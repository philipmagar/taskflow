const logger =require('../utils/logger');
const {detectSuspiciousInput} = require('../utils/securityDetector');

const securityMiddleware = (req, res, next) => {
    // Check both request body and query parameters for suspicious patterns
    const isSuspiciousBody = detectSuspiciousInput(req.body);
    const isSuspiciousQuery = detectSuspiciousInput(req.query);

    if (isSuspiciousBody || isSuspiciousQuery) {
        logger.warn("Suspicious input detected", {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            threatLocation: isSuspiciousBody ? "body" : "query"
        });
        return res.status(400).json({ 
            status: "fail",
            message: "Suspicious input detected. Your request has been blocked for security reasons." 
        });
    }

    next();
}

module.exports = securityMiddleware;
