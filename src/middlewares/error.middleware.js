const globalErrorHandler =(err,req,res,next)=>{
    console.error("Global erro handler:",err);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    
    res.status(err.statusCode).json({
        status: err.status,
        message :err.message,
    });
};

module.exports = globalErrorHandler;