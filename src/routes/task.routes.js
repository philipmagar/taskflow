const express = require("express");
const taskController = require("../controllers/task.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, taskController.createTask);

module.exports = router;