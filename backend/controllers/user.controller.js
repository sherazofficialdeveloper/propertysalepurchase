/**
 * User controller — profile endpoints.
 * No role/email changes here. Identity comes from req.user.
 */
const User = require('../models/User');
const { clean, isNonEmpty, isValidPhone } = require('../utils/validation');

async function getMe(req, res) {
  return res.status(200).json({ success: true, user: req.user.toSafeJSON() });
}

async function updateMe(req, res, next) {
  try {
    const body = req.body || {};
    const errors = {};
    const patch = {};

    if (body.name !== undefined) {
      const name = clean(body.name);
      if (!isNonEmpty(name, 2)) errors.name = 'Name must be at least 2 characters.';
      else patch.name = name;
    }

    if (body.phone !== undefined) {
      const phone = clean(body.phone);
      if (!isValidPhone(phone)) errors.phone = 'Please enter a valid phone number.';
      else patch.phone = phone;
    }

    // Explicitly reject role/email/isActive changes here.
    ['role', 'email', 'isActive', 'password'].forEach((k) => {
      if (body[k] !== undefined) errors[k] = `${k} cannot be changed here.`;
    });

    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: 'Invalid update.', errors });
    }

    Object.assign(req.user, patch);
    await req.user.save();

    return res.status(200).json({ success: true, message: 'Profile updated.', user: req.user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMe, updateMe };
