# 07. OFFLINE-FIRST ARCHITECTURE

## e-MAM System Enterprise

**Version:** 1.1.0  
**Status:** APPROVED — EAOM COMPLIANT  
**Document Type:** Enterprise Offline-First Architecture Blueprint  
**Single Source of Truth (SSOT) Reference:** `docs/07_OFFLINE_FIRST_ARCHITECTURE.md`

---

# 7.0 Offline-First Overview

## 7.0.1 Purpose
Offline-First Architecture pada e-MAM System Enterprise dirancang untuk memastikan aplikasi tetap dapat beroperasi secara penuh (100% fungsional untuk operasi harian) tanpa bergantung pada ketersediaan koneksi internet. Madrasah sering kali menghadapi kendala ketidakstabilan jaringan; arsitektur ini memisahkan ketersediaan fungsionalitas UI dari status konektivitas eksternal.

---

## 7.0.2 Goals
1. **Zero Latency UI:** Operasi pembacaan dan penulisan data di UI direspon secara instan (<100ms) karena berinteraksi langsung dengan database lokal.
2. **100% Offline Capability:** Pencatatan absensi, penilaian, konseling BK, dan pengajuan surat izin dapat dilakukan sepenuhnya saat offline tanpa kehilangan data.
3. **Optimasi Biaya Firestore:** Meminimalkan kuota baca/tulis Firestore dengan menggunakan database lokal sebagai operational database utama dan menyinkronkan data hanya melalui mekanisme delta sync.
4. **Data Integrity & Consistency:** Menjamin data di tingkat lokal dan cloud mencapai status konsisten (eventual consistency) setelah koneksi pulih tanpa adanya kerusakan data (*data corruption*) atau duplikasi data.

---

## 7.0.3 Design Philosophy
Aplikasi dirancang dengan filosofi **Local-First, Cloud-Backup**. Perangkat lokal tidak dianggap sebagai sekadar "cache" dari data cloud, melainkan sebagai database operasional mandiri yang memiliki kedaulatan data penuh. Cloud Firestore bertindak sebagai pelindung, target sinkronisasi delta, serta jembatan kolaborasi antar perangkat.

---

## 7.0.4 Offline-First Principles
- **Local Database First:** UI hanya membaca dan menulis ke local database (Dexie IndexedDB). UI tidak pernah menunggu respon jaringan internet.
- **Never Wait for Network:** Semua operasi penulisan dianggap sukses secara lokal segera setelah transaksi database IndexedDB berhasil dikomit.
- **Queue Before Sync:** Perubahan lokal wajib ditulis ke Outbox Sync Queue sebelum Sync Engine memprosesnya ke cloud.
- **Immutable Events:** Setiap mutasi lokal direkam dalam antrian outbox sebagai event mutasi yang bersifat immutable (tidak dapat diubah setelah ditulis).
- **Eventual Consistency:** Sinkronisasi asinkron di latar belakang menjamin data lokal dan cloud pada akhirnya akan sama.
- **Security Never Bypassed:** Validasi otorisasi, hak akses RBAC, dan cakupan ABAC tetap ditegakkan secara ketat meskipun aplikasi berjalan dalam mode offline total.
- **Connectivity Independence:** Semua transaksi bisnis tidak boleh gagal hanya karena koneksi internet hilang. Proses transaksi bisnis mengalir lancar dari: `Internet OFF ──► UI ──► Service ──► Repository ──► Dexie ──► SUCCESS` secara mandiri.

---

# 7.1 Local-First Architecture

## 7.1.1 Runtime Architecture
Runtime arsitektur e-MAM membagi proses kerja menjadi dua eksekusi utama yang terisolasi: **Main Application Thread** untuk interaksi UI berkecepatan tinggi, dan **Sync Engine Daemon** yang berjalan asinkron di latar belakang untuk melakukan sinkronisasi data ke cloud.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        MAIN APPLICATION THREAD                         │
│                                                                        │
│   React UI ──► Zustand Store ──► Service Layer ──► Repository Layer    │
│                                                          │             │
└──────────────────────────────────────────────────────────┼─────────────┘
                                                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     LOCAL PERSISTENCE LAYER (Dexie)                    │
│                                                                        │
│         Operational Tables ─────────────► Outbox Sync Queue            │
│                                                  │                     │
└──────────────────────────────────────────────────┼─────────────────────┘
                                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       SYNC ENGINE DAEMON (Async)                       │
│                                                                        │
│                       Single-Flight Delta Sync                         │
│                                  │                                     │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CLOUD PERSISTENCE (Cloud)                       │
│                                                                        │
│                     Firestore Secure Gateway                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7.1.2 Data Flow
Aliran data mutasi lokal dirancang secara searah (*unidirectional*) tanpa adanya bypass layer:

1. **Penulisan Lokal:**
   ```text
   UI Component ──► Service (Validasi & Auth) ──► Repository ──► Dexie Commit ──► Outbox Queue Written
   ```
