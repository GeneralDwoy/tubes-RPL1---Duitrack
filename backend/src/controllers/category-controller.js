const pool = require('../config/database');

const categoryTypes = ['pemasukan', 'pengeluaran'];

function parseCategoryInput(body = {}) {
  const namaKategori =
    typeof body.namaKategori === 'string'
      ? body.namaKategori.trim()
      : '';

  const jenis = body.jenis;
  const targetAnggaran = Number(body.targetAnggaran ?? 0);

  const warna =
    typeof body.warna === 'string'
      ? body.warna.trim()
      : '#087B68';

  const ikon =
    typeof body.ikon === 'string' && body.ikon.trim()
      ? body.ikon.trim()
      : null;

  if (namaKategori.length < 2 || namaKategori.length > 25) {
    return {
      error: 'Nama kategori harus terdiri dari 2 sampai 25 karakter',
    };
  }

  if (!categoryTypes.includes(jenis)) {
    return {
      error: 'Jenis kategori harus pemasukan atau pengeluaran',
    };
  }

  if (!Number.isSafeInteger(targetAnggaran) || targetAnggaran < 0) {
    return {
      error: 'Target anggaran tidak valid',
    };
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(warna)) {
    return {
      error: 'Warna harus menggunakan format seperti #087B68',
    };
  }

  if (ikon && ikon.length > 50) {
    return {
      error: 'Nama ikon maksimal 50 karakter',
    };
  }

  return {
    value: {
      namaKategori,
      jenis,
      targetAnggaran: jenis === 'pengeluaran' ? targetAnggaran : 0,
      warna,
      ikon,
    },
  };
}

async function listCategories(req, res) {
  try {
    const { jenis } = req.query;
    const parameters = [req.user.idUser];

    let sql = `
      SELECT
        id_kategori,
        id_user,
        nama_kategori,
        jenis,
        target_anggaran,
        warna,
        ikon,
        aktif
      FROM kategori
      WHERE id_user = ?
        AND aktif = TRUE
    `;

    if (jenis) {
      if (!categoryTypes.includes(jenis)) {
        return res.status(400).json({
          status: 'error',
          message: 'Jenis kategori tidak valid',
        });
      }

      sql += ' AND jenis = ?';
      parameters.push(jenis);
    }

    sql += ' ORDER BY nama_kategori ASC';

    const [categories] = await pool.execute(sql, parameters);

    return res.status(200).json({
      status: 'success',
      data: { categories },
    });
  } catch (error) {
    console.error('Mengambil kategori gagal:', error.message);

    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }
}

async function createCategory(req, res) {
  try {
    const parsed = parseCategoryInput(req.body);

    if (parsed.error) {
      return res.status(400).json({
        status: 'error',
        message: parsed.error,
      });
    }

    const category = parsed.value;

    const [result] = await pool.execute(
      `INSERT INTO kategori
        (
          id_user,
          nama_kategori,
          jenis,
          target_anggaran,
          warna,
          ikon
        )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.idUser,
        category.namaKategori,
        category.jenis,
        category.targetAnggaran,
        category.warna,
        category.ikon,
      ]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Kategori berhasil ditambahkan',
      data: {
        idKategori: result.insertId,
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status: 'error',
        message: 'Nama kategori tersebut sudah digunakan',
      });
    }

    console.error('Menambah kategori gagal:', error.message);

    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }
}

async function updateCategory(req, res) {
  try {
    const idKategori = Number(req.params.id);
    const parsed = parseCategoryInput(req.body);

    if (!Number.isInteger(idKategori) || idKategori <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'ID kategori tidak valid',
      });
    }

    if (parsed.error) {
      return res.status(400).json({
        status: 'error',
        message: parsed.error,
      });
    }

    const [existing] = await pool.execute(
      `SELECT id_kategori
       FROM kategori
       WHERE id_kategori = ?
         AND id_user = ?
       LIMIT 1`,
      [idKategori, req.user.idUser]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Kategori tidak ditemukan',
      });
    }

    const category = parsed.value;

    await pool.execute(
      `UPDATE kategori
       SET
         nama_kategori = ?,
         jenis = ?,
         target_anggaran = ?,
         warna = ?,
         ikon = ?
       WHERE id_kategori = ?
         AND id_user = ?`,
      [
        category.namaKategori,
        category.jenis,
        category.targetAnggaran,
        category.warna,
        category.ikon,
        idKategori,
        req.user.idUser,
      ]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Kategori berhasil diperbarui',
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status: 'error',
        message: 'Nama kategori tersebut sudah digunakan',
      });
    }

    console.error('Memperbarui kategori gagal:', error.message);

    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }
}

async function deleteCategory(req, res) {
  try {
    const idKategori = Number(req.params.id);

    if (!Number.isInteger(idKategori) || idKategori <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'ID kategori tidak valid',
      });
    }

    const [result] = await pool.execute(
      `DELETE FROM kategori
       WHERE id_kategori = ?
         AND id_user = ?`,
      [idKategori, req.user.idUser]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Kategori tidak ditemukan',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Kategori berhasil dihapus',
    });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        status: 'error',
        message: 'Kategori sudah digunakan dan tidak dapat dihapus',
      });
    }

    console.error('Menghapus kategori gagal:', error.message);

    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }
}

module.exports = {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
};