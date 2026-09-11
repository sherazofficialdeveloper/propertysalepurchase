/**
 * MongoDB connection via Mongoose.
 * Single responsibility: connect, log, exit on failure.
 */
const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
