const pool =require('../config/db.config');

class User{
    static async create(user){
        const {email,password,role} = user;
        const [result] = await pool.query('INSERT INTO users (email,password,role) VALUES (?,?,?)',
            [email,password,role]);
        return result;
        }
    static async findByEmail(email){
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }
}