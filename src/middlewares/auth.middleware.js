const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

exports.protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new AppError('you are not authorized to access this', 401));
    }
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
    }   catch (err){
        return next(new AppError('Invalid token',401));
    }
};
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You are not authorized to perform this action', 403));
        }
        next();
    };
};