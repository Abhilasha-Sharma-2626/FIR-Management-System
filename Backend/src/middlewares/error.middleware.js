/**
 * Centralized error handling middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err);

  // PostgreSQL unique violation error
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A duplicate record with the provided information already exists.',
      detail: err.detail
    });
  }

  // PostgreSQL foreign key violation error
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced entity does not exist.',
      detail: err.detail
    });
  }

  // JSON parsing error in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload.'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

module.exports = {
  errorHandler
};