2. **Sinkronisasi Latar Belakang:**
   ```text
   Sync Engine ──► Read Outbox ──► Process Firestore API ──► Mark Outbox 'synced' ──► Clear Outbox
   ```

---

## 7.1.3 Local Source of Truth
Seluruh fungsionalitas aplikasi menganggap **Dexie IndexedDB** sebagai satu-satunya sumber kebenaran operasional aktif (*Local Source of Truth*). Data master (siswa, guru, kelas, jadwal) dan data transaksional (absensi, jurnal, nilai) dibaca langsung dari Dexie.

---

## 7.1.4 Cloud as Synchronization Target
**Cloud Firestore** berperan sebagai target sinkronisasi, sistem backup data otomatis, penjamin integritas multi-device, serta disaster recovery. Firestore tidak melayani pembacaan langsung dari UI, melainkan murni menerima unggahan mutasi delta dari local outbox queue dan menyuplai data delta terbaru yang belum dimiliki client.

---

## 7.1.5 Canonical Offline Source of Truth
Untuk menghindari ambiguitas data dalam arsitektur terdistribusi offline, e-MAM mendefinisikan pembagian Single Source of Truth (SSOT) secara eksplisit berdasarkan domain tanggung jawab berikut:

| Domain | Sumber Kebenaran Kanonikal (SSOT) | Keterangan |
| :--- | :--- | :--- |
| **Operational Source** | `Dexie IndexedDB` | Sumber data utama untuk rendering UI, reporting, dan validasi transaksi bisnis. |
| **Synchronization Target**| `Cloud Firestore` | Tempat penyimpanan backup, kolaborasi multi-perangkat, dan delta sync. |
| **Authentication Source** | `Firebase Authentication` | Penyedia identitas terotentikasi dan penerbit token kredensial terpusat. |
| **Authorization Source**  | `JWT Custom Claims` | Profil klaim otorisasi RBAC & ABAC yang di-cache di local `SecurityContext`. |

---

## 7.1.6 Offline Consistency Model
e-MAM mengadopsi model konsistensi hibrida guna menyeimbangkan performa interaksi pengguna lokal dan integritas data cloud:
1. **Immediate Consistency (Strong Consistency) di tingkat Local:** Setiap transaksi penulisan ke database lokal bersifat ACID, menjamin data langsung terbaca konsisten di tingkat lokal seketika setelah operasi dikomit.
2. **Eventual Consistency di tingkat Cloud:** Penyelarasan data cloud dijalankan secara asinkron di latar belakang, menjamin data lokal dan Firestore mencapai konsistensi penuh dalam hitungan detik setelah jaringan internet pulih.

---

## 7.1.7 Diagram Besar Offline Runtime
Berikut adalah aliran koordinasi lengkap antara thread presentasi pengguna, penyimpanan lokal, dan sinkronisasi data cloud latar belakang:

```text
                    USER
                     │
                     ▼
                React UI
                     │
                     ▼
              Zustand Store
                     │
                     ▼
             Application Service
                     │
                     ▼
            Authorization Service
                     │
                     ▼
               Repository Layer
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
 Operational Tables        Sync Queue
         │                       │
         ▼                       ▼
       Dexie                Sync Engine
         │                       │
         └───────────┬───────────┘
                     ▼
            Firestore Gateway
                     │
                     ▼
              Cloud Firestore
```

---

# 7.2 Local Storage Architecture

## 7.2.1 Dexie Database
Dexie.js digunakan sebagai wrapper IndexedDB karena menyediakan API transaksi yang aman, performa pencarian berbasis indeks komposit secepat kilat (O(log N)), serta kapabilitas migrasi skema database yang tangguh tanpa merusak data offline pengguna yang belum tersinkronisasi.

---

## 7.2.2 Table Organization
Skema database Dexie secara ketat diatur dan dikelompokkan berdasarkan karakteristik persistensi, operasional, dan fungsionalitas sistem:

```text
Dexie Database
├── Operational Tables (Data Master & Transaksional Akademik)
│   ├── students, teachers, classes, subjects, schedules, academic_years
│   └── attendance, journals, letters, points, grades
├── System Tables (Metadata Keamanan & Konfigurasi)
│   ├── settings, securityContext, audit_logs
│   └── system_recovery (Metadata pemulihan mandiri database)
└── Sync Tables (Antrean & Sinkronisasi Latar Belakang)
    └── sync_queue, dead_letter_queue, sync_metadata
```

Detail kategorisasi tabel:
1. **Operational Tables (Master & Transaksional):** Menyimpan data referensi akademik jangka panjang serta data aktivitas harian yang aktif dimutasi di madrasah.
2. **System Tables:** Menyimpan parameter pengaturan aplikasi, context kredensial keamanan lokal, log audit keamanan yang immutable, serta metadata `system_recovery` untuk pelacakan perbaikan mandiri.
3. **Sync Tables:** Mengelola antrean perubahan outbox, pencatatan kegagalan fatal di dead-letter queue, dan pencatatan state delta sync terakhir (`sync_metadata`).

