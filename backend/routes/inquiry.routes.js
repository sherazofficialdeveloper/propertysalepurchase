/**
 * Inquiry routes.
 *   POST   /api/inquiries              → public submit (auth optional)
 *   GET    /api/inquiries              → role-scoped list
 *   GET    /api/inquiries/:id          → role-scoped detail
 *   PUT    /api/inquiries/:id/status   → admin/owning-seller
 */
const express = require('express');
const {
  createInquiry, listInquiries, getInquiry, updateInquiryStatus,
} = require('../controllers/inquiry.controller');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

// Optional auth on submit: attach user if cookie is valid, but don't require it.
router.post('/', optionalAuth, createInquiry);

router.get('/', authenticateUser, listInquiries);
router.get('/:id', authenticateUser, getInquiry);
router.put('/:id/status', authenticateUser, updateInquiryStatus);

// Extend authenticateUser's error path so missing/invalid cookie doesn't 401 public POST.
function optionalAuth(req, res, next) {
  const hasAuth = (req.cookies && req.cookies.auth_token) || req.headers.authorization;
  if (!hasAuth) return next();
  return authenticateUser(req, res, () => next());
}

module.exports = router;
