const { body } = require('express-validator');

exports.registerValidator = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .trim(),
  body('role')
    .custom((value) => {
      if (value) throw new Error('Role selection is forbidden during registration');
      return true;
    }),
];