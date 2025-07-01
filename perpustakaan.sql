-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 01, 2025 at 06:11 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `perpustakaan`
--

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `isbn` varchar(20) DEFAULT NULL,
  `publisher` varchar(100) DEFAULT NULL,
  `publication_year` int(11) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 1,
  `cover_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id`, `title`, `author`, `description`, `isbn`, `publisher`, `publication_year`, `stock`, `cover_url`, `is_active`, `created_at`, `updated_at`) VALUES
(6, 'Laskar Pelangi', 'Andrea Hirata', 'Menceritakan perjuangan 10 murid miskin di SD Muhammadiyah Gantong, Belitung, termasuk Ikal (Andrea), Lintang (jenius miskin), Mahar (seniman), dan guru Muslimah. Dalam kemiskinan, mereka tetap belajar dengan penuh semangat dan kreativitas.', '978-9793062792', 'Bentang Pustaka', 2005, 10, '/uploads/book-cover-1751305382446-704440197.jpeg', 1, '2025-06-30 10:43:02', '2025-06-30 10:43:02'),
(7, 'Dilan: Dia adalah Dilanku Tahun 1990', 'Pidi Baiq', 'Milea pindah ke SMA di Bandung dan bertemu Dilan—remaja yang unik, romantis, dan \"anak geng motor\". Kisah cinta remaja di tahun 90-an ini penuh puisi, pesan, dan kejenakaan.', '978-6027870414', 'Pastel Books', 2014, 25, '/uploads/book-cover-1751305626377-142642582.jpeg', 1, '2025-06-30 10:47:06', '2025-06-30 10:47:06'),
(8, 'Atomic Habits', 'James Clear', 'Buku ini mengajarkan bahwa kebiasaan kecil (1%) yang dilakukan konsisten jauh lebih penting daripada motivasi besar. Termasuk strategi membuat dan menghancurkan kebiasaan.', '978-0735211292', 'Gramedia (terjemahan)', 2020, 10, '/uploads/book-cover-1751305812525-280856114.jpeg', 1, '2025-06-30 10:50:12', '2025-06-30 10:50:12'),
(9, 'Perahu Kertas', 'Dewi Lestari (Dee)', 'Kugy dan Keenan, dua mahasiswa dengan mimpi dan jalan hidup yang berbeda. Walau saling mencintai, mereka harus mengorbankan hubungan demi idealisme dan keluarga.', '978-6028811263', 'Bentang Pustaka', 2009, 11, '/uploads/book-cover-1751305941559-304578088.jpeg', 1, '2025-06-30 10:52:21', '2025-07-01 16:08:15'),
(10, 'Rich Dad Poor Dad', 'Robert T. Kiyosaki', 'Kiyosaki membandingkan dua figur ayah—ayah kandung (pegawai) dan ayah temannya (investor). Buku ini mengajarkan cara berpikir orang kaya, mengelola aset, dan membangun kebebasan finansial.', '978-9792212853', 'Gramedia (ID)', 1997, 17, '/uploads/book-cover-1751306077024-687683311.jpeg', 1, '2025-06-30 10:54:37', '2025-07-01 14:18:15'),
(11, 'Psicology Of Money', 'Zeta', 'Berpikir tentang cara mengelola keungan dengan strategi yang absolute dan terbaik', 'ISBN-32344', 'The FED', 2022, 12, '/uploads/book-cover-1751381639768-800547899.webp', 1, '2025-07-01 14:53:59', '2025-07-01 14:53:59'),
(12, 'Psicology Of Moneyy', 'Kobo', '', 'ISBN-32344s', 'The FED', 2022, 12, '/uploads/book-cover-1751382033047-872519779.jpg', 1, '2025-07-01 15:00:33', '2025-07-01 15:00:33');

-- --------------------------------------------------------

--
-- Table structure for table `book_categories`
--

CREATE TABLE `book_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `book_categories`
--

INSERT INTO `book_categories` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Fiksi', '2025-05-16 18:51:42', '2025-05-16 18:51:42'),
(2, 'Non-Fiksi', '2025-05-16 18:51:42', '2025-05-16 18:51:42'),
(3, 'Sains', '2025-05-16 18:51:42', '2025-05-16 18:51:42'),
(4, 'Sejarah', '2025-05-16 18:51:42', '2025-05-16 18:51:42'),
(5, 'Teknologi', '2025-05-16 18:51:42', '2025-05-16 18:51:42');

-- --------------------------------------------------------

--
-- Table structure for table `book_category_mappings`
--

CREATE TABLE `book_category_mappings` (
  `book_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `book_category_mappings`
--

INSERT INTO `book_category_mappings` (`book_id`, `category_id`) VALUES
(7, 1),
(9, 1);