---

## 7.2.3 Repository Boundary
Repository Layer bertindak sebagai satu-satunya objek yang memiliki kewenangan menulis dan membaca tabel Dexie. Repository membungkus query Dexie secara deterministik dan memastikan data yang dikembalikan selalu mematuhi Model Kanonikal (SSOT).

**❌ Pola Salah (Bypass Repository):**
```typescript
// DILARANG: Komponen UI memanggil Dexie langsung
const students = await db.students.where("classId").equals(classId).toArray();
```

**✅ Pola Benar (Repository Boundary):**
```typescript
// DIANJURKAN: Menggunakan abstraction repository
const students = await studentRepository.getStudentsByClass(classId);
```

---

## 7.2.4 Local Transactions (Transaction Boundary)
Setiap transaksi bisnis di tingkat lokal wajib dibatasi oleh batasan transaksi Dexie ACID (*Atomic, Consistent, Isolated, Durable*). Hal ini memastikan bahwa mutasi data operasional, penulisan log audit, dan pendaftaran item antrean outbox dikomit secara atomik tanpa risiko setengah tersimpan.

```text
[ Business Transaction ]
          │
          ▼
┌──────────────────────────────────────┐
│       Dexie RW Transaction (ACID)    │
│  ┌────────────────────────────────┐  │
│  │ 1. Operational Mutation        │  │
│  ├────────────────────────────────┤  │
│  │ 2. Audit Trail Log Insertion   │  │
│  ├────────────────────────────────┤  │
│  │ 3. Sync Outbox Queue Entry     │  │
│  └────────────────────────────────┘  │
│                  │                   │
│                  ▼                   │
│         [ COMMIT / ROLLBACK ]        │
└──────────────────────────────────────┘
```

Contoh implementasi transaksi terpadu:

```typescript
// Transaksi atomik pencatatan kehadiran yang mengikat jurnal kelas dan outbox queue
await db.transaction('rw', [db.attendance, db.journals, db.sync_queue, db.audit_logs], async () => {
  // 1. Tulis absensi siswa (Operational Table)
  await db.attendance.bulkPut(attendancePayloads);
  
  // 2. Tulis jurnal guru (Operational Table)
  await db.journals.put(journalPayload);

  // 3. Tulis Log Audit Keamanan (System Table)
  await db.audit_logs.put(auditLogPayload);
  
  // 4. Tulis event mutasi ke Sync Queue (Sync Table)
  await db.sync_queue.bulkPut(syncQueuePayloads);
});
```

---

## 7.2.5 Database Versioning & Migration
Pembaruan skema database lokal dikelola secara deklaratif menggunakan mekanisme versi Dexie tanpa menghapus data transaksional offline yang belum tersinkronisasi:

```typescript
db.version(26)
  .stores({
    attendance: 'id, tenantId, version, syncStatus, [tenantId+classId+date], studentId, date',
    sync_queue: 'id, tenantId, collection, status, createdAt, [tenantId+status]'
  })
  .upgrade(async (tx) => {
    // Jalankan transformasi data secara aman di dalam scope transaksi migrasi
    await tx.table('attendance').toCollection().modify(record => {
      if (!record.version) record.version = 1;
      if (!record.syncStatus) record.syncStatus = 'synced';
    });
  });
```

---

# 7.3 Offline Data Lifecycle

Setiap objek data transaksional lokal mengalami siklus hidup status sinkronisasi (*Synchronization Lifecycle Status*) yang dikontrol secara ketat:

```text
[ Record Created ] ──► syncStatus: 'pending' (Tersimpan di Dexie & Antrean Outbox)
        │
        ▼ (Sync Engine memproses transaksi)
[ Record Syncing ] ──► syncStatus: 'synced' (Berhasil terunggah ke Cloud Firestore)
        │
        ▼ (Ada edit offline baru)
[ Record Updated ] ──► syncStatus: 'pending' (Kembali masuk antrean Outbox)
```

---

## 7.3.1 Create (Offline Write)
Saat pengguna membuat data baru (misal: mencatat kehadiran siswa):
1. **Deterministic ID Generation:** ID dikalkulasikan secara deterministik di tingkat Service (misal: `${classId}_${studentId}_${date}`).
2. **Commit Local DB:** Data disimpan ke tabel `attendance` dengan status `syncStatus: 'pending'`.
3. **Queue Event:** Rekaman mutasi dimasukkan ke `sync_queue` secara atomic dalam transaksi yang sama.
4. **UI Notification:** UI langsung memperbarui tampilan dengan indikator visual "Menunggu Sinkronisasi".

---

## 7.3.2 Read (Offline Query)
Pencarian data oleh UI diarahkan murni ke tabel Dexie lokal. Query memanfaatkan indeks komposit untuk memastikan waktu respon instan:
- Membaca data siswa kelas aktif diselesaikan menggunakan indeks `[tenantId+classId]`.
- Membaca riwayat kehadiran disaring menggunakan filter asinkron tanpa menyentuh jaringan cloud.

