import express from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from '../../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Configuration
const BCRYPT_ROUNDS = 12;
const SESSION_DURATION_DAYS = 30;
const PASSWORD_RESET_DURATION_HOURS = 1;

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function isValidPassword(password) {
  return password && password.length >= 8;
}

/**
 * Create a new session for a user
 */
function createSession(userId) {
  const sessionId = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  run(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `, [sessionId, userId, expiresAt.toISOString()]);

  return { sessionId, expiresAt };
}

/**
 * Set session cookie
 */
function setSessionCookie(res, sessionId, expiresAt) {
  res.cookie('session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt
  });
}

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if email already exists
    const existingUser = get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const result = run(`
      INSERT INTO users (email, password_hash)
      VALUES (?, ?)
    `, [email.toLowerCase(), passwordHash]);

    const userId = result.lastInsertRowid;

    // Create session
    const { sessionId, expiresAt } = createSession(userId);
    setSessionCookie(res, sessionId, expiresAt);

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: userId,
        email: email.toLowerCase(),
        theme: 'light'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/**
 * POST /api/auth/login
 * Log in with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create session
    const { sessionId, expiresAt } = createSession(user.id);
    setSessionCookie(res, sessionId, expiresAt);

    res.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        theme: user.theme
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

/**
 * POST /api/auth/logout
 * Destroy current session
 */
router.post('/logout', (req, res) => {
  const sessionId = req.cookies?.session;

  if (sessionId) {
    // Delete session from database
    run('DELETE FROM sessions WHERE id = ?', [sessionId]);
    res.clearCookie('session');
  }

  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: req.user
  });
});

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account exists with that email, a reset link has been sent' });
    }

    // Generate reset token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_DURATION_HOURS);

    // Invalidate any existing tokens for this user
    run('UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0', [user.id]);

    // Store new token
    run(`
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `, [user.id, token, expiresAt.toISOString()]);

    // In a real application, send email here
    // For development, log the token
    console.log(`Password reset token for ${email}: ${token}`);
    console.log(`Reset URL: http://localhost:3000/reset-password?token=${token}`);

    res.json({
      message: 'If an account exists with that email, a reset link has been sent',
      // Include token in development for testing
      ...(process.env.NODE_ENV !== 'production' && { token })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find valid token
    const resetRecord = get(`
      SELECT * FROM password_resets
      WHERE token = ?
        AND used = 0
        AND expires_at > datetime('now')
    `, [token]);

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Update password
    run(`
      UPDATE users SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [passwordHash, resetRecord.user_id]);

    // Mark token as used
    run('UPDATE password_resets SET used = 1 WHERE id = ?', [resetRecord.id]);

    // Invalidate all sessions for this user (security measure)
    run('DELETE FROM sessions WHERE user_id = ?', [resetRecord.user_id]);

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
