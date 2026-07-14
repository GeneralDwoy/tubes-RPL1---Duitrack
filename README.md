# DuiTrack

DuiTrack adalah aplikasi pencatatan keuangan pribadi yang dirancang untuk berjalan di perangkat mobile dan web.

## Teknologi

- Expo dan React Native dengan TypeScript
- Expo Router untuk navigasi
- Supabase untuk autentikasi dan database PostgreSQL
- GitHub untuk penyimpanan dan kolaborasi kode

## Fitur Utama

- Registrasi, login, dan profil pengguna
- Pencatatan pemasukan dan pengeluaran
- Pengelolaan kategori dan anggaran
- Riwayat dan pencarian transaksi
- Laporan serta evaluasi kondisi keuangan
- Ekspor laporan PDF dan Excel
- Notifikasi pemakaian anggaran
- Pengaturan profil dan kata sandi

## Struktur Repository

- `frontend/` - aplikasi Expo untuk Android, iOS, dan web
- Dokumen analisis dan folder ekstraksi tetap disimpan secara lokal dan diabaikan oleh Git

## Status Pengembangan

MVP DuiTrack sudah mencakup seluruh kebutuhan fungsional utama: autentikasi, kategori dan anggaran, transaksi pemasukan/pengeluaran, validasi saldo, pencarian dan filter riwayat, laporan bulanan, evaluasi anggaran, serta ekspor Excel (CSV) dan PDF. Semua halaman data dilindungi oleh sesi Supabase dan Row Level Security.

Skema database tersedia di `supabase/schema.sql`, sedangkan langkah pembuatan project dan pemasangan key dijelaskan di `docs/SUPABASE_SETUP.md`.

## Menjalankan Aplikasi

Masuk ke folder `frontend`, pasang dependensi, lalu jalankan:

```bash
npm install
npm start
```

Gunakan tombol `a` untuk Android, `w` untuk web, atau pindai kode QR melalui Expo Go.

Untuk menjalankan web secara langsung:

```bash
npm run web
```

## Pemeriksaan Project

```bash
npx tsc --noEmit
npm run lint
npx expo-doctor
npx expo export --platform web
```
