const pool =require('../config/db');

class User{
    //create a new user
    static async create(email,password,role="member"){
        const [result] = await pool.query('INSERT INTO users (email,password,role) VALUES (?,?,?)',
            [email,password,role]);
        return result;
        }
    static async findByEmail(email){
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }
}
module.exports = User;