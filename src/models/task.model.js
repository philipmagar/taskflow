const pool =require('../config/db');

exports.createTask = async (title, description, userId) => {
    const [result] = await pool.query('INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)',
        [title, description, userId]);
    return result;
};

exports.getTasksByUserId = async (userId) => {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);
    return rows;
};