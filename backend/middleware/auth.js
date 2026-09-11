/**
 * Authentication middleware.
 * Reads JWT from HTTP-only cookie (falls back to Authorization: Bearer).
 * Attaches req.user (a Mongoose User document) on success.
 */
const User = require('../models/User');
const { verifyToken, COOKIE_NAME } = require('../utils/token');

async function authenticateUser(req, res, next) {
  try {
    const cookieToken = req.cookies ? req.cookies[COOKIE_NAME] : null;
    const headerToken =
      req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null;
    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    req.user = user;
    next();
  } catch (err) {
    // Do not leak details
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
}

module.exports = { authenticateUser };
