const logger = require("../utils/logger");
const config = require("../config/config");

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (config.env === "development") {
    logger.error("Error :", { message: err.message, stack: err.stack });
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // Production
  if (config.env === "production") {
    // Log error for internal tracking
    logger.error(err.message, {
      requestId: req.requestId,
      statusCode: err.statusCode,
      status: err.status,
      stack: err.stack,
    });

    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // Programming or other unknown error: don't leak error details
    logger.error("ERROR", { message: err.message, stack: err.stack });
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }

  // Fallback for other environments (test, etc)
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

module.exports = globalErrorHandler;

