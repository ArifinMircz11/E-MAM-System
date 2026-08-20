# e-MAM System Database Architecture Blueprint
## Versi 1.1 — Official Reference Baseline

Dokumen ini merupakan cetak biru (blueprint) resmi dan baku untuk seluruh pengembangan database, skema, sinkronisasi, dan konvensi penamaan relasi dalam **e-MAM System (Integrated Madrasah Academic Manager)**. Seluruh modul, developer, dan AI Agent wajib mematuhi spesifikasi ini tanpa pengecualian.

---

## 1. Arsitektur Aliran Data (Data Flow)

Aplikasi beroperasi dengan prinsip **Offline-First**. Komponen UI tidak boleh menyentuh Firestore langsung. 

```text
UI Component
     │
     ▼
Hook Layer (useAutoFix, state presenting)
     │
     ▼
Service Layer (Business rules, validations, sync decisions)
     │
     ▼
Repository Layer (HANYA mengakses Dexie/IndexedDB)
     │
     ▼
IndexedDB (Dexie — Operational Database)
     │
     ▼
Sync Queue & Sync Engine (Lokal ke Cloud)
     │
     ▼
Firestore (Source of Truth — Backup & Sync)
```

---

## 2. Taksonomi & Klasifikasi Koleksi (35+1 Rule)

Database e-MAM System secara formal memiliki klasifikasi sebagai berikut:
* **35 Firestore Top-Level Collections** (terbagi atas 30 Koleksi Bisnis dan 5 Koleksi Infrastruktur).
* **1 Local-Only Table** pada Dexie yang tidak pernah disinkronkan ke cloud.

### A. 30 Koleksi Bisnis (Business Collections)
Menyimpan data operasional sekolah mulai dari profil, presensi, jurnal, nilai, hingga persuratan. Contoh: `students`, `teachers`, `users`, `classes`, `attendance`, `journals`, `points`, `letters`, dsb.

### B. 5 Koleksi Infrastruktur (Infrastructure Collections)
Koleksi sistem yang digunakan untuk mengelola sinkronisasi, konflik, audit, dan dashboard:
1. `sync_queue`: Antrean transaksi offline yang akan dikirim ke Firestore.
2. `deleted_records`: Menyimpan tombstone data untuk sinkronisasi penghapusan.
3. `sync_metadata`: Menyimpan metadata sinkronisasi per perangkat/tenant untuk delta sync.
4. `sync_conflicts`: Registrasi konflik data untuk rekonsiliasi.
5. `summary`: Koleksi agregasi data (seperti `attendance_summary`, `dashboard_summary`) untuk konsumsi cepat dashboard.

### C. 1 Tabel Lokal Saja (Local-only Dexie Table)
* `activity_logs`: Log interaksi UI, debugging, dan metrik kinerja perangkat lokal.

---

## 3. Manajemen Log: `activity_logs` vs `audit_logs`

Untuk menghemat kuota Firestore secara drastis serta mengisolasi data analitis lokal dari data kepatuhan (compliance), penanganan logging dibagi secara ketat:

### A. `activity_logs` (Dexie Only)
* **Lokasi**: Hanya disimpan di IndexedDB (Dexie).
* **Sync Engine**: ❌ Tidak masuk `sync_queue` dan tidak pernah disinkronkan ke Firestore.
* **Tujuan**: Debugging UI, log performa, troubleshooting lokal. Hanya dikirim manual jika diinstruksikan melalui Developer Console.

### B. `audit_logs` (Sync to Firestore)
* **Lokasi**: Ditulis ke Dexie, dimasukkan ke `sync_queue`, disinkronkan oleh `SyncEngine` ke Firestore.
* **Tujuan**: Audit keamanan dan operasional sensitif (seperti perubahan nilai, approval pengguna, perubahan status kehadiran, perubahan hak akses/role).
* **Keuntungan**: Melindungi integritas data madrasah, menghemat kuota write Firestore hingga >90% karena log UI tidak mengotori cloud.

---

## 4. Konvensi Penamaan (Naming Conventions)

Untuk mencegah ambiguitas antara kode baru dengan sisa-sisa legacy, ditetapkan standar penamaan penulisan field di seluruh layer aplikasi:

### A. Primary Key (PK)
* Seluruh entitas wajib menggunakan field tunggal bernama: **`id`** (System UUID / Deterministic ID).

