/**
 * Entry point: connect DB, start server, handle shutdown.
 */
const app = require('./app');
const { connectDB } = require('./config/db');
const { PORT, NODE_ENV } = require('./config/env');

(async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[server] Running in ${NODE_ENV} mode on http://localhost:${PORT}`);
    console.log(`[server] Health: http://localhost:${PORT}/api/health`);
  });

  const shutdown = (signal) => {
    console.log(`\n[server] ${signal} received. Shutting down...`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
