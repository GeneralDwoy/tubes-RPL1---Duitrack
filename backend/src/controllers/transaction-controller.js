const pool = require('../config/database');

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateIncome(body) {
  const idKategori = parseId(body.idKategori);
  const nominal = Number(body.nominal);
  const tanggal = body.tanggal;
  const sumber = body.sumber?.trim();
  const catatan = body.catatan?.trim() || null;

  if (!validDate(tanggal)) return { error: 'Tanggal pemasukan tidak valid' };
  if (!idKategori) return { error: 'Kategori pemasukan tidak valid' };
  if (!Number.isSafeInteger(nominal) || nominal <= 0) {
    return { error: 'Nominal pemasukan harus berupa bilangan bulat lebih dari 0' };
  }
  if (!sumber || sumber.length > 150) {
    return { error: 'Sumber pemasukan wajib diisi dan maksimal 150 karakter' };
  }
  if (catatan && catatan.length > 255) return { error: 'Catatan maksimal 255 karakter' };

  return { idKategori, nominal, tanggal, sumber, catatan };
}

function validateExpense(body) {
  const idKategori = parseId(body.idKategori);
  const nominal = Number(body.nominal);
  const tanggal = body.tanggal;
  const deskripsi = body.deskripsi?.trim() || null;

  if (!validDate(tanggal)) return { error: 'Tanggal pengeluaran tidak valid' };
  if (!idKategori) return { error: 'Kategori pengeluaran tidak valid' };
  if (!Number.isSafeInteger(nominal) || nominal <= 0) {
    return { error: 'Nominal pengeluaran harus berupa bilangan bulat lebih dari 0' };
  }
  if (deskripsi && deskripsi.length > 255) return { error: 'Deskripsi maksimal 255 karakter' };

  return { idKategori, nominal, tanggal, deskripsi };
}

async function findCategory(connection, idKategori, idUser, jenis) {
  const [categories] = await connection.execute(
    `SELECT id_kategori, nama_kategori, target_anggaran
     FROM kategori
     WHERE id_kategori = ? AND id_user = ? AND jenis = ? AND aktif = TRUE
     LIMIT 1`,
    [idKategori, idUser, jenis],
  );
  return categories[0] ?? null;
}

async function getBalance(connection, idUser, excludedIncomeId = null, excludedExpenseId = null) {
  const [rows] = await connection.execute(
    `SELECT
      (SELECT COALESCE(SUM(total_pemasukan), 0) FROM pemasukan
       WHERE id_user = ? AND (? IS NULL OR id_pemasukan <> ?))
      -
      (SELECT COALESCE(SUM(total_pengeluaran), 0) FROM pengeluaran
       WHERE id_user = ? AND (? IS NULL OR id_pengeluaran <> ?)) AS saldo`,
    [idUser, excludedIncomeId, excludedIncomeId, idUser, excludedExpenseId, excludedExpenseId],
  );
  return Number(rows[0].saldo);
}

async function getCategorySpending(connection, idUser, idKategori, tanggal, excludedExpenseId = null) {
  const [rows] = await connection.execute(
    `SELECT COALESCE(SUM(dp.nominal), 0) AS total_terpakai
     FROM detail_pengeluaran dp
     JOIN pengeluaran p ON p.id_pengeluaran = dp.id_pengeluaran
     WHERE p.id_user = ?
       AND dp.id_kategori = ?
       AND DATE_FORMAT(p.tanggal, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
       AND (? IS NULL OR p.id_pengeluaran <> ?)`,
    [idUser, idKategori, tanggal, excludedExpenseId, excludedExpenseId],
  );
  return Number(rows[0].total_terpakai);
}

function budgetExceeded(res, category, spent, nominal) {
  const budget = Number(category.target_anggaran);
  if (budget <= 0 || spent + nominal <= budget) return false;

  res.status(409).json({
    status: 'error',
    code: 'BUDGET_EXCEEDED',
    message: `Anggaran ${category.nama_kategori} tidak mencukupi`,
    data: {
      targetAnggaran: budget,
      totalTerpakai: spent,
      sisaAnggaran: Math.max(budget - spent, 0),
    },
  });
  return true;
}

