/**
 * Standardized API Response Utility
 * Ensures all API responses follow a consistent structure:
 * { status, message, data }
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Object|Array|null} data - Response data
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
exports.success = (res, message, data = null, statusCode = 200) => {
  const response = {
    status: "success",
    message,
  };

  // Only include data key if data is provided
  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {Object|null} errors - Additional error details
 */
exports.error = (res, message, statusCode = 500, errors = null) => {
  const response = {
    status: "error",
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
