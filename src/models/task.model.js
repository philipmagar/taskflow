const pool =require('../config/db');

exports.createTask = async (title, description, userId) => {
    const [result] = await pool.query('INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)',
        [title, description, userId]);
    return result;
};

exports.getTasksByUserId = async (userId, status) => {
    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [userId];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    const [rows] = await pool.query(query, params);
    return rows;
};

exports.getTaskById = async (taskId) => {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    return rows[0];
};
exports.updateTask = async (taskId, title, description) => {
    const [result] = await pool.query('UPDATE tasks SET title = ?, description = ? WHERE id = ?',
        [title, description, taskId]);
    return result;
};
exports.deleteTask = async (taskId) => {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);
    return result;
};