# Menyiapkan Supabase untuk DuiTrack

Supabase menyediakan database PostgreSQL, autentikasi pengguna, API, dan penyimpanan file untuk aplikasi DuiTrack.

## 1. Membuat akun

1. Buka https://supabase.com/dashboard.
2. Pilih **Sign in with GitHub**.
3. Gunakan akun GitHub yang menyimpan repository DuiTrack.
4. Selesaikan verifikasi akun bila diminta.

## 2. Membuat project

1. Klik **New project**.
2. Pilih organisasi pribadi Anda.
3. Isi nama project dengan `DuiTrack`.
4. Buat kata sandi database yang kuat dan simpan di password manager.
5. Pilih region terdekat dengan Indonesia, misalnya Singapore atau Southeast Asia.
6. Pilih paket Free untuk tahap pengembangan.
7. Klik **Create new project** dan tunggu sampai database siap.

Jangan mengirim kata sandi database kepada siapa pun dan jangan menaruhnya di GitHub.

## 3. Mengambil konfigurasi aplikasi

1. Buka project DuiTrack di dashboard Supabase.
2. Klik tombol **Connect**.
3. Cari bagian konfigurasi aplikasi atau client library.
4. Salin **Project URL**.
5. Salin **Publishable key**. Jangan gunakan `service_role` atau secret key di aplikasi.

Nilai tersebut nanti dimasukkan ke file `frontend/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
```

File `.env` diabaikan oleh Git. File `.env.example` hanya berisi contoh nama variabel dan aman disimpan di repository.

## 4. Membuat tabel

1. Di dashboard Supabase, buka **SQL Editor**.
2. Klik **New query**.
3. Buka file `supabase/schema.sql` dari repository DuiTrack.
4. Salin seluruh isi file ke SQL Editor.
5. Klik **Run**.
6. Pastikan hasilnya menampilkan pesan sukses tanpa error.

Skema mengaktifkan Row Level Security. Setiap pengguna hanya dapat membaca dan mengubah data keuangannya sendiri.

## 5. Pengaturan autentikasi lokal

1. Buka **Authentication > URL Configuration**.
2. Isi Site URL dengan `http://localhost:8081` selama pengembangan web.
3. Tambahkan `http://localhost:8081/**` pada Redirect URLs.
4. Redirect mobile dengan scheme `duittrack://` akan ditambahkan ketika build perangkat dibuat.

## Catatan keamanan

- Password pengguna dikelola oleh Supabase Auth dan tidak disimpan pada tabel buatan DuiTrack.
- Publishable key boleh digunakan oleh aplikasi karena akses data tetap dilindungi Row Level Security.
- `service_role`, secret key, dan kata sandi database tidak boleh dimasukkan ke aplikasi atau GitHub.
