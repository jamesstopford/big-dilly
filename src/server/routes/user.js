import express from 'express';
import { run, get } from '../../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const VALID_THEMES = ['light', 'dark', 'cyber-neon'];

/**
 * PUT /api/user/theme
 * Update user's theme preference
 */
router.put('/theme', requireAuth, (req, res) => {
  try {
    const { theme } = req.body;

    if (!theme) {
      return res.status(400).json({ error: 'Theme is required' });
    }

    if (!VALID_THEMES.includes(theme)) {
      return res.status(400).json({
        error: `Invalid theme. Must be one of: ${VALID_THEMES.join(', ')}`
      });
    }

    // Update user's theme
    run(`
      UPDATE users SET theme = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [theme, req.user.id]);

    res.json({
      message: 'Theme updated successfully',
      theme
    });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

/**
 * GET /api/user/profile
 * Get current user's profile
 */
router.get('/profile', requireAuth, (req, res) => {
  try {
    const user = get(`
      SELECT id, email, theme, created_at
      FROM users WHERE id = ?
    `, [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;
