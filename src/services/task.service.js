const Task = require("../models/task.model");
const AppError = require("../utils/appError");

/**
 * Service to handle task-related business logic
 */
class TaskService {
  /**
   * Create a new task
   * @param {string} title - Task title
   * @param {string} description - Task description
   * @param {number} userId - ID of the user creating the task
   * @returns {Promise<Object>}
   */
  static async createTask(title, description, userId) {
    if (!title) {
      throw new AppError("Task title is required", 400);
    }
    return await Task.createTask(title, description, userId);
  }

  /**
   * Get all tasks for a specific user with optional filtering/sorting/pagination
   * @param {number} userId - ID of the user
   * @param {Object} queryOptions - Filtering/sorting/pagination options
   * @returns {Promise<Array>}
   */
  static async getTasksByUserId(userId, queryOptions) {
    return await Task.getTasksByUserId(userId, queryOptions);
  }

  /**
   * Get a single task by ID and verify ownership
   * @param {number} taskId - ID of the task
   * @param {number} userId - ID of the user
   * @returns {Promise<Object>}
   */
  static async getTaskById(taskId, userId) {
    const task = await Task.getTaskById(taskId);

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    if (task.user_id !== userId) {
      throw new AppError("Not authorized to access this task", 403);
    }

    return task;
  }

  /**
   * Update a task's title and/or description
   * @param {number} taskId - ID of the task
   * @param {number} userId - ID of the user performing the update
   * @param {Object} updateData - Data to update (title, description)
   * @returns {Promise<Object>}
   */
  static async updateTask(taskId, userId, updateData) {
    const task = await this.getTaskById(taskId, userId);

    const title = updateData.title || task.title;
    const description = updateData.description || task.description;

    return await Task.updateTask(taskId, title, description);
  }

  /**
   * Delete a task
   * @param {number} taskId - ID of the task
   * @param {number} userId - ID of the user performing the deletion
   * @returns {Promise<Object>}
   */
  static async deleteTask(taskId, userId) {
    // Ownership check via getTaskById
    await this.getTaskById(taskId, userId);
    return await Task.deleteTask(taskId);
  }
}

module.exports = TaskService;
