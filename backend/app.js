/**
 * Express app factory.
 * Cookie + CORS hardening for cross-origin deployment.
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

// Behind a proxy (Railway, Render, Heroku, etc.) — needed for secure cookies.
app.set('trust proxy', 1);

// ---------------------------------------------------------------
// CORS configuration
// ---------------------------------------------------------------
// Normalize origins: trim, remove trailing slashes, drop empties.
const normalizeOrigin = (o) => String(o || '').trim().replace(/\/+$/, '');
const allowedOrigins = (CORS_ORIGIN && CORS_ORIGIN.length > 0
  ? CORS_ORIGIN
  : ['http://localhost:5500', 'http://127.0.0.1:5500']
).map(normalizeOrigin);

app.use(
  cors({
    origin: function (origin, callback) {
      // No origin → allow (curl, Postman, same-origin server-side).
      if (!origin) return callback(null, true);

      const cleanOrigin = normalizeOrigin(origin);
      if (allowedOrigins.includes(cleanOrigin)) {
        // Reflect the exact origin back to the browser.
        return callback(null, cleanOrigin);
      }

      // Not allowed — pass a normal error (not thrown), so it reaches the
      // error handler as a 500 without crashing the server.
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // cache preflight for 24h
  })
);

// Explicitly handle preflight requests for every route.
app.options('*', cors());

// ---------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ---------------------------------------------------------------
// Dev request logger
// ---------------------------------------------------------------
if (NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    const c = req.cookies && req.cookies.auth_token ? '🍪 yes' : '🍪 no';
    console.log(`[req] ${req.method} ${req.originalUrl} ${c}`);
    next();
  });
}

// ---------------------------------------------------------------
// API routes
// ---------------------------------------------------------------
app.use('/api', apiRoutes);

// ---------------------------------------------------------------
// Serve frontend in production
// ---------------------------------------------------------------
if (NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend');
  app.use(express.static(frontendPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ---------------------------------------------------------------
// 404 + error handling (must be last)
// ---------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;