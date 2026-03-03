const globalErrorHandler = (err, req, res, next) => {
    console.error("Error:", err);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    // Development
    if (process.env.NODE_ENV === "development") {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            stack: err.stack
        });
    }

    // Production
    if (process.env.NODE_ENV === "production") {
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }

        return res.status(500).json({
            status: "error",
            message: "Something went wrong"
        });
    }

    // Fallback
    return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
};

module.exports = globalErrorHandler;