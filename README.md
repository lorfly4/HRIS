# 🚀 Modern HRIS & Payroll System

Sistem Informasi Sumber Daya Manusia (HRIS) berbasis web yang dirancang untuk efisiensi pengelolaan data karyawan, absensi berbasis lokasi (GPS), dan sistem penggajian (Payroll) yang dinamis dengan fitur intervensi manual.

---

## ✨ Fitur Utama

### 1. 📂 Manajemen Master Data
* **Hierarki Organisasi:** Pengelolaan Departemen dan Jabatan yang terintegrasi secara *real-time*.
* **Manajemen Karyawan (CRUD):** Kelola data personal, NIK, email, dan role akses (Superadmin, Manager, Employee).
* **Gaji Pokok Personal:** Pengaturan gaji pokok yang unik untuk setiap individu karyawan langsung pada profil mereka.
* **Mata Uang Global:** Fitur pengaturan mata uang perusahaan (IDR, USD, SGD, dll) yang otomatis menyesuaikan simbol dan format ribuan di seluruh sistem.

### 2. 📍 Absensi Berbasis Geolocation
* **Check-In/Out:** Absensi menggunakan koordinat GPS untuk memastikan karyawan berada di lokasi kerja yang sah.
* **Verifikasi Foto:** Karyawan diwajibkan melakukan *capture* foto saat absensi untuk keamanan dan validasi tambahan.
* **Deteksi Keterlambatan:** Sistem otomatis mendeteksi status "Late" jika karyawan melakukan clock-in melewati jam masuk.

### 3. 💰 Sistem Payroll Dinamis (Preview & Edit)
* **Generate Preview:** Menghitung otomatis saran gaji berdasarkan kehadiran dan keterlambatan dari data absensi.
* **Interactive Editing:** HR dapat mengedit nominal **Bonus** dan **Potongan** secara manual langsung pada tabel preview sebelum disimpan ke database.
* **Real-time Recalculate:** Total gaji per individu dan **Grand Total** pengeluaran perusahaan dihitung secara instan (on-the-fly) saat data diedit.
* **Laporan History:** Filter data payroll berdasarkan bulan dan tahun untuk melihat arsip gaji yang sudah difinalisasi.

### 4. 🔒 Keamanan & Otentikasi
* **JWT (JSON Web Token):** Proteksi API dan manajemen sesi pengguna yang aman.
* **Aktivasi Akun:** Sistem keamanan di mana karyawan baru wajib aktivasi menggunakan NIK untuk mengatur password pertama kali.
* **Bcrypt Hashing:** Enkripsi password tingkat tinggi untuk menjamin keamanan database.

---

## 🛠️ Teknologi yang Digunakan

* **Backend:** Node.js, Express.js
* **Frontend:** EJS (Embedded JavaScript Templates), Tailwind CSS
* **Database:** MySQL
* **Libraries:** * `jsonwebtoken` (Auth)
    * `bcryptjs` (Security)
    * `multer` (File/Photo Upload)
    * `mysql2` (Database Connector)

---

## 🚀 Panduan Instalasi

1. **Clone Repository**
   ```bash
   git clone [https://github.com/username/hris-payroll-system.git](https://github.com/username/hris-payroll-system.git)
   cd hris-payroll-system
   ```

2. **Install Dependency**
   ```
   npm install
   ```
3. Konfigurasi database
   Buat database baru di MySQL (contoh: hris_db).
   Impor file hris_db.sql yang tersedia di folder proyek ke database Anda.
4. **Konfigurasi Environment**
   buat file .env di root folder
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=hris_db
   JWT_SECRET=rahasia_dapur_anda
   PORT=3000
   ```
5. **Jalankan Server Anda**
   ```
   npm run dev
   ```
