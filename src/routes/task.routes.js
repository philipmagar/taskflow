const express = require("express");
const taskController = require("../controllers/task.controller");
const { protect } = require("../middlewares/auth.middleware");
const router = express.Router();

router.patch("/:id", protect, taskController.updateTask);



router.post("/", protect, taskController.createTask);
router.get("/", protect, taskController.getTasks);
router.patch("/:id", protect, taskController.updateTask);
module.exports = router;