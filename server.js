const express = require('express');
const cors = require('cors');
// Perbaikan 1: Hapus .promises di sini karena kita butuh fungsi Sync untuk bikin folder
const fs = require('fs'); 
const path = require('path');
require('dotenv').config();

const app = express();

// Konfigurasi EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware dasar
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Agar bisa menerima file foto base64

// Perbaikan 2: Pindahkan baris ini ke bawah agar tidak masuk ke dalam komentar
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Bikin folder uploads otomatis kalau belum ada
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Import database (hanya untuk trigger test koneksi saat server nyala)
require('./config/db');

// --- ROUTES API BACKEND KITA ---
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const masterDataRoutes = require('./routes/masterData');
const leaveRoutes = require('./routes/leave');
// server.js
const payrollRoutes = require('./routes/payroll');


app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/master', masterDataRoutes);
app.use('/api/leave', leaveRoutes);
// Pastikan baris ini ada dan benar
app.use('/api/payroll', payrollRoutes);
// --- ROUTES UNTUK TAMPILAN FRONTEND (EJS) ---
// Route halaman Login
app.get('/login', (req, res) => {
    res.render('login');
});

// Route halaman Dashboard (Root)
app.get('/', (req, res) => {
    res.render('dashboard');
});

// Route Halaman Absensi
app.get('/attendance', (req, res) => {
    res.render('attendance');
});

// Tambahkan Route Riwayat Absensi ini:
app.get('/attendance-history', (req, res) => {
    res.render('attendance-history');
});

// Tambahkan baris ini untuk halaman Manajemen User
app.get('/users', (req, res) => {
    res.render('users');
}); 

// Route halaman Payroll
app.get('/payroll', (req, res) => {
    res.render('payroll');
});

// Menjalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server HRIS berjalan di http://localhost:${PORT}`);
});