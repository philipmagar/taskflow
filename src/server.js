/**
 * @file server.js
 * @description TaskFlow API – server entry point with full startup lifecycle logging.
 */

"use strict";

const config = require("./config/config");
const app = require("./app");
const pool = require("./config/db");
const logger = require("./utils/logger");

const PORT = config.port;
const SERVICE = "taskflow-api";

// ─── Process-level error handlers (register FIRST) ───────────────────────────

process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION – shutting down", {
    event: "uncaughtException",
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error("UNHANDLED REJECTION – shutting down", {
    event: "unhandledRejection",
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// ─── Graceful shutdown handler ────────────────────────────────────────────────

function gracefulShutdown(signal) {
  logger.info(`${signal} received – starting graceful shutdown`, {
    event: "shutdown_initiated",
    signal,
  });

  // Give in-flight requests 10 s to complete
  setTimeout(() => {
    logger.warn("Graceful shutdown timed out – forcing exit", {
      event: "shutdown_timeout",
    });
    process.exit(1);
  }, 10_000).unref();

  pool.end((err) => {
    if (err) {
      logger.error("Error closing DB pool during shutdown", {
        event: "db_pool_close_error",
        error: err.message,
      });
    } else {
      logger.info("Database pool closed cleanly", { event: "db_pool_closed" });
    }
    process.exit(0);
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ─── Start server ─────────────────────────────────────────────────────────────

async function startServer() {
  logger.info("Starting server…", {
    event: "startup_begin",
    service: SERVICE,
    env: config.env,
    nodeVersion: process.version,
    pid: process.pid,
  });

  try {
    // 1. Verify database connectivity
    logger.info("Verifying database connection…", { event: "db_connect_attempt" });
    const connection = await pool.getConnection();
    logger.info("Database connection established", {
      event: "db_connect_success",
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
    });
    connection.release();

    // 2. Bind HTTP listener
    app.listen(PORT, () => {
      logger.info("Server is running and ready to accept requests", {
        event: "server_ready",
        service: SERVICE,
        port: PORT,
        env: config.env,
        pid: process.pid,
        url: `http://localhost:${PORT}`,
        healthCheck: `http://localhost:${PORT}/api/v1/health`,
        metrics: `http://localhost:${PORT}/metrics`,
      });
    });
  } catch (error) {
    logger.error("Failed to start server", {
      event: "startup_error",
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

startServer();