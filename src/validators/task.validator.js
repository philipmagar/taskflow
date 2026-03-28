const { body } = require("express-validator");

exports.createTaskValidator = [
  body("title")
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ max: 255 })
    .withMessage("Title cannot exceed 255 characters")
    .trim(),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
];

exports.updateTaskValidator = [
  body("title")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Title cannot exceed 255 characters")
    .trim(),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
];
