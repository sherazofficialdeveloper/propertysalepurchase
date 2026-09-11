const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const [email, password] = process.argv.slice(2);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./models/User');
  const hashed = await bcrypt.hash(password, 10);
  const r = await User.updateOne({ email: email.toLowerCase() }, { $set: { password: hashed } });
  console.log('Updated:', r.modifiedCount);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
