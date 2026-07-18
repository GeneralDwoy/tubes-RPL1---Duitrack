# DuiTrack

DuiTrack adalah aplikasi pencatatan keuangan pribadi untuk mobile dan web.

## Teknologi

- Expo, React Native, dan TypeScript untuk aplikasi mobile serta web
- Expo Router untuk navigasi berbasis file
- Node.js dan Express untuk REST API
- MySQL untuk penyimpanan data
- JWT dan bcrypt untuk sesi serta keamanan kata sandi

## Fitur Utama

- Registrasi, login, profil, dan perubahan kata sandi
- CRUD kategori serta anggaran bulanan
- CRUD pemasukan dan pengeluaran
- Validasi saldo dan batas anggaran
- Riwayat, pencarian, dan filter transaksi
- Dashboard, laporan bulanan, serta notifikasi anggaran
- Ekspor laporan PDF dan Excel

## Struktur Repository

- `frontend/` - aplikasi Expo untuk Android, iOS, dan web
- `backend/` - REST API Express yang terhubung ke MySQL
- `docs/` - panduan konfigurasi dan demo
- `supabase/` - arsip skema lama; tidak dipakai oleh aplikasi MySQL saat ini

Panduan lengkap MySQL dan urutan demo tersedia di `docs/MYSQL_SETUP.md`. Skema enam tabel yang digunakan aplikasi tersedia di `backend/sql/schema.sql`.

## Menjalankan Demo

Nyalakan MySQL terlebih dahulu. Buka dua terminal dari folder proyek.

Terminal pertama:

```powershell
cd backend
npm.cmd run dev
```

Terminal kedua untuk web:

```powershell
cd frontend
npm.cmd run web
```

Untuk HP yang satu Wi-Fi dengan laptop:

```powershell
cd frontend
npm.cmd run mobile
```

Backend harus tetap berjalan selama aplikasi digunakan. Expo Go akan memakai alamat IP laptop dari koneksi LAN. Jika diperlukan, isi `frontend/.env` dengan `EXPO_PUBLIC_API_URL=http://IP-LAPTOP:3000`.

## Pemeriksaan

```powershell
cd backend
npm.cmd run check
npm.cmd test

cd ..\frontend
npx.cmd tsc --noEmit
npm.cmd run lint
```
