import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';

// Use a unique test database path for isolation
process.env.DB_PATH = ':memory:';

// Mock the auth middleware before importing anything else
vi.mock('../src/server/middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 1, email: 'test@example.com', theme: 'light' };
    next();
  },
  optionalAuth: (req, res, next) => {
    req.user = { id: 1, email: 'test@example.com', theme: 'light' };
    next();
  }
}));

// Import after setting up mocks
import { getDb, run, get, all, closeDb } from '../src/db/database.js';
import { schema, indexes } from '../src/db/schema.js';
import todoRoutes from '../src/server/routes/todos.js';
import templateRoutes from '../src/server/routes/template.js';

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/todos', todoRoutes);
  app.use('/api/template', templateRoutes);

  return app;
}

let app;
let db;

// Setup once for all tests
beforeAll(() => {
  db = getDb();
  // Initialize schema
  db.exec(schema);
  db.exec(indexes);
  // Create test user (use INSERT OR IGNORE in case tests run multiple times with same db)
  run('INSERT OR IGNORE INTO users (email, password_hash) VALUES (?, ?)', ['test@example.com', 'hashedpassword']);
  app = createTestApp();
});

afterAll(() => {
  closeDb();
});

// Clean up before each test
beforeEach(() => {
  run('DELETE FROM todos WHERE user_id = 1');
  run('DELETE FROM template_items WHERE user_id = 1');
});

