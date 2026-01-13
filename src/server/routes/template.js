import express from 'express';
import { run, get, all, getDb } from '../../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All template routes require authentication
router.use(requireAuth);

/**
 * GET /api/template
 * Get user's template items
 */
router.get('/', (req, res) => {
  try {
    const items = all(
      `SELECT id, text, sort_order
       FROM template_items
       WHERE user_id = ?
       ORDER BY sort_order ASC`,
      [req.user.id]
    );

    res.json({ items });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * POST /api/template/save
 * Save current todos as template (replaces existing template)
 * Only saves text and order, not completion state
 */
router.post('/save', (req, res) => {
  try {
    const db = getDb();

    // Get current todos
    const currentTodos = all(
      `SELECT text, sort_order
       FROM todos
       WHERE user_id = ?
       ORDER BY sort_order ASC`,
      [req.user.id]
    );

    // Replace template in a transaction
    const saveTemplate = db.transaction(() => {
      // Delete existing template items
      run('DELETE FROM template_items WHERE user_id = ?', [req.user.id]);

      // Insert current todos as template items
      const insertStmt = db.prepare(
        'INSERT INTO template_items (user_id, text, sort_order) VALUES (?, ?, ?)'
      );

      for (const todo of currentTodos) {
        insertStmt.run(req.user.id, todo.text, todo.sort_order);
      }
    });

    saveTemplate();

    // Return the saved template
    const savedItems = all(
      `SELECT id, text, sort_order
       FROM template_items
       WHERE user_id = ?
       ORDER BY sort_order ASC`,
      [req.user.id]
    );

    res.json({
      message: 'Template saved successfully',
      items: savedItems,
      count: savedItems.length
    });
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

/**
 * POST /api/template/reset
 * Replace all todos with template items
 * Creates new todos with completed = 0
 */
router.post('/reset', (req, res) => {
  try {
    const db = getDb();

    // Get template items
    const templateItems = all(
      `SELECT text, sort_order
       FROM template_items
       WHERE user_id = ?
       ORDER BY sort_order ASC`,
      [req.user.id]
    );

    if (templateItems.length === 0) {
      return res.status(400).json({ error: 'No template saved. Save a template first.' });
    }

    // Replace todos in a transaction
    const resetToTemplate = db.transaction(() => {
      // Delete all current todos
      run('DELETE FROM todos WHERE user_id = ?', [req.user.id]);

      // Create new todos from template
      const insertStmt = db.prepare(
        'INSERT INTO todos (user_id, text, completed, sort_order) VALUES (?, ?, 0, ?)'
      );

      for (const item of templateItems) {
        insertStmt.run(req.user.id, item.text, item.sort_order);
      }
    });

    resetToTemplate();

    // Return the new todos
    const newTodos = all(
      `SELECT id, text, completed, sort_order
       FROM todos
       WHERE user_id = ?
       ORDER BY sort_order ASC`,
      [req.user.id]
    );

    res.json({
      message: 'Todos reset to template successfully',
      todos: newTodos
    });
  } catch (error) {
    console.error('Error resetting to template:', error);
    res.status(500).json({ error: 'Failed to reset to template' });
  }
});

export default router;
