/**
 * Role-based authorization middleware factory.
 * Usage: authorizeRoles('admin') / authorizeRoles('admin', 'seller')
 */
function authorizeRoles(...allowed) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
    }
    next();
  };
}

module.exports = { authorizeRoles };
