/**
 * @file task.controller.js
 * @description Task CRUD controller with full task-event logging.
 *
 * Log events emitted (domain: task):
 *  - task.list.success      – tasks fetched for a user
 *  - task.get.success       – single task retrieved
 *  - task.create.success    – new task created
 *  - task.update.success    – task updated
 *  - task.update.noop       – update attempted with no valid fields
 *  - task.delete.success    – task deleted
 */

"use strict";

const TaskService = require("../services/task.service");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const logger = require("../utils/logger");
const apiResponse = require("../utils/apiResponse");

// Use the dedicated task child logger
const taskLogger = logger.task;

/**
 * Filter an object to only include allowed fields.
 * @param {Object} obj
 * @param {...string} allowedFields
 * @returns {Object}
 */
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// ─── GET /tasks ───────────────────────────────────────────────────────────────

exports.getTasks = catchAsync(async (req, res, next) => {
  const tasks = await TaskService.getTasks(req.user.id, req.query);

  taskLogger.info("Tasks listed", {
    event: "task.list.success",
    requestId: req.requestId,
    userId: req.user.id,
    count: tasks.length,
    filters: req.query,
  });

  apiResponse.success(res, "Tasks fetched", { results: tasks.length, tasks });
});

// ─── GET /tasks/:id ───────────────────────────────────────────────────────────

exports.getTaskById = catchAsync(async (req, res, next) => {
  const task = await TaskService.getTaskById(req.params.id, req.user.id);

  taskLogger.info("Task retrieved", {
    event: "task.get.success",
    requestId: req.requestId,
    userId: req.user.id,
    taskId: req.params.id,
  });

  apiResponse.success(res, "Task fetched", { task });
});

// ─── POST /tasks ──────────────────────────────────────────────────────────────

exports.createTask = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, "title", "description");

  const result = await TaskService.createTask(
    filteredBody.title,
    filteredBody.description,
    req.user.id
  );

  taskLogger.info("Task created", {
    event: "task.create.success",
    requestId: req.requestId,
    userId: req.user.id,
    taskId: result.insertId,
    title: filteredBody.title,
  });

  apiResponse.success(
    res,
    "Task created successfully",
    { taskId: result.insertId },
    201
  );
});

// ─── PATCH /tasks/:id ─────────────────────────────────────────────────────────

exports.updateTask = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, "title", "description");

  if (Object.keys(filteredBody).length === 0) {
    taskLogger.warn("Task update attempted with no valid fields", {
      event: "task.update.noop",
      requestId: req.requestId,
      userId: req.user.id,
      taskId: req.params.id,
      bodyKeys: Object.keys(req.body),
    });
    return next(new AppError("No data provided to update", 400));
  }

  await TaskService.updateTask(req.params.id, req.user.id, filteredBody);

  taskLogger.info("Task updated", {
    event: "task.update.success",
    requestId: req.requestId,
    userId: req.user.id,
    taskId: req.params.id,
    updatedFields: Object.keys(filteredBody),
  });

  apiResponse.success(res, "Task updated successfully");
});

// ─── DELETE /tasks/:id ────────────────────────────────────────────────────────

exports.deleteTask = catchAsync(async (req, res, next) => {
  await TaskService.deleteTask(req.params.id, req.user.id);

  taskLogger.info("Task deleted", {
    event: "task.delete.success",
    requestId: req.requestId,
    userId: req.user.id,
    taskId: req.params.id,
  });

  res.status(204).json({
    status: "success",
    message: "Task deleted successfully",
    data: null,
  });
});
