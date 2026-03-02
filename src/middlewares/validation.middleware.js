const {body,validationResult} = require('express-validator');
const AppError = require('../utils/appError');

exports.validate = [
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').isLength({min: 6}).withMessage('Password must be at least 6 characters long'),    
    body('role').isIn(['admin', 'user']).withMessage('Role must be either admin or user'),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return next(new AppError(errors.array()[0].msg, 400, 'Validation Error'));
        }
        next();
    }
];