const attempts = new Map();
const blockedIPs = new Map();

const MAX_ATTEMPTS = 5;
const WINDOW_TIME = 60 * 60 * 1000; // 1 hour window to track attempts
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes block duration

// Comma-separated list of IPs that are never blocked (load-test runners, CI, internal)
// Set via ALLOWED_IPS env var, e.g. ALLOWED_IPS=172.22.0.7,127.0.0.1
const ALLOWED_IPS = new Set(
  (process.env.ALLOWED_IPS || '')
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean)
);

/**
 * Checks if an IP is currently blocked
 * @param {string} ip 
 * @returns {boolean}
 */
exports.isBlocked = (ip) => {
    // Whitelisted IPs (e.g. load-test containers) are never blocked
    if (ALLOWED_IPS.has(ip)) return false;

    const blockUntil = blockedIPs.get(ip);
    if (!blockUntil) return false;

    if (Date.now() > blockUntil) {
        // Block expired, clean up
        blockedIPs.delete(ip);
        attempts.delete(ip);
        return false;
    }

    return true;
};

/**
 * Records a suspicious event for an IP and blocks if threshold reached
 * @param {string} ip 
 * @returns {number} Current attempt count
 */
exports.recordEvent = (ip) => {
    // Whitelisted IPs are never tracked or blocked
    if (ALLOWED_IPS.has(ip)) return 0;

    const now = Date.now();
    let timestamps = attempts.get(ip) || [];

    // Filter out timestamps outside the current window
    timestamps = timestamps.filter(time => now - time < WINDOW_TIME);
    
    // Add current timestamp
    timestamps.push(now);
    attempts.set(ip, timestamps);

    // If threshold exceeded, block the IP
    if (timestamps.length >= MAX_ATTEMPTS) {
        blockedIPs.set(ip, now + BLOCK_DURATION);
    }

    return timestamps.length;
};

/**
 * Resets attempts for a given IP (e.g., after a successful login)
 * @param {string} ip 
 */
exports.resetAttempts = (ip) => {
    attempts.delete(ip);
    blockedIPs.delete(ip);
};