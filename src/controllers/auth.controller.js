const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const securityTracker = require("../utils/securityTrack");
const logger = require("../utils/logger");  
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if IP is blocked
  if (securityTracker.isBlocked(req.ip)) {
    logger.warn("Blocked login attempt blocked", { ip: req.ip, email });
    return next(new AppError("Too many attempts, please try again later", 429));
  }

  // 2) Find user & check password
  const user = await User.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    // Record failed attempt
    const attempts = securityTracker.recordFailedLogin(req.ip);
    logger.warn("Failed login attempt", { ip: req.ip, email, attempts });
    return next(new AppError("Invalid email or password", 401));
  }

  // 3) On successful login
  securityTracker.resetAttempts(req.ip);
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  logger.info("User logged in successfully", { userId: user.id, ip: req.ip });

  res.status(200).json({
    status: "success",
    token,
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

