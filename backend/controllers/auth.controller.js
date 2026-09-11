/**
 * Auth controller — register, login, logout, me.
 * NOTE: password is pre-hashed before User.create() to satisfy the model's
 * minlength:60 validation (bcrypt hash = 60 chars).
 */
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { clean, isNonEmpty, isValidEmail, isValidPhone } = require('../utils/validation');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/token');

const PUBLIC_ROLES = ['buyer', 'seller'];
const MIN_PASSWORD = 6;
const SALT_ROUNDS = 10;

function validateRegister(body) {
  const errors = {};
  const value = {};

  value.name = clean(body.name);
  if (!isNonEmpty(value.name, 2)) errors.name = 'Name must be at least 2 characters.';

  value.email = clean(body.email).toLowerCase();
  if (!isValidEmail(value.email)) errors.email = 'Please enter a valid email address.';

  value.phone = clean(body.phone);
  if (!isValidPhone(value.phone)) errors.phone = 'Please enter a valid phone number.';

  value.password = typeof body.password === 'string' ? body.password : '';
  if (value.password.length < MIN_PASSWORD) {
    errors.password = `Password must be at least ${MIN_PASSWORD} characters.`;
  }

  value.role = clean(body.role).toLowerCase() || 'buyer';
  if (!PUBLIC_ROLES.includes(value.role)) {
    errors.role = 'Role must be either buyer or seller.';
  }

  return { valid: Object.keys(errors).length === 0, errors, value };
}

async function register(req, res, next) {
  try {
    const { valid, errors, value } = validateRegister(req.body || {});
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Please correct the highlighted fields.',
        errors,
      });
    }

    const existing = await User.findOne({ email: value.email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
        errors: { email: 'This email is already registered.' },
      });
    }

    // Pre-hash password — bypasses the model's minlength:60 plain-text check.
    const hashedPassword = await bcrypt.hash(value.password, SALT_ROUNDS);

    const user = await User.create({
      name: value.name,
      email: value.email,
      phone: value.phone,
      password: hashedPassword,     // <-- hashed, 60 chars, validation passes
      role: value.role,
    });

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: user.toSafeJSON(),
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const email = clean(req.body && req.body.email).toLowerCase();
    const password = typeof (req.body && req.body.password) === 'string' ? req.body.password : '';

    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user: user.toSafeJSON(),
    });
  } catch (err) {
    return next(err);
  }
}

function logout(req, res) {
  clearAuthCookie(res);
  return res.status(200).json({ success: true, message: 'Logged out.' });
}

async function me(req, res) {
  return res.status(200).json({ success: true, user: req.user.toSafeJSON() });
}

module.exports = { register, login, logout, me };
