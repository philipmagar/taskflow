const pool =require('../config/db');
const allowFields =["created_at","updated_at","title","status"];
exports.createTask = async (title, description, userId) => {
    const [result] = await pool.query('INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)',
        [title, description, userId]);
    return result;
};
exports.getTasksByUserId = async (userId, options = {}) => {
  const { status, sort, page = 1, limit = 10 } = options;
  let query = "SELECT * FROM tasks WHERE user_id = ?";
  const params = [userId];

  // Filtering
  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  // Sorting
  if (sort) {
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    if (allowFields.includes(sortField)) {
      query += ` ORDER BY ${sortField} ${sort.startsWith("-") ? "DESC" : "ASC"}`;
    }
  }

  // Pagination
  const limitVal = Math.min(parseInt(limit) || 10, 50);
  const offset = (Math.max(1, parseInt(page)) - 1) * limitVal;
  query += " LIMIT ? OFFSET ?";
  params.push(limitVal, offset);

  const [rows] = await pool.query(query, params);
  return rows;
};

exports.getTaskById = async (taskId) => {
  const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [taskId]);
  return rows[0];
};

exports.updateTask = async (taskId, title, description) => {
  const [result] = await pool.query(
    "UPDATE tasks SET title = ?, description = ? WHERE id = ?",
    [title, description, taskId]
  );
  return result;
};

exports.deleteTask = async (taskId) => {
  const [result] = await pool.query("DELETE FROM tasks WHERE id = ?", [taskId]);
  return result;
};
