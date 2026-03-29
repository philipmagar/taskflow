const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
const app = express();
const requestLogger = require("./middlewares/requestLogger.middleware");  
const securityMiddleware = require("./middlewares/security.middleware");
//morgan
if (process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}
// Middleware
app.use(helmet());
app.use(express.json());
app.use(hpp());
app.use(requestLogger);
app.use(securityMiddleware);
// Routes
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require("./routes/task.routes");
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);  
app.use("/api/v1/tasks", taskRoutes);
// Global Error Handler
const globalErrorHandler = require('./middlewares/error.middleware');
app.use(globalErrorHandler);
module.exports = app;