### B. Foreign Key (FK)
Semua relasi baru wajib berbentuk singular dengan akhiran `Id` untuk menunjuk ke primary key target:
* `tenantId` (Isolasi tenant)
* `userId` (Profil akun)
* `studentId` (Siswa target)
* `teacherId` (Guru target)
* `parentUserId` (Orang tua siswa)
* `classId` (Kelas target)
* `academicConfigId` (Kalender/Konfigurasi akademik)
* `assignmentId` (Tugas target)
* `submissionId` (Pengumpulan tugas)
* `letterId` (Surat)
* `approvalRequestId` (Permohonan persetujuan)
* `notificationId` (Notifikasi)
* `chatRoomId` (Kanal obrolan)
* `deviceId` (Perangkat pengirim)
* `qrSessionId` (Sesi pemindaian QR)
* `categoryId` (Kategori poin/pelanggaran)

> ❌ **Dilarang keras** menggunakan nama jamak seperti `studentsId`, `teachersId`, atau `classesId` untuk kolom relasi di entitas baru.

### C. Legacy Support Mapper
Apabila database Firestore legacy memerlukan struktur lama untuk kompatibilitas ke belakang, layer **Repository/Service Mapper** bertanggung jawab melakukan translasi data sebelum dikirim atau setelah diterima dari database lokal/cloud:
* `studentId` ──(Mapper)──> `studentsId`
* `teachersId` ──(Mapper)──> `teacherId`

Dengan demikian, UI, Hook, Service, Repository, dan SyncEngine internal hanya mengenal dan bekerja menggunakan satu standar bersih (singular `id`).

---

## 5. Pemisahan Business ID vs System Primary Key

Demi menjaga stabilitas sistem terhadap perubahan data administratif, dipisahkan antara kunci sistem (System PK) dengan nomor pengenal operasional sekolah (Business ID):

| Entitas | Primary Key (`id`) | Business ID | Fungsi & Keterangan |
| :--- | :--- | :--- | :--- |
| **`students`** | `id` (UUID / Deterministic) | `idUnik` | NIM / Nomor Induk Madrasah yang dicetak pada kartu QR Card. Digunakan untuk scanning operasional harian. |
| **`teachers`** | `id` (UUID / Deterministic) | `teachersId` | NIP (ASN) atau NIK/ID GTK (Non-ASN) sebagai nomor identitas resmi guru. |
| **`users`** | `id` (UUID / Deterministic) | `firebaseUid` | ID otentikasi Firebase Auth yang menghubungkan akun dengan profil terkait. |

### Aturan Relasi Internal (Foreign Key)
* Seluruh relasi internal sistem **WAJIB** menggunakan **`id` (Primary Key)** untuk merujuk satu sama lain.
  ```text
  attendance.studentId   ──> students.id
  attendance.teacherId   ──> teachers.id
  journals.teacherId     ──> teachers.id
  journals.classId       ──> classes.id
  submissions.studentId  ──> students.id
  points.studentId       ──> students.id
  ```
* `students.idUnik` dan `teachers.teachersId` **hanya** digunakan untuk:
  * Pemindaian QR Card.
  * Pencarian manual oleh staf/guru.
  * Pencetakan administratif luar.
* **Alur Scanner**: Scanner QR membaca `idUnik` -> Melakukan pencarian lokal (lookup) ke Dexie untuk mendapatkan `students.id` -> Menyimpan transaksi kehadiran (`attendance`) menggunakan `students.id` sebagai foreign key utama.

---

## 6. Standar Skema Metadata Dokumen

Seluruh dokumen operasional yang masuk ke dalam sinkronisasi wajib memiliki sekumpulan metadata standar berikut:

```typescript
interface StandardMetadata {
  id: string;                      // Primary Key dokumen
  tenantId: string;                // Isolasi multi-tenant
  createdAt: string;               // ISO 8601 Timestamp pembuatan
  updatedAt: string;               // ISO 8601 Timestamp pembaruan terakhir
  createdBy: string;               // userId pembuat dokumen
  updatedBy: string;               // userId pembaru terakhir dokumen
  version: number;                 // Versi dokumen untuk optimistik locking / delta sync
  schemaVersion: number;           // Versi skema data (misal: 1) untuk migrasi aman
  syncStatus: 'synced' | 'pending' | 'failed'; // Status sinkronisasi lokal
  deleted: boolean;                // Penanda tombstone (soft delete)
  deletedAt: string | null;        // ISO 8601 Timestamp soft delete
  lastModifiedDevice: string;      // ID Perangkat yang melakukan modifikasi terakhir
  
  // Field opsional pembantu migrasi dan audit integritas
  migrationVersion?: string | null;// Versi skema migrasi jika data telah dimigrasikan
  checksum?: string | null;        // Checksum payload untuk verifikasi data dari tampering
}
```

