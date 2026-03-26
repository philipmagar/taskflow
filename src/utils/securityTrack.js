const attempts = new Map();
const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 15 * 60 * 1000; // 15 minutes

exports.recordFailedLogin = (ip) => {
  const data = attempts.get(ip) || { count: 0, lastAttempt: Date.now() };
  data.count += 1;
  data.lastAttempt = Date.now();
  attempts.set(ip, data);
  return data.count;
};

exports.resetAttempts = (ip) => {
  attempts.delete(ip);
};

exports.isBlocked = (ip) => {
  const data = attempts.get(ip);
  if (!data) return false;

  const isMoreThanMax = data.count >= MAX_ATTEMPTS;
  const isWithinBlockTime = Date.now() - data.lastAttempt < BLOCK_TIME;

  if (isMoreThanMax && isWithinBlockTime) return true;

  // Reset if block time has passed
  if (isMoreThanMax && !isWithinBlockTime) {
    attempts.delete(ip);
    return false;
  }

  return false;
};