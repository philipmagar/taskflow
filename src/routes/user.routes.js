const express = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middlewares/validate.middleware');
const { createUserSchema } = require('../validators/user.validator');
const { validate: validateUser } = require('../middlewares/validation.middleware');

const router = express.Router();
router.post("/" , validateUser, userController.createUser);

module.exports = router;