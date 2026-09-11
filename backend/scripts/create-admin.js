/**
 * One-off admin creation script.
 * Usage:  node scripts/create-admin.js "Name" "email@x.com" "password" "+923..."
 * Run this manually — never expose via public API.
 */
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');

(async () => {
  const [name, email, password, phone = ''] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.error('Usage: node scripts/create-admin.js "Name" "email" "password" ["phone"]');
    process.exit(1);
  }

  await connectDB();
  try {
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      console.error('[admin] User with this email already exists.');
      process.exit(1);
    }
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'admin',
    });
    console.log('[admin] Created admin user:', user._id.toString(), user.email);
    process.exit(0);
  } catch (err) {
    console.error('[admin] Failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
