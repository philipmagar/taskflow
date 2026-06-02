/**
 * @file error.middleware.js
 * @description Global error handler with structured, environment-aware logging.
 *
 * Every error is logged with:
 *  - event name          (error.operational | error.programmer | error.unclassified)
 *  - requestId           (correlation ID set by requestId.middleware)
 *  - HTTP method + URL
 *  - userId / IP
 *  - statusCode
 *  - error message
 *  - stack trace         (always captured, exposed to client in dev only)
 */

"use strict";

const logger = require("../utils/logger");
const config = require("../config/config");

/**
 * Build a structured metadata object common to all error log entries.
 */
function buildErrorMeta(err, req) {
  return {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userId: req.user ? req.user.id : "unauthenticated",
    ip: req.ip,
    statusCode: err.statusCode || 500,
    errorName: err.name,
    stack: err.stack,
  };
}

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  const meta = buildErrorMeta(err, req);

  // ── Development ────────────────────────────────────────────────────────────
  if (config.env === "development") {
    logger.error(`[DEV] ${err.message}`, {
      event: "error.unclassified",
      isOperational: err.isOperational || false,
      ...meta,
    });

    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // ── Production & other envs ────────────────────────────────────────────────
  if (err.isOperational) {
    // Known / expected error – safe to surface to client
    logger.warn(`Operational error: ${err.message}`, {
      event: "error.operational",
      isOperational: true,
      ...meta,
    });

    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Unknown / programmer error – do NOT leak details
  logger.error(`Programmer error: ${err.message}`, {
    event: "error.programmer",
    isOperational: false,
    ...meta,
  });

  return res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};

module.exports = globalErrorHandler;
