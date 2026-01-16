import express from 'express';
import { run, get, all } from '../../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All tracker routes require authentication
router.use(requireAuth);

// Configuration
const MAX_TRACKERS = 10;

/**
 * Validate tracker name
 */
function isValidTrackerName(name) {
  return name && typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 100;
}

/**
 * Validate tracker icon
 */
function isValidTrackerIcon(icon) {
  // Allow any non-empty string for icon (emoji or icon identifier)
  return icon && typeof icon === 'string' && icon.trim().length > 0 && icon.trim().length <= 50;
}

/**
 * GET /api/trackers
 * Get all trackers for current user
 */
router.get('/', (req, res) => {
  try {
    const trackers = all(
      `SELECT id, name, icon, last_reset, created_at, updated_at
       FROM trackers
       WHERE user_id = ?
       ORDER BY created_at ASC`,
      [req.user.id]
    );

    res.json({ trackers });
  } catch (error) {
    console.error('Error fetching trackers:', error);
    res.status(500).json({ error: 'Failed to fetch trackers' });
  }
});

/**
 * POST /api/trackers
 * Create a new tracker (enforces max 10)
 */
router.post('/', (req, res) => {
  try {
    const { name, icon } = req.body;

    // Validate input
    if (!isValidTrackerName(name)) {
      return res.status(400).json({ error: 'Tracker name is required and must be between 1 and 100 characters' });
    }

    if (!isValidTrackerIcon(icon)) {
      return res.status(400).json({ error: 'Tracker icon is required' });
    }

    // Check current count
    const countResult = get(
      'SELECT COUNT(*) as count FROM trackers WHERE user_id = ?',
      [req.user.id]
    );

    if (countResult.count >= MAX_TRACKERS) {
      return res.status(400).json({ error: `Maximum of ${MAX_TRACKERS} trackers allowed` });
    }

    // Create the tracker with last_reset set to now
    const result = run(
      `INSERT INTO trackers (user_id, name, icon, last_reset) VALUES (?, ?, ?, datetime('now'))`,
      [req.user.id, name.trim(), icon.trim()]
    );

    // Fetch the newly created tracker to get all fields including last_reset
    const newTracker = get(
      'SELECT id, name, icon, last_reset, created_at, updated_at FROM trackers WHERE id = ?',
      [Number(result.lastInsertRowid)]
    );

    res.status(201).json({ tracker: newTracker });
  } catch (error) {
    console.error('Error creating tracker:', error);
    res.status(500).json({ error: 'Failed to create tracker' });
  }
});

/**
 * PUT /api/trackers/:id
 * Update tracker (name and/or icon)
 */
router.put('/:id', (req, res) => {
  try {
    const trackerId = parseInt(req.params.id, 10);
    if (isNaN(trackerId)) {
      return res.status(400).json({ error: 'Invalid tracker ID' });
    }

    const { name, icon } = req.body;

    // Verify the tracker belongs to the user
    const existingTracker = get(
      'SELECT * FROM trackers WHERE id = ? AND user_id = ?',
      [trackerId, req.user.id]
    );

    if (!existingTracker) {
      return res.status(404).json({ error: 'Tracker not found' });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const params = [];

    if (name !== undefined) {
      if (!isValidTrackerName(name)) {
        return res.status(400).json({ error: 'Tracker name must be between 1 and 100 characters' });
      }
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (icon !== undefined) {
      if (!isValidTrackerIcon(icon)) {
        return res.status(400).json({ error: 'Invalid tracker icon' });
      }
      updates.push('icon = ?');
      params.push(icon.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = datetime(\'now\')');
    params.push(trackerId, req.user.id);

    run(
      `UPDATE trackers SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );

    // Fetch and return the updated tracker
    const updatedTracker = get(
      'SELECT id, name, icon, last_reset, created_at, updated_at FROM trackers WHERE id = ?',
      [trackerId]
    );

    res.json({ tracker: updatedTracker });
  } catch (error) {
    console.error('Error updating tracker:', error);
    res.status(500).json({ error: 'Failed to update tracker' });
  }
});

/**
 * DELETE /api/trackers/:id
 * Delete a tracker
 */
router.delete('/:id', (req, res) => {
  try {
    const trackerId = parseInt(req.params.id, 10);
    if (isNaN(trackerId)) {
      return res.status(400).json({ error: 'Invalid tracker ID' });
    }

    // Verify the tracker belongs to the user
    const existingTracker = get(
      'SELECT id FROM trackers WHERE id = ? AND user_id = ?',
      [trackerId, req.user.id]
    );

    if (!existingTracker) {
      return res.status(404).json({ error: 'Tracker not found' });
    }

    // Delete the tracker
    run('DELETE FROM trackers WHERE id = ? AND user_id = ?', [trackerId, req.user.id]);

    res.json({ message: 'Tracker deleted successfully' });
  } catch (error) {
    console.error('Error deleting tracker:', error);
    res.status(500).json({ error: 'Failed to delete tracker' });
  }
});

/**
 * POST /api/trackers/:id/reset
 * Reset tracker's last_reset to now
 */
router.post('/:id/reset', (req, res) => {
  try {
    const trackerId = parseInt(req.params.id, 10);
    if (isNaN(trackerId)) {
      return res.status(400).json({ error: 'Invalid tracker ID' });
    }

    // Verify the tracker belongs to the user
    const existingTracker = get(
      'SELECT id FROM trackers WHERE id = ? AND user_id = ?',
      [trackerId, req.user.id]
    );

    if (!existingTracker) {
      return res.status(404).json({ error: 'Tracker not found' });
    }

    // Reset the tracker
    run(
      `UPDATE trackers SET last_reset = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
      [trackerId, req.user.id]
    );

    // Fetch and return the updated tracker
    const updatedTracker = get(
      'SELECT id, name, icon, last_reset, created_at, updated_at FROM trackers WHERE id = ?',
      [trackerId]
    );

    res.json({ tracker: updatedTracker });
  } catch (error) {
    console.error('Error resetting tracker:', error);
    res.status(500).json({ error: 'Failed to reset tracker' });
  }
});

export default router;
