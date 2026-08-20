# 08 Synchronization Architecture

Enterprise Synchronization Protocol  
**e-MAM System (Integrated Madrasah Academic Manager)**

---

## 8.0 Synchronization Overview
Dalam arsitektur *offline-first* e-MAM System, **Sync Engine** bertindak sebagai satu-satunya gerbang komunikasi (*exclusive gateway*) yang menghubungkan antara database operasional lokal (**Dexie IndexedDB**) dengan penyimpanan awan (**Cloud Firestore**) sebagai *Source of Truth* terpusat.

Mekanisme sinkronisasi didesain untuk beroperasi di latar belakang (*background service*) secara asinkron, mandiri, dan tahan terhadap gangguan konektivitas. Pengguna akhir dapat terus melakukan transaksi bisnis harian di madrasah tanpa menyadari fluktuasi jaringan, sementara Sync Engine menjamin bahwa data lokal dan awan pada akhirnya akan mencapai konsistensi penuh (*eventual consistency*).

---

## 8.1 Synchronization Principles
Seluruh operasi sinkronisasi di dalam e-MAM System wajib mematuhi lima prinsip rekayasa utama berikut:

1. **Firestore Access Lock (Single Point of Ingress):** Hanya komponen di bawah naungan Sync Engine (terletak pada `src/services/sync/` atau `src/sync/`) yang memiliki otoritas untuk memanggil Firebase/Firestore SDK. Modul UI, Component, Hook, Service fungsional, dan Repository lainnya **DILARANG KERAS** mengimpor Firebase SDK atau melakukan query langsung ke awan.
2. **Idempotency Guarantee:** Seluruh mutasi data harus bersifat idempoten. Eksekusi ulang terhadap payload sinkronisasi yang sama akibat hilangnya koneksi di tengah jalan tidak boleh menghasilkan duplikasi data atau korupsi relasi di sisi server.
3. **Deterministic Entity IDs:** Semua entitas database wajib menggunakan ID deterministik berbasis UUIDv4 yang dihasilkan langsung di sisi klien sebelum data disimpan ke Dexie. Sistem melarang penggunaan generator ID otomatis Firestore (`addDoc`) guna mencegah inkonsistensi referensial antar entitas selama mode offline.
4. **Tenant Isolation Enforced:** Setiap payload sinkronisasi wajib menyertakan properti `tenantId` (ID Madrasah). Sync Engine menyaring dan mempartisi seluruh transaksi berdasarkan tenant aktif guna memastikan isolasi data multi-tenant yang mutlak.
5. **Firestore Cost Efficiency (Low-Overhead):** Seluruh proses transfer data memprioritaskan pemrosesan delta (*Delta Sync*) dan agregasi ringkasan (*Summary Collections*) guna meminimalkan biaya operasional Firestore (kuota *Document Read*, *Document Write*, dan *Active Listeners*).

---

## 8.2 Delta Synchronization Model
Untuk menghindari pemborosan kuota transfer data akibat pengunduhan ulang seluruh koleksi (*full collection scan*), e-MAM mengadopsi model **Delta Synchronization**.

### 8.2.1 Delta Sync Mechanism
Setiap kali melakukan sinkronisasi data masuk (*pull sync*), Sync Engine tidak mengunduh seluruh dokumen, melainkan hanya meminta data yang mengalami perubahan sejak timestamp sinkronisasi terakhir:

```text
               CLIENT (Dexie)                            CLOUD (Firestore)
                      │                                          │
                      │─── 1. Request Delta (lastSync, entity) ─►│
                      │                                          │─── 2. Query Firestore ───┐
                      │                                          │    updatedAt > lastSync  │
                      │                                          │◄─────────────────────────┘
                      │◄── 3. Return Delta Documents ────────────│
                      │
            [ Apply Delta to Dexie ]
            [ Update Local lastSync ]
```

### 8.2.2 Clock Skew Safety Buffer
Guna mengantisipasi ketidakcocokan waktu (*clock skew*) antara jam lokal perangkat klien dengan jam server Cloud Firestore, Sync Engine menerapkan aturan **Safety Buffer** sebesar 10 detik (-10,000 milidetik):

