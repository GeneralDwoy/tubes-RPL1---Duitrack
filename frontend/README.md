# DuiTrack Frontend (Vite + React)

Aplikasi Web Frontend DuiTrack dibuat menggunakan **Vite** dan **React**.

## Persiapan

```powershell
npm install
```

Backend Express di folder `../backend` dan layanan MySQL harus aktif. Alamat API web bawaan adalah `http://localhost:3000`.

## Menjalankan Server Pengembang (Dev)

```powershell
npm run dev
```

Akses via browser di `http://localhost:5173`.

## Membangun untuk Produksi (Build)

```powershell
npm run build
```

Hasil kompilasi file statis web akan tersimpan di folder `dist/`.

## Pengujian Ekspor Laporan

```powershell
npm run test:exports
```
