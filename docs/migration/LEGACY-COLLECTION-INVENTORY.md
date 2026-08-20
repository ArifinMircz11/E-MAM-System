# e-MAM System Legacy Firestore Collection Inventory
## PHASE: FIRESTORE LEGACY DATA EXTRACTION (AUDIT & INVENTORY)
### PURPOSE: Export raw Firestore collections before Enterprise Data Dictionary V7.8 migration

Laporan inventarisasi ini memuat seluruh detail struktur koleksi Firestore legacy yang diidentifikasi dari database e-MAM sebelum dikoordinasikan dengan **Enterprise Data Dictionary V7.8**.

---

## 1. RINGKASAN INVENTARISASI KOLEKSI LEGACY

Total Koleksi Legacy: **41 Koleksi**

| No | Nama Koleksi Legacy | Estimasi Dokumen | Status Kepatuhan V7.8 | Keterangan Migrasi |
|:---|:---|:---:|:---:|:---|
| 1 | `about_content` | ~5 | ⚠️ Deprecated | Digantikan oleh CMS Static Configuration di `settings` |
| 2 | `academic_years` | ~10 | ❌ Non-Compliant | Perlu normalisasi indeks dan field `status` |
| 3 | `ai_logs` | ~200 | ⚠️ Deprecated | Dilebur ke `activity_logs` di Dexie (Local-only) |
| 4 | `attendance` | ~5000 | ❌ Non-Compliant | Migrasi ke `attendance_daily` dengan field `date` & index komposit |
| 5 | `attendance_monthly_summaries` | ~100 | ❌ Non-Compliant | Dilebur ke entitas `summaries` (sub-jenis: `attendance_summary`) |
| 6 | `audit_logs` | ~1000 | ❌ Non-Compliant | Penyelarasan skema metadata wajib dan `_isAuditLogging` flag |
| 7 | `audit_notifications` | ~50 | ⚠️ Deprecated | Dilebur ke sistem notifikasi umum (`notifications`) |
| 8 | `chats` | ~300 | ❌ Non-Compliant | Restrukturisasi relasi `chatRoomId` dan penyeragaman field pesan |
| 9 | `class_chats` | ~50 | ❌ Non-Compliant | Relasi diseragamkan ke top-level `chats` dengan filter `scope` |
| 10 | `classes` | ~30 | ❌ Non-Compliant | Ubah field `academicYear` (string) menjadi `academicYearId` (FK) |
| 11 | `complaints` | ~40 | ❌ Non-Compliant | Penyelarasan field pengirim dan isolasi multi-tenant |
| 12 | `config` | ~5 | ⚠️ Deprecated | Dilebur ke koleksi unified `settings` |
| 13 | `daily_stats` | ~365 | ❌ Non-Compliant | Agregasi statistik harian dimasukkan ke sub-tipe `summaries` |
| 14 | `letters` | ~150 | ❌ Non-Compliant | Migrasi ke `student_letters` dan standarisasi enum status surat |
| 15 | `login_logs` | ~1500 | ⚠️ Deprecated | Dilebur ke `user_sessions` dan `user_activity_logs` (Dexie Only) |
| 16 | `messageQueue` | ~0 | ⚠️ Deprecated | Dilebur ke `sync_queue` |
| 17 | `metadata` | ~5 | ❌ Non-Compliant | Penyelarasan format Delta Sync dan penanda versi |
| 18 | `migration_backups` | ~10 | ⚙️ Infrastructure | Hanya digunakan selama eksekusi migrasi (tidak masuk Dexie) |
| 19 | `migration_logs` | ~50 | ⚙️ Infrastructure | Hanya digunakan selama eksekusi migrasi |
| 20 | `news` | ~25 | ❌ Non-Compliant | Standardisasi metadata berita CMS |
| 21 | `notifications` | ~1200 | ❌ Non-Compliant | Pembersihan target `userId` dan penyesuaian skema general |
| 22 | `poin` | ~800 | ❌ Non-Compliant | Integrasi dengan `point_records` dan normalisasi model |
| 23 | `point_categories` | ~40 | ❌ Non-Compliant | Perbaikan PK `id` dan relasi singular `categoryId` |
| 24 | `point_records` | ~600 | ❌ Non-Compliant | Penyeragaman dengan tabel transaksi poin `point_transactions` |
| 25 | `point_transactions` | ~600 | ❌ Non-Compliant | Unified transaction table untuk pencatatan poin kedisiplinan |
| 26 | `points` | ~800 | ❌ Non-Compliant | Penyatuan tabel point lama |
| 27 | `profile_update_requests` | ~35 | ❌ Non-Compliant | Transisi ke `profile_requests` dengan persetujuan formal |
| 28 | `schedules` | ~250 | ❌ Non-Compliant | Hubungkan relasi `subjectId` (singular) dan `classId` |
| 29 | `settings` | ~10 | ❌ Non-Compliant | Unified tenant/system configuration |
| 30 | `student_point_summaries` | ~350 | ❌ Non-Compliant | Masuk ke sub-tipe `summaries` (sub-jenis: `student_point_summary`) |
| 31 | `student_points` | ~500 | ❌ Non-Compliant | Dilebur ke transaksi gabungan kedisiplinan |
| 32 | `students` | ~350 | ❌ Non-Compliant | PK wajib deterministic `id`. Penyeragaman `statusSiswa` |
| 33 | `summaries` | ~50 | ❌ Non-Compliant | Agregasi dashboard multi-tenant (hemat Firestore read) |
| 34 | `system` | ~5 | ⚠️ Deprecated | Konfigurasi sistem disatukan di `settings` |
| 35 | `system_config` | ~2 | ⚠️ Deprecated | Dilebur ke unified `settings` |
| 36 | `system_configs` | ~2 | ⚠️ Deprecated | Dilebur ke unified `settings` |
| 37 | `system_settings` | ~2 | ⚠️ Deprecated | Dilebur ke unified `settings` |
| 38 | `teacher_attendance` | ~1200 | ❌ Non-Compliant | Normalisasi struktur check-in/out harian guru |
| 39 | `teachers` | ~45 | ❌ Non-Compliant | Ubah menjadi `gtk` (Sesuai Golden Rule penamaan singular) |
| 40 | `tenants` | ~10 | ❌ Non-Compliant | Penambahan profil madrasah esensial (`nsm`, `namaMadrasah`) |
| 41 | `users` | ~400 | ❌ Non-Compliant | Pemisahan akun (`users`), profil (`identity_profiles`), dan role (`user_roles`) |