$$\text{Query Timestamp} = \text{Timestamp lastSync} - 10,000 \text{ ms}$$

Dengan formula ini, setiap pencarian delta akan selalu bertumpang tindih sedikit dengan rentang waktu sinkronisasi sebelumnya. Idempotensi penulisan di tingkat Dexie (`bulkPut`) menjamin bahwa data yang tumpang tindih ini akan ditimpa dengan aman tanpa merusak integritas state lokal.

---

## 8.3 Sync Engine Architecture
Secara arsitektural, Sync Engine dibagi menjadi komponen-komponen modular berorientasi objek yang berjalan di dalam thread utama namun dijalankan secara asinkron atau menggunakan Web Workers jika diperlukan.

### 8.3.1 Component Topology

```text
                       ┌───────────────────────┐
                       │       React UI        │
                       └───────────┬───────────┘
                                   │ (Reactive Status Binding)
                                   ▼
                       ┌───────────────────────┐
                       │     Sync Monitor      │
                       └───────────▲───────────┘
                                   │ (Events)
                                   ▼
                       ┌───────────────────────┐
                       │     Sync Engine       │
                       └─────┬───────────▲─────┘
        ┌────────────────────┘           └────────────────────┐
        ▼ (Push Thread)                                       ▼ (Pull Thread)
┌───────────────┐                                     ┌───────────────┐
│  Sync Queue   │                                     │ Cache Service │
│   (Outbox)    │                                     └───────┬───────┘
└───────┬───────┘                                             │
        ▼                                                     ▼
┌───────────────┐                                     ┌───────────────┐
│   Conflict    │                                     │  Master Sync  │
│   Resolver    │                                     │    Service    │
└───────┬───────┘                                     └───────┬───────┘
        ▼                                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Firestore Gateway                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.3.2 Modular File Map
Implementasi modular diletakkan di bawah direktori `src/sync/`:
- `syncQueue.ts`: Mengelola antrean penulisan keluar (*outbox queue*) di tabel Dexie `sync_queue` dengan status terstandarisasi.
- `conflictResolver.ts`: Menangani resolusi tabrakan data lokal vs cloud dengan strategi mutakhir serta melog hasilnya ke audit log.
- `syncEngine.ts`: Koordinator utama yang memicu aliran *Push* (mengosongkan outbox) dan *Pull* (sinkronisasi delta masuk).
- `syncWorker.ts`: Pengatur jadwal background (*scheduler*) yang bereaksi terhadap perubahan status jaringan (`navigator.onLine`).
- `syncMonitor.ts`: Menyediakan state reaktif untuk konsumsi UI (misalnya memajang indikator sinkronisasi di Developer Console).

---

## 8.4 Pull Strategy (Inbound Sync)
*Pull Strategy* bertanggung jawab menjaga agar data master dan data transaksional perangkat lokal tetap selaras dengan perubahan yang dilakukan oleh pengguna lain di perangkat berbeda.

### 8.4.1 Master Data Synchronization
Data master akademik (seperti daftar siswa, guru, kelas, mata pelajaran, dan jadwal) jarang berubah namun kritis untuk validasi operasional. Alur sinkronisasi data master:
1. **Metadata Version Check:** Saat aplikasi melakukan inisialisasi (*bootstrap*), Sync Engine membandingkan versi metadata lokal yang tercatat di `systemSettings` (`last_synced_master_version`) dengan metadata versi global di Firestore.
2. **Delta Query Trigger:** Jika versi metadata berbeda, Sync Engine memicu tugas Delta Sync paralel untuk seluruh tabel master terkait.
3. **Write & Upgrade:** Dokumen delta ditulis ke Dexie, dan versi metadata lokal ditingkatkan ke nilai terbaru.

### 8.4.2 Transactional Data Synchronization
Untuk data transaksional (seperti absensi, jurnal mengajar, dan poin konseling):
1. Pengunduhan delta terjadi secara periodik (misalnya setiap 5 menit) atau saat mendeteksi pergantian context (seperti pengguna membuka halaman modul bersangkutan).
2. Query delta dibatasi ketat oleh parameter `tenantId` dan rentang tanggal akademik aktif guna meminimalkan konsumsi memori lokal.

---

## 8.5 Push Strategy (Outbox / Outbound Sync)
*Push Strategy* menggunakan **Outbox Pattern** untuk menjamin bahwa seluruh mutasi data yang dilakukan oleh pengguna saat offline akan dikirimkan ke cloud secara andal dan berurutan ketika koneksi internet tersedia.

### 8.5.1 The Outbox Cycle

```text
[ Mutation Event ] ──► [ Write to Dexie ] ──► [ Add to sync_queue (PENDING) ]
                                                        │
   ┌────────────────────────────────────────────────────┘
   ▼
