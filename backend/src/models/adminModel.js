const db = require('../config/db');

class AdminModel {
    static async findByUsername(username) {
        const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
        return rows[0];
    }
}

module.exports = AdminModel;
