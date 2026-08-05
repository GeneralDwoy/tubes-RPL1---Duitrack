-- phpMyAdmin SQL Dump
-- DuiTrack Clean Database Dump (Tanpa Data Pribadi/Sensitif)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `duitrack`
--

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE IF NOT EXISTS `user` (
  `id_user` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `foto_profil` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `uk_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kategori`
--

CREATE TABLE IF NOT EXISTS `kategori` (
  `id_kategori` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `nama_kategori` varchar(25) NOT NULL,
  `jenis` enum('pemasukan','pengeluaran') NOT NULL DEFAULT 'pengeluaran',
  `target_anggaran` bigint(20) NOT NULL DEFAULT 0,
  `warna` varchar(7) NOT NULL DEFAULT '#087B68',
  `ikon` varchar(50) DEFAULT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_kategori`),
  UNIQUE KEY `uq_kategori_user_jenis_nama` (`id_user`,`jenis`,`nama_kategori`),
  KEY `fk_kategori_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pemasukan`
--

CREATE TABLE IF NOT EXISTS `pemasukan` (
  `id_pemasukan` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `total_pemasukan` bigint(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_pemasukan`),
  KEY `fk_pemasukan_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `detail_pemasukan`
--

CREATE TABLE IF NOT EXISTS `detail_pemasukan` (
  `id_detail_masuk` int(11) NOT NULL AUTO_INCREMENT,
  `id_pemasukan` int(11) NOT NULL,
  `id_kategori` int(11) NOT NULL,
  `sumber` varchar(150) NOT NULL,
  `nominal` bigint(20) NOT NULL,
  `catatan` text DEFAULT NULL,
  PRIMARY KEY (`id_detail_masuk`),
  KEY `fk_detail_pemasukan_parent` (`id_pemasukan`),
  KEY `fk_detail_pemasukan_kategori` (`id_kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengeluaran`
--

CREATE TABLE IF NOT EXISTS `pengeluaran` (
  `id_pengeluaran` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `total_pengeluaran` bigint(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_pengeluaran`),
  KEY `fk_pengeluaran_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `detail_pengeluaran`
--

CREATE TABLE IF NOT EXISTS `detail_pengeluaran` (
  `id_detail_keluar` int(11) NOT NULL AUTO_INCREMENT,
  `id_pengeluaran` int(11) NOT NULL,
  `id_kategori` int(11) NOT NULL,
  `nominal` bigint(20) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  PRIMARY KEY (`id_detail_keluar`),
  KEY `fk_detail_pengeluaran_parent` (`id_pengeluaran`),
  KEY `fk_detail_pengeluaran_kategori` (`id_kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Constraints for dumped tables
--

ALTER TABLE `kategori`
  ADD CONSTRAINT `fk_kategori_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `pemasukan`
  ADD CONSTRAINT `fk_pemasukan_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `detail_pemasukan`
  ADD CONSTRAINT `fk_detail_pemasukan_kategori` FOREIGN KEY (`id_kategori`) REFERENCES `kategori` (`id_kategori`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detail_pemasukan_parent` FOREIGN KEY (`id_pemasukan`) REFERENCES `pemasukan` (`id_pemasukan`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `pengeluaran`
  ADD CONSTRAINT `fk_pengeluaran_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `detail_pengeluaran`
  ADD CONSTRAINT `fk_detail_pengeluaran_kategori` FOREIGN KEY (`id_kategori`) REFERENCES `kategori` (`id_kategori`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detail_pengeluaran_parent` FOREIGN KEY (`id_pengeluaran`) REFERENCES `pengeluaran` (`id_pengeluaran`) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
