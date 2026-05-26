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
exports.getTasksAdvanced = async (userId, queryParams) => {

  let query = "SELECT * FROM tasks WHERE user_id = ?";
  const values = [userId];

  //  Filtering
  if (queryParams.status) {
    query += " AND status = ?";
    values.push(queryParams.status);
  }

  //  Sorting
  if (queryParams.sort) {
    const allowedSortFields = ["created_at", "title"];
    if (allowedSortFields.includes(queryParams.sort)) {
      query += ` ORDER BY ${queryParams.sort}`;
    }
  } else {
    query += " ORDER BY created_at DESC";
  }

  //  Pagination
  const limit = parseInt(queryParams.limit) || 10;
  const page = parseInt(queryParams.page) || 1;
  const offset = (page - 1) * limit;

  query += " LIMIT ? OFFSET ?";
  values.push(limit, offset);

  const [rows] = await pool.query(query, values);

  return rows;
};
exports.deleteTask = async (taskId) => {
  const [result] = await pool.query("DELETE FROM tasks WHERE id = ?", [taskId]);
  return result;
};

