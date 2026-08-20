# Migration Readiness Report (e-MAM System V7.8)
## PROJECT: e-MAM System Enterprise V7.8
### STATUS: READY FOR MIGRATION (PRE-FLIGHT STAGE PASSED)

Laporan Kesiapan Migrasi (*Migration Readiness Report*) ini disusun sebagai kesimpulan menyeluruh dari fase audit, inventarisasi, pemetaan skema legacy, rencana migrasi lokal Dexie, dan analisis boundary pelanggaran kueri Firestore.

---

## A. METRIK KESIAPAN DATA (DATA METRICS)

- **Total Koleksi Legacy Teridentifikasi**: **41 Koleksi**
- **Total Entitas Target V7.8 (Canonical Schema)**: **15 Entitas Utama**

---

## B. KLASIFIKASI KATEGORI KOLEKSI LEGACY (COLLECTION CATEGORIES)

### 1. Koleksi yang Siap Migrasi (Direct/Near-Direct Mapping)
Koleksi yang memiliki keselarasan tinggi dengan struktur target dan hanya membutuhkan sedikit penyesuaian PK atau format tanggal:
* `academic_years` -> `academic_years`
* `tenants` -> `tenants`
* `settings` -> `settings`
* `news` -> `news`
* `complaints` -> `complaints`

### 2. Koleksi yang Membutuhkan Transformasi Kompleks (Transform & Restructure)
Koleksi yang harus diproses secara mendalam oleh Mapper Layer sebelum aman dimasukkan ke Dexie IndexedDB:
* `users` -> Dipecah menjadi `users`, `identity_profiles`, dan `user_roles`.
* `teachers` -> Diubah namanya menjadi singular `gtk`, normalisasi tipe personal data, dan hubungkan UUID.
* `students` -> Penjanaan `id` deterministic UUID, tetapkan `idUnik` sebagai indeks bisnis, dan ubah rombel ke `className`.
* `classes` -> Normalisasi `academicYear` string ke `academicYearId` (FK) dan set wali kelas.
* `attendance` -> Ubah format ke `attendance_daily`, mapping `tanggal` ke `date`, dan perbaiki asosiasi FK UUID siswa.
* `poin`, `points`, `point_records`, `point_transactions`, `student_points` -> Dikonsolidasikan penuh ke dalam satu tabel transaksi `point_transactions` serta sub-agregat di `summaries`.
* `letters` -> Ubah format nama ke `student_letters` dan transformasikan status dokumen ke format enum baru.

### 3. Koleksi Deprecated (Dibuang / Dilebur Secara Lokal)
Koleksi lama yang tidak lagi dipelihara secara cloud untuk efisiensi kuota Firestore:
* `about_content` -> Dilebur ke config statis di `settings`.
* `ai_logs` -> Dilebur ke tabel lokal-saja `activity_logs` di Dexie (Local-only).
* `login_logs` -> Dilebur ke `user_sessions` dan `user_activity_logs` (Dexie Only).
* `messageQueue` -> Dilebur ke standard `sync_queue`.
* `audit_notifications` -> Dilebur ke sistem notifikasi umum (`notifications`).
* `daily_stats` + `attendance_monthly_summaries` -> Agregasi dilebur ke entitas `summaries` (sub-jenis agregat).

---

## C. ANALISIS RISIKO MIGRASI (MIGRATION RISKS ASSESSMENT)

| Faktor Risiko | Tingkat Dampak | Skenario Mitigasi Terencana |
|:---|:---:|:---|
| **Data Yatim (Orphaned Records)** <br>Absensi menunjuk ke siswa/kelas lama yang sudah terhapus di master. | Medium | Validation Checkpoint menyaring data yatim, memindahkannya ke tabel penampung error log terisolasi. |
| **Gagal Validasi Zod (Validation Crash)** <br>Field wajib legacy bernilai null atau tipe data tidak cocok. | High | Mapper menyuplai nilai fallback default (seperti `'L'` untuk jenis kelamin, `""` untuk NISN) agar lulus gate schema Zod. |
| **Penyalahgunaan Firestore (Boundary Bypass)** <br>UI component melakukan kueri langsung memotong antrean sinkronisasi lokal. | High | Rencana refaktorisasi 10 file UI (laporan `FIRESTORE-BOUNDARY-VIOLATION.md`) untuk memotong akses langsung sebelum tombol sinkronisasi diaktifkan. |
| **Beban Memori Sinkronisasi (Memory Overload)** <br>Penarikan data dalam jumlah besar sekaligus membebani memori browser. | Low | Delta Sync membagi data ke dalam beberapa batch terpisah (chunking) berukuran maksimal 500 baris per transaksi Dexie. |

---

## D. REKOMENDASI TAHAP BERIKUTNYA (NEXT ACTION RUNBOOK)

Sebagai bagian dari integritas workflow pengkuncian Domain (Domain Freeze), disarankan untuk melanjutkan proyek sesuai urutan berikut:

1. **Langkah 1: Refaktor Boundary Pelanggaran Firestore**
   Eksekusi rencana perbaikan pada **10 file UI** yang teridentifikasi agar sepenuhnya beralih membaca dari offline Dexie database lokal menggunakan Hook dan Service Layer.
2. **Langkah 2: Migrasi Skema Dexie Lokal**
   Naikkan versi IndexedDB lokal ke skema terbaru di `/src/core/database/db.ts` untuk mendaftarkan tabel baru: `identity_profiles`, `user_roles`, `parents`, `student_parents`, dan `grades`.
3. **Langkah 3: Integrasikan Mapper ke Sync Engine**
   Daftarkan mappers baru (`identityMapper`, `masterMapper`, `academicMapper`, `attendanceMapper`, `pointMapper`) ke dalam file `EntityMapper.ts` sebagai filter otomatis saat data masuk ke Sync Engine.
4. **Langkah 4: Jalankan Uji Coba Dry-Run**
   Lakukan eksekusi migrasi parsial (dry-run mode) menggunakan subset data kueri lokal untuk mengonfirmasi ketepatan pemetaan tanpa menulis ke IndexedDB produksi.
5. **Langkah 5: Full Rollout**
   Aktifkan tombol migrasi resmi dari konsol administrasi e-MAM.
