const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/authMiddleware');

// Middleware Proteksi Admin
const requireAdmin = (req, res, next) => {
    const role = req.user.role ? req.user.role.toUpperCase() : '';
    if (role !== 'SUPERADMIN') return res.status(403).json({ message: 'Akses Ditolak' });
    next();
};

// --- SETTINGS MATA UANG ---
router.get('/currency', verifyToken, async (req, res) => {
    const [rows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'company_currency'");
    res.json({ currency: rows[0] ? rows[0].setting_value : 'IDR' });
});

router.post('/currency', verifyToken, requireAdmin, async (req, res) => {
    const { currency } = req.body;
    await pool.query("INSERT INTO settings (setting_key, setting_value) VALUES ('company_currency', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", [currency]);
    res.json({ message: 'Mata uang diperbarui' });
});

// --- CRUD DEPARTMENTS (Endpoint: /departments) ---
router.get('/departments', verifyToken, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM departments ORDER BY department_name ASC');
    res.json(rows);
});

router.post('/departments', verifyToken, requireAdmin, async (req, res) => {
    const { department_name } = req.body;
    await pool.query('INSERT INTO departments (department_name) VALUES (?)', [department_name]);
    res.json({ message: 'Departemen berhasil ditambah' });
});

router.delete('/departments/:id', verifyToken, requireAdmin, async (req, res) => {
    await pool.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Departemen dihapus' });
});

// --- CRUD POSITIONS (Endpoint: /positions) ---
router.get('/positions', verifyToken, async (req, res) => {
    // JOIN dengan departments agar nama departemen muncul di tabel jabatan
    const [rows] = await pool.query(`
        SELECT p.*, d.department_name 
        FROM positions p 
        LEFT JOIN departments d ON p.department_id = d.id
    `);
    res.json(rows);
});

router.post('/positions', verifyToken, requireAdmin, async (req, res) => {
    const { position_name, department_id } = req.body;
    await pool.query('INSERT INTO positions (position_name, department_id) VALUES (?, ?)', [position_name, department_id]);
    res.json({ message: 'Jabatan berhasil ditambah' });
});

router.delete('/positions/:id', verifyToken, requireAdmin, async (req, res) => {
    await pool.query('DELETE FROM positions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Jabatan dihapus' });
});

// --- CRUD EMPLOYEES (Endpoint: /employees) ---
router.get('/employees', verifyToken, requireAdmin, async (req, res) => {
    // Query ini harus JOIN ke positions DAN departments sesuai struktur SQL Anda 
    const [rows] = await pool.query(`
        SELECT e.*, p.position_name, d.department_name 
        FROM employees e 
        LEFT JOIN positions p ON e.position_id = p.id 
        LEFT JOIN departments d ON p.department_id = d.id
        ORDER BY e.name ASC
    `);
    res.json(rows);
});

router.post('/employees', verifyToken, requireAdmin, async (req, res) => {
    const { nik, name, email, role, position_id, basic_salary } = req.body;
    try {
        await pool.query('INSERT INTO employees (nik, name, email, role, position_id, basic_salary, password) VALUES (?, ?, ?, ?, ?, ?, NULL)', [nik, name, email, role, position_id, basic_salary]);
        res.json({ message: 'Karyawan berhasil ditambah' });
    } catch (e) { res.status(400).json({ message: 'NIK/Email sudah ada' }); }
});

router.put('/employees/:id', verifyToken, requireAdmin, async (req, res) => {
    const { nik, name, email, role, position_id, basic_salary } = req.body;
    try {
        await pool.query('UPDATE employees SET nik=?, name=?, email=?, role=?, position_id=?, basic_salary=? WHERE id=?', [nik, name, email, role, position_id, basic_salary, req.params.id]);
        res.json({ message: 'Data karyawan diperbarui' });
    } catch (e) { res.status(400).json({ message: 'Gagal update data' }); }
});

router.delete('/employees/:id', verifyToken, requireAdmin, async (req, res) => {
    await pool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ message: 'Karyawan dihapus' });
});

module.exports = router;