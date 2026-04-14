const express = require("express");
const orderController = require("../controllers/order.control");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect); // All order routes require authentication

router.post("/", orderController.createOrder);

module.exports = router;