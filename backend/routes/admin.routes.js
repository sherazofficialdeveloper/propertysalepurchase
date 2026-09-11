/**
 * Admin-only routes.
 *   GET /api/admin/users
 *   PUT /api/admin/users/:id/status
 *   PUT /api/admin/users/:id/role
 */
const express = require('express');
const { listUsers, updateUserStatus, updateUserRole } = require('../controllers/admin.controller');
const { authenticateUser } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const router = express.Router();

router.use(authenticateUser, authorizeRoles('admin'));

router.get('/users', listUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);

module.exports = router;
