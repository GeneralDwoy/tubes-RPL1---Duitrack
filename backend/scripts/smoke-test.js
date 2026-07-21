const assert = require('node:assert/strict');

const app = require('../src/app');
const pool = require('../src/config/database');

async function main() {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const baseUrl = `${origin}/api`;
  const email = `s${String(Date.now()).slice(-8)}@d.local`;
  const firstPassword = 'KataSandiUji123!';
  const secondPassword = 'KataSandiBaru456!';
  let token = '';

  async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      method: options.method || 'GET',
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(`${options.method || 'GET'} ${path}: ${payload.message}`);
    return payload.data;
  }

  async function requestForm(path, formData, method = 'PUT') {
    const response = await fetch(`${baseUrl}${path}`, {
      body: formData,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      method,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(`${method} ${path}: ${payload.message}`);
    return payload.data;
  }

  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    assert.equal(healthResponse.status, 200);

    const registration = await request('/auth/register', {
      method: 'POST',
      body: { email, nama: 'Pengguna Smoke Test', password: firstPassword },
    });
    token = registration.token;
    assert.ok(token);

    const categoryData = await request('/categories');
    assert.equal(categoryData.categories.length, 10);
    const incomeCategory = categoryData.categories.find((item) => item.jenis === 'pemasukan');
    const expenseCategory = categoryData.categories.find((item) => item.jenis === 'pengeluaran');
    assert.ok(incomeCategory);
    assert.ok(expenseCategory);

    await request(`/categories/${expenseCategory.id_kategori}`, {
      method: 'PUT',
      body: {
        jenis: 'pengeluaran',
        namaKategori: expenseCategory.nama_kategori,
        targetAnggaran: 400000,
        warna: expenseCategory.warna,
        ikon: expenseCategory.ikon,
      },
    });

    const date = new Date().toISOString().slice(0, 10);
    const income = await request('/transactions/income', {
      method: 'POST',
      body: {
        catatan: 'Uji integrasi',
        idKategori: incomeCategory.id_kategori,
        nominal: 500000,
        sumber: 'Pendapatan uji',
        tanggal: date,
      },
    });
    const expense = await request('/transactions/expense', {
      method: 'POST',
      body: {
        deskripsi: 'Pengeluaran uji',
        idKategori: expenseCategory.id_kategori,
        nominal: 100000,
        tanggal: date,
      },
    });

    await request(`/transactions/income/${income.idPemasukan}`, {
      method: 'PUT',
      body: {
        catatan: 'Uji integrasi diperbarui',
        idKategori: incomeCategory.id_kategori,
        nominal: 600000,
        sumber: 'Pendapatan uji',
        tanggal: date,
      },
    });
    await request(`/transactions/expense/${expense.idPengeluaran}`, {
      method: 'PUT',
      body: {
        deskripsi: 'Pengeluaran uji diperbarui',
        idKategori: expenseCategory.id_kategori,
        nominal: 125000,
        tanggal: date,
      },
    });

    const summary = await request(`/transactions/summary?month=${date.slice(0, 7)}`);
    assert.equal(Number(summary.totalPemasukan), 600000);
    assert.equal(Number(summary.totalPengeluaran), 125000);
    assert.equal(Number(summary.saldoBulanan), 475000);

    const history = await request('/transactions?limit=20');
    assert.equal(history.transactions.length, 2);
    const detail = await request(`/transactions/expense/${expense.idPengeluaran}`);
    assert.equal(Number(detail.transaction.nominal), 125000);

    const profile = await request('/auth/me', {
      method: 'PUT',
      body: { nama: 'Pengguna Smoke Selesai' },
    });
    assert.equal(profile.user.nama, 'Pengguna Smoke Selesai');

    const photoForm = new FormData();
    photoForm.append(
      'photo',
      new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' }),
      'profil.png',
    );
    const uploadedPhoto = await requestForm('/auth/photo', photoForm);
    assert.match(uploadedPhoto.user.fotoProfil, /^\/uploads\/profile-/);
    const photoResponse = await fetch(`${origin}${uploadedPhoto.user.fotoProfil}`);
    assert.equal(photoResponse.status, 200);
    const removedPhoto = await request('/auth/photo', { method: 'DELETE' });
    assert.equal(removedPhoto.user.fotoProfil, null);

    await request('/auth/password', { method: 'PUT', body: { password: secondPassword } });

    await request(`/transactions/expense/${expense.idPengeluaran}`, { method: 'DELETE' });
    await request(`/transactions/income/${income.idPemasukan}`, { method: 'DELETE' });

    token = '';
    const login = await request('/auth/login', {
      method: 'POST',
      body: { email, password: secondPassword },
    });
    assert.ok(login.token);

    console.log('Smoke test DuiTrack berhasil: 17 alur API lolos.');
  } finally {
    await pool.execute('DELETE FROM `user` WHERE email = ?', [email]);
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
