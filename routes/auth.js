const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM employees WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) return res.status(401).json({ message: 'User tidak ditemukan' });

    if (user.password === null) {
        if (password === user.nik) {
            return res.json({ needsActivation: true, userId: user.id });
        }
        return res.status(401).json({ message: 'Gunakan NIK untuk login pertama kali' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Password salah' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user });
});

router.post('/activate', async (req, res) => {
    const { userId, newPassword } = req.body;
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE employees SET password = ? WHERE id = ?', [hashed, userId]);
    res.json({ message: 'Akun aktif' });
});

module.exports = router;