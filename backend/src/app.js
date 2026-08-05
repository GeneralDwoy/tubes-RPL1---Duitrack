require('dotenv').config();

const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const cors = require('cors');
const express = require('express');
const path = require('node:path');

const pool = require('./config/database');
const authRoutes = require('./routes/auth-routes');
const categoryRoutes = require('./routes/category-routes');
const transactionRoutes = require('./routes/transaction-routes');

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.disable('x-powered-by');
app.use(
  cors({
    origin: (origin, callback) => {
      // izinkan request tanpa origin (misalnya curl, Postman, atau server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} tidak diizinkan`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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
