/**
 * Express app factory.
 * Cookie + CORS hardening for cross-origin dev (localhost vs 127.0.0.1).
 */
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const { CORS_ORIGIN, NODE_ENV } = require('./config/env');
const apiRoutes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Behind proxy (needed for secure cookies on hosts like Render/Heroku)
app.set('trust proxy', 1);

// Allow configured origins; support both localhost and 127.0.0.1.
const allowedOrigins = CORS_ORIGIN.length > 0
  ? CORS_ORIGIN
  : ['http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (curl, mobile apps, same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS: origin not allowed — ' + origin));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

if (NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    const c = req.cookies && req.cookies.auth_token ? '🍪 yes' : '🍪 no';
    console.log(`[req] ${req.method} ${req.originalUrl} ${c}`);
    next();
  });
}

app.use('/api', apiRoutes);

if (NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend');
  app.use(express.static(frontendPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
