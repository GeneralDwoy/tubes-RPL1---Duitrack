require('dotenv').config();

const cors = require('cors');
const express = require('express');

const pool = require('./config/database');
const authRoutes = require('./routes/auth-routes');
const categoryRoutes = require('./routes/category-routes');
const transactionRoutes = require('./routes/transaction-routes');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DATABASE() AS database_name, NOW() AS waktu_server');
    return res.status(200).json({
      status: 'ok',
      message: 'Backend DuiTrack terhubung ke MySQL',
      database: rows[0].database_name,
      waktuServer: rows[0].waktu_server,
    });
  } catch (error) {
    console.error('Database health check gagal:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Backend tidak dapat terhubung ke database',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);

app.use((req, res) => {
  return res.status(404).json({ status: 'error', message: 'Endpoint tidak ditemukan' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error('Permintaan API gagal:', error.message);
  return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
});

module.exports = app;
