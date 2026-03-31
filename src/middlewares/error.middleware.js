const logger = require("../utils/logger");

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    console.error("Error 💥:", err);
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // Production
  if (process.env.NODE_ENV === "production") {
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
    console.error("ERROR", err);
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
