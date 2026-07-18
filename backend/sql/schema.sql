CREATE DATABASE IF NOT EXISTS duitrack
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE duitrack;

CREATE TABLE IF NOT EXISTS `user` (
  id_user INT NOT NULL AUTO_INCREMENT,
  nama VARCHAR(50) NOT NULL,
  email VARCHAR(30) NOT NULL,
  password VARCHAR(255) NOT NULL,
  foto_profil VARCHAR(255) NULL,
  PRIMARY KEY (id_user),
  UNIQUE KEY uk_user_email (email)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kategori (
  id_kategori INT NOT NULL AUTO_INCREMENT,
  id_user INT NOT NULL,
  nama_kategori VARCHAR(25) NOT NULL,
  jenis ENUM('pemasukan', 'pengeluaran') NOT NULL DEFAULT 'pengeluaran',
  target_anggaran BIGINT NOT NULL DEFAULT 0,
  warna VARCHAR(7) NOT NULL DEFAULT '#087B68',
  ikon VARCHAR(50) NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_kategori),
  UNIQUE KEY uq_kategori_user_jenis_nama (id_user, jenis, nama_kategori),
  CONSTRAINT fk_kategori_user
    FOREIGN KEY (id_user) REFERENCES `user` (id_user)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pemasukan (
  id_pemasukan INT NOT NULL AUTO_INCREMENT,
  id_user INT NOT NULL,
  tanggal DATE NOT NULL,
  total_pemasukan BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (id_pemasukan),
  KEY fk_pemasukan_user (id_user),
  CONSTRAINT fk_pemasukan_user
    FOREIGN KEY (id_user) REFERENCES `user` (id_user)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detail_pemasukan (
  id_detail_masuk INT NOT NULL AUTO_INCREMENT,
  id_pemasukan INT NOT NULL,
  id_kategori INT NOT NULL,
  sumber VARCHAR(150) NOT NULL,
  nominal BIGINT NOT NULL,
  catatan TEXT NULL,
  PRIMARY KEY (id_detail_masuk),
  KEY fk_detail_pemasukan_parent (id_pemasukan),
  KEY fk_detail_pemasukan_kategori (id_kategori),
  CONSTRAINT fk_detail_pemasukan_parent
    FOREIGN KEY (id_pemasukan) REFERENCES pemasukan (id_pemasukan)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_detail_pemasukan_kategori
    FOREIGN KEY (id_kategori) REFERENCES kategori (id_kategori)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pengeluaran (
  id_pengeluaran INT NOT NULL AUTO_INCREMENT,
  id_user INT NOT NULL,
  tanggal DATE NOT NULL,
  total_pengeluaran BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (id_pengeluaran),
  KEY fk_pengeluaran_user (id_user),
  CONSTRAINT fk_pengeluaran_user
    FOREIGN KEY (id_user) REFERENCES `user` (id_user)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detail_pengeluaran (
  id_detail_keluar INT NOT NULL AUTO_INCREMENT,
  id_pengeluaran INT NOT NULL,
  id_kategori INT NOT NULL,
  nominal BIGINT NOT NULL,
  deskripsi TEXT NULL,
  PRIMARY KEY (id_detail_keluar),
  KEY fk_detail_pengeluaran_parent (id_pengeluaran),
  KEY fk_detail_pengeluaran_kategori (id_kategori),
  CONSTRAINT fk_detail_pengeluaran_parent
    FOREIGN KEY (id_pengeluaran) REFERENCES pengeluaran (id_pengeluaran)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_detail_pengeluaran_kategori
    FOREIGN KEY (id_kategori) REFERENCES kategori (id_kategori)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
