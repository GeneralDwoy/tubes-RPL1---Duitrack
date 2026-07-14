# DuiTrack Frontend

Aplikasi Expo SDK 57 dengan React Native, TypeScript, dan Expo Router. Basis kode yang sama digunakan untuk Android, iOS, dan web.

## Persiapan

Instal dependensi setelah repository di-clone:

```bash
npm install
```

Buat file `.env` berdasarkan `.env.example`, kemudian isi URL dan publishable key Supabase. Jangan commit file `.env`.

## Menjalankan Project

```bash
npm start
```

Pada terminal Expo, tekan `a` untuk Android atau `w` untuk web. Untuk ponsel fisik, pindai kode QR melalui Expo Go.

Perintah khusus web:

```bash
npm run web
```

## Pemeriksaan

```bash
npm run lint
npx expo-doctor
npx expo export --platform web
```

Kode halaman berada di `src/app` dan menggunakan routing berdasarkan struktur file.

## Fitur MVP

- Autentikasi dan pemulihan akun Supabase
- Dashboard saldo dan transaksi terbaru
- CRUD kategori, anggaran, pemasukan, dan pengeluaran
- Validasi saldo serta sisa anggaran real-time
- Pencarian dan filter transaksi berdasarkan tanggal, bulan, atau tahun
- Laporan bulanan dan evaluasi anggaran per kategori
- Ekspor Excel (CSV) dan PDF di web maupun Expo Go
- Profil, perubahan kata sandi, dan notifikasi anggaran
