# Enterprise Data Dictionary e-MAM V7.8
## 06. Sync Contract (Protokol & Kontrak Sinkronisasi)

Dokumen ini mendefinisikan arsitektur dan alur kerja pertukaran data dua arah antara database lokal (**Dexie IndexedDB**) dengan cloud (**Cloud Firestore**). Protokol ini dirancang untuk mencapai efisiensi kuota Firestore hingga >70% melalui sinkronisasi diferensial (Delta Sync).

---

### 1. Delta Sync Protocol (Sinkronisasi Diferensial)

e-MAM System melarang keras pengunduhan penuh seluruh koleksi data setiap kali aplikasi dinyalakan atau pengguna berpindah halaman. Sinkronisasi harus dilakukan secara delta (hanya mengambil data yang berubah sejak waktu sinkronisasi terakhir).

```text
[Aplikasi Dimulai / Login]
           │
           ▼
[Baca Waktu Sinkronisasi Terakhir (lastSyncTime) dari Local Metadata]
           │
           ▼
[Kirim Query Delta ke Firestore dengan Filter: updatedAt > lastSyncTime AND tenantId == activeTenantId]
           │
           ▼
[Firestore hanya Mengembalikan Dokumen yang Baru Dibuat atau Diperbarui (Delta Data)]
           │
           ▼
[Dexie Menyimpan Delta Data ke Storage Lokal & Memperbarui lastSyncTime Perangkat]
```

#### Komparasi Versi Metadata (`metadataVersion`)
Untuk mempermudah koordinasi data statis (Master Data seperti Mapel, Ruangan, Tahun Pelajaran), sistem mencatat versi metadata global di Firestore. Jika versi metadata lokal masih sama dengan versi global, sinkronisasi untuk koleksi tersebut dilewati (Zero Read Cost).

---

### 2. Skema Baku Antrean Sinkronisasi (`sync_queue`)

Seluruh mutasi data yang dilakukan pengguna saat offline dimasukkan ke dalam antrean lokal `sync_queue`. Item antrean memiliki struktur universal berikut:

```typescript
interface SyncQueueItem {
  id: string;                      // ID unik item antrean (UUID v4)
  tenantId: string;                // ID Tenant pengirim (Isolasi multi-tenant)
  collection: string;              // Nama koleksi target di Firestore (misal: 'attendance')
  documentId: string;              // Primary Key (id) dokumen yang disinkronkan
  operation: 'create' | 'update' | 'delete'; // Operasi tulis database
  payload: any;                    // Payload dokumen utuh (JSON-safe)
  version: number;                 // Versi dokumen terkait
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;              // Jumlah percobaan ulang kirim (maksimum 5 kali)
  deviceId: string;                // ID Perangkat fisik pengirim
  createdAt: string;               // ISO 8601 Tanggal antrean dibuat
  processedAt: string | null;      // ISO 8601 Tanggal sinkronisasi selesai diproses
  lastRetryAt: string | null;      // ISO 8601 Tanggal percobaan terakhir
  errorCode: string | null;        // Kode kesalahan (misal: 'permission-denied')
  errorMessage: string | null;     // Deskripsi kesalahan rinci untuk debug
}
```

---

### 3. Queue Processing Rules & Retry Policy

Sync Engine memproses antrean lokal `sync_queue` menggunakan aturan pemrosesan yang deterministik:

1. **Urutan FIFO Berdasarkan Prioritas**: Antrean diproses berurutan berdasarkan waktu pembuatan (`createdAt`) dan tingkat prioritas (Kehadiran Siswa > Jurnal > Nilai).
2. **Aturan Retries Berbasis Exponential Backoff**:
   Jika pengiriman gagal akibat gangguan jaringan, sistem akan mencoba mengirim ulang dengan jeda waktu yang terus melipat ganda:
   - Percobaan ke-1: Jeda 1 detik
   - Percobaan ke-2: Jeda 2 detik
   - Percobaan ke-3: Jeda 4 detik
   - Percobaan ke-4: Jeda 8 detik
   - Percobaan ke-5: Jeda 16 detik
3. **Maksimum Retry & Dead Letter Queue (DLQ)**:
   Apabila pengiriman tetap gagal setelah 5 kali percobaan atau menghasilkan error permanen (misal `permission-denied`), dokumen dipindahkan dari `sync_queue` ke tabel lokal **`dead_letter_queue`** di Dexie. Item dalam DLQ tidak akan disinkronkan lagi secara otomatis oleh Sync Engine, melainkan memerlukan intervensi administrator melalui **Developer Console**.

---

### 4. Realtime Sync Bounds (Batasan Realtime)

e-MAM System meminimalkan penggunaan listener realtime (`onSnapshot` Firebase) karena biaya read yang sangat mahal dan rawan memicu infinite-loop. Penggunaan koneksi realtime **HANYA** diperbolehkan untuk modul-modul kritis berikut:

* **Sistem Notifikasi Darurat & Pengumuman**: Untuk menyiarkan info darurat ke wali murid/guru.
* **Sesi Scanner QR Absensi Aktif**: Memantau feedback instan layar monitor saat siswa melakukan tapping kartu QR.
* **Presence & Chat Sesi Konseling BK**: Memfasilitasi komunikasi langsung yang responsif antara guru BK, siswa, dan orang tua.

Seluruh data master, riwayat nilai, log audit, dan rekapitulasi data bulanan **wajib** menggunakan Delta Sync berbasis tombol pemicu manual (Pull/Refresh) atau interval terjadwal di latar belakang.
