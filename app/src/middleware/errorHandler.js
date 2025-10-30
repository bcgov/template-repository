const { HTTP_STATUS } = require('../constants');

const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  const errorResponse = {
    error: err.message || 'Internal server error',
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && err.stack && { stack: err.stack }),
  };

  res.status(statusCode).json(errorResponse);
};

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.path}`);
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
