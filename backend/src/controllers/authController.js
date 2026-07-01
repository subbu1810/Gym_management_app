const AdminModel = require('../models/adminModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        const admin = await AdminModel.findByUsername(username);
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET || 'your_super_secret_key',
            { expiresIn: '1h' }
        );

        res.json({ token, username: admin.username });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
