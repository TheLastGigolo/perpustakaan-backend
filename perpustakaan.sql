-- Buat Database Perpustakaan
CREATE DATABASE perpustakaan;

-- Gunakan database perpustakaan
USE perpustakaan;


-- Membuat tabel users:
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'petugas', 'anggota') DEFAULT 'anggota',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Buku Baru
CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(100) NOT NULL,
  isbn VARCHAR(20) UNIQUE,
  publisher VARCHAR(100),
  publication_year INT,
  stock INT NOT NULL DEFAULT 1,
  cover_image VARCHAR(255),
  description TEXT AFTER author,
  cover_url VARCHAR(255) AFTER stock,
  is_active BOOLEAN DEFAULT TRUE AFTER cover_url,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Anggota
CREATE TABLE members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  member_code VARCHAR(20) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  join_date DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Peminjaman
CREATE TABLE borrowings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  member_id INT NOT NULL,
  borrow_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  status ENUM('dipinjam', 'dikembalikan', 'antri') NOT NULL DEFAULT 'antri',
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Kategori Buku
CREATE TABLE IF NOT EXISTS book_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Relasi Buku-Kategori
CREATE TABLE IF NOT EXISTS book_category_mappings (
  book_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (book_id, category_id),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES book_categories(id) ON DELETE CASCADE
);

-- Tambahkan user contoh (password: admin123):
INSERT INTO users (name, email, password, role) 
VALUES (
  'Admin Perpustakaan', 
  'admin@perpustakaan.com', 
  '$2b$10$cKF8G3ZuoMEkzih23uh7ZeHhxPnvSbFM8WHHdE0CbgvypimMzIo12', 
  'admin'
);

-- Contoh data buku
INSERT INTO books (title, author, isbn, stock) VALUES
('Laskar Pelangi', 'Andrea Hirata', '9789793062792', 10),
('Bumi Manusia', 'Pramoedya Ananta Toer', '9789798659075', 8),
('Pulang', 'Tere Liye', '9786020310456', 5);

-- Contoh data anggota
INSERT INTO members (user_id, member_code, phone, join_date) VALUES
(4, 'M001', '08123456789', '2023-01-15'),
(3, 'M002', '08129876543', '2023-02-20');

-- Contoh data peminjaman
INSERT INTO borrowings (book_id, member_id, borrow_date, due_date, status) VALUES
(1, 11, '2023-05-01', '2023-05-15', 'dipinjam'),
(2, 11, '2023-05-10', '2023-05-24', 'dikembalikan'),
(1, 12, '2023-05-12', '2023-05-26', 'dipinjam');

-- Contoh data kategori
INSERT INTO book_categories (name) VALUES 
('Fiksi'), ('Non-Fiksi'), ('Sains'), ('Sejarah'), ('Teknologi');