/**
 * Property routes.
 *   GET    /api/properties          → public list (or ?mine=true / ?all=true)
 *   GET    /api/properties/:id      → read one
 *   POST   /api/properties          → create (seller/admin)
 *   PUT    /api/properties/:id      → update (owner/admin)
 *   DELETE /api/properties/:id      → delete (owner/admin)
 */
const express = require('express');
const {
  createProperty, listProperties, getProperty, updateProperty, deleteProperty,
} = require('../controllers/property.controller');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

// Public browse (auth optional — we call it internally with tryAuth pattern).
router.get('/', optionalAuth, listProperties);
router.get('/:id', optionalAuth, getProperty);

// Create/Update/Delete — require auth.
router.post('/', authenticateUser, createProperty);
router.put('/:id', authenticateUser, updateProperty);
router.delete('/:id', authenticateUser, deleteProperty);

// Optional auth: attach user if cookie/token present, but don't reject.
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const hasCookie = req.cookies && (req.cookies.auth_token || req.cookies.token);
  if (!hasCookie && !authHeader) return next();
  return authenticateUser(req, res, (err) => {
    // Ignore auth failures here — treat as guest.
    next();
  });
}

module.exports = router;
