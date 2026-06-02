/**
 * @file logger.js
 * @description Winston logger configuration for TaskFlow API.
 *
 * Domains / child loggers:
 *  - logger           (root – general purpose)
 *  - logger.auth      (authentication events)
 *  - logger.task      (task CRUD events)
 *  - logger.http      (inbound HTTP requests)
 *  - logger.error     (uncaught / unhandled errors)
 *
 * Transports:
 *  - Console          (dev: colourised, prod: JSON)
 *  - DailyRotateFile  combined.log  (all levels ≥ info)
 *  - DailyRotateFile  error.log     (level: error only)
 *  - DailyRotateFile  auth.log      (auth domain only)
 *  - DailyRotateFile  task.log      (task domain only)
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const config = require("../config/config");

// ─── 1. Ensure logs/ directory exists ────────────────────────────────────────
const LOGS_DIR = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const isProduction = config.env === "production";
const SERVICE_NAME = "taskflow-api";

// ─── 2. Shared format helpers ─────────────────────────────────────────────────

/** Base fields always added to every log entry */
const baseFields = format((info) => {
  info.service = SERVICE_NAME;
  info.env = config.env;
  if (!info.timestamp) info.timestamp = new Date().toISOString();
  return info;
});

/** Developer-friendly colourised output */
const devFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  baseFields(),
  format.printf(({ level, message, timestamp, domain, requestId, ...meta }) => {
    const domainTag = domain ? ` [${domain}]` : "";
    const reqTag = requestId ? ` rid=${requestId}` : "";
    const metaStr = Object.keys(meta).length
      ? " " + JSON.stringify(meta, null, 0)
      : "";
    return `${timestamp}${domainTag}${reqTag} ${level}: ${message}${metaStr}`;
  })
);

/** Production-ready structured JSON */
const prodFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  baseFields(),
  format.json()
);

const logFormat = isProduction ? prodFormat : devFormat;

// ─── 3. DailyRotateFile transport factory ────────────────────────────────────

/**
 * @param {string} stem   File stem, e.g. "combined" → logs/combined-%DATE%.log
 * @param {object} opts   Additional DailyRotateFile options
 */
function rotateTransport(stem, opts = {}) {
  return new DailyRotateFile({
    filename: path.join(LOGS_DIR, `${stem}-%DATE%.log`),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "10m",
    maxFiles: "14d",
    auditFile: path.join(LOGS_DIR, `.${stem}-audit.json`),
    format: format.combine(
      format.timestamp(),
      baseFields(),
      format.json() // files are always JSON for grep-ability
    ),
    ...opts,
  });
}

// ─── 4. Root logger ───────────────────────────────────────────────────────────

const rootLogger = createLogger({
  level: isProduction ? "info" : "debug",
  format: logFormat,
  transports: [
    new transports.Console(),
    rotateTransport("combined"),
    rotateTransport("error", { level: "error", maxSize: "5m" }),
  ],
  exitOnError: false,
});

// ─── 5. Domain child loggers ──────────────────────────────────────────────────

/**
 * Auth child logger – writes to console + combined + error + dedicated auth.log
 */
rootLogger.auth = createLogger({
  level: isProduction ? "info" : "debug",
  format: logFormat,
  defaultMeta: { domain: "auth", service: SERVICE_NAME, env: config.env },
  transports: [
    new transports.Console(),
    rotateTransport("combined"),
    rotateTransport("error", { level: "error", maxSize: "5m" }),
    rotateTransport("auth", { maxSize: "5m", maxFiles: "30d" }),
  ],
  exitOnError: false,
});

/**
 * Task child logger – writes to console + combined + error + dedicated task.log
 */
rootLogger.task = createLogger({
  level: isProduction ? "info" : "debug",
  format: logFormat,
  defaultMeta: { domain: "task", service: SERVICE_NAME, env: config.env },
  transports: [
    new transports.Console(),
    rotateTransport("combined"),
    rotateTransport("error", { level: "error", maxSize: "5m" }),
    rotateTransport("task", { maxSize: "10m", maxFiles: "14d" }),
  ],
  exitOnError: false,
});

/**
 * HTTP request child logger – lightweight, writes to console + combined only
 */
rootLogger.http = createLogger({
  level: "http",
  format: logFormat,
  defaultMeta: { domain: "http", service: SERVICE_NAME, env: config.env },
  transports: [
    new transports.Console(),
    rotateTransport("combined"),
  ],
  exitOnError: false,
});

module.exports = rootLogger;
