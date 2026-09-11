/**
 * Auth routes.
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/auth/logout
 *   GET  /api/auth/me     (protected)
 */
const express = require('express');
const { register, login, logout, me } = require('../controllers/auth.controller');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateUser, me);

module.exports = router;
