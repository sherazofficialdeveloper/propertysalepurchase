/**
 * Aggregates all API routes under /api.
 */
const express = require('express');
const healthRoutes = require('./health.routes');
const inquiryRoutes = require('./inquiry.routes');
const authRoutes = require('./auth.routes');
const propertyRoutes = require('./property.routes');
const userRoutes = require('./user.routes');
const dashboardRoutes = require('./dashboard.routes');
const adminRoutes = require('./admin.routes');
const favoriteRoutes = require('./favorite.routes');
const notificationRoutes = require('./notification.routes');
const router = express.Router();

router.use('/health', healthRoutes);
router.use('/inquiries', inquiryRoutes);
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
