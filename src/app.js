const express = require('express');
const morgan = require('morgan');
const app = express();
//morgan
if (process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}
// Middleware
app.use(express.json());

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