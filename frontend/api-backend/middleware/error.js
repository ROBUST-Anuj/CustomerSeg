function errorHandler(err, req, res, next) {
  console.error('[Error Middleware]', err.stack || err);

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