---

## 7.3.3 Update (Offline Mutation)
Pengubahan data offline mengikuti koridor penulisan ulang:
1. Data lokal di Dexie diperbarui dengan perubahan baru, properti `updatedAt` diisi waktu saat itu, properti `version` dinaikkan secara inkremental (+1), dan `syncStatus` diubah kembali menjadi `'pending'`.
2. Event mutasi tipe `UPDATE` dimasukkan ke dalam `sync_queue`. Jika antrean mutasi untuk dokumen tersebut dengan status `'pending'` sudah ada, Sync Engine melakukan optimasi dengan menggabungkan (*coalescing*) payload mutasi terbaru untuk menghemat kuota transfer data.
3. **Conflict Flagging:** Jika proses update offline bertabrakan dengan versi cloud yang lebih baru saat sinkronisasi berjalan, item ditandai sebagai konflik (`syncStatus: 'conflict'`) dan didelegasikan secara penuh ke **08 Synchronization Architecture** untuk ditangani melalui resolver tak-bertabrakan (*conflict resolver*).

---

## 7.3.4 Soft Delete
e-MAM melarang keras penghapusan fisik (*hard delete*) pada data akademik guna menjaga konsistensi audit log.
1. Saat data dihapus, properti `deleted` diubah menjadi `true` dan `deletedAt` diisi epoch timestamp.
2. `syncStatus` diubah menjadi `'pending'` dan mutasi direkam ke outbox queue.
3. Query pembacaan standar pada repository wajib menyaring keluar data ini: `.filter(item => !item.deleted)`.

---

## 7.3.5 Restore (Data Disaster Recovery)
Jika perangkat lokal mengalami kerusakan atau database korup:
1. Local database dikosongkan secara terstruktur.
2. Sync Engine memicu prosedur **Full Sync Recovery Mode**.
3. Seluruh data master dan transaksional aktif diunduh ulang secara aman dari path `/tenants/{tenantId}` di Firestore untuk membangun kembali kedaulatan data lokal.

---

# 7.4 Outbox Architecture (Mekanisme Antrean Perubahan)

## 7.4.1 Outbox Pattern
Outbox Pattern menjamin keandalan pengiriman pesan mutasi (*Guaranteed Delivery*) meskipun koneksi internet terputus di tengah jalan. Mutasi data operasional sekolah dan penulisan antrean sync outbox dikomit dalam satu transaksi database lokal yang tidak dapat dipisahkan (*atomic transaction*).

---

## 7.4.2 Event Structure
Setiap rekaman antrean sinkronisasi wajib memenuhi kontrak skema `SyncQueueItem` berikut:

```typescript
export interface SyncQueueItem {
  id: string;                  // UUID unik sebagai PK antrean
  tenantId: string;            // Madrasah pengirim
  collection: string;          // Target koleksi Firestore (e.g., 'attendance')
  documentId: string;          // ID dokumen yang diubah secara deterministik
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;// Selisih perubahan (delta payload) atau dokumen penuh
  createdAt: number;           // Epoch Milliseconds UTC
  retryCount: number;          // Percobaan exponential backoff
  lastError?: string;          // Pesan error kegagalan terakhir
  status: 'pending' | 'processing' | 'failed' | 'dead-letter';
}
```

---

## 7.4.3 Queue Lifecycle
Sync Engine memproses antrean outbox dengan alur kerja prosedural berikut:
1. **Fetch:** Mengambil item dengan kriteria `status === 'pending'` diurutkan secara FIFO berdasarkan `createdAt`.
2. **Lock:** Mengubah status item menjadi `'processing'` untuk mencegah pemrosesan ganda (*single-flight execution*).
3. **Execute:** Mengirimkan payload mutasi ke Firestore melalui secure gateway.
4. **Complete:** Setelah sukses, item dihapus secara fisik dari tabel `sync_queue` lokal, dan properti `syncStatus` pada tabel operasional diubah dari `'pending'` menjadi `'synced'`.

---

## 7.4.4 Retry Strategy (Exponential Backoff)
Jika Sync Engine mendeteksi kegagalan jaringan saat mengirimkan data outbox:
1. Status item diubah kembali menjadi `'failed'`.
2. Penjadwalan ulang pengiriman dihitung menggunakan rumus **Exponential Backoff dengan Jitter**:
   $$\text{Delay} = \min(2^{\text{retryCount}} \times 1000 + \text{RandomJitter}, \; 300000 \text{ ms})$$
3. Jika `retryCount` melampaui batas maksimal (misal: 10 kali percobaan gagal berturut-turut), item dipindahkan ke tabel `dead_letter_queue` untuk penanganan manual oleh sistem pengembang, mencegah antrean utama tersumbat (*head-of-line blocking*).

---

