// routes/leave.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/authMiddleware');

// ==========================================
// 1. POST /api/leave/apply (Ajukan Cuti)
// ==========================================
router.post('/apply', verifyToken, async (req, res) => {
    try {
        const { type, start_date, end_date, reason } = req.body;
        const employeeId = req.user.id;

        if (!type || !start_date || !end_date || !reason) {
            return res.status(400).json({ message: 'Semua kolom pengajuan wajib diisi!' });
        }

        // Insert ke database dengan status default 'pending'
        const [result] = await pool.query(
            `INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status) 
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [employeeId, type, start_date, end_date, reason]
        );

        res.status(201).json({ 
            message: 'Pengajuan cuti berhasil dikirim, menunggu persetujuan.',
            leave_id: result.insertId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

// ==========================================
// 2. GET /api/leave/my-requests (Riwayat Cuti Saya)
// ==========================================
router.get('/my-requests', verifyToken, async (req, res) => {
    try {
        const employeeId = req.user.id;
        const [requests] = await pool.query(
            'SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY created_at DESC',
            [employeeId]
        );
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

// ==========================================
// 3. PUT /api/leave/:id/status (Approval oleh Admin/HR)
// ==========================================
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        // Cek apakah user adalah admin atau manager
        if (req.user.role !== 'superadmin' && req.user.role !== 'manager') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya atasan yang bisa memproses cuti.' });
        }

        const leaveId = req.params.id;
        const { status } = req.body; // 'approved' atau 'rejected'
        const approverId = req.user.id;

        if (status !== 'approved' && status !== 'rejected') {
            return res.status(400).json({ message: 'Status tidak valid!' });
        }

        // Ambil data cuti untuk mengecek jenisnya
        const [leaveData] = await pool.query('SELECT * FROM leave_requests WHERE id = ?', [leaveId]);
        if (leaveData.length === 0) {
            return res.status(404).json({ message: 'Data cuti tidak ditemukan!' });
        }

        // Jika disetujui dan tipe cutinya adalah 'annual_leave' (cuti tahunan), potong saldo cuti karyawan
        if (status === 'approved' && leaveData[0].type === 'annual_leave') {
            // Hitung durasi cuti secara kasar (selisih hari)
            const start = new Date(leaveData[0].start_date);
            const end = new Date(leaveData[0].end_date);
            const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            // Kurangi leave_balance di tabel employees
            await pool.query(
                'UPDATE employees SET leave_balance = leave_balance - ? WHERE id = ?',
                [daysDiff, leaveData[0].employee_id]
            );
        }

        // Update status cuti dan catat siapa yang menyetujui
        await pool.query(
            'UPDATE leave_requests SET status = ?, approved_by = ? WHERE id = ?',
            [status, approverId, leaveId]
        );

        res.json({ message: `Cuti berhasil di-${status}!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

module.exports = router;