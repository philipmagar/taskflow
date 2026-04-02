const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const isProduction = process.env.NODE_ENV === "production";

//  DEV FORMAT (Readable)
const devFormat = format.combine(
  format.colorize(),
  format.timestamp(),
  format.printf(({ level, message, timestamp, ...meta }) => {
    return `[${timestamp}] ${level}: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ""
    }`;
  }),
);

//  PROD FORMAT (Structured JSON)
const prodFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json(),
);
const filerotateTransport = new DailyRotateFile({
  filename: "logs/combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "10m",
  maxFiles: "7d",
});
const errorRotateTransport = new DailyRotateFile({
  filename: "logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "5m",
  maxFiles: "7d",
});
const logger = createLogger({
  level: "info",
  format: isProduction ? prodFormat : devFormat,

  transports: [
    new transports.Console(),
    filerotateTransport,
    errorRotateTransport,
  ],
});
module.exports = logger;