## 7.4.5 Idempotency Key
ID unik dari outbox item (`id`) bertindak sebagai **Idempotency Key** di Firestore Cloud. Jika Sync Engine mengirim ulang payload yang sama dikarenakan kegagalan koneksi di ujung respon terima, Firestore Security Rules dan Cloud Functions mendeteksi kecocokan ID transaksi dan mengabaikan penulisan duplikat tanpa merusak data atau melipatgandakan kuota transaksi.

---

## 7.4.6 Sync Trigger Matrix
Siklus pemrosesan sinkronisasi asinkron diaktifkan secara dinamis berdasarkan matriks pemicu (*trigger matrix*) berikut:

| Pemicu (Trigger) | Tindakan Sync Engine (Action) | Deskripsi Fungsional |
| :--- | :--- | :--- |
| **App Start** | *Queue Scan & Resume* | Memindai antrean lokal dan memproses sisa transaksi outbox yang tertunda. |
| **Online Event** | *Process Pending Queue* | Mendeteksi kembalinya internet dan langsung memicu pembersihan antrean outbox. |
| **Timer (Periodic)** | *Incremental Delta Sync* | Sinkronisasi berkala (misal: setiap 5 menit) untuk memeriksa pembaruan master data dari cloud. |
| **Manual Sync** | *Force Queue Processing* | Memicu pengiriman antrean paksa saat pengguna menekan tombol "Sinkronkan Sekarang" di UI. |
| **Login Success** | *Pull Latest Delta* | Mengunduh versi metadata dan data master delta terbaru untuk sinkronisasi pertama kali. |
| **Logout Init** | *Flush Runtime State* | Membersihkan RAM transient, menghentikan seluruh listener aktif (*unsubscribes*), dan mengunci DB. |

---

# 7.5 Offline State Management

State Management aplikasi membagi tugas penyimpanan berdasarkan volatilitas dan durasi persistensi:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        STATE VOLATILITY BOUNDARY                       │
│                                                                        │
│  Zustand Store (Transient Memory RAM)                                  │
│   ├── Kredensial aktif (CanonicalUser)                                 │
│   ├── Status jaringan (isOnline: true/false)                           │
│   └── ID kelas terpilih aktif (activeClassId)                          │
│                                                                        │
│  Dexie Local DB (Durable Persistence Disk)                             │
│   ├── Seluruh record operasional (Siswa, Absensi, Nilai)               │
│   ├── Antrean Outbox (sync_queue)                                      │
│   └── Audit trail keamanan (audit_logs)                                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7.5.1 Application State (Zustand RAM)
Zustand digunakan hanya untuk menyimpan state transien yang membutuhkan akses super cepat oleh UI namun tidak perlu dipertahankan selamanya jika tab browser ditutup (seperti status sidebar terbuka, history rute halaman, dan error banner).

---

## 7.5.2 Persistence State (Dexie Storage)
Data bisnis, konfigurasi madrasah, dan session terenkripsi disimpan secara permanen di Dexie. Zustand tidak boleh menyalin record Dexie ke dalam RAM, melainkan murni memicu re-fetch dari Dexie jika contextual ID di Zustand berubah.

---

## 7.5.3 Sync State
Zustand melacak indikator global status sinkronisasi aktif:
- `isSyncing`: Apakah Sync Engine sedang aktif mengunggah outbox.
- `pendingPayloadCount`: Jumlah antrean outbox yang belum dikirim.
- `lastSyncedAt`: Epoch MS waktu sinkronisasi sukses terakhir.

---

## 7.5.4 Connectivity State (Jaringan Listener)
Aplikasi memasang event listener global terhadap status koneksi sistem operasi:
```typescript
// Memantau kestabilan koneksi internet perangkat secara realtime
window.addEventListener('online', () => {
  sessionStore.setState({ isOnline: true });
  syncEngine.triggerProcessing();
});

window.addEventListener('offline', () => {
  sessionStore.setState({ isOnline: false });
});
```

---

# 7.6 Offline Security

Pengamanan data dan hak akses tetap diberlakukan secara ketat ketika perangkat tidak terhubung ke jaringan internet (*offline mode*).

---

## 7.6.1 SecurityContext Cache
Setiap kali login online berhasil, payload otorisasi yang sah (`SecurityContext` berisi JWT claims, role, dan scope ABAC) didekripsi dan disimpan secara terenkripsi ke dalam tabel `securityContext` lokal di Dexie.

---

## 7.6.2 Offline Authorization (Local Policy Enforcement)
Saat offline, `AuthorizationService` memulihkan context dari database lokal. Seluruh operasi penulisan offline diverifikasi menggunakan context cache lokal ini. Pengguna dilarang memanipulasi role lokal untuk menaikkan hak akses (*privilege escalation*) karena tanda tangan enkripsi context akan diverifikasi ulang oleh Sync Engine sebelum dikirim ke cloud.

---

