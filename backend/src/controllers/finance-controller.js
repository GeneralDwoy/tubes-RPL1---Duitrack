const pool = require('../config/database');

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

async function listTransactions(req, res) {
  try {
    const type = req.query.type || 'all';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const search = req.query.search?.trim();
    const requestedLimit = Number(req.query.limit ?? 200);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 1000)
      : 200;

    if (!['all', 'pemasukan', 'pengeluaran'].includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: 'Jenis transaksi tidak valid',
      });
    }

    if (startDate && !validDate(startDate)) {
      return res.status(400).json({
        status: 'error',
        message: 'Tanggal awal tidak valid',
      });
    }

    if (endDate && !validDate(endDate)) {
      return res.status(400).json({
        status: 'error',
        message: 'Tanggal akhir tidak valid',
      });
    }

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Tanggal awal tidak boleh melebihi tanggal akhir',
      });
    }

    const queries = [];
    const parameters = [];

    if (type === 'all' || type === 'pemasukan') {
      const conditions = ['p.id_user = ?'];
      const values = [req.user.idUser];

      if (startDate) {
        conditions.push('p.tanggal >= ?');
        values.push(startDate);
      }

      if (endDate) {
        conditions.push('p.tanggal <= ?');
        values.push(endDate);
      }

      if (search) {
        conditions.push(`
          (
            dp.sumber LIKE ?
            OR dp.catatan LIKE ?
            OR k.nama_kategori LIKE ?
          )
        `);

        const keyword = `%${search}%`;
        values.push(keyword, keyword, keyword);
      }

      queries.push(`
        SELECT
          p.id_pemasukan AS id_transaksi,
          'pemasukan' AS jenis_transaksi,
          p.tanggal,
          dp.nominal,
          k.id_kategori,
          k.nama_kategori,
          dp.sumber AS deskripsi,
          dp.catatan
        FROM pemasukan p
        JOIN detail_pemasukan dp
          ON dp.id_pemasukan = p.id_pemasukan
        JOIN kategori k
          ON k.id_kategori = dp.id_kategori
        WHERE ${conditions.join(' AND ')}
      `);

      parameters.push(...values);
    }

    if (type === 'all' || type === 'pengeluaran') {
      const conditions = ['p.id_user = ?'];
      const values = [req.user.idUser];

      if (startDate) {
        conditions.push('p.tanggal >= ?');
        values.push(startDate);
      }

      if (endDate) {
        conditions.push('p.tanggal <= ?');
        values.push(endDate);
      }

      if (search) {
        conditions.push(`
          (
            dp.deskripsi LIKE ?
            OR k.nama_kategori LIKE ?
          )
        `);

        const keyword = `%${search}%`;
        values.push(keyword, keyword);
      }

      queries.push(`
        SELECT
          p.id_pengeluaran AS id_transaksi,
          'pengeluaran' AS jenis_transaksi,
          p.tanggal,
          dp.nominal,
          k.id_kategori,
          k.nama_kategori,
          dp.deskripsi,
          NULL AS catatan
        FROM pengeluaran p
        JOIN detail_pengeluaran dp
          ON dp.id_pengeluaran = p.id_pengeluaran
        JOIN kategori k
          ON k.id_kategori = dp.id_kategori
        WHERE ${conditions.join(' AND ')}
      `);

      parameters.push(...values);
    }

    const sql = `
      SELECT *
      FROM (${queries.join(' UNION ALL ')}) AS transaksi
      ORDER BY tanggal DESC, id_transaksi DESC
      LIMIT ${limit}
    `;

    const [transactions] = await pool.execute(sql, parameters);

    return res.status(200).json({
      status: 'success',
      data: { transactions },
    });
  } catch (error) {
    console.error('Mengambil riwayat transaksi gagal:', error.message);

    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }
}

async function getFinancialSummary(req, res) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const month = req.query.month || currentMonth;

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        status: 'error',
        message: 'Periode harus menggunakan format YYYY-MM',
      });
    }

    const [rows] = await pool.execute(
      `SELECT
        (
          SELECT COALESCE(SUM(total_pemasukan), 0)
          FROM pemasukan
          WHERE id_user = ?
            AND DATE_FORMAT(tanggal, '%Y-%m') = ?
        ) AS pemasukan_bulan,

        (
          SELECT COALESCE(SUM(total_pengeluaran), 0)
          FROM pengeluaran
          WHERE id_user = ?
            AND DATE_FORMAT(tanggal, '%Y-%m') = ?
        ) AS pengeluaran_bulan,

        (
          SELECT COALESCE(SUM(total_pemasukan), 0)
          FROM pemasukan
          WHERE id_user = ?
        )
        -
        (
          SELECT COALESCE(SUM(total_pengeluaran), 0)
          FROM pengeluaran
          WHERE id_user = ?
        ) AS saldo_keseluruhan`,
      [
        req.user.idUser,
        month,
        req.user.idUser,
        month,
        req.user.idUser,
        req.user.idUser,
      ]
    );

    const totalPemasukan = Number(rows[0].pemasukan_bulan);
    const totalPengeluaran = Number(rows[0].pengeluaran_bulan);

    return res.status(200).json({
      status: 'success',
      data: {
        periode: month,
        totalPemasukan,
        totalPengeluaran,
        saldoBulanan: totalPemasukan - totalPengeluaran,
        saldoKeseluruhan: Number(rows[0].saldo_keseluruhan),
      },
    });
  } catch (error) {
    console.error('Mengambil ringkasan gagal:', error.message);

    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server',
    });
  }
}

module.exports = {
  getFinancialSummary,
  listTransactions,
};