async function createIncome(req, res) {
  const input = validateIncome(req.body);
  if (input.error) return res.status(400).json({ status: 'error', message: input.error });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const category = await findCategory(connection, input.idKategori, req.user.idUser, 'pemasukan');
    if (!category) {
      await connection.rollback();
      return res.status(400).json({ status: 'error', message: 'Kategori pemasukan tidak ditemukan' });
    }

    const [result] = await connection.execute(
      'INSERT INTO pemasukan (id_user, tanggal, total_pemasukan) VALUES (?, ?, ?)',
      [req.user.idUser, input.tanggal, input.nominal],
    );
    await connection.execute(
      `INSERT INTO detail_pemasukan
        (id_pemasukan, id_kategori, sumber, nominal, catatan)
       VALUES (?, ?, ?, ?, ?)`,
      [result.insertId, input.idKategori, input.sumber, input.nominal, input.catatan],
    );

    await connection.commit();
    return res.status(201).json({
      status: 'success',
      message: 'Pemasukan berhasil disimpan',
      data: { idPemasukan: result.insertId },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Menyimpan pemasukan gagal:', error.message);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  } finally {
    connection.release();
  }
}

async function createExpense(req, res) {
  const input = validateExpense(req.body);
  if (input.error) return res.status(400).json({ status: 'error', message: input.error });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('SELECT id_user FROM `user` WHERE id_user = ? FOR UPDATE', [req.user.idUser]);

    const category = await findCategory(connection, input.idKategori, req.user.idUser, 'pengeluaran');
    if (!category) {
      await connection.rollback();
      return res.status(400).json({ status: 'error', message: 'Kategori pengeluaran tidak ditemukan' });
    }

    const saldo = await getBalance(connection, req.user.idUser);
    if (input.nominal > saldo) {
      await connection.rollback();
      return res.status(409).json({
        status: 'error',
        code: 'INSUFFICIENT_BALANCE',
        message: 'Saldo tidak mencukupi untuk pengeluaran ini',
        data: { saldo },
      });
    }

    const spent = await getCategorySpending(
      connection,
      req.user.idUser,
      input.idKategori,
      input.tanggal,
    );
    if (budgetExceeded(res, category, spent, input.nominal)) {
      await connection.rollback();
      return undefined;
    }

    const [result] = await connection.execute(
      'INSERT INTO pengeluaran (id_user, tanggal, total_pengeluaran) VALUES (?, ?, ?)',
      [req.user.idUser, input.tanggal, input.nominal],
    );
    await connection.execute(
      `INSERT INTO detail_pengeluaran
        (id_pengeluaran, id_kategori, nominal, deskripsi)
       VALUES (?, ?, ?, ?)`,
      [result.insertId, input.idKategori, input.nominal, input.deskripsi],
    );

    await connection.commit();
    const budget = Number(category.target_anggaran);
    return res.status(201).json({
      status: 'success',
      message: 'Pengeluaran berhasil disimpan',
      data: {
        idPengeluaran: result.insertId,
        sisaSaldo: saldo - input.nominal,
        sisaAnggaran: budget > 0 ? budget - spent - input.nominal : null,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Menyimpan pengeluaran gagal:', error.message);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  } finally {
    connection.release();
  }
}

async function getTransaction(req, res) {
  try {
    const id = parseId(req.params.id);
    const type = req.params.type;
    if (!id || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ status: 'error', message: 'Transaksi tidak valid' });
    }

    const isIncome = type === 'income';
    const [rows] = await pool.execute(
      isIncome
        ? `SELECT p.id_pemasukan AS id_transaksi, p.tanggal, dp.nominal,
             dp.id_kategori, k.nama_kategori, dp.sumber AS deskripsi, dp.catatan
           FROM pemasukan p
           JOIN detail_pemasukan dp ON dp.id_pemasukan = p.id_pemasukan
           JOIN kategori k ON k.id_kategori = dp.id_kategori
           WHERE p.id_pemasukan = ? AND p.id_user = ? LIMIT 1`
        : `SELECT p.id_pengeluaran AS id_transaksi, p.tanggal, dp.nominal,
             dp.id_kategori, k.nama_kategori, dp.deskripsi, NULL AS catatan
           FROM pengeluaran p
           JOIN detail_pengeluaran dp ON dp.id_pengeluaran = p.id_pengeluaran
           JOIN kategori k ON k.id_kategori = dp.id_kategori
           WHERE p.id_pengeluaran = ? AND p.id_user = ? LIMIT 1`,
      [id, req.user.idUser],
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Transaksi tidak ditemukan' });
    }

    return res.status(200).json({
      status: 'success',
      data: { transaction: { ...rows[0], jenis_transaksi: isIncome ? 'pemasukan' : 'pengeluaran' } },
    });
  } catch (error) {
    console.error('Mengambil transaksi gagal:', error.message);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  }
}

async function updateIncome(req, res) {
  const id = parseId(req.params.id);
  const input = validateIncome(req.body);
  if (!id) return res.status(400).json({ status: 'error', message: 'ID pemasukan tidak valid' });
  if (input.error) return res.status(400).json({ status: 'error', message: input.error });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existingRows] = await connection.execute(
      `SELECT p.id_pemasukan, p.total_pemasukan
       FROM pemasukan p WHERE p.id_pemasukan = ? AND p.id_user = ? FOR UPDATE`,
      [id, req.user.idUser],
    );
    if (existingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ status: 'error', message: 'Pemasukan tidak ditemukan' });
    }

    const category = await findCategory(connection, input.idKategori, req.user.idUser, 'pemasukan');
    if (!category) {
      await connection.rollback();
      return res.status(400).json({ status: 'error', message: 'Kategori pemasukan tidak ditemukan' });
    }

    const balanceWithoutIncome = await getBalance(connection, req.user.idUser, id, null);
    if (balanceWithoutIncome + input.nominal < 0) {
      await connection.rollback();
      return res.status(409).json({
        status: 'error',
        code: 'INCOME_IN_USE',
        message: 'Pemasukan tidak dapat dikurangi karena masih digunakan untuk menutup pengeluaran',
      });
    }

    await connection.execute(
      'UPDATE pemasukan SET tanggal = ?, total_pemasukan = ? WHERE id_pemasukan = ?',
      [input.tanggal, input.nominal, id],
    );
    await connection.execute(
      `UPDATE detail_pemasukan
       SET id_kategori = ?, sumber = ?, nominal = ?, catatan = ?
       WHERE id_pemasukan = ?`,
      [input.idKategori, input.sumber, input.nominal, input.catatan, id],
    );

    await connection.commit();
    return res.status(200).json({ status: 'success', message: 'Pemasukan berhasil diperbarui' });
  } catch (error) {
    await connection.rollback();
    console.error('Memperbarui pemasukan gagal:', error.message);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  } finally {
    connection.release();
  }
}

