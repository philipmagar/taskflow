const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

/**
 * Middleware to handle express-validator result
 */
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400, 'Validation Error'));
    }
    next();
};