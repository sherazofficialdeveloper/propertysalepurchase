/**
 * Notification controller — always scoped to the authenticated user.
 */
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

function validId(id) { return mongoose.Types.ObjectId.isValid(id); }

/**
 * GET /api/notifications?page=&limit=&isRead=
 */
async function listNotifications(req, res, next) {
  try {
    const q = req.query || {};
    const filter = { recipient: req.user._id };

    if (q.isRead === 'true') filter.isRead = true;
    else if (q.isRead === 'false') filter.isRead = false;

    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(q.limit) || 10));
    const skip = (page - 1) * limit;

    const [items, total, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      notifications: items.map((n) => serialize(n)),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      unreadCount: unread,
    });
  } catch (err) { return next(err); }
}

/**
 * GET /api/notifications/unread-count
 */
async function unreadCount(req, res, next) {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    return res.status(200).json({ success: true, count });
  } catch (err) { return next(err); }
}

/**
 * GET /api/notifications/:id — auto-marks as read (idempotent).
 */
async function getNotification(req, res, next) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ success: false, message: 'Invalid notification id.' });

    const n = await Notification.findOne({ _id: id, recipient: req.user._id });
    if (!n) return res.status(404).json({ success: false, message: 'Notification not found.' });

    if (!n.isRead) { n.isRead = true; await n.save(); }

    return res.status(200).json({ success: true, notification: serialize(n) });
  } catch (err) { return next(err); }
}

/**
 * PUT /api/notifications/:id/read
 */
async function markRead(req, res, next) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ success: false, message: 'Invalid notification id.' });

    const n = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!n) return res.status(404).json({ success: false, message: 'Notification not found.' });

    return res.status(200).json({ success: true, notification: serialize(n) });
  } catch (err) { return next(err); }
}

/**
 * PUT /api/notifications/read-all
 */
async function markAllRead(req, res, next) {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json({ success: true, modified: result.modifiedCount || 0 });
  } catch (err) { return next(err); }
}

/**
 * DELETE /api/notifications/:id
 */
async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ success: false, message: 'Invalid notification id.' });

    const deleted = await Notification.findOneAndDelete({ _id: id, recipient: req.user._id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Notification not found.' });

    return res.status(200).json({ success: true });
  } catch (err) { return next(err); }
}

function serialize(n) {
  return {
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    message: n.message,
    relatedEntityType: n.relatedEntityType,
    relatedEntityId: n.relatedEntityId,
    isRead: n.isRead,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

module.exports = {
  listNotifications,
  unreadCount,
  getNotification,
  markRead,
  markAllRead,
  deleteNotification,
};