## 7.6.3 Tenant Isolation
Isolasi tenant tetap dikunci secara mutlak saat offline. Repository secara otomatis menyuntikkan filter `tenantId` yang diambil secara internal dari offline `SecurityContext` cache pada setiap query Dexie, mencegah terjadinya kebocoran visual data madrasah lain pada perangkat yang digunakan bersama.

---

## 7.6.4 Local Encryption Policy
Data tergolong **Level 4 Restricted PII** (seperti NIK, password cache, dan token akses) wajib dienkripsi di tingkat database lokal menggunakan algoritma asimetris (misalnya AES-GCM dengan kunci yang diturunkan dari kredensial user melalui Web Crypto API) untuk mencegah kebocoran data jika perangkat fisik dicuri.

---

## 7.6.5 Sensitive Data Handling
Sistem melarang keras pencatatan log diagnostik (*console.log*) pada parameter data yang memuat atribut sensitif Level 3 dan Level 4 saat memproses mutasi offline.

---

# 7.7 Bootstrap & Recovery Procedures

Mekanisme memulai aplikasi secara aman guna meminimalkan risiko inkonsistensi data lokal akibat kegagalan listrik perangkat atau kerusakan database browser.

---

## 7.7.1 Startup Flow
1. **Database Open:** Membuka koneksi Dexie DB lokal. Jika gagal akibat kegagalan browser, picu perbaikan otomatis.
2. **Verify Integrity Checksum:** Memverifikasi integritas tabel keamanan lokal dan kecocokan skema database.
3. **Restore Context:** Membaca dan mendekripsi `SecurityContext` teraktif dari penyimpanan lokal.
4. **Boot Daemon:** Menyalakan daemon pengawas Sync Engine.
5. **Mount Router:** Mengaktifkan sistem navigasi UI setelah bootstrap dinyatakan sukses (`initialized: true`).

---

## 7.7.2 Session Restore
Jika pengguna membuka kembali aplikasi dalam keadaan offline, `SessionManager` mendeteksi token local cache. Jika token lokal masih dalam batas masa kedaluwarsa offline yang diizinkan (misal: 14 hari tanpa online), aplikasi mengaktifkan kembali session kerja pengguna secara sah tanpa harus memaksa masuk ulang.

---

## 7.7.3 Database Recovery (Self-Repair Engine)
Jika Dexie IndexedDB mengalami kerusakan fisik (*corruption*) akibat memori penyimpanan perangkat penuh atau gangguan browser, sistem mengaktifkan penanganan darurat `SelfRepairEngine` secara otomatis tanpa bergantung pada SessionStorage yang rentan hilang jika tab ditutup:
1. **State Preservation:** `SelfRepairEngine` menyalin antrean outbox `sync_queue` yang belum dikirim ke tabel internal terisolasi `system_recovery` atau mendaftarkan transaksinya ke penyimpanan aman tingkat browser yang persisten.
2. **Re-Initialization:** Menutup koneksi database aktif, menghapus database Dexie lokal yang terkorupsi secara aman, dan menginisialisasi skema database lokal baru yang bersih.
3. **Queue Restoration:** Mengimpor data antrean outbox yang diselamatkan dari tabel `system_recovery` kembali ke `sync_queue` baru untuk meminimalkan risiko kehilangan data mutasi offline pengguna.
4. **Resilience Playback:** Memicu Sync Engine untuk memproses kembali antrean yang dipulihkan sesegera mungkin saat koneksi internet aktif kembali.

---

## 7.7.4 Queue Recovery
Saat aplikasi dihidupkan kembali, Sync Engine memicu pemindaian otomatis terhadap sisa transaksi outbox yang tertinggal dengan status `'processing'` akibat crash sistem sebelumnya, mengembalikan statusnya kembali menjadi `'pending'` agar dapat diproses ulang secara aman.

---

## 7.7.5 Corruption Handling Rules
Jika database lokal terdeteksi rusak dan tidak dapat dipulihkan secara otomatis melalui `SelfRepairEngine`, aplikasi menampilkan layar darurat khusus (*Recovery Screen*) yang memberikan instruksi kepada operator untuk melakukan ekspor database lokal dalam bentuk berkas terenkripsi `.mam-backup` sebelum melakukan inisialisasi ulang database secara total.

---

## 7.7.6 Offline Failure & Recovery Matrix
Guna menjaga kedaulatan data dan kestabilan sistem dalam berbagai kondisi ekstrem, e-MAM mendesain matriks penanganan kegagalan (*failure recovery matrix*) terstruktur sebagai berikut:

| Skenario Kegagalan (Failure Scenario) | Akar Masalah (Root Cause) | Prosedur Pemulihan (Recovery Strategy) |
| :--- | :--- | :--- |
| **Browser Crash / Tab Closed** | Pengguna menutup aplikasi saat transaksi berjalan. | **Queue Recovery:** Sisa transaksi outbox dengan status `'processing'` dikembalikan ke `'pending'` pada startup berikutnya. |
| **Device Restart / Power Loss** | Perangkat fisik mati mendadak saat menulis ke disk. | **Replay Uncommitted Transactions:** Transaksi Dexie bersifat ACID akan melakukan rollback otomatis; data yang setengah tertulis tidak akan dikomit ke disk lokal. |
| **Network Timeout** | Koneksi internet tidak stabil atau sangat lambat. | **Exponential Backoff:** Sync Engine melakukan penundaan rilis ulang dengan delay waktu yang berkembang eksponensial + Jitter acak. |
| **Conflict Detected** | Data lokal bertabrakan dengan versi cloud terbaru. | **Conflict Flagging:** Versi lokal ditandai dengan status `syncStatus: 'conflict'` dan didelegasikan secara penuh ke modul resolusi konflik pada **08 Synchronization Architecture**. |
| **Local Database Corruption** | Kegagalan penyimpanan fisik atau memori penuh. | **SelfRepairEngine:** Database di-wipe secara aman, skema dibangun kembali, outbox dipulihkan via tabel `system_recovery`, dan master data di-re-fetch dari cloud. |

---

# 7.8 Offline User Experience (UX Design)

Aplikasi wajib mengomunikasikan status konektivitas dan sinkronisasi data secara jujur, elegan, dan non-intrusif kepada pengguna menggunakan indikator visual bertema **Enterprise Slate** yang bersih dan tenang.

---

## 7.8.1 Connectivity Indicator
Menampilkan status koneksi internet di margin atau header aplikasi secara halus:
- **Online (Connected):** Titik indikator kecil berwarna hijau tenang di pojok kanan atas dengan teks desaturasi "Sistem Terhubung".
- **Offline (Disconnected):** Titik indikator kecil berwarna jingga hangat dengan teks "Mode Offline - Data disimpan lokal". Tidak boleh menampilkan popup modal besar yang menghalangi produktivitas kerja pengguna.

---

## 7.8.2 Pending Changes Indicator
Setiap baris data pada tabel laporan (misal: daftar absensi siswa) yang baru dicatat secara offline wajib menampilkan ikon jam pasir kecil desaturasi di sampingnya, mengindikasikan status "Menunggu Sinkronisasi". Indikator berubah menjadi centang hijau tenang setelah data berhasil tersinkronisasi ke cloud.

---

## 7.8.3 Sync Status Counter
Menampilkan jumlah sisa antrean perubahan yang belum terunggah ke cloud secara dinamis pada panel status bawah sidebar (misalnya: "● 12 Perubahan lokal disimpan").

---

## 7.8.4 Conflict Notification
Jika terjadi konflik data saat sinkronisasi yang membutuhkan keputusan manual, sistem menampilkan panel resolusi konflik fungsional yang intuitif pada menu notifikasi, memberikan pilihan resolusi kepada operator sekolah tanpa menghentikan jalannya operasional aplikasi utama.

---

## 7.8.5 Read-only Mode Visual
Untuk modul-modul sistem tertentu yang tidak mendukung mutasi offline total (seperti perubahan hak akses RBAC global atau modifikasi setelan tenant utama), UI secara proaktif mengunci seluruh input formulir dan menampilkan banner informatif: "Setoran ini dikunci dalam Mode Baca-Saja saat Offline".

---

# 7.9 Offline Constraints & Limits

---

## 7.9.1 Supported Operations (100% Offline)
- Pencatatan absensi harian dan presensi mengajar guru.
- Penginputan nilai evaluasi akademik dan ujian siswa.
- Pencatatan poin pelanggaran perilaku siswa oleh Guru BK.
- Pengajuan dan pencetakan draf surat izin resmi sekolah.
- Pembacaan seluruh direktori profil akademik madrasah.

---

## 7.9.2 Unsupported Operations (Requires Online Connection)
- Pendaftaran akun pengguna baru dan verifikasi email otentikasi.
- Reset password akun dan perubahan data krusial profil keamanan.
- Unggah berkas dokumen surat dengan ukuran besar (>5MB) ke Storage.
- Pemrosesan iuran keuangan real-time yang terintegrasi dengan Payment Gateway eksternal.

---

## 7.9.3 Performance Targets
Untuk menjamin kenyamanan maksimal, aplikasi offline wajib memenuhi anggaran performa (*Performance Budgets*) berikut:
- **Local Read Latency:** Query pembacaan list data lokal wajib selesai di bawah **50 ms**.
- **Local Write Latency:** Transaksi penulisan lokal (Dexie Commit + Outbox Insert) wajib selesai di bawah **100 ms**.
- **Bootstrap Time:** Proses inisialisasi awal aplikasi dari keadaan mati hingga siap digunakan wajib selesai di bawah **2 detik** saat offline.

---

## 7.9.4 Storage Limits
Aplikasi membatasi pemakaian memori IndexedDB lokal untuk mencegah peringatan penyimpanan browser penuh:
- Maksimal penyimpanan master data lokal dibatasi sebesar **100 MB** per tenant.
- Berkas gambar avatar profil dan dokumen surat dikompresi di tingkat client menggunakan Canvas API sebelum ditulis ke local database untuk meminimalkan beban penyimpanan fisik disk perangkat.

