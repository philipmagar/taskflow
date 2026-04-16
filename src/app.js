require('dotenv').config();
const express = require("express");
const apiResponse = require("./utils/apiResponse");
const helmet = require("helmet");
const morgan = require("morgan");
const hpp = require("hpp");
const app = express();
const requestLogger = require("./middlewares/requestLogger.middleware");
const securityMiddleware = require("./middlewares/security.middleware");
const requestIdMiddleware = require("./middlewares/requestId.middleware");
//morgan
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// Middleware
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(hpp());
app.use(requestIdMiddleware);
app.use(requestLogger);
app.use(securityMiddleware);

// Health Check Endpoint
app.get("/api/v1/health", (req, res) => {
  apiResponse.success(res, "API is running");
});

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
