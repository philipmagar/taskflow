const Task = require("../models/task.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createTask = catchAsync(async (req, res, next) => {
  const { title, description } = req.body;

  if (!title) {
    return next(new AppError("Task title is required", 400));
  }

  const result = await Task.createTask(title, description, req.user.id);

  res.status(201).json({
    status: "success",
    message: "Task created successfully",
    taskId: result.insertId,
  });
});

exports.getTasks = catchAsync(async (req, res, next) => {
const {status} = req.query;
const tasks = await Task.getTasksByUserId(req.user.id, status);
  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: tasks,
  });
});

exports.getTaskById = catchAsync(async (req, res, next) => {
  const taskId = req.params.id;
  const task = await Task.getTaskById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // authorization check
  if (task.user_id !== req.user.id) {
    return next(new AppError("Not authorized to access this task", 403));
  }

  res.status(200).json({
    status: "success",
    data: {
      task,
    },
  });
});

exports.updateTask = catchAsync(async (req, res, next) => {
  const taskId = req.params.id;
  const task = await Task.getTaskById(taskId);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  if (task.user_id !== req.user.id) {
    return next(
      new AppError("You do not have permission to update this task", 403),
    );
  }

  const { title, description } = req.body;

  await Task.updateTask(
    taskId,
    title || task.title,
    description || task.description,
  );

  res.status(200).json({
    status: "success",
    message: "Task updated successfully",
  });
});

exports.deleteTask = catchAsync(async (req, res, next) => {
  const taskId = req.params.id;
  const task = await Task.getTaskById(taskId);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }
  if (task.user_id !== req.user.id) {
    return next(
      new AppError("You do not have permission to delete this task", 403),
    );
  }
  await Task.deleteTask(taskId);
  res.status(200).json({
    status: "success",
    message: "Task deleted successfully",
  });
});
