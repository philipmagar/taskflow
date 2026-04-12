const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const AppError = require("../utils/appError");
const apiResponse = require("../utils/apiResponse");
const catchAsync = require("../utils/catchAsync");
const securityTracker = require("../utils/securityTrack");
const logger = require("../utils/logger");  
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if IP is blocked
  if (securityTracker.isBlocked(req.ip)) {
    logger.warn("Blocked login attempt blocked", { ip: req.ip, email });
    return next(new AppError("Too many attempts, please try again later", 429));
  }

  //  Find user & check password
  const user = await User.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    // Record failed attempt
    const attempts = securityTracker.recordEvent(req.ip);
    logger.warn("Failed login attempt", { ip: req.ip, email, attempts });
    return next(new AppError("Invalid email or password", 401));
  }

  // On successful login
  securityTracker.resetAttempts(req.ip);
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  logger.info("User logged in successfully", { userId: user.id, ip: req.ip });

  apiResponse.success(res, "Login successful", {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

module.exports = {
  login,
};