---

## 2. DETAIL ANALISIS KOLEKSI UTAMA (CORE ENTITIES INVENTORY)

### 2.1. Koleksi: `users`
* **Jumlah Dokumen**: ~400 dokumen
* **Struktur Dokumen Terwakili**:
  ```json
  {
    "uid": "legacy_firebase_auth_uid_123",
    "email": "guru.budi@madrasah.id",
    "displayName": "Budi Susanto, S.Pd.",
    "role": "guru",
    "roles": ["guru", "walikelas"],
    "tenantId": "madrasah_al_ikhlas",
    "teachersId": "GTK-19880112-001",
    "status": "aktif",
    "createdAt": "2024-01-12T08:00:00Z"
  }
  ```
* **Field Tersedia**: `uid`, `email`, `displayName`, `role`, `roles`, `tenantId`, `teachersId`, `status`, `createdAt`
* **Field Hilang (Gaps)**: `id` (Deterministic stable UUID PK), `authUid` (indeks pendukung), `username`, `accountType`, `version`, `schemaVersion`, `syncStatus`, `deleted`, `deletedAt`
* **Field Duplikat/Legacy**: `uid` (harusnya `authUid`), `role`/`roles` (harus keluar ke `user_roles`), `teachersId` (harus keluar ke `identity_profiles` atau relasi)
* **Field Deprecated**: `roles` (penanganan array string tidak ternormalisasi)
* **Kemungkinan Relasi**: Hubungan 1-to-1 dengan profil fisik (`identity_profiles`), 1-to-Many dengan penugasan hak akses (`user_roles`).

### 2.2. Koleksi: `teachers` (Target V7.8: `gtk`)
* **Jumlah Dokumen**: ~45 dokumen
* **Struktur Dokumen Terwakili**:
  ```json
  {
    "teachersId": "GTK-19880112-001",
    "npsn": "12345678",
    "namaLengkap": "Budi Susanto, S.Pd.",
    "gender": "L",
    "nip": "198801122015031002",
    "active": true,
    "userUid": "legacy_firebase_auth_uid_123",
    "phone": "081234567890",
    "address": "Jl. Melati No. 45"
  }
  ```
* **Field Tersedia**: `teachersId`, `npsn`, `namaLengkap`, `gender`, `nip`, `active`, `userUid`, `phone`, `address`
* **Field Hilang (Gaps)**: `id` (UUID PK), `tenantId` (Isolasi tenant wajib), `gelarDepan`, `gelarBelakang`, `nik` (16 digit), `nuptk`, `jenisKelamin` (enum baku L/P), `tempatLahir`, `tanggalLahir`, `agama`, `employmentStatus`, `asnStatus`, `jabatan`, `statusAktif` (boolean), properti standard metadata.
* **Field Duplikat/Legacy**: `teachersId` (sebagai PK legacy, di V7.8 dijadikan `teachersId` business id), `active` (legacy status), `gender` (legacy), `phone` (ganti `telepon`), `address` (ganti `alamat`).
* **Field Deprecated**: `userUid` (harusnya relasi melalui table `identity_profiles`).
* **Kemungkinan Relasi**: Terhubung ke `users.id` via profil fisik, dan `classes.teacherId` (wali kelas).

### 2.3. Koleksi: `students`
* **Jumlah Dokumen**: ~350 dokumen
* **Struktur Dokumen Terwakili**:
  ```json
  {
    "idUnik": "QR-2026-9901",
    "namaLengkap": "Ahmad Fauzi",
    "nis": "260901",
    "nisn": "0123456789",
    "className": "Kelas IX A",
    "rombel": "IX A",
    "statusAktif": true,
    "poinAkumulasi": 15,
    "tenantId": "madrasah_al_ikhlas"
  }
  ```
