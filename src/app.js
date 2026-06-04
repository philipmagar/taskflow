const config = require("./config/config");
const express = require("express");
const apiResponse = require("./utils/apiResponse");
const helmet = require("helmet");
const morgan = require("morgan");
const hpp = require("hpp");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const requestLogger = require("./middlewares/requestLogger.middleware");
const securityMiddleware = require("./middlewares/security.middleware");
const requestIdMiddleware = require("./middlewares/requestId.middleware");
const { metricsMiddleware, metricsEndpoint } = require("./middlewares/metrics.middleware");
//morgan
if (config.env === "development") {
  app.use(morgan("dev"));
}
// Middleware
app.use(cors());
app.use(helmet());

// Rate Limiting — configurable via env vars for load testing
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // default 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,                        // default 100 req
  message: {
    status: "fail",
    message: "Too many requests from this IP, please try again later"
  },
  skip: (req) => {
    // Skip rate limiting for whitelisted IPs (load-test runners, CI)
    const allowed = (process.env.ALLOWED_IPS || "")
      .split(",")
      .map(ip => ip.trim())
      .filter(Boolean);
    return allowed.includes(req.ip);
  },
});
app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));
app.use(hpp());

app.use(requestIdMiddleware);
app.use(requestLogger);
app.use(metricsMiddleware);
app.use(securityMiddleware);

// Health Check Endpoint
app.get("/api/v1/health", (req, res) => {
  apiResponse.success(res, "API is running");
});

// Metrics Endpoint
app.get("/metrics", metricsEndpoint);

app.use("/api/v1/orders", require("./routes/order.routes"));
// Routes
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
// Global Error Handler
const globalErrorHandler = require("./middlewares/error.middleware");
app.use(globalErrorHandler);
module.exports = app;
