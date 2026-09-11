/**
 * Loads and validates environment variables.
 * Fails fast if a required key is missing.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const required = ['MONGODB_URI', 'PORT'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`[env] Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  PORT: Number(process.env.PORT),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  CORS_ORIGIN: (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};
