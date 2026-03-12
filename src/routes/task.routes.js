const express = require("express");
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getTaskById,
} = require("../controllers/task.controller");

const { protect } = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/", protect, createTask);
router.get("/", protect, getTasks);
router.get("/:id", protect, getTaskById);
router.patch("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);
module.exports = router;
