const securityTrack = require('../utils/securityTrack');
const logger = require('../utils/logger');
const { detectSuspiciousInput } = require('../utils/securityDetector');

/**
 * Security middleware to protect against malicious inputs and brute force
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {next} next 
 */
const securityMiddleware = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;

    // 1. Check if IP is currently blocked
    if (securityTrack.isBlocked(ip)) {
        logger.warn("Request from blocked IP attempted", {
            requestId: req.requestId,
            ip,
            method: req.method,
            url: req.originalUrl,
            status: 403
        });
        return res.status(403).json({ 
            status: "fail",
            message: "This IP has been temporarily blocked due to multiple suspicious attempts. Please try again later." 
        });
    }

    // 2. Check both request body and query parameters for suspicious patterns
    const isSuspiciousBody = detectSuspiciousInput(req.body);
    const isSuspiciousQuery = detectSuspiciousInput(req.query);

    if (isSuspiciousBody || isSuspiciousQuery) {
        // Record this event to eventually block the IP if threshold reached
        const attempts = securityTrack.recordEvent(ip);

        logger.warn("Suspicious input detected", {
            requestId: req.requestId,
            ip,
            method: req.method,
            url: req.originalUrl,
            threatLocation: isSuspiciousBody ? "body" : "query",
            attemptCount: attempts,
            status: 400
        });

        return res.status(400).json({ 
            status: "fail",
            message: "Suspicious input detected. Your request has been blocked for security reasons." 
        });
    }

    next();
}

module.exports = securityMiddleware;
