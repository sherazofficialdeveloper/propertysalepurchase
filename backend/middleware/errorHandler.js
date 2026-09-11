/**
 * Central error handler. Routes just call next(err).
 */
module.exports = function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const payload = {
    success: false,
    message: err.message || 'Internal Server Error',
  };
  if (process.env.NODE_ENV === 'development') payload.stack = err.stack;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json(payload);
};
