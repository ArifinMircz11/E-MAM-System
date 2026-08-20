# 05. DATA ARCHITECTURE

## e-MAM System Enterprise

**Version:** 1.1.0  
**Status:** APPROVED — EAOM COMPLIANT  
**Document Type:** Enterprise Data Architecture Blueprint  
**Single Source of Truth (SSOT) Reference:** `docs/05_DATA_ARCHITECTURE.md`

---

# 5.0 Data Architecture Overview

Arsitektur Data e-MAM System dirancang dengan pendekatan **Offline-First** dan **Local-First (Dexie IndexedDB)** sebagai database operasional utama pada sisi client, sedangkan **Cloud Firestore** bertindak sebagai gateway sinkronisasi, backup cloud, dan disaster recovery.

Seluruh aliran data harus mematuhi jalur unidirectional yang ketat tanpa bypass layer, menjamin konsistensi data, isolasi multi-tenant yang aman, dan efisiensi biaya operasional Firestore.

---

## 5.1 Data Architecture Principles

Arsitektur data e-MAM System dikendalikan oleh 6 prinsip utama berikut:

1. **Local-First (Dexie IndexedDB sebagai Operational DB):** Seluruh query pembacaan dan penulisan operasional dilakukan langsung ke local database (IndexedDB via Dexie) secara instan (<100ms) tanpa menunggu respon jaringan internet.
2. **Firestore sebagai Sync Gateway & Source of Truth:** Firestore tidak boleh diakses langsung oleh UI untuk operasi CRUD harian. Firestore berperan sebagai pelindung awan (Cloud Backup) dan penyedia Delta Synchronization untuk sinkronisasi antar perangkat.
3. **Isolasi Multi-Tenant Mutlak:** Semua entitas transaksional wajib dipisahkan menggunakan kolom/atribut `tenantId`. Query lintas tenant dilarang keras, dan composite indices wajib menyertakan `tenantId` sebagai kunci utama.
4. **Unidirectional Data Flow:** Aliran data bergerak dalam satu arah yang dapat diprediksi:  
   `UI ──► Hook ──► Service ──► Repository ──► Dexie ──► Sync Queue ──► Sync Engine ──► Firestore`.
5. **No Hard Deletes (Kebijakan Soft-Delete):** Penghapusan fisik data pada tabel operasional dilarang. Seluruh operasi penghapusan digantikan dengan mekanisme update status (`deleted: true`, `deletedAt: EpochMS`), sehingga integritas audit log tetap terjaga.
6. **ID Deterministik (Anti Auto-ID Firestore):** Penggunaan fungsi auto-ID Firestore (`addDoc`) dilarang keras untuk data transaksional. Semua ID harus digenerasikan secara manual dan deterministik di sisi client (misalnya gabungan `tenantId_classId_studentId_date` pada absensi) untuk mencegah duplikasi data saat sinkronisasi offline.

---

## 5.2 Aliran Data & Lapisan Penyimpanan

Data mengalir secara terstruktur melalui lapisan-lapisan yang memiliki tanggung jawab terisolasi:

```text
[ UI Components (React) ]
          │
          ▼ (hooks: useStudents, useAttendance)
[ Hook Layer (Orchestration & State) ]
          │
          ▼ (services: studentService, attendanceService)
[ Service Layer (Business Logic & Validation) ]
          │
          ▼ (repositories: studentRepository, attendanceRepository)
[ Repository Layer (Dexie DB Access Mapper) ]
          │
          ▼ (local writes / reads)
[ Operational DB (Dexie IndexedDB) ] ────► [ Local Outbox Sync Queue (Dexie) ]
                                                            │
                                                            ▼
                                                 [ Sync Engine Daemon ]
                                                            │
                                                            ▼ (secure Firestore API calls)
                                                 [ Cloud Firestore (Backup / Sync) ]
```

---

## 5.3 Model Data Kanonikal (SSOT)

Model-model TypeScript berikut merupakan standar tertinggi (SSOT) yang wajib digunakan di semua layer aplikasi.