[ Sync Engine Processing ]
   │
   ├─► 1. Set Queue status to 'PROCESSING'
   ├─► 2. Coalesce pending updates for same Document
   ├─► 3. Validate DTO with Zod schema
   ├─► 4. Send payload to Firestore Gateway
   │
   ├─── SUCCESS ───► [ Update status to 'SUCCESS' ] ──► [ Clear from Queue ]
   │
   └─── FAILURE ───► [ Update status to 'FAILED' ] ──► [ Exponential Backoff ]
```

### 8.5.2 Event Coalescing (Aggregation)
Untuk menghemat kuota *document write* Firestore dan menghindari *race condition*, Sync Engine melakukan penggabungan event (*event coalescing*) sebelum mengirimkannya ke cloud. 

Jika di dalam antrean `sync_queue` terdapat beberapa mutasi bertipe `UPDATE` yang menyasar dokumen yang sama dengan status `PENDING`, Sync Engine menggabungkan payload-payload tersebut menjadi satu transaksi penulisan tunggal yang memuat representasi akhir dokumen terkini.

---

### 8.5.3 Synchronization State Machine
Setiap item mutasi dalam antrean keluar (`sync_queue`) diatur secara ketat oleh mesin status (*state machine*) penanganan sinkronisasi berikut guna menjamin pelacakan yang deterministik dan konsisten:

```text
         [ Local Mutation Event ]
                    │
                    ▼
          ┌───────────────────┐
          │     'PENDING'     │◄──────────────────┐
          └─────────┬─────────┘                   │
                    │                             │
                    ▼ (Sync Triggered)            │ (Exponential Backoff
          ┌───────────────────┐                   │  & Retry Attempt < 5)
          │   'PROCESSING'    │                   │
          └────┬──────────┬───┘                   │
               │          │                       │
               │          └─► [ Error Caught ] ───┘
               │
      [ Sync Success ]
               │
               ▼
          ┌───────────────────┐
          │     'SUCCESS'     │ ──► [ Auto-Purge from Queue ]
          └───────────────────┘

      [ Sync Failed (Retry Count >= 5) / Validation DTO Error ]
               │
               ▼
          ┌───────────────────┐
          │  'DLQ_DEMOTED'    │ ──► [ Moved to dead_letter_queue ]
          └───────────────────┘
