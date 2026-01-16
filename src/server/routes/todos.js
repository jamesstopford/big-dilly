import express from 'express';
import { run, get, all, transaction, getDb } from '../../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All todo routes require authentication
router.use(requireAuth);

// Configuration
const MAX_TODOS = 10;

/**
 * Validate todo text
 */
function isValidTodoText(text) {
  return text && typeof text === 'string' && text.trim().length > 0 && text.trim().length <= 500;
}

/**
 * GET /api/todos
 * Get all todos for current user, ordered by sort_order
 */
router.get('/', (req, res) => {
  try {
    const todos = all(
      `SELECT id, text, completed, sort_order
       FROM todos
       WHERE user_id = ?
       ORDER BY sort_order ASC`,
      [req.user.id]
    );

    res.json({ todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

/**
 * POST /api/todos
 * Create a new todo (enforces max 10)
 */
router.post('/', (req, res) => {
  try {
    const { text } = req.body;

    // Validate input
    if (!isValidTodoText(text)) {
      return res.status(400).json({ error: 'Todo text is required and must be between 1 and 500 characters' });
    }

    // Check current count
    const countResult = get(
      'SELECT COUNT(*) as count FROM todos WHERE user_id = ?',
      [req.user.id]
    );

    if (countResult.count >= MAX_TODOS) {
      return res.status(400).json({ error: `Maximum of ${MAX_TODOS} todos allowed` });
    }

    // Get the next sort order (put new todo at the end)
    const maxOrderResult = get(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM todos WHERE user_id = ?',
      [req.user.id]
    );
    const nextOrder = maxOrderResult.max_order + 1;

    // Create the todo
    const result = run(
      `INSERT INTO todos (user_id, text, sort_order) VALUES (?, ?, ?)`,
      [req.user.id, text.trim(), nextOrder]
    );

    const newTodo = {
      id: Number(result.lastInsertRowid),
      text: text.trim(),
      completed: 0,
      sort_order: nextOrder
    };

    res.status(201).json({ todo: newTodo });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

/**
 * PUT /api/todos/reorder
 * Update sort order for all todos
 * Body: { todoIds: [id1, id2, ...] } - array of todo IDs in new order
 */
router.put('/reorder', (req, res) => {
  try {
    const { todoIds } = req.body;

    // Validate input
    if (!Array.isArray(todoIds)) {
      return res.status(400).json({ error: 'todoIds must be an array' });
    }

    // Verify all IDs belong to the user
    const userTodos = all(
      'SELECT id FROM todos WHERE user_id = ?',
      [req.user.id]
    );
    const userTodoIds = new Set(userTodos.map(t => t.id));

    // Check if all provided IDs belong to the user
    for (const id of todoIds) {
      if (!userTodoIds.has(id)) {
        return res.status(400).json({ error: 'Invalid todo ID in request' });
      }
    }

    // Update sort orders in a transaction
    const db = getDb();
    const updateStmt = db.prepare('UPDATE todos SET sort_order = ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?');

    const updateAll = db.transaction((ids) => {
      for (let i = 0; i < ids.length; i++) {
        updateStmt.run(i, ids[i], req.user.id);
      }
    });

    updateAll(todoIds);

    res.json({ message: 'Todos reordered successfully' });
  } catch (error) {
    console.error('Error reordering todos:', error);
    res.status(500).json({ error: 'Failed to reorder todos' });
  }
});

/**
 * PUT /api/todos/:id
 * Update todo (text and/or completed status)
 */
router.put('/:id', (req, res) => {
  try {
    const todoId = parseInt(req.params.id, 10);
    if (isNaN(todoId)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }

    const { text, completed } = req.body;

    // Verify the todo belongs to the user
    const existingTodo = get(
      'SELECT * FROM todos WHERE id = ? AND user_id = ?',
      [todoId, req.user.id]
    );

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const params = [];

    if (text !== undefined) {
      if (!isValidTodoText(text)) {
        return res.status(400).json({ error: 'Todo text must be between 1 and 500 characters' });
      }
      updates.push('text = ?');
      params.push(text.trim());
    }

    if (completed !== undefined) {
      const completedValue = completed ? 1 : 0;
      updates.push('completed = ?');
      params.push(completedValue);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = datetime(\'now\')');
    params.push(todoId, req.user.id);

    run(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );

    // Fetch and return the updated todo
    const updatedTodo = get(
      'SELECT id, text, completed, sort_order FROM todos WHERE id = ?',
      [todoId]
    );

    res.json({ todo: updatedTodo });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

/**
 * DELETE /api/todos/:id
 * Delete a todo
 */
router.delete('/:id', (req, res) => {
  try {
    const todoId = parseInt(req.params.id, 10);
    if (isNaN(todoId)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }

    // Verify the todo belongs to the user
    const existingTodo = get(
      'SELECT id FROM todos WHERE id = ? AND user_id = ?',
      [todoId, req.user.id]
    );

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Delete the todo
    run('DELETE FROM todos WHERE id = ? AND user_id = ?', [todoId, req.user.id]);

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default router;