### 5.3.1 Common Metadata Contract (BaseEntity)
Setiap entitas operasional dan master data wajib mewarisi (inherit) kontrak dasar pelacakan metadata ini:

```typescript
export interface BaseEntity {
  id: string;                  // ID unik deterministik (Primary Key)
  tenantId: string;            // Identifikasi Madrasah/Tenant
  createdAt: number;           // Epoch Milliseconds (UTC)
  updatedAt: number;           // Epoch Milliseconds (UTC)
  createdBy: string;           // Firebase Auth UID pembuat
  updatedBy: string;           // Firebase Auth UID pengubah terakhir
  version: number;             // Nomor versi untuk optimistic locking & delta sync
  schemaVersion: number;       // Versi skema untuk kebutuhan data migrator
  deleted: boolean;            // Flag soft-delete
  deletedAt?: number;          // Epoch Milliseconds jika dihapus
}
```

### 5.3.2 Canonical User (Identity) Model
Mengelola data otentikasi, otorisasi, hak akses (RBAC), serta cakupan data (ABAC):

```typescript
export interface CanonicalUser extends BaseEntity {
  uid: string;                 // Firebase Auth UID (bertindak sebagai PK/id)
  referenceId?: string;        // Bridge penghubung ke Teacher ID (Txxx) atau Student ID (Sxxx)
  accountType: 'developer' | 'kanwil' | 'kemenag' | 'madrasah';
  role: 'admin' | 'kamad' | 'keptu' | 'guru' | 'guru_bk' | 'staf' | 'siswa' | 'orang_tua';
  roles: string[];             // Multi-role tambahan (e.g. ['wali_kelas', 'bendahara'])
  displayName: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  scope: {
    tenantId: string;
    classIds?: string[];       // Batas kelas yang diampu guru (ABAC)
    subjectIds?: string[];     // Batas mata pelajaran (ABAC)
  };
  provider: string;            // Provider login (e.g. 'password', 'google.com')
  lastLoginAt?: number;
  lastSyncAt?: number;
}
```

### 5.3.3 Dekopling Identitas vs Domain (Reference Mapping)
Atribut `referenceId` bertindak sebagai jembatan decoupled antara **Identity Domain (User)** dan **Business Domain (Profil Siswa/Guru)**:

```text
User (Identity / Otorisasi Context)
  │
  ├── referenceId (T001) ──► Teacher Profile (Business Domain)
  │                            ├── id: "19870001"
  │                            ├── nip: "19870001..."
  │                            └── name: "Ahmad Fikri"
  │
  └── referenceId (S992) ──► Student Profile (Business Domain)
                               ├── id: "S992"
                               ├── nisn: "1234567890"
                               └── name: "Budi Santoso"
```

**Aturan Arsitektur Dekopling:**
- **User BUKAN Siswa/Guru:** Akun User mengelola akses masuk dan RBAC. Entitas `Teacher` dan `Student` murni mengelola data akademik sekolah.
- **Service-Level Resolution:** Pencarian profil domain berdasarkan akun login wajib diselesaikan pada Service Layer menggunakan jembatan `referenceId`.

### 5.3.4 Canonical Student Model
```typescript
export interface CanonicalStudent extends BaseEntity {
  nisn: string;                // Nomor Induk Siswa Nasional (10 digit numerik)
  nik?: string;                // Nomor Induk Kependudukan (16 digit numerik)
  name: string;
  gender: 'L' | 'P';           // Laki-laki / Perempuan
  birthPlace?: string;
  birthDate?: string;          // Format ISO YYYY-MM-DD
  classId: string;             // Link ke Class.id
  parentIds: string[];         // Array UID akun orang tua / wali
  status: 'active' | 'graduated' | 'moved' | 'inactive';
}
```

### 5.3.5 Canonical Teacher Model
```typescript
export interface CanonicalTeacher extends BaseEntity {
  nip: string;                 // Nomor Induk Pegawai (18 digit) atau NUPTK
  name: string;
  subjects: string[];          // Array ID mata pelajaran yang diampu
  roles: string[];             // Jabatan struktural (e.g., ['Wakamad Kurikulum', 'Pembina OSIS'])
  status: 'active' | 'inactive';
}
```

