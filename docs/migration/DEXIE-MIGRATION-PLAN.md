# e-MAM System Dexie Local-First Migration Plan
## PROJECT: e-MAM System Enterprise V7.8
### TYPE: ENTERPRISE DEPLOYMENT ARCHITECTURE RUNBOOK

Rencana kerja ini menetapkan pipeline terstruktur untuk memindahkan data raw Firestore legacy hasil ekstraksi ke database operasional lokal **IndexedDB (Dexie)** secara aman, tanpa merusak konsistensi data.

---

## 1. STRUKTUR PIPELINE MIGRASI LOCAL-FIRST

Untuk menjamin tidak adanya anomali atau data korup yang masuk ke database operasional lokal Dexie, data tidak disisipkan langsung, melainkan melalui pipeline berikut:

```text
  Firestore Legacy JSON (raw)
              │
              ▼
    Legacy Mapper Layer
  (Menerapkan format V7.8)
              │
              ▼
    Validation Layer (Zod)
  (Menolak data tidak valid)
              │
              ▼
   Dexie Repository Layer
  (Skema Dexie multi-tenant)
              │
              ▼
     IndexedDB (Dexie)
 (Local Operational Database)
```

---

## 2. URUTAN MIGRASI EKSEKUSI (ENTITY DEPENDENCY ORDER)

Penentuan urutan migrasi didasarkan pada dependensi kunci asing (Foreign Keys) antar entitas. Entitas master yang dirujuk wajib dimigrasikan terlebih dahulu agar integritas relasi tidak patah.

### Urutan Resmi Eksekusi:

| Tahap | Entitas Target | Sumber Legacy | Ketergantungan (Dependencies) | Alasan & Dampak |
|:---:|:---|:---|:---|:---|
| **1** | `tenants` | `tenants` + `settings` | - *None* - | Menetapkan konteks madrasah dasar (isolasi multi-tenant). |
| **2** | `users` | `users` | `tenants` | Akun pengguna login harus terdaftar di tenant masing-masing. |
| **3** | `identity_profiles` | `users` + profil | `users` | Profil fisik menunjuk langsung ke `users.id` via `userId`. |
| **4** | `user_roles` | `users.roles` | `users` | Penugasan wewenang login menunjuk langsung ke `users.id`. |
| **5** | `gtk` | `teachers` | `tenants` + `users` | GTK (guru/staf) terkait dengan tenant dan akun pengguna. |
| **6** | `students` | `students` | `tenants` | Data siswa terkait langsung dengan tenant. |
| **7** | `parents` | `orang_tua` | `tenants` | Data orang tua atau wali terdaftar di tenant. |
| **8** | `student_parents` | - Relasional - | `students` + `parents` | Tabel penengah relasi banyak-ke-banyak (Many-to-Many). |
| **9** | `academic_years` | `academic_years` | `tenants` | Kalender akademik madrasah. |
| **10** | `classes` | `classes` | `academic_years` + `gtk` | Kelas memerlukan FK wali kelas (`waliKelasId`) dan `academicYearId`. |
| **11** | `subjects` | `mata_pelajaran` | `tenants` | Kurikulum mata pelajaran madrasah. |
| **12** | `schedules` | `schedules` | `classes` + `subjects` + `gtk` | Jadwal mengajar merujuk ke kelas, pelajaran, dan guru. |
| **13** | `attendance` | `attendance` | `students` + `classes` | Absensi harian merujuk ke siswa (`studentId` UUID) dan kelas. |
| **14** | `grades` | `penilaian` | `students` + `classes` | Nilai akademik terhubung dengan siswa dan rombel. |
| **15** | `points` | Riwayat Poin | `students` | Pencatatan transaksi mutasi poin kedisiplinan siswa. |

---

## 3. PRIMARY KEY & BUSINESS IDENTIFICATION STRATEGY

### Aturan Keamanan Identitas (Golden Identity Rules):
1. **Primary Key (`id`)**:
   - Seluruh entitas wajib menggunakan field `id` bertipe **Deterministic stable UUID** (UUID v5 / Namespace Hash).
   - Dilarang menggunakan ID acak atau ID dokumen Firestore langsung sebagai primary key IndexedDB jika hal tersebut merusak stabilitas relasi lokal.
   - Penjanaan PK `id` stabil berdasarkan field unik legacy (misal hash dari `idUnik` untuk siswa, hash dari `teachersId` untuk guru, hash dari `uid` untuk user).
2. **Business ID (`idUnik` / `teachersId`)**:
   - Dipisahkan secara ketat dari `id` sistem.
   - `students.idUnik` digunakan untuk scanning QR Code harian.
   - Alur scan QR: Membaca `idUnik` -> Lookup cepat ke Dexie untuk mendapatkan `id` UUID siswa -> Catat presensi di `attendance_daily` dengan FK `studentId` merujuk ke `id` UUID.

---

## 4. VALIDATION CHECKPOINTS (QUALITY CONTROL GATE)

Setiap record wajib divalidasi menggunakan Zod Schema di memory sebelum dilakukan penyimpanan (write) ke Dexie:

- **Checkpoint 1: Tenant Validation**:
  Tolak record yang tidak memiliki `tenantId` yang valid (kecuali sistem konfigurasi global).
- **Checkpoint 2: Reference Validation**:
  Pastikan seluruh FK (seperti `classId` pada siswa atau `studentId` pada absensi) merujuk ke record yang eksis di database lokal. Jika tidak, tandai record tersebut sebagai yatim (*orphan*) dan pindahkan ke log pengecualian migrasi.
- **Checkpoint 3: ISO Date Validation**:
  Seluruh field timestamp wajib berupa format ISO 8601 UTC. Format tanggal campuran lama ditolak dan diubah secara otomatis.

---

## 5. ROLLBACK STRATEGY (FAIL-SAFE ACTION RUNBOOK)

Jika terjadi kesalahan atau kegagalan parsing skema saat eksekusi migrasi di tengah jalan:

1. **Abrupt Stop & Transaction Abort**:
   Gunakan transaksi Dexie secara atomis (`db.transaction('rw', [...], async () => { ... })`). Jika satu entitas gagal, seluruh transaksi pada blok bersangkutan di-rollback otomatis secara lokal.
2. **Database Cleansing & Recovery**:
   Gunakan tombol "Force Reset Database" di Developer Console yang akan menjalankan perintah `db.delete()` kemudian `db.open()` untuk membersihkan seluruh IndexedDB lokal dari sisa-sisa migrasi yang korup.
3. **Log Diagnostic**:
   Catat kegagalan terperinci pada file log lokal `docs/migration/migration-failure-diagnostics.json` guna keperluan penelusuran tim teknis.
