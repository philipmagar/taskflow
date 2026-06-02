/**
 * @file auth.middleware.js
 * @description JWT authentication & authorisation middleware with structured logging.
 *
 * Log events emitted:
 *  - auth.protect.no_token         – request arrived without a Bearer token
 *  - auth.protect.invalid_token    – JWT verification failed (expired / tampered)
 *  - auth.protect.success          – token valid, req.user populated
 *  - auth.restrictTo.denied        – user's role is not in the allowed list
 */

"use strict";

const jwt = require("jsonwebtoken");
const config = require("../config/config");
const AppError = require("../utils/appError");
const logger = require("../utils/logger");

// Use the dedicated auth child logger
const authLogger = logger.auth;

// ─── protect ─────────────────────────────────────────────────────────────────

exports.protect = async (req, res, next) => {
  try {
    // 1. Extract token
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      authLogger.warn("Access denied – no token provided", {
        event: "auth.protect.no_token",
        requestId: req.requestId,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
      });
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtErr) {
      const isExpired = jwtErr.name === "TokenExpiredError";
      authLogger.warn(
        isExpired ? "Access denied – token expired" : "Access denied – invalid token",
        {
          event: "auth.protect.invalid_token",
          requestId: req.requestId,
          ip: req.ip,
          method: req.method,
          url: req.originalUrl,
          reason: jwtErr.message,
          expiredAt: isExpired ? jwtErr.expiredAt : undefined,
        }
      );
      return next(new AppError("Invalid or expired token", 401));
    }

    // 3. Attach user to request
    req.user = decoded;

    authLogger.info("Token verified – access granted", {
      event: "auth.protect.success",
      requestId: req.requestId,
      userId: decoded.id,
      role: decoded.role,
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
    });

    next();
  } catch (err) {
    authLogger.error("Unexpected error in protect middleware", {
      event: "auth.protect.error",
      requestId: req.requestId,
      ip: req.ip,
      error: err.message,
      stack: err.stack,
    });
    return next(new AppError("Authentication error", 500));
  }
};

// ─── restrictTo ───────────────────────────────────────────────────────────────

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      authLogger.warn("Access denied – insufficient role", {
        event: "auth.restrictTo.denied",
        requestId: req.requestId,
        userId: req.user?.id,
        userRole: req.user?.role,
        requiredRoles: roles,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
      });
      return next(
        new AppError("You are not authorized to perform this action", 403)
      );
    }

    authLogger.info("Role check passed", {
      event: "auth.restrictTo.success",
      requestId: req.requestId,
      userId: req.user.id,
      role: req.user.role,
      url: req.originalUrl,
    });

    next();
  };
};