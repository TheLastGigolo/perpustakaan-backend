-- Membuat tabel users:
USE perpustakaan_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'petugas', 'anggota') DEFAULT 'anggota',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



-- Tambahkan user contoh (password: admin123):
INSERT INTO users (name, email, password, role) 
VALUES (
  'Admin Perpustakaan', 
  'admin@perpustakaan.com', 
  '$2b$10$cKF8G3ZuoMEkzih23uh7ZeHhxPnvSbFM8WHHdE0CbgvypimMzIo12', 
  'admin'
);