const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const [email, ...pwParts] = process.argv.slice(2);
const password = pwParts.join(' ');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./models/User');
  const u = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
  if (!u) { console.log('❌ User not found:', email); process.exit(0); }
  console.log('✅ User found');
  console.log('   email:  ', u.email);
  console.log('   role:   ', u.role);
  console.log('   active: ', u.isActive);
  console.log('   hash length:', u.password.length, '(60 = bcrypt, ok)');
  console.log('   hash preview:', u.password.slice(0, 30) + '...');
  console.log('   compare with "' + password + '":', await bcrypt.compare(password, u.password));
  process.exit(0);
})().catch((e) => { console.error('❌', e.message); process.exit(1); });