### 5.3.6 Canonical Academic Models (Class & Schedule)
```typescript
export interface CanonicalClass {
  id: string;                  // ID kelas unik
  tenantId: string;
  name: string;                // e.g., "7A", "8B", "12-IPA-1"
  level: string;               // e.g., "7", "8", "9", "10", "11", "12"
  academicYearId: string;      // Link ke AcademicYear.id (e.g., "2026-2027")
  homeroomTeacherId?: string;  // Link ke Teacher.id (Wali Kelas)
  studentIds: string[];        // Cache array ID siswa terdaftar
  createdAt: number;
  updatedAt: number;
}

export interface CanonicalSchedule {
  id: string;
  tenantId: string;
  classId: string;             // Link ke Class.id
  subjectId: string;           // Link ke Subject.id
  teacherId: string;           // Link ke Teacher.id
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  startTime: string;           // Format HH:MM (24h)
  endTime: string;             // Format HH:MM (24h)
  createdAt: number;
  updatedAt: number;
}
```

### 5.3.7 Canonical Attendance Model
```typescript
export interface CanonicalAttendance {
  id: string;                  // ID Determinis: ClassId + StudentId + Date (YYYY-MM-DD)
  tenantId: string;
  studentId: string;           // Link ke Student.id
  classId: string;             // Link ke Class.id
  scheduleId: string;          // Link ke Schedule.id
  date: string;                // Tanggal absensi (ISO YYYY-MM-DD)
  status: 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpa';
  source: 'qr' | 'manual' | 'import';
  recordedBy: string;          // UID Guru/Staf pencatat absensi
  location?: {                 // Koordinat GPS validasi presensi
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  deviceId?: string;           // Hash register device pengirim
  createdAt: number;
  updatedAt: number;
  version: number;
  deleted: boolean;
}
```

---

## 5.4 Model Relasi Entitas (ERM)

Hubungan logis antar entitas dikonfigurasi dalam struktur relasional terisolasi per Tenant untuk performa pembacaan maksimal saat offline dan keamanan di cloud.

### 5.4.1 High-Level Entity Relationship Diagram (ERD)

```text
                         TENANT
                           │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
      USERS              TEACHERS            STUDENTS
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
    PERMISSIONS          SUBJECTS             PARENTS (parentIds)
                            │
                            ▼
                          CLASSES (classId)
                            │
                            ▼
                        SCHEDULES
                            │
                            ▼
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
               ATTENDANCE      ASSESSMENTS
                    │               │
                    └───────┬───────┘
                            ▼
                        AUDIT LOG
```

### 5.4.2 Aturan Relasional & Kardinalitas Detail

#### 1. Tenant Root Isolation
Tenant adalah fondasi batas keamanan teratas.
* **Kardinalitas:** `Tenant (1) ──► (N) [Users, Students, Teachers, Classes, Attendance]`
* **Invarian Operasional:** Tidak ada transaksi lintas tenant. Atribut `tenantId` bertindak sebagai partisi data mutlak di semua level query.

#### 2. User (Identity) Relationship
Mengelola otentikasi login, session, dan RBAC.
* **Kardinalitas:** `User (1) ──► (1) [Teacher | Student | Parent | Staff Profile]` via `referenceId` bridge.
* **Aturan:** Relasi dipisahkan secara longgar (decoupled). Informasi operasional sekolah tidak disimpan di dokumen otentikasi user.

#### 3. Teacher & Subject Assignment
* **Kardinalitas:** `Teacher (1) ──► (N) [Schedules]` (Relasi mengajar).
* **Subject Mapping:** `Teacher (N) ──► (M) [Subjects]` dimapping secara denormalisasi menggunakan string array `subjects: string[]` pada dokumen guru untuk performa tinggi local cache.

