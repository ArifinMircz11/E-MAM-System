# Work Order: RECOVERY-001

## Objective
Memulihkan aplikasi dari crash runtime `ERR_MODULE_NOT_FOUND` pada `/server.ts`.

## Background
Runtime Node.js gagal menemukan modul yang diimpor di `server.ts` karena kurangnya ekstensi file dalam import ESM.

## Action Taken
1. Verifikasi import di `/server.ts`.
2. Memastikan seluruh import menggunakan ekstensi `.js`.
3. Menjalankan ulang `npm run build` untuk menggenerate ulang `dist/server.cjs`.

## Acceptance Criteria
- `npm run build` berhasil.
- Aplikasi berhasil di-boot tanpa error `ERR_MODULE_NOT_FOUND`.
- Endpoint API dapat diakses.
