// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    // Ambil header authorization
    const authHeader = req.headers['authorization'];
    
    // Cek apakah token ada dan formatnya "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Token tidak disediakan. Akses ditolak.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verifikasi token dengan JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Simpan data user (id, role) dari token ke dalam request
        req.user = decoded; 
        
        // Lanjut ke controller/route berikutnya
        next(); 
    } catch (error) {
        return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
    }
};

module.exports = { verifyToken };