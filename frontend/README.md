# DuiTrack Frontend

Aplikasi Expo SDK 57 dengan React Native, TypeScript, dan Expo Router. Basis kode yang sama digunakan untuk Android, iOS, dan web.

## Persiapan

Instal dependensi setelah repository di-clone:

```bash
npm install
```

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
