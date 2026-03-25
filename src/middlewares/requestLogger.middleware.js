const logger = require("../utils/logger");

const requestLogger = (req, res, next) => {

  const start = Date.now();

  res.on("finish", () => {

    const duration = Date.now() - start;

    logger.info("HTTP Request", {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user ? req.user.id : "guest",
      ip: req.ip,
    });

  });

  next();
};

module.exports = requestLogger;