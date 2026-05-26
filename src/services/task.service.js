const pool = require("../config/db");
const AppError = require("../utils/appError");
const TaskModel = require("../models/task.model");
const cache = require("../utils/cache");

/**
 * Generate a cache key for task queries
 * @param {Number} userId
 * @param {Object} queryParams
 * @returns {String}
 */
const buildCacheKey = (userId, queryParams) => {
  const sortedParams = Object.keys(queryParams)
    .sort()
    .map((key) => `${key}=${queryParams[key]}`)
    .join("&");
  return `tasks:user:${userId}:${sortedParams}`;
};

/**
 * Create a task with transaction and row lock (atomic operation)
 */
exports.createTask = async (title, description, userId) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (!title) {
      throw new AppError("Task title is required", 400);
    }

    //  LOCK USER ROW to prevent concurrent count mismatch
    const [userRows] = await connection.query(
      "SELECT task_count FROM users WHERE id = ? FOR UPDATE",
      [userId],
    );

    if (!userRows.length) {
      throw new AppError("User not found", 404);
    }

    // 1️⃣ Insert task
    const [taskResult] = await connection.query(
      "INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)",
      [title, description, userId],
    );

    // 2️⃣ Update user task count safely
    await connection.query(
      "UPDATE users SET task_count = task_count + 1 WHERE id = ?",
      [userId],
    );

    await connection.commit();

    // ️ Invalidate task cache for this user
    cache.deleteByPrefix(`tasks:user:${userId}`);

    return taskResult;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.getTasksByUserId = async (userId, options) => {
  return await TaskModel.getTasksByUserId(userId, options);
};

/**
 * Get tasks with caching
 * First request  → Database (result cached)
 * Second request → Cache (faster)
 */
exports.getTasks = async (userId, queryParams) => {
  const cacheKey = buildCacheKey(userId, queryParams);

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const tasks = await TaskModel.getTasksAdvanced(userId, queryParams);

  cache.set(cacheKey, tasks);

  return tasks;
};

exports.getTaskById = async (taskId, userId) => {
  const task = await TaskModel.getTaskById(taskId);

  if (!task || task.user_id !== userId) {
    throw new AppError("Task not found or access denied", 404);
  }

  return task;
};

/**
 * Update a task (pass-through)
 */
exports.updateTask = async (taskId, userId, data) => {
  const task = await TaskModel.getTaskById(taskId);

  if (!task || task.user_id !== userId) {
    throw new AppError("Task not found or access denied", 404);
  }

  const { title, description } = data;
  const result = await TaskModel.updateTask(
    taskId,
    title || task.title,
    description || task.description,
  );

  cache.deleteByPrefix(`tasks:user:${userId}`);

  return result;
};

exports.deleteTask = async (taskId, userId) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [userRows] = await connection.query(
      "SELECT task_count FROM users WHERE id = ? FOR UPDATE",
      [userId],
    );

    if (!userRows.length) {
      throw new AppError("User not found", 404);
    }

    // 1️⃣ Check if task exists and belongs to user
    const [tasks] = await connection.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, userId],
    );

    if (tasks.length === 0) {
      throw new AppError("Task not found or access denied", 404);
    }

    await connection.query("DELETE FROM tasks WHERE id = ?", [taskId]);

    await connection.query(
      "UPDATE users SET task_count = GREATEST(0, task_count - 1) WHERE id = ?",
      [userId],
    );

    await connection.commit();

    cache.deleteByPrefix(`tasks:user:${userId}`);

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