---

## 7.9.5 Offline Capability Matrix
Guna memberikan kejelasan operasional yang instan bagi tim developer, QA, dan auditor sistem, matriks kapabilitas offline berikut merinci secara eksplisit batasan operasi baca, tulis, ubah, dan hapus untuk setiap modul utama dalam e-MAM System saat jaringan internet terputus sepenuhnya:

| Modul Utama | Read Offline | Create Offline | Update Offline | Delete Offline | Keterangan Sinkronisasi |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Siswa & Guru** | ✅ | ❌ | ❌ | ❌ | Data master akademik di-cache penuh via Delta Sync untuk validasi operasional. |
| **Absensi & Jurnal** | ✅ | ✅ | ✅ | Soft Delete | Operasional inti harian berjalan 100% offline dan dikomit via Outbox Queue. |
| **Bimbingan Konseling (Point)** | ✅ | ✅ | ✅ | Soft Delete | Pencatatan pelanggaran & prestasi perilaku siswa disimpan lokal dan disinkronkan. |
| **Sistem Surat (Letters)** | ✅ | *Draft Only* | *Draft Only* | *Draft Only* | Pembuatan draf surat dapat dilakukan offline, pengajuan resmi butuh sinkronisasi. |
| **Penilaian Akademik (Grades)** | ✅ | ✅ | ✅ | Soft Delete | Guru dapat memasukkan dan memperbarui nilai ujian/tugas langsung di ruang kelas. |
| **Manajemen Pengguna (User Mgmt)**| *Read Only* | ❌ | ❌ | ❌ | Penambahan admin/operator atau pengubahan struktur organisasi wajib online. |
| **Keamanan & RBAC** | ✅ | ❌ | ❌ | ❌ | Validasi hak akses fungsional menggunakan cache JWT & SecurityContext lokal. |

---

# 7.10 Summary of Offline-First Architecture Principles

```text
       ┌─────────────────────────────────────────────────────────┐
       │             OFFLINE ARCHITECTURE PRINCIPLES             │
       ├─────────────────────────────────────────────────────────┤
       │ 1. Local Database First (UI interacts only with Dexie)  │
       │ 2. Never Wait for Network (Success is local first)      │
       │ 3. Queue Before Sync (Mutations write to Outbox Queue)  │
       │ 4. Immutable Events (Every outbox event is unchangeable)│
       │ 5. Eventual Consistency (Sync runs async in background) │
       │ 6. Security Never Bypassed (Auth active offline)        │
       └─────────────────────────────────────────────────────────┘
```

---

# 7.11 Definition of Done (Offline-First Architecture)

Penerapan Offline-First Architecture dinyatakan selesai (Done) dan sah jika memenuhi standar checklist kualitas berikut:

| No | Komponen Kelayakan Offline-First | Kriteria Audit Penilaian | Status |
| :-: | :--- | :--- | :-: |
| 1 | **100% Offline Mutasi** | Aplikasi mampu melakukan Create, Read, Update, dan Soft-Delete data presensi siswa tanpa koneksi internet secara penuh. | ✅ |
| 2 | **No Network Blocking UI** | Tidak ada pemblokiran visual (seperti loading spinner yang berputar selamanya) saat operasi penulisan lokal dikomit. | ✅ |
| 3 | **Atomic Outbox Commits** | Penyimpanan data operasional dan penyisipan data antrean outbox dikunci di dalam satu scope transaksi Dexie RW yang sama. | ✅ |
| 4 | **Exponential Backoff Jitter** | Sync Engine menerapkan sistem jeda toleransi kegagalan jaringan yang berkembang eksponensial di tingkat lokal. | ✅ |
| 5 | **Local Security Enforced** | Seluruh evaluasi otorisasi fungsional dan isolasi tenant tetap berjalan ketat saat offline menggunakan local SecurityContext cache. | ✅ |
| 6 | **Self-Repair Database Recovery** | Sistem memiliki mesin perbaikan mandiri untuk memitigasi risiko korupsi database IndexedDB lokal secara atomic. | ✅ |
| 7 | **Idempotent Cloud Submissions** | Submit ulang outbox akibat kegagalan jaringan dikunci menggunakan Idempotency Key unik guna menghindari duplikasi di Firestore. | ✅ |

---

### Status Akhir Blueprint

```text
07 OFFLINE-FIRST ARCHITECTURE

STATUS:
APPROVED — FREEZE COMPLIANT

VERSION:
1.1.0

ALIGNMENT:
✅ EAOM v2.0 Enterprise Offline-First standard
✅ Architecture Freeze v1.1
✅ Data Architecture Blueprint v1.1.0
✅ Security Architecture Blueprint v1.1.1
✅ Outbox Pattern & Local Storage Design
```
