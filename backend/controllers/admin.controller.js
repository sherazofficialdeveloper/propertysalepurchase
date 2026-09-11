/**
 * Admin controller — user listing + status/role management.
 * Reuses existing User model; no duplicate auth.
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const { ROLES } = require('../models/User');

async function listUsers(req, res, next) {
  try {
    const q = req.query || {};
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (q.role) filter.role = q.role;
    if (q.active === 'true') filter.isActive = true;
    if (q.active === 'false') filter.isActive = false;
    if (q.q) {
      const re = new RegExp(String(q.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      users: items.map((u) => u.toSafeJSON()),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    return next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }
    const isActive = Boolean((req.body || {}).isActive);
    if (id === req.user._id.toString() && isActive === false) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = isActive;
    await user.save();
    return res.status(200).json({ success: true, user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }
    const role = String((req.body || {}).role || '').toLowerCase();
    if (!ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    // Prevent self-demotion away from admin (would orphan the system).
    if (id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot change your own role away from admin.' });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.role = role;
    await user.save();
    return res.status(200).json({ success: true, user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listUsers, updateUserStatus, updateUserRole };