#### 4. Student & Class Section
* **Kardinalitas:** `Student (N) ──► (1) [Class]`
* **Aturan:** Siswa hanya boleh aktif dalam 1 kelas pada satu periode akademik aktif (`Student.classId`). Riwayat kenaikan kelas dipisahkan ke tabel `riwayat_siswa`.

#### 5. Parent / Guardian Mapping
* **Kardinalitas:** `Parent (1) ──► (N) [Student]`
* **Aturan:** Mendukung multi-child household (satu orang tua memantau beberapa anak). Hubungan dikunci melalui array string `parentIds` di dokumen `Student` yang menyimpan UID akun orang tua.

#### 6. Academic Scheduling
* **Kardinalitas:** `Class (1) ──► (N) [Schedule] ──► (1) [Subject / Teacher]`
* **Aturan:** Jadwal mengikat kelas, mapel, guru pengampu, serta slot waktu harian.

#### 7. Attendance Collision-Free Relation
* **Kardinalitas:** `Student (1) ──► (N) [Attendance]`
* **Aturan:** ID unik absensi dirumuskan secara deterministik: `{classId}_{studentId}_{date}`. Hal ini mencegah kegagalan duplikasi entri saat puluhan perangkat melakukan sinkronisasi offline-online secara bersamaan.

---

## 5.5 Desain Skema Database & Arsitektur

e-MAM memisahkan penyimpanan operasional berkecepatan tinggi di sisi client (Dexie) dari penyimpanan data persisten global di cloud (Firestore).

### 5.5.1 Cloud Firestore Collection Architecture
Firestore terorganisasi dalam folder `/tenants/{tenantId}` secara terisolasi penuh. Struktur ini mengamankan isolasi tenant pada level physical document path:

```text
/tenants/
  └── {tenantId}/                                 [Document: Tenant Configuration]
        ├── metadata (Holds school details, calendar settings, academic years)
        │
        ├── users/                                [Subcollection: Users Profiles]
        │     └── {userId} (CanonicalUser Document)
        │
        ├── students/                             [Subcollection: Students Profiles]
        │     └── {studentId} (CanonicalStudent Document)
        │
        ├── teachers/                             [Subcollection: Teachers Profiles]
        │     └── {teacherId} (CanonicalTeacher Document)
        │
        ├── classes/                              [Subcollection: Classes Directory]
        │     └── {classId} (CanonicalClass Document)
        │
        ├── schedules/                            [Subcollection: Schedules Timetable]
        │     └── {scheduleId} (CanonicalSchedule Document)
        │
        ├── attendance/                           [Subcollection: Student Attendance]
        │     └── {attendanceId} (CanonicalAttendance Document)
        │
        └── audit_logs/                           [Subcollection: Immutable Security Trails]
              └── {logId} (CanonicalAuditLog Document)
```

---

### 5.5.2 Local Dexie (IndexedDB) Schema Definition
Dexie adalah operational database engine utama. Skema tabel dideklarasikan dengan indeks komposit untuk mengunci performa rendering <50ms dan pengamanan tenant:

```typescript
// Skema tabel Dexie dideklarasikan di /src/core/database/db.ts
const dexieSchema = {
  // MASTER DATA
  madrasah: 'id, npsn, tenantId, version, syncStatus',
  users: 'id, tenantId, version, syncStatus, [tenantId+role], uid, email, role',
  teachers: 'id, tenantId, version, syncStatus, [tenantId+status], nip, isClaimed',
  students: 'idUnik, tenantId, version, syncStatus, [tenantId+classId], [tenantId+status], studentsId, classId, status, nisn, nik',
  academic_years: 'id, tenantId, npsn, version, syncStatus, [tenantId+isActive], isActive',
  classes: 'id, tenantId, npsn, version, syncStatus, [tenantId+academicYearId], classId, name',
  subjects: 'id, tenantId, version, syncStatus, [tenantId+code], name',
  rooms: 'id, tenantId, version, syncStatus, [tenantId+code], name',

  // AKADEMIK & OPERASIONAL
  schedules: 'id, tenantId, version, syncStatus, [tenantId+classId], [tenantId+teacherId], classId',
  attendance: 'id, tenantId, version, syncStatus, [tenantId+scheduleId+date], [tenantId+studentId+date], [tenantId+classId+date], [tenantId+date], studentId, date, classId',
  teacher_attendance: 'id, tenantId, version, syncStatus, [tenantId+teacherId+date], [tenantId+date], [teachersId+date], teachersId, date',
  journals: 'id, tenantId, version, syncStatus, [tenantId+teacherId+date], [tenantId+classId+date], teacherId, date',
  letters: 'id, tenantId, version, syncStatus, [tenantId+status], [tenantId+userId], [tenantId+updatedAt], userId, status',

  // BK (Bimbingan Konseling)
  point_categories: 'id, tenantId, version, syncStatus, [tenantId+isActive], type, isActive',
  points: 'id, tenantId, version, syncStatus, [tenantId+studentId], [tenantId+date], studentsId, date, type',
  student_point_summaries: 'id, tenantId, version, syncStatus, [tenantId+studentId], studentId, totalPoints',

  // SISTEM & SYNC ENGINE
  notifications: 'id, tenantId, userId, read, createdAt, [tenantId+userId]',
  settings: 'key, tenantId, updatedAt',
  sync_queue: 'id, tenantId, collection, operation, status, priority, createdAt, [tenantId+status], [tenantId+priority], [tenantId+createdAt]',
  dead_letter_queue: 'id, tenantId, collection, status, createdAt, [tenantId+status], [tenantId+createdAt]',
  audit_logs: 'id, tenantId, userId, action, timestamp, [tenantId+timestamp], [tenantId+userId]',
  syncMetadata: 'id, collection, tenantsId, version, status',
  dashboard_summaries: 'id, tenantId, updatedAt, [tenantId+updatedAt]',
};
```

---

### 5.5.3 Indexing Strategy

e-MAM sangat bergantung pada compound/composite indexes untuk menjaga rendering UI secepat kilat dan efisiensi scan database.

#### 1. Compound Indices di Dexie (IndexedDB)
Membatasi hasil pencarian langsung pada mesin IndexedDB tanpa membuang siklus CPU client:
* **`[tenantId+classId]`**: Digunakan untuk menampilkan daftar siswa pada kelas aktif secara instan.
* **`[tenantId+studentId+date]`**: Digunakan untuk mengecek presensi harian siswa secara presisi dan mencegah duplikasi absensi.
* **`[tenantId+teacherId+date]`**: Mengunci validasi presensi guru harian.

#### 2. Composite Indices di Firestore
Firestore memerlukan composite indexes ketika query menggabungkan filter kesamaan (equality) dengan range filter atau sorting order.  
Semua konfigurasi composite dideklarasikan pada `firestore.indexes.json` (e.g. filter `tenantId == x` + `updatedAt > y` + `orderBy version desc`).

---

### 5.5.4 Standar Penulisan Query (Query Pattern Standards)

Mencegah terjadinya full-table scans di IndexedDB yang memperlambat kinerja aplikasi.

#### ❌ Salah (CPU-Intensive, mengambil seluruh data lalu memfilter di memory)
```typescript
// SANGAT BURUK: Membaca puluhan ribu siswa ke RAM lalu melakukan filter JavaScript
const allStudents = await db.students.toArray();
const activeStudents = allStudents.filter(s => s.tenantId === tenantId && s.classId === classId);
```

#### ✅ Benar (Index-Driven, diselesaikan di tingkat DB Engine, kecepatan O(log N))
```typescript
// SANGAT BAIK: Menggunakan compound index Dexie secara langsung
const activeStudents = await db.students
  .where('[tenantId+classId]')
  .equals([tenantId, classId])
  .toArray();
```

---

### 5.5.5 Repository Mapping Contract

Repository bertindak sebagai penerjemah (Data Mapper) antara struktur database IndexedDB yang dioptimalkan dengan Model Kanonikal domain bisnis:

```text
[ Service Layer (Menggunakan Canonical Models) ]
       │
       ▼  toCanonical() / fromCanonical()
[ Repository Layer (Menerapkan Mapping & Serialisasi) ]
       │
       ▼  db.students.put() / db.students.get()
[ Local Dexie IndexedDB (Menyimpan Payload Teroptimasi) ]
```

**Tanggung Jawab Mapping pada Repository:**
1. **Date Normalization:** Mengonversi input tanggal bervariasi menjadi string ISO `YYYY-MM-DD` atau Epoch MS sebelum disimpan.
2. **Metadata Injection:** Memastikan atribut pelacak (`updatedAt`, `updatedBy`, `version`, `syncStatus`) otomatis tertulis pada setiap mutasi data.
3. **Implicit Soft-Delete Filtering:** Otomatis menambahkan filter `.filter(s => !s.deleted)` pada setiap pembacaan data, mencegah UI menampilkan record yang sudah dihapus.

---

## 5.6 Batas Kepemilikan & Visibilitas Data

| Domain Data | Owner Identity (Domain) | Writer Role (Otorisasi) | Cakupan Hak Baca (ABAC) |
| :--- | :--- | :--- | :--- |
| **Profil User** | Identitas Sistem | Keptu, Admin | Pemilik Akun, Admin Madrasah |
| **Direktori Siswa**| Akademik Sekolah | Keptu, Admin | Guru, Guru BK, Orang Tua (hanya anak kandung) |
| **Jadwal & Kelas** | Kurikulum Sekolah | Keptu, Admin | Seluruh Warga Madrasah (Read-Only) |
| **Absensi Siswa** | Operasional Kelas | Guru Pengampu, Wali Kelas | Wali Kelas, Kamad, Orang Tua (hanya anak kandung) |
| **Poin Perilaku BK**| Disiplin & BK | Guru BK, Wali Kelas | Wali Kelas, Guru BK, Kamad, Orang Tua |
| **Surat Izin Resmi**| Pelayanan PTSP | Keptu, Staf TU | Pemohon, Wali Kelas, Keptu, Kamad |

---

## 5.7 Siklus Hidup Data (Data Lifecycle Flow)

Setiap rekaman transaksi data bergerak melalui tahapan siklus hidup yang ketat:

```text
[ DRAFT / PENDING ] ──► [ ACTIVE / VERIFIED ] ──► [ ARCHIVED ] ──► [ SOFT DELETED ]
        │                                                                │
        ▼ (Gagal Validasi)                                               ▼
   [ REJECTED ]                                                   [ SYNC ARCHIVED ]
```

- **Draft / Pending:** Record dibuat saat offline, disimpan di Dexie dengan status `syncStatus: 'pending'`.
- **Active / Verified:** Sync Engine memproses antrian outbox, berhasil mengunggah ke Firestore, status berubah menjadi `syncStatus: 'synced'`.
- **Archived:** Data akademik masa lalu (e.g. periode semester lalu) dikunci menjadi Read-Only secara sistem.
- **Soft Deleted:** Atribut diubah menjadi `deleted: true`. Record tetap tersimpan di database lokal dan cloud untuk audit kepatuhan, namun disembunyikan dari query operasional UI.

---

## 5.8 Kontrak Antrian Sinkronisasi (Sync Queue Contract)

Seluruh perubahan offline dikomunikasikan ke Sync Engine melalui skema payload antrian yang standar:

```typescript
export interface SyncQueueItem {
  id: string;                  // ID unik antrian (UUID)
  tenantId: string;            // Madrasah pengirim
  collection: string;          // Target koleksi Firestore (e.g., 'attendance')
  documentId: string;          // ID dokumen target yang dimutasi
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;// Selisih data (diff) atau dokumen penuh yang akan disinkronkan
  createdAt: number;           // Waktu antrian dibuat
  retryCount: number;          // Counter percobaan exponential backoff
  lastError?: string;          // Pesan kegagalan terakhir untuk pemantauan kualitas
  status: 'pending' | 'processing' | 'failed' | 'dead-letter';
}
```

