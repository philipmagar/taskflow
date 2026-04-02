const Task = require("../models/task.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const logger = require("../utils/logger");

/**
 * Filter an object based on allowed fields
 * @param {Object} obj - The object to filter
 * @param {...String} allowedFields - The fields to keep
 * @returns {Object}
 */
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

logger.info("task created successfully", {
  requestId: req.requestId,
  userId: req.user.id,
  taskId: result.insertId,
});
exports.createTask = catchAsync(async (req, res, next) => {
  // Mass assignment protection
  const filteredBody = filterObj(req.body, "title", "description");

  if (!filteredBody.title) {
    return next(new AppError("Task title is required", 400));
  }

  const result = await Task.createTask(
    filteredBody.title,
    filteredBody.description,
    req.user.id
  );

  logger.info("Task created successfully", {
    UserId: req.user.id,
    taskId: result.insertId,
  });

  res.status(201).json({
    status: "success",
    message: "Task created successfully",
    data: {
      taskId: result.insertId,
    },
  });
});

exports.getTasks = catchAsync(async (req, res, next) => {
  const { status } = req.query;
  const tasks = await Task.getTasksByUserId(req.user.id, { status });

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: {
      tasks,
    },
  });
});

exports.getTaskById = catchAsync(async (req, res, next) => {
  const task = await Task.getTaskById(req.params.id);

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Authorization check
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
      new AppError("You do not have permission to update this task", 403)
    );
  }

  // Mass assignment protection
  const filteredBody = filterObj(req.body, "title", "description");

  if (Object.keys(filteredBody).length === 0) {
    return next(new AppError("No data provided to update", 400));
  }

  await Task.updateTask(
    taskId,
    filteredBody.title || task.title,
    filteredBody.description || task.description
  );

  res.status(200).json({
    status: "success",
    message: "Task updated successfully",
    data: null,
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
      new AppError("You do not have permission to delete this task", 403)
    );
  }

  await Task.deleteTask(taskId);

  res.status(204).json({
    status: "success",
    message: "Task deleted successfully",
    data: null,
  });
});
