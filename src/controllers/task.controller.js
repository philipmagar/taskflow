const TaskService = require("../services/task.service");
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

/**
 * Controller for creating a task
 */
exports.createTask = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, "title", "description");

  const result = await TaskService.createTask(
    filteredBody.title,
    filteredBody.description,
    req.user.id
  );

  logger.info("Task created successfully", {
    requestId: req.requestId,
    userId: req.user.id,
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

/**
 * Controller for getting all user tasks
 */
exports.getTasks = catchAsync(async (req, res, next) => {
  const tasks = await TaskService.getTasksByUserId(req.user.id, req.query);

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: {
      tasks,
    },
  });
});

/**
 * Controller for getting a single task by ID
 */
exports.getTaskById = catchAsync(async (req, res, next) => {
  const task = await TaskService.getTaskById(req.params.id, req.user.id);

  res.status(200).json({
    status: "success",
    data: {
      task,
    },
  });
});

/**
 * Controller for updating a task
 */
exports.updateTask = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, "title", "description");

  if (Object.keys(filteredBody).length === 0) {
    return next(new AppError("No data provided to update", 400));
  }

  await TaskService.updateTask(req.params.id, req.user.id, filteredBody);

  res.status(200).json({
    status: "success",
    message: "Task updated successfully",
    data: null,
  });
});

/**
 * Controller for deleting a task
 */
exports.deleteTask = catchAsync(async (req, res, next) => {
  await TaskService.deleteTask(req.params.id, req.user.id);

  res.status(204).json({
    status: "success",
    message: "Task deleted successfully",
    data: null,
  });
});