describe('Todo API', () => {
  describe('GET /api/todos', () => {
    it('should return empty array when no todos exist', async () => {
      const res = await request(app).get('/api/todos');

      expect(res.status).toBe(200);
      expect(res.body.todos).toEqual([]);
    });

    it('should return all todos for the user ordered by sort_order', async () => {
      run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Todo 1', 0]);
      run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Todo 2', 1]);
      run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Todo 3', 2]);

      const res = await request(app).get('/api/todos');

      expect(res.status).toBe(200);
      expect(res.body.todos).toHaveLength(3);
      expect(res.body.todos[0].text).toBe('Todo 1');
      expect(res.body.todos[1].text).toBe('Todo 2');
      expect(res.body.todos[2].text).toBe('Todo 3');
    });

    it('should not return todos from other users', async () => {
      // Create another user and their todo (use INSERT OR IGNORE in case user exists from previous test)
      run('INSERT OR IGNORE INTO users (email, password_hash) VALUES (?, ?)', ['other@example.com', 'hashedpassword']);
      const otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [otherUser.id, 'Other user todo', 0]);
      run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'My todo', 0]);

      const res = await request(app).get('/api/todos');

      expect(res.status).toBe(200);
      expect(res.body.todos).toHaveLength(1);
      expect(res.body.todos[0].text).toBe('My todo');
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ text: 'New todo' });

      expect(res.status).toBe(201);
      expect(res.body.todo).toBeDefined();
      expect(res.body.todo.text).toBe('New todo');
      expect(res.body.todo.completed).toBe(0);
      expect(res.body.todo.sort_order).toBe(0);
    });

    it('should trim whitespace from todo text', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ text: '  Trimmed todo  ' });

      expect(res.status).toBe(201);
      expect(res.body.todo.text).toBe('Trimmed todo');
    });

    it('should assign correct sort order to new todos', async () => {
      await request(app).post('/api/todos').send({ text: 'First' });
      await request(app).post('/api/todos').send({ text: 'Second' });
      const res = await request(app).post('/api/todos').send({ text: 'Third' });

      expect(res.status).toBe(201);
      expect(res.body.todo.sort_order).toBe(2);
    });

    it('should reject empty text', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ text: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should reject whitespace-only text', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ text: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should reject text longer than 500 characters', async () => {
      const longText = 'a'.repeat(501);
      const res = await request(app)
        .post('/api/todos')
        .send({ text: longText });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('500');
    });

    it('should enforce maximum of 10 todos', async () => {
      // Create 10 todos
      for (let i = 0; i < 10; i++) {
        run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [1, `Todo ${i}`, i]);
      }

      const res = await request(app)
        .post('/api/todos')
        .send({ text: 'One too many' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Maximum');
      expect(res.body.error).toContain('10');
    });
  });

  describe('PUT /api/todos/:id', () => {
    let todoId;

    beforeEach(() => {
      const result = run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Test todo', 0]);
      todoId = Number(result.lastInsertRowid);
    });

    it('should update todo text', async () => {
      const res = await request(app)
        .put(`/api/todos/${todoId}`)
        .send({ text: 'Updated text' });

      expect(res.status).toBe(200);
      expect(res.body.todo.text).toBe('Updated text');
    });

    it('should update completed status to true', async () => {
      const res = await request(app)
        .put(`/api/todos/${todoId}`)
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.todo.completed).toBe(1);
    });

    it('should update completed status to false', async () => {
      run('UPDATE todos SET completed = 1 WHERE id = ?', [todoId]);

      const res = await request(app)
        .put(`/api/todos/${todoId}`)
        .send({ completed: false });

      expect(res.status).toBe(200);
      expect(res.body.todo.completed).toBe(0);
    });

    it('should update both text and completed in one request', async () => {
      const res = await request(app)
        .put(`/api/todos/${todoId}`)
        .send({ text: 'New text', completed: true });

      expect(res.status).toBe(200);
      expect(res.body.todo.text).toBe('New text');
      expect(res.body.todo.completed).toBe(1);
    });

    it('should return 404 for non-existent todo', async () => {
      const res = await request(app)
        .put('/api/todos/99999')
        .send({ text: 'Updated' });

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid todo ID', async () => {
      const res = await request(app)
        .put('/api/todos/invalid')
        .send({ text: 'Updated' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for empty update', async () => {
      const res = await request(app)
        .put(`/api/todos/${todoId}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('No valid fields');
    });

    it('should not allow updating other users todos', async () => {
      // Create todo for another user
      let otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      if (!otherUser) {
        run('INSERT INTO users (email, password_hash) VALUES (?, ?)', ['other@example.com', 'hashedpassword']);
        otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      }
      const otherResult = run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [otherUser.id, 'Other todo', 0]);
      const otherId = Number(otherResult.lastInsertRowid);

      const res = await request(app)
        .put(`/api/todos/${otherId}`)
        .send({ text: 'Hacked!' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    let todoId;

    beforeEach(() => {
      const result = run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'To delete', 0]);
      todoId = Number(result.lastInsertRowid);
    });

    it('should delete a todo', async () => {
      const res = await request(app).delete(`/api/todos/${todoId}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');

      const todo = get('SELECT * FROM todos WHERE id = ?', [todoId]);
      expect(todo).toBeUndefined();
    });

    it('should return 404 for non-existent todo', async () => {
      const res = await request(app).delete('/api/todos/99999');

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid todo ID', async () => {
      const res = await request(app).delete('/api/todos/invalid');

      expect(res.status).toBe(400);
    });

    it('should not allow deleting other users todos', async () => {
      let otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      if (!otherUser) {
        run('INSERT INTO users (email, password_hash) VALUES (?, ?)', ['other@example.com', 'hashedpassword']);
        otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      }
      const otherResult = run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [otherUser.id, 'Other todo', 0]);
      const otherId = Number(otherResult.lastInsertRowid);

      const res = await request(app).delete(`/api/todos/${otherId}`);

      expect(res.status).toBe(404);

      // Verify it still exists
      const todo = get('SELECT * FROM todos WHERE id = ?', [otherId]);
      expect(todo).toBeDefined();
    });
  });

  describe('PUT /api/todos/reorder', () => {
    let todoIds;

    beforeEach(() => {
      todoIds = [];
      for (let i = 0; i < 3; i++) {
        const result = run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [1, `Todo ${i}`, i]);
        todoIds.push(Number(result.lastInsertRowid));
      }
    });

    it('should reorder todos', async () => {
      const newOrder = [todoIds[2], todoIds[0], todoIds[1]];

      const res = await request(app)
        .put('/api/todos/reorder')
        .send({ todoIds: newOrder });

      expect(res.status).toBe(200);

      const todos = all('SELECT * FROM todos WHERE user_id = 1 ORDER BY sort_order');
      expect(todos[0].id).toBe(todoIds[2]);
      expect(todos[1].id).toBe(todoIds[0]);
      expect(todos[2].id).toBe(todoIds[1]);
    });

    it('should reject non-array todoIds', async () => {
      const res = await request(app)
        .put('/api/todos/reorder')
        .send({ todoIds: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('array');
    });

    it('should reject invalid todo IDs', async () => {
      const res = await request(app)
        .put('/api/todos/reorder')
        .send({ todoIds: [todoIds[0], 99999, todoIds[2]] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid');
    });

    it('should reject todo IDs from other users', async () => {
      let otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      if (!otherUser) {
        run('INSERT INTO users (email, password_hash) VALUES (?, ?)', ['other@example.com', 'hashedpassword']);
        otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      }
      const otherResult = run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [otherUser.id, 'Other', 0]);
      const otherId = Number(otherResult.lastInsertRowid);

      const res = await request(app)
        .put('/api/todos/reorder')
        .send({ todoIds: [todoIds[0], otherId, todoIds[2]] });

      expect(res.status).toBe(400);
    });
  });
});

describe('Template API', () => {
  describe('GET /api/template', () => {
    it('should return empty array when no template exists', async () => {
      const res = await request(app).get('/api/template');

      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
    });

    it('should return template items ordered by sort_order', async () => {
      run('INSERT INTO template_items (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Item 1', 0]);
      run('INSERT INTO template_items (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Item 2', 1]);

      const res = await request(app).get('/api/template');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0].text).toBe('Item 1');
      expect(res.body.items[1].text).toBe('Item 2');
    });
  });

  describe('POST /api/template/save', () => {
    it('should save current todos as template', async () => {
      run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Todo 1', 0]);
      run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Todo 2', 1]);

      const res = await request(app).post('/api/template/save');

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('saved');
      expect(res.body.items).toHaveLength(2);
      expect(res.body.count).toBe(2);
    });

    it('should replace existing template', async () => {
      run('INSERT INTO template_items (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Old item', 0]);
      run('INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'New todo', 0]);

      const res = await request(app).post('/api/template/save');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].text).toBe('New todo');

      // Verify old template is gone
      const oldItems = all('SELECT * FROM template_items WHERE text = ?', ['Old item']);
      expect(oldItems).toHaveLength(0);
    });

    it('should only save text and order, not completion state', async () => {
      run('INSERT INTO todos (user_id, text, completed, sort_order) VALUES (?, ?, ?, ?)', [1, 'Completed todo', 1, 0]);

      const res = await request(app).post('/api/template/save');

      expect(res.status).toBe(200);
      // Template items store text and sort_order, not completed status
      expect(res.body.items[0].text).toBe('Completed todo');
      expect(res.body.items[0].sort_order).toBe(0);
      // completed is not a field in template_items
    });
  });

  describe('POST /api/template/reset', () => {
    it('should replace todos with template items', async () => {
      run('INSERT INTO template_items (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Template 1', 0]);
      run('INSERT INTO template_items (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Template 2', 1]);
      run('INSERT INTO todos (user_id, text, completed, sort_order) VALUES (?, ?, ?, ?)', [1, 'Old todo', 1, 0]);

      const res = await request(app).post('/api/template/reset');

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('reset');
      expect(res.body.todos).toHaveLength(2);
      expect(res.body.todos[0].text).toBe('Template 1');
      expect(res.body.todos[0].completed).toBe(0);
      expect(res.body.todos[1].text).toBe('Template 2');
    });

    it('should return error when no template exists', async () => {
      const res = await request(app).post('/api/template/reset');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('No template');
    });

    it('should reset all todos to uncompleted state', async () => {
      run('INSERT INTO template_items (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Task', 0]);
      run('INSERT INTO todos (user_id, text, completed, sort_order) VALUES (?, ?, ?, ?)', [1, 'Done task', 1, 0]);

      const res = await request(app).post('/api/template/reset');

      expect(res.status).toBe(200);
      expect(res.body.todos[0].completed).toBe(0);
    });

    it('should preserve sort order from template', async () => {
      run('INSERT INTO template_items (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'First', 0]);
      run('INSERT INTO template_items (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Second', 1]);
      run('INSERT INTO template_items (user_id, text, sort_order) VALUES (?, ?, ?)', [1, 'Third', 2]);

      const res = await request(app).post('/api/template/reset');

      expect(res.body.todos[0].text).toBe('First');
      expect(res.body.todos[0].sort_order).toBe(0);
      expect(res.body.todos[1].text).toBe('Second');
      expect(res.body.todos[1].sort_order).toBe(1);
      expect(res.body.todos[2].text).toBe('Third');
      expect(res.body.todos[2].sort_order).toBe(2);
    });
  });
});
