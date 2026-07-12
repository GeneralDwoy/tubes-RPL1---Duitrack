# DuiTrack

DuiTrack adalah aplikasi pencatatan keuangan pribadi yang dirancang untuk berjalan di perangkat mobile dan web.

## Rencana Teknologi

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

## Struktur Repository

- `frontend/` - aplikasi Expo untuk Android, iOS, dan web
- Dokumen analisis dan folder ekstraksi tetap disimpan secara lokal dan diabaikan oleh Git

## Status Pengembangan

Fondasi antarmuka sudah tersedia untuk splash screen, halaman sambutan, login, registrasi, pemulihan kata sandi, penggantian kata sandi, dan dashboard awal. Autentikasi sudah terhubung ke Supabase dengan sesi tersimpan dan perlindungan route dashboard.

Fondasi Supabase tersedia di `supabase/schema.sql`, sedangkan langkah pembuatan project dan pemasangan key dijelaskan di `docs/SUPABASE_SETUP.md`.

## Menjalankan Aplikasi

Masuk ke folder `frontend`, lalu jalankan:

```bash
npm start
```

Gunakan tombol `a` untuk Android, `w` untuk web, atau pindai kode QR melalui Expo Go.