---

## 5.9 Isolasi Data Multi-Tenant

1. **Invarian Filter Tenant:** Semua query database operasional pada repository WAJIB menyuntikkan `tenantId` dari `SecurityContext` secara implisit tanpa mengandalkan input UI manual.
2. **Invarian Indeks Komposit:** Index Dexie dan Firestore wajib diawali dengan atribut `tenantId` sebagai kluster terdepan query.
3. **Firestore Security Boundary:** Aturan Firestore Rules menolak keras seluruh request pembacaan/penulisan dokumen di bawah path `/tenants/{tenantId}` jika properti `tenantId` pada token JWT Custom Claims user tidak cocok dengan target path tenant yang diakses.

---

## 5.10 Aturan Tata Kelola Data (Data Governance)

1. **Deterministic ID Generation:** Penggunaan ID otomatis (`addDoc()`) diharamkan untuk menghindari split-brain dan duplikasi data jika jaringan terputus saat proses upload. PK wajib dirakit deterministik (misalnya `attendanceId = "${classId}_${studentId}_${date}"`).
2. **Hash Chain Audit Integrity:** Setiap perubahan data bernilai tinggi (misalnya poin pelanggaran atau nilai kelulusan) wajib mencatat log audit ke tabel `audit_logs` lokal dengan hash SHA-256 berantai (hash Log N berisi hash Log N-1) untuk menjamin data tidak dapat dimanipulasi secara ilegal saat offline.
3. **Pemisahan Modul Repositori:** Satu repository hanya melayani satu domain data. Operasi penggabungan relasi lintas modul wajib ditangani pada Service Layer.

---

## 5.11 Strategi Migrasi Skema Lokal

Kenaikan skema database lokal IndexedDB dilakukan secara inkremental tanpa menghapus data transaksional offline yang belum disinkronkan:

```typescript
// Pipeline migrasi database lokal dideklarasikan pada db.ts
db.version(25).stores({
  teacher_attendance: 'id, tenantId, version, syncStatus, [tenantId+teacherId+date], [tenantId+date], [teachersId+date]'
}).upgrade(async (tx) => {
  // Melakukan transformasi data secara aman dalam satu transaksi database lokal
  await tx.table('teacher_attendance').toCollection().modify(record => {
    if (!record.version) record.version = 1;
    if (!record.syncStatus) record.syncStatus = 'synced';
  });
});
```

---

## 5.12 Aturan Validasi Data (DVAR - Data Validation Rules)

Sebelum sebuah transaksi data masuk ke Repository Layer, Service Layer wajib memastikan keabsahan data sesuai dengan standar institusi nasional:

1. **Validasi Atribut Identitas Nasional:**
   - **NISN (Siswa):** Wajib berupa string angka dengan panjang tepat 10 digit.
   - **NIP (Guru):** Wajib berupa string angka dengan panjang tepat 18 digit (format aparatur sipil negara) atau template ID unik madrasah.
   - **NIK (Kependudukan):** Wajib berupa string angka dengan panjang tepat 16 digit.
2. **Standar Format Tanggal:** Seluruh atribut tanggal (e.g. `birthDate`, attendance `date`) wajib disimpan dalam string standar ISO `YYYY-MM-DD`.
3. **RFC 5322 Email Format:** Penulisan email pengguna wajib divalidasi dengan regex standar RFC 5322 sebelum disimpan.
4. **Soft-Delete Validation:** Ketika flag `deleted` diubah menjadi `true`, properti `deletedAt` wajib diisi dengan waktu saat itu (`Date.now()`). Pembacaan standar repository wajib menyaring keluar data dengan filter `deleted === false`.

---

### Status Akhir Blueprint

```text
05 DATA ARCHITECTURE

STATUS:
APPROVED - EAOM COMPLIANT

VERSION:
1.1.0

ALIGNMENT:
EAOM v2.0 & v1.1 Architecture Freeze
```
