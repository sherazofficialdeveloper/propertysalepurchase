/**
 * Notification routes — all require authentication.
 *   GET    /api/notifications
 *   GET    /api/notifications/unread-count
 *   GET    /api/notifications/:id
 *   PUT    /api/notifications/:id/read
 *   PUT    /api/notifications/read-all
 *   DELETE /api/notifications/:id
 */
const express = require('express');
const {
  listNotifications, unreadCount, getNotification, markRead, markAllRead, deleteNotification,
} = require('../controllers/notification.controller');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateUser);

router.get('/', listNotifications);
router.get('/unread-count', unreadCount);
router.put('/read-all', markAllRead);
router.get('/:id', getNotification);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

module.exports = router;
