const express = require('express');
const app = express();
const morgan = require('morgan');
//morgan
if (process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}
// Middleware
app.use(express.json());

// Routes
const userRoutes = require('./routes/user.routes'); // Make sure the filename matches exactly
app.use('/api/v1/users', userRoutes);

// Optional Health Check
app.get('/api/v1/health', (req, res) => {
    res.json({ message: "Server is healthy" });
});

// Global Error Handler
const globalErrorHandler = require('./middlewares/error.middleware');
app.use(globalErrorHandler);

module.exports = app;