/**
 * Forwards unmatched routes to the error handler as 404.
 */
module.exports = function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
};