```

Status transisi dalam siklus hidup antrean:
- **`PENDING`**: Status awal saat data mutasi lokal berhasil dikomit ke Dexie dan didaftarkan ke antrean outbox.
- **`PROCESSING`**: Item antrean sedang dikunci oleh Sync Engine untuk diproses, divalidasi, dan dikirimkan ke Firestore Gateway. Menghindari pemrosesan ganda (*double execution*).
- **`SUCCESS`**: Sinkronisasi ke awan berhasil diselesaikan dan diakui (*acknowledged*) oleh server. Item kemudian segera dihapus secara aman dari `sync_queue` lokal.
- **`DLQ_DEMOTED`** (`'DLQ_DEMOTED'`): Item ditandai sebagai gagal permanen setelah melampaui limit percobaan ulang atau gagal validasi skema. Item dipindahkan ke tabel terisolasi `dead_letter_queue` untuk peninjauan manual.

---

## 8.6 Conflict Detection
Tabrakan data (*data conflict*) terjadi ketika pengguna memperbarui suatu dokumen di database lokal dalam kondisi offline, sementara dokumen yang sama di Firestore telah diubah oleh pengguna lain (atau sistem) ke versi yang lebih baru.

### 8.6.1 Version and Timestamp Tracking
e-MAM System melacak potensi konflik menggunakan skema metadata standar pada setiap dokumen operasional:
- `version`: Angka inkremental (mulai dari 1) yang naik setiap kali dokumen dimutasi.
- `updatedAt`: Timestamp milidetik yang mencatat waktu mutasi terakhir.

### 8.6.2 Detection Algorithm
Sebelum meluncurkan pembaruan dokumen lokal ke Firestore, Sync Engine melakukan verifikasi optimistik (*Optimistic Verification*):
1. Mengambil versi terenkripsi dari dokumen yang ada di awan (*cloud version*) menggunakan kueri meta ringan.
2. Memeriksa apakah `version_lokal <= version_cloud` ATAU `updatedAt_lokal < updatedAt_cloud`.
3. Jika kondisi di atas terpenuhi, sistem mendeteksi terjadinya konflik sinkronisasi dan menghentikan pengiriman otomatis untuk dokumen tersebut. Item antrean ditandai dengan status `'CONFLICT'`.

---

## 8.7 Conflict Resolution
Ketika konflik terdeteksi, kontrol penanganan didelegasikan sepenuhnya ke `ConflictResolver` di bawah aturan resolusi terstruktur.

### 8.7.1 Resolution Strategies

Sistem menyediakan tiga tingkatan strategi penyelesaian konflik yang dapat dikonfigurasi berdasarkan kekritisan data:

| Strategi Resolusi | Mekanisme Kerja | Penggunaan Utama |
| :--- | :--- | :--- |
| **Latest updatedAt Wins (LUAW)** | Dokumen dengan nilai timestamp `updatedAt` paling baru (tertinggi) akan memenangkan pertikaian dan menimpa dokumen lama. | Modul Absensi harian, Pencatatan Poin Perilaku, dan Jurnal Kelas. |
| **Incremental Merge** | Field numerik (seperti akumulasi poin, atau jumlah kehadiran) digabungkan secara matematis, sementara data tekstual digabungkan menggunakan aturan penggabungan cerdas. | Statistik kehadiran bulanan dan akumulasi pencatatan skor madrasah. |
| **Interactive Manual Resolution** | Dokumen ditangguhkan dan disajikan di layar Developer Console bagi operator madrasah untuk memilih secara manual versi mana yang akan dipertahankan. | Perubahan data kependudukan sensitif milik siswa atau guru. |

### 8.7.2 Conflict Audit Trail
Setiap keputusan penyelesaian konflik wajib dicatat ke dalam log audit lokal (`audit_logs`) dan disinkronkan ke cloud dengan format payload yang transparan:

```typescript
interface ConflictAuditPayload {
  id: string;
  tenantId: string;
  collection: string;
  documentId: string;
  resolutionStrategy: "LUAW" | "MERGE" | "MANUAL";
  localVersion: number;
  cloudVersion: number;
  resolvedPayload: Record<string, any>;
  resolvedAt: string;
  resolvedBy: string;
}
```

---

## 8.8 Ordering & Idempotency
Dalam arsitektur terdistribusi, menjaga urutan pengiriman transaksi (*strict ordering*) dan keunikan penulisan (*idempotency*) adalah hal mutlak untuk mencegah rusaknya integritas data akademik.

### 8.8.1 FIFO Queue Processing
Sync Engine memproses antrean keluar (`sync_queue`) menggunakan pendekatan **First-In, First-Out (FIFO)** untuk setiap dokumen unik. Dokumen B tidak boleh disinkronkan mendahului dokumen A jika dokumen A merupakan prasyarat relasional dokumen B (misalnya, pembuatan data Jurnal Kelas tidak boleh mendahului data Jadwal Pelajaran).

### 8.8.2 Idempotency Keys
Setiap item di dalam `sync_queue` dilengkapi dengan kunci idempoten unik (`id` antrean) yang berkolerasi dengan operasi mutasi. Firestore Gateway memanfaatkan kunci ini untuk memastikan bahwa jika server menerima paket jaringan ganda akibat kegagalan transmisi TCP/IP, server hanya memproses mutasi tersebut tepat satu kali (*Exactly-Once Processing*).

---

## 8.9 Retry & Failure Handling
Koneksi internet yang terputus-putus (*intermittent network*) di lingkungan madrasah pedesaan diatasi menggunakan kebijakan pemulihan kegagalan yang tangguh.

### 8.9.1 Exponential Backoff with Jitter
Jika pengiriman antrean gagal akibat gangguan jaringan (timeout, resolusi DNS gagal, atau hilangnya rute), Sync Engine akan menjadwalkan ulang pemrosesan menggunakan algoritme **Exponential Backoff** disertai **Jitter** acak guna menghindari badai request (*thundering herd problem*):

$$t_{\text{retry}} = \min(t_{\text{max}}, \, t_{\text{base}} \times 2^{\text{attempt}}) \pm \text{random\_jitter}$$

- $t_{\text{base}} = 1.5 \text{ detik}$
- $t_{\text{max}} = 300 \text{ detik}$ (5 menit)
- $\text{random\_jitter} = \text{nilai acak antara } 0 \text{ hingga } 1000 \text{ ms}$

### 8.9.2 Dead Letter Queue (DLQ)
Jika suatu transaksi antrean gagal didekatkan ke awan setelah mencapai batas maksimal **5 kali percobaan berturut-turut** (atau jika kegagalan disebabkan oleh kesalahan validasi skema DTO yang tidak dapat diperbaiki oleh pengiriman ulang):
1. Sync Engine memindahkan item tersebut dari `sync_queue` ke tabel `dead_letter_queue` (DLQ) di Dexie.
2. Status item diubah menjadi `'DLQ_DEMOTED'` dengan melampirkan log kesalahan terakhir (`lastError`).
3. Notifikasi kegagalan fatal dikirimkan ke panel sistem agar administrator atau pengembang dapat meninjau dan menyelesaikan masalah secara manual tanpa memblokir aliran antrean normal lainnya.

---

## 8.10 Sync Scheduling
Aliran kerja sinkronisasi dieksekusi secara otomatis berdasarkan kejadian (*Event-Driven*) dan jadwal terstruktur (*Timer-Driven*) guna mengoptimalkan responsivitas aplikasi dan konsumsi daya baterai perangkat.

### 8.10.1 Trigger Matrix

| Kejadian (Event) | Jenis Aliran | Tindakan Sync Engine | Mekanisme Deteksi |
| :--- | :---: | :--- | :--- |
| **System Boot / Login** | Pull & Push | Melakukan pengecekan metadata master, mengunduh delta awal, dan memindai antrean outbox yang tersisa. | Inisialisasi aplikasi. |
| **Internet Restored** | Push | Segera membangunkan Sync Engine untuk mengosongkan antrean lokal yang menumpuk. | Event listener `online` browser. |
| **Local Mutation** | Push (Lazy) | Mendaftarkan mutasi ke outbox dan memicu pengiriman instan dengan toleransi delay 2 detik (*debouced*). | Modifikasi database Dexie. |
| **Periodic Timer** | Pull | Menjalankan delta sync berkala (setiap 5 menit) untuk menarik pembaruan dari perangkat lain. | Background Interval. |
| **Manual Force Trigger** | Pull & Push | Memaksa proses sinkronisasi menyeluruh seketika tanpa memedulikan timer atau status backoff. | Interaksi tombol "Sinkronkan" di UI. |

---

## 8.11 Performance & Scalability
Untuk mengantisipasi beban data skala besar di madrasah dengan ribuan siswa, Sync Engine menerapkan teknik optimasi throughput:

1. **Batching Writes (Firestore Limits Adherence):** Firestore membatasi jumlah operasi dalam satu transaksi tulis maksimal 500 dokumen. Sync Engine membagi pemrosesan outbox menjadi potongan kelompok (*chunks*) berukuran maksimal 100 dokumen per batch transaksi tulis untuk menjamin kestabilan dan mematuhi batas aman sistem.
2. **Payload Minimization:** Hanya properti dokumen yang mengalami pembaruan (*dirty fields*) yang disertakan dalam payload `UPDATE` keluar, bukan keseluruhan isi dokumen, guna mengurangi konsumsi bandwidth internet.
3. **Summary Pre-aggregation:** Dashboard kepala madrasah membaca data ringkasan kehadiran langsung dari tabel lokal `attendance_summary` yang dihitung secara dinamis oleh Service Layer di latar belakang, bukan dengan mengunduh ratusan ribu log kehadiran mentah dari Firestore lalu menghitungnya di peramban klien.

---

## 8.12 Synchronization Observability
Untuk menjamin transparansi operasional sistem terdistribusi, Sync Engine menyediakan metrik observabilitas (*observability metrics*) terpusat yang dapat dipantau secara real-time melalui Developer Console maupun log sistem admin:

- **Queue Length (Outbox Size):** Jumlah transaksi mutasi tertunda yang masih mengantre di `sync_queue`. Nilai ideal di saat stabil adalah `0`.
- **Average Sync Latency:** Waktu rata-rata yang dibutuhkan dari momen transaksi lokal dicatatkan di Dexie hingga dikomit sukses di Firestore.
- **Sync Success Rate:** Rasio persentase keberhasilan pengiriman transaksi keluar (target: `> 99%` pada jaringan normal).
- **Retry Rate:** Jumlah frekuensi terjadinya pengiriman ulang transaksi akibat interupsi jaringan atau timeout.
- **Conflict Rate:** Persentase dokumen yang memicu pertikaian state versi lokal vs awan (digunakan untuk menganalisis kepadatan kolaborasi pengguna).
- **Dead Letter Queue (DLQ) Count:** Jumlah total item yang terdampar di `dead_letter_queue` lokal dan memerlukan intervensi manual.
- **Last Successful Sync Timestamp:** Penunjuk waktu presisi yang mencatat kapan siklus sinkronisasi delta terakhir kali diselesaikan secara sempurna.
- **Pull & Push Duration:** Metrik performa yang mengukur durasi masing-masing operasi unduh delta (Pull) dan unggah outbox (Push).

Metrik ini direkam secara berkala ke dalam tabel lokal `activity_logs` (untuk visualisasi statistik performa) tanpa pernah dikirimkan ke Firestore guna menghemat resource.

---

## 8.13 Definition of Done (Sync Verification)
Sebuah siklus sinkronisasi dinyatakan selesai sepenuhnya (*Fully Synchronized*) dan memenuhi kriteria kualitas sistem jika dan hanya jika memenuhi seluruh parameter berikut:

- [ ] **Zero Pending Queue:** Tabel `sync_queue` di Dexie dalam kondisi kosong (seluruh transaksi berstatus `'SUCCESS'` telah dihapus dari antrean).
- [ ] **DLQ Clear of Active Failures:** Tidak ada item baru yang masuk ke `dead_letter_queue` tanpa adanya penandaan atau pelaporan isu ke operator.
- [ ] **Metadata Versions Match:** Versi metadata lokal (`last_synced_master_version`) cocok dengan versi metadata terkini yang diterbitkan oleh Firestore.
- [ ] **Strict Tenant Separation Verified:** Seluruh mutasi yang dilakukan dalam siklus sinkronisasi memuat `tenantId` yang valid dan tidak melintasi batasan tenant lain.
- [ ] **No Unhandled Exception in Console:** Pemrosesan sinkronisasi berjalan tanpa memunculkan galat tidak tertangani (*unhandled promise rejections*) di konsol log browser.
- [ ] **Local Audit Trail Appended:** Setiap aktivitas mutasi penting dan resolusi konflik tercatat dengan rapi di dalam tabel `audit_logs` lokal.
