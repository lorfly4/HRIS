// routes/attendance.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/authMiddleware'); // Import satpam kita
const fs = require('fs').promises;
const path = require('path');

// ==========================================
// POST /api/attendance/clock-in
// ==========================================
router.post('/clock-in', verifyToken, async (req, res) => {
    try {
        const { lat, long, timezone, photo } = req.body; // Tambah photo
        const employeeId = req.user.id;

        if (!lat || !long || !timezone || !photo) {
            return res.status(400).json({ message: 'Koordinat, zona waktu, dan foto wajib dikirim!' });
        }

        const today = new Date().toISOString().split('T')[0];

        const [existing] = await pool.query(
            'SELECT * FROM attendances WHERE employee_id = ? AND date = ?',
            [employeeId, today]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Anda sudah melakukan clock-in hari ini!' });
        }

        // --- PROSES SIMPAN FOTO ---
        // Format photo dari frontend: "data:image/jpeg;base64,/9j/4AAQSkZJ..."
        const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
        const fileName = `absen_masuk_${employeeId}_${Date.now()}.jpg`;
        const filePath = path.join(__dirname, '../public/uploads', fileName);
        
        await fs.writeFile(filePath, base64Data, 'base64');
        const photoUrl = `/uploads/${fileName}`; // Path untuk disimpan di DB

        const clockInTime = new Date();

        await pool.query(
            `INSERT INTO attendances (employee_id, date, clock_in_time, clock_in_lat, clock_in_long, timezone_client, status, clock_in_photo) 
             VALUES (?, ?, ?, ?, ?, ?, 'present', ?)`,
            [employeeId, today, clockInTime, lat, long, timezone, photoUrl]
        );

        res.status(201).json({ 
            message: 'Clock-in berhasil dicatat!',
            server_time: clockInTime
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});
// ==========================================
// PUT /api/attendance/clock-out
// ==========================================
// routes/attendance.js - Bagian Clock-Out
router.put('/clock-out', verifyToken, async (req, res) => {
    try {
        const { lat, long, photo } = req.body; // Pastikan photo diambil di sini
        const employeeId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const [existing] = await pool.query(
            'SELECT * FROM attendances WHERE employee_id = ? AND date = ?',
            [employeeId, today]
        );

        if (existing.length === 0) return res.status(400).json({ message: 'Belum clock-in!' });

        let photoUrl = null;
        if (photo) {
            const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
            const fileName = `absen_pulang_${employeeId}_${Date.now()}.jpg`;
            const filePath = path.join(__dirname, '../public/uploads', fileName);
            await fs.writeFile(filePath, base64Data, 'base64');
            photoUrl = `/uploads/${fileName}`;
        }

        const clockOutTime = new Date();

        // Pastikan query UPDATE menyertakan clock_out_photo
        await pool.query(
            `UPDATE attendances SET clock_out_time = ?, clock_out_lat = ?, clock_out_long = ?, clock_out_photo = ? 
             WHERE employee_id = ? AND date = ?`,
            [clockOutTime, lat, long, photoUrl, employeeId, today]
        );

        res.json({ message: 'Clock-out berhasil!', photo: photoUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ==========================================
// GET /api/attendance/today (Status Hari Ini)
// ==========================================
router.get('/today', verifyToken, async (req, res) => {
    try {
        const employeeId = req.user.id;
        const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD (UTC Server)

        const [records] = await pool.query(
            'SELECT clock_in_time, clock_out_time FROM attendances WHERE employee_id = ? AND date = ?',
            [employeeId, today]
        );

        if (records.length > 0) {
            res.json(records[0]);
        } else {
            res.json({ clock_in_time: null, clock_out_time: null }); // Belum absen
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

// ==========================================
// GET /api/attendance/history (Riwayat Absensi)
// ==========================================
router.get('/history', verifyToken, async (req, res) => {
    try {
        const { role, id } = req.user;
        let query = '';
        let params = [];

        // Logika: Jika Superadmin, ambil semua. Jika bukan, ambil miliknya sendiri.
        if (role === 'superadmin') {
            query = `
                SELECT a.*, e.name as employee_name 
                FROM attendances a 
                JOIN employees e ON a.employee_id = e.id 
                ORDER BY a.date DESC, a.clock_in_time DESC
            `;
        } else {
            query = `
                SELECT a.*, e.name as employee_name 
                FROM attendances a 
                JOIN employees e ON a.employee_id = e.id 
                WHERE a.employee_id = ? 
                ORDER BY a.date DESC, a.clock_in_time DESC
            `;
            params = [id];
        }

        const [records] = await pool.query(query, params);
        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;