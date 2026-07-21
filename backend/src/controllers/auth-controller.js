const bcrypt = require('bcryptjs');
const fs = require('node:fs/promises');
const jwt = require('jsonwebtoken');
const path = require('node:path');

const pool = require('../config/database');

const defaultCategories = [
  ['Gaji', 'pemasukan', 0, '#087B68', 'briefcase'],
  ['Bonus', 'pemasukan', 0, '#5377A6', 'gift'],
  ['Lainnya', 'pemasukan', 0, '#6B7C78', 'circle-dollar-sign'],
  ['Makanan', 'pengeluaran', 0, '#E2A32B', 'utensils'],
  ['Transportasi', 'pengeluaran', 0, '#5377A6', 'car'],
  ['Tagihan', 'pengeluaran', 0, '#D85D52', 'receipt-text'],
  ['Belanja', 'pengeluaran', 0, '#9A6FB0', 'shopping-bag'],
  ['Kesehatan', 'pengeluaran', 0, '#2E9A78', 'heart-pulse'],
  ['Hiburan', 'pengeluaran', 0, '#D17B3F', 'gamepad-2'],
  ['Lainnya', 'pengeluaran', 0, '#6B7C78', 'circle-ellipsis'],
];

function createToken(user) {
  return jwt.sign(
    { idUser: user.id_user, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function publicUser(user) {
  return {
    idUser: Number(user.id_user),
    nama: user.nama,
    email: user.email,
    fotoProfil: user.foto_profil ?? null,
  };
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function removeStoredPhoto(photoPath) {
  if (!photoPath?.startsWith('/uploads/profile-')) return;

  const filePath = path.join(__dirname, '..', '..', 'uploads', path.basename(photoPath));
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function register(req, res) {
  const nama = req.body.nama?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!nama || !email || !password) {
    return res.status(400).json({ status: 'error', message: 'Nama, email, dan kata sandi wajib diisi' });
  }

  if (nama.length < 3 || nama.length > 50) {
    return res.status(400).json({ status: 'error', message: 'Nama harus terdiri dari 3 sampai 50 karakter' });
  }

  if (!validEmail(email) || email.length > 30) {
    return res.status(400).json({ status: 'error', message: 'Format email tidak valid atau melebihi 30 karakter' });
  }

  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ status: 'error', message: 'Kata sandi harus terdiri dari 8 sampai 72 karakter' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.execute(
      'SELECT id_user FROM `user` WHERE email = ? LIMIT 1',
      [email],
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({ status: 'error', code: 'EMAIL_EXISTS', message: 'Email sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await connection.execute(
      'INSERT INTO `user` (nama, email, password) VALUES (?, ?, ?)',
      [nama, email, passwordHash],
    );

    for (const category of defaultCategories) {
      await connection.execute(
        `INSERT INTO kategori
          (id_user, nama_kategori, jenis, target_anggaran, warna, ikon, aktif)
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [result.insertId, ...category],
      );
    }

    await connection.commit();

    const user = { id_user: result.insertId, nama, email, foto_profil: null };
    return res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil',
      data: { user: publicUser(user), token: createToken(user) },
    });
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ status: 'error', code: 'EMAIL_EXISTS', message: 'Email sudah terdaftar' });
    }

    console.error('Registrasi gagal:', error.message);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  } finally {
    connection.release();
  }
}

async function login(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email dan kata sandi wajib diisi' });
    }

    const [users] = await pool.execute(
      'SELECT id_user, nama, email, password, foto_profil FROM `user` WHERE email = ? LIMIT 1',
      [email],
    );

    if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
      return res.status(401).json({ status: 'error', code: 'INVALID_CREDENTIALS', message: 'Email atau kata sandi tidak sesuai' });
    }

    const user = users[0];
    return res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      data: { user: publicUser(user), token: createToken(user) },
    });
  } catch (error) {
    console.error('Login gagal:', error.message);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
}

async function me(req, res) {
  try {
    const [users] = await pool.execute(
      'SELECT id_user, nama, email, foto_profil FROM `user` WHERE id_user = ? LIMIT 1',
      [req.user.idUser],
    );

    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan' });
    }

    return res.status(200).json({ status: 'success', data: { user: publicUser(users[0]) } });
  } catch (error) {
    console.error('Mengambil profil gagal:', error.message);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
}

async function updateProfile(req, res) {
  try {
    const nama = req.body.nama?.trim();

    if (!nama || nama.length < 3 || nama.length > 50) {
      return res.status(400).json({ status: 'error', message: 'Nama harus terdiri dari 3 sampai 50 karakter' });
    }

    const [result] = await pool.execute(
      'UPDATE `user` SET nama = ? WHERE id_user = ?',
      [nama, req.user.idUser],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan' });
    }

    const [users] = await pool.execute(
      'SELECT id_user, nama, email, foto_profil FROM `user` WHERE id_user = ? LIMIT 1',
      [req.user.idUser],
    );

    return res.status(200).json({
      status: 'success',
      message: 'Profil berhasil diperbarui',
      data: { user: publicUser(users[0]) },
    });
  } catch (error) {
    console.error('Memperbarui profil gagal:', error.message);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
}

async function updateProfilePhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'Pilih foto yang akan diunggah' });
  }

  const newPhotoPath = `/uploads/${req.file.filename}`;

  try {
    const [users] = await pool.execute(
      'SELECT id_user, nama, email, foto_profil FROM `user` WHERE id_user = ? LIMIT 1',
      [req.user.idUser],
    );

    if (users.length === 0) {
      await removeStoredPhoto(newPhotoPath);
      return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan' });
    }

    const oldPhotoPath = users[0].foto_profil;
    await pool.execute(
      'UPDATE `user` SET foto_profil = ? WHERE id_user = ?',
      [newPhotoPath, req.user.idUser],
    );
    try {
      await removeStoredPhoto(oldPhotoPath);
    } catch (removeError) {
      console.error('Menghapus foto profil lama gagal:', removeError.message);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Foto profil berhasil diperbarui',
      data: {
        user: publicUser({ ...users[0], foto_profil: newPhotoPath }),
      },
    });
  } catch (error) {
    await removeStoredPhoto(newPhotoPath).catch(() => undefined);
    console.error('Memperbarui foto profil gagal:', error.message);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
}

async function deleteProfilePhoto(req, res) {
  try {
    const [users] = await pool.execute(
      'SELECT id_user, nama, email, foto_profil FROM `user` WHERE id_user = ? LIMIT 1',
      [req.user.idUser],
    );

    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan' });
    }

    await pool.execute(
      'UPDATE `user` SET foto_profil = NULL WHERE id_user = ?',
      [req.user.idUser],
    );
    try {
      await removeStoredPhoto(users[0].foto_profil);
    } catch (removeError) {
      console.error('Menghapus berkas foto profil gagal:', removeError.message);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Foto profil berhasil dihapus',
      data: {
        user: publicUser({ ...users[0], foto_profil: null }),
      },
    });
  } catch (error) {
    console.error('Menghapus foto profil gagal:', error.message);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
}

async function updatePassword(req, res) {
  try {
    const password = req.body.password;

    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
      return res.status(400).json({ status: 'error', message: 'Kata sandi harus terdiri dari 8 sampai 72 karakter' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'UPDATE `user` SET password = ? WHERE id_user = ?',
      [passwordHash, req.user.idUser],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan' });
    }

    return res.status(200).json({ status: 'success', message: 'Kata sandi berhasil diperbarui' });
  } catch (error) {
    console.error('Memperbarui kata sandi gagal:', error.message);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
}

module.exports = {
  deleteProfilePhoto,
  login,
  me,
  register,
  updatePassword,
  updateProfile,
  updateProfilePhoto,
};
