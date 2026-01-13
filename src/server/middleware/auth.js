import { get } from '../../db/database.js';

/**
 * Authentication middleware
 * Validates session cookie and attaches user to request
 */
export function requireAuth(req, res, next) {
  const sessionId = req.cookies?.session;

  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Get session and user data
  const session = get(`
    SELECT s.*, u.id as user_id, u.email, u.theme
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `, [sessionId]);

  if (!session) {
    // Clear invalid session cookie
    res.clearCookie('session');
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  // Attach user to request
  req.user = {
    id: session.user_id,
    email: session.email,
    theme: session.theme
  };
  req.sessionId = sessionId;

  next();
}

/**
 * Optional authentication middleware
 * Attaches user to request if valid session exists, but doesn't require it
 */
export function optionalAuth(req, res, next) {
  const sessionId = req.cookies?.session;

  if (!sessionId) {
    return next();
  }

  const session = get(`
    SELECT s.*, u.id as user_id, u.email, u.theme
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `, [sessionId]);

  if (session) {
    req.user = {
      id: session.user_id,
      email: session.email,
      theme: session.theme
    };
    req.sessionId = sessionId;
  }

  next();
}

export default { requireAuth, optionalAuth };