async function updateExpense(req, res) {
  const id = parseId(req.params.id);
  const input = validateExpense(req.body);
  if (!id) return res.status(400).json({ status: 'error', message: 'ID pengeluaran tidak valid' });
  if (input.error) return res.status(400).json({ status: 'error', message: input.error });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('SELECT id_user FROM `user` WHERE id_user = ? FOR UPDATE', [req.user.idUser]);
    const [existingRows] = await connection.execute(
      `SELECT p.id_pengeluaran
       FROM pengeluaran p WHERE p.id_pengeluaran = ? AND p.id_user = ? FOR UPDATE`,
      [id, req.user.idUser],
    );
    if (existingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ status: 'error', message: 'Pengeluaran tidak ditemukan' });
    }

    const category = await findCategory(connection, input.idKategori, req.user.idUser, 'pengeluaran');
    if (!category) {
      await connection.rollback();
      return res.status(400).json({ status: 'error', message: 'Kategori pengeluaran tidak ditemukan' });
    }

    const balanceWithoutExpense = await getBalance(connection, req.user.idUser, null, id);
    if (input.nominal > balanceWithoutExpense) {
      await connection.rollback();
      return res.status(409).json({
        status: 'error',
        code: 'INSUFFICIENT_BALANCE',
        message: 'Saldo tidak mencukupi untuk pengeluaran ini',
        data: { saldo: balanceWithoutExpense },
      });
    }

    const spent = await getCategorySpending(
      connection,
      req.user.idUser,
      input.idKategori,
      input.tanggal,
      id,
    );
    if (budgetExceeded(res, category, spent, input.nominal)) {
      await connection.rollback();
      return undefined;
    }

    await connection.execute(
      'UPDATE pengeluaran SET tanggal = ?, total_pengeluaran = ? WHERE id_pengeluaran = ?',
      [input.tanggal, input.nominal, id],
    );
    await connection.execute(
      `UPDATE detail_pengeluaran
       SET id_kategori = ?, nominal = ?, deskripsi = ? WHERE id_pengeluaran = ?`,
      [input.idKategori, input.nominal, input.deskripsi, id],
    );

    await connection.commit();
    return res.status(200).json({ status: 'success', message: 'Pengeluaran berhasil diperbarui' });
  } catch (error) {
    await connection.rollback();
    console.error('Memperbarui pengeluaran gagal:', error.message);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  } finally {
    connection.release();
  }
}

async function deleteTransaction(req, res) {
  const id = parseId(req.params.id);
  const type = req.params.type;
  if (!id || !['income', 'expense'].includes(type)) {
    return res.status(400).json({ status: 'error', message: 'Transaksi tidak valid' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (type === 'income') {
      const [rows] = await connection.execute(
        'SELECT id_pemasukan FROM pemasukan WHERE id_pemasukan = ? AND id_user = ? FOR UPDATE',
        [id, req.user.idUser],
      );
      if (rows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ status: 'error', message: 'Pemasukan tidak ditemukan' });
      }

      if ((await getBalance(connection, req.user.idUser, id, null)) < 0) {
        await connection.rollback();
        return res.status(409).json({
          status: 'error',
          code: 'INCOME_IN_USE',
          message: 'Pemasukan tidak dapat dihapus karena masih digunakan untuk menutup pengeluaran',
        });
      }

      await connection.execute('DELETE FROM pemasukan WHERE id_pemasukan = ?', [id]);
    } else {
      const [result] = await connection.execute(
        'DELETE FROM pengeluaran WHERE id_pengeluaran = ? AND id_user = ?',
        [id, req.user.idUser],
      );
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ status: 'error', message: 'Pengeluaran tidak ditemukan' });
      }
    }

    await connection.commit();
    return res.status(200).json({ status: 'success', message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    await connection.rollback();
    console.error('Menghapus transaksi gagal:', error.message);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
  } finally {
    connection.release();
  }
}

module.exports = {
  createExpense,
  createIncome,
  deleteTransaction,
  getTransaction,
  updateExpense,
  updateIncome,
};
