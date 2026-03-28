const express = require("express");
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getTaskById,
} = require("../controllers/task.controller");

const { protect } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validation.middleware");
const {
  createTaskValidator,
  updateTaskValidator,
} = require("../validators/task.validator");

const router = express.Router();

router.use(protect); // Protect all task routes

router.post("/", createTaskValidator, validate, createTask);
router.get("/", getTasks);
router.get("/:id", getTaskById);
router.patch("/:id", updateTaskValidator, validate, updateTask);
router.delete("/:id", deleteTask);
module.exports = router;
