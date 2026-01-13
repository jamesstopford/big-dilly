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
import trackerRoutes from '../src/server/routes/trackers.js';

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/trackers', trackerRoutes);

  return app;
}

let app;
let db;

// SQL for inserting trackers with current datetime
const INSERT_TRACKER_NOW = "INSERT INTO trackers (user_id, name, icon, last_reset) VALUES (?, ?, ?, datetime('now'))";
const INSERT_TRACKER_PAST = "INSERT INTO trackers (user_id, name, icon, last_reset) VALUES (?, ?, ?, datetime('now', '-1 day'))";

// Setup once for all tests
beforeAll(() => {
  db = getDb();
  // Initialize schema
  db.exec(schema);
  db.exec(indexes);
  // Create test user
  run('INSERT OR IGNORE INTO users (email, password_hash) VALUES (?, ?)', ['test@example.com', 'hashedpassword']);
  app = createTestApp();
});

afterAll(() => {
  closeDb();
});

// Clean up before each test
beforeEach(() => {
  run('DELETE FROM trackers WHERE user_id = 1');
});

describe('Tracker API', () => {
  describe('GET /api/trackers', () => {
    it('should return empty array when no trackers exist', async () => {
      const res = await request(app).get('/api/trackers');

      expect(res.status).toBe(200);
      expect(res.body.trackers).toEqual([]);
    });

    it('should return all trackers for the user ordered by created_at', async () => {
      run(INSERT_TRACKER_NOW, [1, 'Workout', 'running']);
      run(INSERT_TRACKER_NOW, [1, 'Reading', 'book']);

      const res = await request(app).get('/api/trackers');

      expect(res.status).toBe(200);
      expect(res.body.trackers).toHaveLength(2);
      expect(res.body.trackers[0].name).toBe('Workout');
      expect(res.body.trackers[1].name).toBe('Reading');
    });

    it('should return tracker with all expected fields', async () => {
      run(INSERT_TRACKER_NOW, [1, 'Test', 'running']);

      const res = await request(app).get('/api/trackers');

      expect(res.status).toBe(200);
      const tracker = res.body.trackers[0];
      expect(tracker.id).toBeDefined();
      expect(tracker.name).toBe('Test');
      expect(tracker.icon).toBe('running');
      expect(tracker.last_reset).toBeDefined();
      expect(tracker.created_at).toBeDefined();
      expect(tracker.updated_at).toBeDefined();
    });

    it('should not return trackers from other users', async () => {
      // Create another user and their tracker
      run('INSERT OR IGNORE INTO users (email, password_hash) VALUES (?, ?)', ['other@example.com', 'hashedpassword']);
      const otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      run(INSERT_TRACKER_NOW, [otherUser.id, 'Other tracker', 'running']);
      run(INSERT_TRACKER_NOW, [1, 'My tracker', 'book']);

      const res = await request(app).get('/api/trackers');

      expect(res.status).toBe(200);
      expect(res.body.trackers).toHaveLength(1);
      expect(res.body.trackers[0].name).toBe('My tracker');
    });
  });

  describe('POST /api/trackers', () => {
    it('should create a new tracker', async () => {
      const res = await request(app)
        .post('/api/trackers')
        .send({ name: 'New tracker', icon: 'running' });

      expect(res.status).toBe(201);
      expect(res.body.tracker).toBeDefined();
      expect(res.body.tracker.name).toBe('New tracker');
      expect(res.body.tracker.icon).toBe('running');
      expect(res.body.tracker.last_reset).toBeDefined();
    });

    it('should trim whitespace from name', async () => {
      const res = await request(app)
        .post('/api/trackers')
        .send({ name: '  Trimmed  ', icon: 'running' });

      expect(res.status).toBe(201);
      expect(res.body.tracker.name).toBe('Trimmed');
    });

    it('should reject empty name', async () => {
      const res = await request(app)
        .post('/api/trackers')
        .send({ name: '', icon: 'running' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should reject whitespace-only name', async () => {
      const res = await request(app)
        .post('/api/trackers')
        .send({ name: '   ', icon: 'running' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should reject name longer than 100 characters', async () => {
      const longName = 'a'.repeat(101);
      const res = await request(app)
        .post('/api/trackers')
        .send({ name: longName, icon: 'running' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('100');
    });

    it('should reject missing icon', async () => {
      const res = await request(app)
        .post('/api/trackers')
        .send({ name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('icon');
    });

    it('should reject empty icon', async () => {
      const res = await request(app)
        .post('/api/trackers')
        .send({ name: 'Test', icon: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('icon');
    });

    it('should enforce maximum of 20 trackers', async () => {
      // Create 20 trackers
      for (let i = 0; i < 20; i++) {
        run(INSERT_TRACKER_NOW, [1, `Tracker ${i}`, 'running']);
      }

      const res = await request(app)
        .post('/api/trackers')
        .send({ name: 'One too many', icon: 'running' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Maximum');
      expect(res.body.error).toContain('20');
    });
  });

  describe('PUT /api/trackers/:id', () => {
    let trackerId;

    beforeEach(() => {
      const result = run(INSERT_TRACKER_NOW, [1, 'Test tracker', 'running']);
      trackerId = Number(result.lastInsertRowid);
    });

    it('should update tracker name', async () => {
      const res = await request(app)
        .put(`/api/trackers/${trackerId}`)
        .send({ name: 'Updated name' });

      expect(res.status).toBe(200);
      expect(res.body.tracker.name).toBe('Updated name');
    });

    it('should update tracker icon', async () => {
      const res = await request(app)
        .put(`/api/trackers/${trackerId}`)
        .send({ icon: 'book' });

      expect(res.status).toBe(200);
      expect(res.body.tracker.icon).toBe('book');
    });

    it('should update both name and icon in one request', async () => {
      const res = await request(app)
        .put(`/api/trackers/${trackerId}`)
        .send({ name: 'New name', icon: 'meditation' });

      expect(res.status).toBe(200);
      expect(res.body.tracker.name).toBe('New name');
      expect(res.body.tracker.icon).toBe('meditation');
    });

    it('should return 404 for non-existent tracker', async () => {
      const res = await request(app)
        .put('/api/trackers/99999')
        .send({ name: 'Updated' });

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid tracker ID', async () => {
      const res = await request(app)
        .put('/api/trackers/invalid')
        .send({ name: 'Updated' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for empty update', async () => {
      const res = await request(app)
        .put(`/api/trackers/${trackerId}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('No valid fields');
    });

    it('should not allow updating other users trackers', async () => {
      // Create tracker for another user
      let otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      if (!otherUser) {
        run('INSERT INTO users (email, password_hash) VALUES (?, ?)', ['other@example.com', 'hashedpassword']);
        otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      }
      const otherResult = run(INSERT_TRACKER_NOW, [otherUser.id, 'Other tracker', 'running']);
      const otherId = Number(otherResult.lastInsertRowid);

      const res = await request(app)
        .put(`/api/trackers/${otherId}`)
        .send({ name: 'Hacked!' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/trackers/:id', () => {
    let trackerId;

    beforeEach(() => {
      const result = run(INSERT_TRACKER_NOW, [1, 'To delete', 'running']);
      trackerId = Number(result.lastInsertRowid);
    });

    it('should delete a tracker', async () => {
      const res = await request(app).delete(`/api/trackers/${trackerId}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');

      const tracker = get('SELECT * FROM trackers WHERE id = ?', [trackerId]);
      expect(tracker).toBeUndefined();
    });

    it('should return 404 for non-existent tracker', async () => {
      const res = await request(app).delete('/api/trackers/99999');

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid tracker ID', async () => {
      const res = await request(app).delete('/api/trackers/invalid');

      expect(res.status).toBe(400);
    });

    it('should not allow deleting other users trackers', async () => {
      let otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      if (!otherUser) {
        run('INSERT INTO users (email, password_hash) VALUES (?, ?)', ['other@example.com', 'hashedpassword']);
        otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      }
      const otherResult = run(INSERT_TRACKER_NOW, [otherUser.id, 'Other tracker', 'running']);
      const otherId = Number(otherResult.lastInsertRowid);

      const res = await request(app).delete(`/api/trackers/${otherId}`);

      expect(res.status).toBe(404);

      // Verify it still exists
      const tracker = get('SELECT * FROM trackers WHERE id = ?', [otherId]);
      expect(tracker).toBeDefined();
    });
  });

  describe('POST /api/trackers/:id/reset', () => {
    let trackerId;
    let originalReset;

    beforeEach(() => {
      // Create tracker with a specific past date
      run(INSERT_TRACKER_PAST, [1, 'To reset', 'running']);
      const tracker = get('SELECT * FROM trackers WHERE user_id = 1 ORDER BY id DESC LIMIT 1');
      trackerId = tracker.id;
      originalReset = tracker.last_reset;
    });

    it('should reset tracker last_reset to now', async () => {
      const res = await request(app).post(`/api/trackers/${trackerId}/reset`);

      expect(res.status).toBe(200);
      expect(res.body.tracker).toBeDefined();
      expect(res.body.tracker.last_reset).toBeDefined();
      // The new reset time should be different from original (which was 1 day ago)
      expect(res.body.tracker.last_reset).not.toBe(originalReset);
    });

    it('should return updated tracker with all fields', async () => {
      const res = await request(app).post(`/api/trackers/${trackerId}/reset`);

      expect(res.status).toBe(200);
      const tracker = res.body.tracker;
      expect(tracker.id).toBe(trackerId);
      expect(tracker.name).toBe('To reset');
      expect(tracker.icon).toBe('running');
      expect(tracker.last_reset).toBeDefined();
      expect(tracker.updated_at).toBeDefined();
    });

    it('should return 404 for non-existent tracker', async () => {
      const res = await request(app).post('/api/trackers/99999/reset');

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid tracker ID', async () => {
      const res = await request(app).post('/api/trackers/invalid/reset');

      expect(res.status).toBe(400);
    });

    it('should not allow resetting other users trackers', async () => {
      let otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      if (!otherUser) {
        run('INSERT INTO users (email, password_hash) VALUES (?, ?)', ['other@example.com', 'hashedpassword']);
        otherUser = get('SELECT id FROM users WHERE email = ?', ['other@example.com']);
      }
      const otherResult = run(INSERT_TRACKER_PAST, [otherUser.id, 'Other tracker', 'running']);
      const otherId = Number(otherResult.lastInsertRowid);
      const otherTracker = get('SELECT * FROM trackers WHERE id = ?', [otherId]);
      const otherOriginalReset = otherTracker.last_reset;

      const res = await request(app).post(`/api/trackers/${otherId}/reset`);

      expect(res.status).toBe(404);

      // Verify it wasn't reset
      const tracker = get('SELECT * FROM trackers WHERE id = ?', [otherId]);
      expect(tracker.last_reset).toBe(otherOriginalReset);
    });
  });
});
