const express = require('express');
const userController = require('../controllers/user.controller');
const { validate: validateUser } = require('../middlewares/validation.middleware');

const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post("/" , validateUser, userController.createUser);
router.get("/admin-query", 
    protect, 
    restrictTo('admin'), 
    (req, res) => {
    res.status(200).json({
        message: "welcome admin"
    });
});

module.exports = router;