---

## 7. Skema Baku Antrean Sinkronisasi (Sync Queue Schema)

Struktur data tabel `sync_queue` dirancang generik agar dapat digunakan oleh semua jenis koleksi bisnis secara seragam tanpa membutuhkan logika bercabang:

```typescript
interface SyncQueueItem {
  id: string;                      // ID unik item antrean
  tenantId: string;                // ID Tenant pengirim
  collection: string;              // Nama koleksi target Firestore (misal: 'attendance')
  documentId: string;              // ID Dokumen yang disinkronkan
  operation: 'create' | 'update' | 'delete'; // Operasi tulis
  payload: any;                    // Payload dokumen yang disinkronkan (JSON-safe)
  version: number;                 // Versi dokumen terkait
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;              // Jumlah percobaan ulang pengiriman
  deviceId: string;                // ID Perangkat pengirim
  createdAt: string;               // Tanggal antrean dibuat
  processedAt: string | null;      // Tanggal sinkronisasi selesai diproses
  lastRetryAt: string | null;      // Tanggal percobaan terakhir
  errorCode: string | null;        // Kode kesalahan jika gagal (misal: 'permission-denied')
  errorMessage: string | null;     // Pesan kesalahan rinci dari Firebase / Network
}
```

---

## 8. Aturan & Batasan Khusus Sistem

### A. Dead Letter Queue (DLQ) Lokal
* **Fungsi**: Item sinkronisasi yang terus-menerus gagal melewati batas maksimum retry (misal: 5 kali percobaan) atau menghasilkan kesalahan permanen (seperti validasi gagal) dipindahkan ke tabel `deadLetterQueue`.
* **Arsitektur**: Tabel `deadLetterQueue` resides **HANYA** di Dexie. Tidak pernah dikirim ke Firestore.
* **Manajemen**: Hanya dapat diakses, dianalisis, dan diperbaiki secara manual melalui halaman **Developer Console** di aplikasi e-MAM.

### B. Dashboard Summary Aggregation
* **Integritas**: Dokumen di dalam koleksi agregasi `summary` (misal: `attendance_summary`, `dashboard_summary`) **tidak boleh diubah langsung oleh UI**.
* **Aliran Perubahan**: UI menginput data kehadiran -> Hook memicu Service -> Service menghitung ulang nilai agregat -> Menulis ke tabel Summary lokal -> SyncEngine mensinkronkan ke Firestore -> Dashboard UI membaca data terbaru dari Summary lokal.

### C. Isolasi Multi-Tenant Pada Sync Metadata Perangkat Bersama
* **Kendala**: Dalam lingkungan madrasah, beberapa pengguna dari tenant berbeda mungkin menggunakan satu perangkat fisik/tablet bersama (Shared Device).
* **Solusi**: Kunci dokumen (document key) untuk `sync_metadata` pada Firestore wajib menggunakan format gabungan:
  ```text
  Key = tenantId + "_" + deviceId
  ```
  Ini menjamin riwayat sinkronisasi tetap terisolasi dengan ketat per tenant, meskipun perangkat yang digunakan adalah perangkat yang sama.

### D. Disiplin Akses Layer Database (Strict Layering Enforcement)
* **Repository**: ❌ **Sama sekali dilarang keras mengimpor Firebase SDK atau Firestore client**. Repository hanya boleh memanggil dan melakukan manipulasi data lokal menggunakan Dexie (IndexedDB).
* **Sync Engine**: ✔ **Satu-satunya komponen sistem yang memiliki otorisasi untuk berinteraksi langsung dengan Cloud Firestore SDK** untuk menarik delta data atau mengirim isi `sync_queue`.

---

### Kesimpulan Blueprint
Dengan mengunci Blueprint Database e-MAM v1.1 ini, kita menjamin:
1. **Multi-Tenant Isolation** terproteksi penuh hingga ke level penyimpanan lokal dan perangkat bersama.
2. **Kinerja Offline-First** instan karena operasi write & read harian ditangani sepenuhnya oleh Dexie secara lokal.
3. **Biaya Firestore Sangat Hemat** melalui agregasi summary, logging UI lokal-saja, delta sync berbasis versi metadata, serta proteksi penulisan cloud terkontrol via antrean sinkronisasi generik.

---
*End of Blueprint Document. Locked for baseline development.*
