# Setup dan Demo MySQL DuiTrack

## Lokasi source code

- Tampilan aplikasi: `frontend/src/app`
- Komunikasi frontend ke backend: `frontend/src/lib/api.ts`
- Logika data keuangan frontend: `frontend/src/lib/finance.ts`
- REST API: `backend/src`
- Skema database: `backend/sql/schema.sql`

## Persiapan pertama kali

1. Nyalakan layanan MySQL.
2. Buka `backend/sql/schema.sql` di MySQL Workbench.
3. Jalankan seluruh isi berkas menggunakan tombol petir.
4. Buat pengguna khusus aplikasi dengan mengganti kata sandi contoh berikut:

```sql
CREATE USER IF NOT EXISTS 'duitrack_app'@'localhost'
  IDENTIFIED BY 'GANTI_DENGAN_PASSWORD_KAMU';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON duitrack.*
  TO 'duitrack_app'@'localhost';

FLUSH PRIVILEGES;
```

5. Salin `backend/.env.example` menjadi `backend/.env`.
6. Isi `DB_PASSWORD` dengan kata sandi pengguna `duitrack_app` dan isi `JWT_SECRET` dengan kode acak yang panjang.
7. Pasang dependensi pada folder `backend` dan `frontend` menggunakan `npm.cmd install`.

File `.env` berisi rahasia lokal dan sudah diabaikan Git. Jangan menaruh kata sandi asli di `.env.example`.

## Urutan demo web

Pastikan MySQL sudah aktif, lalu buka dua terminal.

Terminal backend:

```powershell
cd "C:\Users\gilbr\Documents\Project Aplikasi DuiTrack\backend"
npm.cmd run dev
```

Pastikan terminal menampilkan alamat `http://localhost:3000`. Pemeriksaan koneksi dapat dibuka melalui `http://localhost:3000/api/health`.

Terminal frontend:

```powershell
cd "C:\Users\gilbr\Documents\Project Aplikasi DuiTrack\frontend"
npm.cmd run web
```

Buka `http://localhost:8081`, lalu demonstrasikan registrasi, login, kategori, pemasukan, pengeluaran, riwayat, laporan, ekspor, dan profil.

## Urutan demo Expo Go

1. Hubungkan laptop dan HP ke Wi-Fi yang sama.
2. Nyalakan MySQL dan backend seperti pada demo web.
3. Jalankan frontend dengan `npm.cmd run mobile`.
4. Izinkan Node.js pada Windows Firewall untuk jaringan privat apabila diminta.
5. Pindai QR melalui Expo Go.

Alamat backend pada HP dideteksi otomatis dari alamat LAN Expo. Jika jaringan tertentu menghalanginya, buat `frontend/.env` berisi:

```dotenv
EXPO_PUBLIC_API_URL=http://IPV4_LAPTOP:3000
```

Ganti `IPV4_LAPTOP` dengan alamat IPv4 Wi-Fi dari `ipconfig`, simpan, lalu jalankan ulang Expo.

## Aliran penyimpanan data

Frontend mengirim permintaan JSON ke REST API Express. Backend memeriksa JWT, memvalidasi isi permintaan, lalu menjalankan query MySQL memakai `mysql2`. Kata sandi disimpan sebagai hash bcrypt, bukan teks asli. Setiap kategori dan transaksi terhubung ke `id_user`, sehingga API hanya mengambil atau mengubah data milik pengguna yang sedang login.
