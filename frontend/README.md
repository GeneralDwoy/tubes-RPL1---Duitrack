# DuiTrack Frontend

Aplikasi Expo SDK 54 dengan React Native, TypeScript, dan Expo Router. Basis kode yang sama digunakan untuk Android, iOS, dan web.

## Persiapan

```powershell
npm.cmd install
```

Backend Express di folder `../backend` dan layanan MySQL harus aktif. Alamat API web bawaan adalah `http://localhost:3000`. Untuk alamat khusus, buat `.env` berdasarkan `.env.example`.

## Menjalankan

Web:

```powershell
npm.cmd run web
```

Expo Go pada jaringan LAN:

```powershell
npm.cmd run mobile
```

Pindai QR melalui Expo Go. Laptop dan HP harus berada pada Wi-Fi yang sama, firewall harus mengizinkan Node.js, dan backend port 3000 harus aktif.

## Pemeriksaan

```powershell
npx.cmd tsc --noEmit
npm.cmd run lint
npx.cmd expo-doctor
npx.cmd expo export --platform web
```

Kode halaman utama berada di `src/app`, akses REST API di `src/lib/api.ts`, dan seluruh operasi keuangan di `src/lib/finance.ts`.
