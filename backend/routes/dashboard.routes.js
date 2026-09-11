/**
 * Dashboard statistics.
 *   GET /api/dashboard/buyer
 *   GET /api/dashboard/seller
 *   GET /api/dashboard/admin
 */
const express = require('express');
const { buyerDashboard, sellerDashboard, adminDashboard } = require('../controllers/dashboard.controller');
const { authenticateUser } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const router = express.Router();

router.get('/buyer', authenticateUser, authorizeRoles('buyer'), buyerDashboard);
router.get('/seller', authenticateUser, authorizeRoles('seller', 'admin'), sellerDashboard);
router.get('/admin', authenticateUser, authorizeRoles('admin'), adminDashboard);

module.exports = router;