-- --------------------------------------------------------

--
-- Table structure for table `borrowings`
--

CREATE TABLE `borrowings` (
  `id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `borrow_date` date NOT NULL,
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `status` enum('antri','dipinjam','dikembalikan','ditolak') DEFAULT 'antri',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `admin_notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `borrowings`
--

INSERT INTO `borrowings` (`id`, `book_id`, `member_id`, `borrow_date`, `due_date`, `return_date`, `status`, `created_at`, `updated_at`, `confirmed_at`, `admin_notes`) VALUES
(3, 10, 15, '2025-07-01', '2025-07-08', NULL, 'antri', '2025-07-01 14:33:01', '2025-07-01 14:33:01', NULL, NULL),
(4, 9, 18, '2025-07-01', '2025-07-05', NULL, 'dipinjam', '2025-07-01 16:08:07', '2025-07-01 16:08:15', '2025-07-01 16:08:15', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `member_code` varchar(20) NOT NULL,
  `nim` varchar(20) DEFAULT NULL,
  `faculty` varchar(100) DEFAULT NULL,
  `study_program` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `join_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('aktif','tidak aktif','pending') DEFAULT 'pending',
  `profile_picture` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`id`, `user_id`, `member_code`, `nim`, `faculty`, `study_program`, `phone`, `address`, `join_date`, `created_at`, `updated_at`, `status`, `profile_picture`) VALUES
(15, 14, 'MEM-1751289461805', '2203010236', 'Fakultas', 'Teknik Informatika', '0849675821364', 'Jln. Cocot bacot No.4544', '2025-06-30', '2025-06-30 06:17:42', '2025-07-01 09:23:19', 'aktif', NULL),
(17, 16, 'MEM-1751379624447', '225961313131', 'Fakultas', 'Teknik Informatika', '081221188741', 'PERUM KOTABARU JL.BANDUNG BLOK 6 NO 88, RT 04, RW 014', '2025-07-01', '2025-07-01 14:20:25', '2025-07-01 14:20:25', 'aktif', NULL),
(18, 18, 'MEM-1751382075354', '223010295', 'Fakultas', 'Teknik Informatika', '0812211887438', 'Tokyo, Japan', '2025-07-01', '2025-07-01 15:01:16', '2025-07-01 15:01:34', 'aktif', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','petugas','anggota') DEFAULT 'anggota',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES
(2, 'Admin Perpustakaan', 'admin@perpustakaan.com', '$2a$12$vwTeYwPQlr1IPHeYMA/mv.Ui9vKdm.85jHfQ5EVkaJtD/Si2mxgIW', 'admin', '2025-05-14 21:01:59', '2025-06-23 21:58:03'),
(14, 'Fahmi Firmansyah', 'galangg568@gmail.com', '$2b$12$yKbu/eaNQ9/xBxGVqTN33uCEOKW1WoK6ELy1vdWa91GvUGhQzEQT2', 'anggota', '2025-06-30 06:17:42', '2025-07-01 09:23:19'),
(16, 'Eksha Oktavian', 'ekshaokta@gmail.com', '$2b$12$yH6YhHLuMh48mllImdkKZ.A9DFCrFqTStvjBG4w4pLENUeCmZPdyC', 'anggota', '2025-07-01 14:20:25', '2025-07-01 14:20:25'),
(18, 'rafly rachman', 'rafly@perpustakaan.com', '$2b$12$jTnUkQ21IBsjbrFwaq6aS.5QII54/nB5uoeZC/5gMVMKtfdvsr5gq', 'anggota', '2025-07-01 15:01:16', '2025-07-01 15:01:34');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `isbn` (`isbn`);
ALTER TABLE `books` ADD FULLTEXT KEY `ft_search` (`title`,`author`,`description`);

--
-- Indexes for table `book_categories`
--
ALTER TABLE `book_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `book_category_mappings`
--
ALTER TABLE `book_category_mappings`
  ADD PRIMARY KEY (`book_id`,`category_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `borrowings`
--
ALTER TABLE `borrowings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `book_id` (`book_id`),
  ADD KEY `member_id` (`member_id`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `member_code` (`member_code`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `book_categories`
--
ALTER TABLE `book_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `borrowings`
--
ALTER TABLE `borrowings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `members`
--
ALTER TABLE `members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `book_category_mappings`
--
ALTER TABLE `book_category_mappings`
  ADD CONSTRAINT `book_category_mappings_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `book_category_mappings_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `book_categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `borrowings`
--
ALTER TABLE `borrowings`
  ADD CONSTRAINT `borrowings_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`),
  ADD CONSTRAINT `borrowings_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`);

--
-- Constraints for table `members`
--
ALTER TABLE `members`
  ADD CONSTRAINT `members_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
