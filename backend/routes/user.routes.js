/**
 * User profile routes.
 *   GET /api/users/me
 *   PUT /api/users/me
 */
const express = require('express');
const { getMe, updateMe } = require('../controllers/user.controller');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

router.get('/me', authenticateUser, getMe);
router.put('/me', authenticateUser, updateMe);

module.exports = router;
