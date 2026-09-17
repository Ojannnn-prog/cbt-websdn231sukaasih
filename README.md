# NextCBT

Platform Computer Based Test full-stack untuk guru dan siswa dengan Next.js App Router, Prisma Client driver Neon, dan PostgreSQL Neon.

## Menjalankan project

```bash
npm install
npm run db:init
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`. Konfigurasi rahasia berada di `.env`; gunakan `.env.example` sebagai template tanpa memasukkan secret ke git.

## Fitur yang tersedia

- Login admin dan siswa dengan session JWT httpOnly.
- Cooldown login 15 detik setelah 3 kegagalan.
- Dashboard admin untuk monitoring siswa dengan batas online 60 detik.
- Pembuatan akun siswa otomatis berdasarkan nomor absen.
- Pembuatan ujian dengan 5–50 soal pilihan ganda.
- Fisher–Yates shuffle di server dan penyimpanan urutan pada `ExamAttempt.questionOrder`.
- Timer ujian, navigasi soal, auto-save jawaban, auto-submit, dan hasil instan.
- Export laporan PDF berdasarkan nomor absen atau nilai.
- UI Neo-Brutalism yang responsive untuk desktop dan mobile.

## Catatan database

`npm run db:init` membuat schema idempotent melalui Neon HTTP driver. Cara ini dipakai agar setup tidak bergantung pada binary Prisma Schema Engine di mesin lokal. `npm run db:seed` membuat akun admin dan satu ujian contoh bila database masih kosong.
