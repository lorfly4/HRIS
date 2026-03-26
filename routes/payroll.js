const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/authMiddleware');

// 1. Endpoint Preview (Calculate)
router.post('/calculate', verifyToken, async (req, res) => {
    try {
        const { month, year, defaultBonus, defaultPenalty } = req.body;
        const [employees] = await pool.query('SELECT id, name, nik, basic_salary FROM employees');

        const previewData = [];
        for (let emp of employees) {
            const [att] = await pool.query(`
                SELECT COUNT(*) as hadir, SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) as telat 
                FROM attendances WHERE employee_id=? AND MONTHNAME(date)=? AND YEAR(date)=?
            `, [emp.id, month, year]);

            const bonus = (att[0].hadir || 0) * (parseInt(defaultBonus) || 0);
            const penalty = (att[0].telat || 0) * (parseInt(defaultPenalty) || 0);

            previewData.push({
                employee_id: emp.id,
                name: emp.name,
                nik: emp.nik,
                basic_salary: emp.basic_salary,
                attendance_bonus: bonus,
                late_deduction: penalty,
                total_salary: parseFloat(emp.basic_salary) + bonus - penalty
            });
        }
        res.json(previewData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Endpoint Save Final (Save Batch)
router.post('/save-batch', verifyToken, async (req, res) => {
    try {
        const { period, data } = req.body;
        for (let item of data) {
            await pool.query(`
                INSERT INTO payrolls (employee_id, period_month, basic_salary, attendance_bonus, late_deduction, total_salary)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                attendance_bonus = VALUES(attendance_bonus),
                late_deduction = VALUES(late_deduction),
                total_salary = VALUES(total_salary)
            `, [item.employee_id, period, item.basic_salary, item.attendance_bonus, item.late_deduction, item.total_salary]);
        }
        res.json({ message: 'Payroll berhasil disimpan ke history!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Endpoint History (GET) - FIXED: Menangani Filter
router.get('/history', verifyToken, async (req, res) => {
    try {
        const { month, year } = req.query;
        const period = `${month} ${year}`;
        
        const [rows] = await pool.query(`
            SELECT py.*, e.name, e.nik 
            FROM payrolls py 
            JOIN employees e ON py.employee_id = e.id 
            WHERE py.period_month = ?
            ORDER BY e.name ASC
        `, [period]);
        
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil history' });
    }
});

module.exports = router;