* **Field Tersedia**: `idUnik`, `namaLengkap`, `nis`, `nisn`, `className`, `rombel`, `statusAktif`, `poinAkumulasi`, `tenantId`
* **Field Hilang (Gaps)**: `id` (UUID PK), `nik`, `tempatLahir`, `tanggalLahir`, `jenisKelamin`, `alamat`, `noHp`, `classId` (FK), properti standard metadata.
* **Field Duplikat/Legacy**: `idUnik` (harusnya Business ID untuk QR, bukan PK utama), `rombel` & `tingkatRombel` (legacy, diganti `className`), `poinAkumulasi` (legacy, ditarik dari sub-tabel summaries).
* **Field Deprecated**: `nis` (diganti `nisn` sebagai standar nasional).
* **Kemungkinan Relasi**: Terhubung ke `classes.classId` via `classId`, serta relasi Many-to-Many dengan orang tua (`parents`) melalui `student_parents`.

### 2.4. Koleksi: `attendance` (Target V7.8: `attendance_daily`)
* **Jumlah Dokumen**: ~5000 dokumen
* **Struktur Dokumen Terwakili**:
  ```json
  {
    "id": "legacy_att_doc_abc",
    "tanggal": "2026-07-10",
    "studentId": "QR-2026-9901",
    "classId": "madrasah_al_ikhlas_Kelas IX A",
    "status": "Hadir",
    "tenantId": "madrasah_al_ikhlas"
  }
  ```
* **Field Tersedia**: `id`, `tanggal`, `studentId`, `classId`, `status`, `tenantId`
* **Field Hilang (Gaps)**: `date` (pengganti `tanggal`), `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `version`, `syncStatus`, `deleted`
* **Field Duplikat/Legacy**: `tanggal` (ganti `date`), `studentId` (pada legacy merujuk `idUnik`, di V7.8 harus merujuk UUID `students.id`).
* **Field Deprecated**: `tanggal`.
* **Kemungkinan Relasi**: Relasi FK ke `students.id` dan `classes.id`.

### 2.5. Koleksi: `classes`
* **Jumlah Dokumen**: ~30 dokumen
* **Struktur Dokumen Terwakili**:
  ```json
  {
    "classId": "madrasah_al_ikhlas_Kelas IX A",
    "name": "Kelas IX A",
    "level": "9",
    "academicYear": "2025/2026",
    "teacherId": "GTK-19880112-001",
    "tenantId": "madrasah_al_ikhlas"
  }
  ```
* **Field Tersedia**: `classId`, `name`, `level`, `academicYear`, `teacherId`, `tenantId`
* **Field Hilang (Gaps)**: `id` (UUID PK), `academicYearId` (FK ke `academic_years`), `waliKelasId` (FK ke `gtk.id`), `studentCount`, properti standard metadata.
* **Field Duplikat/Legacy**: `academicYear` (flat string, harusnya di-normalisasi ke `academicYearId`), `teacherId` (masih memakai `teachersId` legacy, bukan UUID `id`).
* **Field Deprecated**: `academicYear` string.
* **Kemungkinan Relasi**: Relasi FK ke `gtk.id` (wali kelas) dan `academic_years.id`.

---

## 3. IDENTIFIKASI INTEGRITAS DATA & DUPLIKASI DATA

Berdasarkan hasil analisis mendalam terhadap sisa-sisa entitas, ditemukan **3 area kritis duplikasi dan inkonsistensi data** yang harus diselesaikan pada Migration Layer:

1. **Duplikasi Data GTK (`teachers`) & User Account (`users`)**:
   - legacy menyimpan properti nama, email, dan foto di dalam kedua koleksi. Ini memicu desinkronisasi jika salah satu diperbarui secara terpisah.
   - *Solusi V7.8*: Seluruh info personal disatukan di `identity_profiles` dan info kepegawaian guru di `gtk` (d/h `teachers`). Akun pengguna `users` hanya fokus pada login kredensial.
   
2. **Double Business ID / Primary Key Mismatch di Siswa**:
   - Legacy menggunakan `idUnik` (misal: `QR-2026-9901`) sekaligus sebagai primary key dokumen Firestore.
   - *Solusi V7.8*: `id` wajib menggunakan deterministic UUID, sedangkan `idUnik` diindeks secara khusus untuk kebutuhan pencarian scan QR Code secara deterministik.

3. **Scatter Point System**:
   - Legacy menyimpan poin siswa secara acak di `poin`, `points`, `point_records`, `point_transactions`, `student_points`.
   - *Solusi V7.8*: Menyederhanakan pencatatan poin ke dalam satu tabel tunggal `point_transactions` untuk transaksi mutasi, dan `summaries` (sub-jenis: `student_point_summary`) untuk pencatatan nilai agregat.
