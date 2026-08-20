Cetak biru ini mengintegrasikan seluruh konstitusi logika bisnis, pembatasan status per sesi, skema database lokal (`Dexie`), aturan *Point Engine* non-kumulatif, hingga visualisasi tabel laporan secara mutlak tanpa menambahkan asumsi di luar data yang Anda berikan.

---

## 🏛️ 1. PIPELINE ARSITEKTUR LOGIKA (Immutable Layer)

Aliran data sistem berjalan satu arah (*Uni-directional*) untuk menjamin status *Offline-First* bekerja 100% tanpa ketergantungan Cloud pada layer presentasi.

$$\text{UI Component} \longrightarrow \text{Hook Layer} \longrightarrow \text{Service Layer} \longrightarrow \text{Repository Layer (Dexie ONLY)} \longrightarrow \text{IndexedDB (Dexie)} \longrightarrow \text{Sync Queue} \longrightarrow \text{Sync Engine} \longrightarrow \text{Firestore}$$

* **UI Component & Hook:** Hanya bertugas merender elemen visual dan memegang status tampilan. **❌ Tidak boleh mengakses Firestore atau Dexie secara langsung.**
* **Service Layer (Business Logic):** Satu-satunya tempat eksekusi *Rule Engine* (Kalkulasi poin harian, *Priority Rule Status*, dan Otomasi BK). **❌ Tidak boleh mengakses Firestore.**
* **Repository Layer:** Abstraksi eksklusif untuk operasi data lokal. **❌ Hanya boleh mengakses Dexie.**
* **Sync Engine & Queue:** Satu-satunya gerbang (*gateway*) penghubung data lokal ke Cloud Firestore menggunakan aturan *Delta Sync* dan konflik *Last Write Wins* (prioritas server timestamp).

---

## 📊 2. STRUKTUR DATA INTEGRAL & SCHEMA (Dexie Level)

### Core Interface: `Attendance` (`1 Siswa + 1 Hari = 1 Dokumen`)

```typescript
export type StatusMasuk = 'T' | 'H' | 'TS' | 'I' | 'S';
export type StatusIbadah = 'TS' | 'H' | 'H+' | 'I' | 'S'; // Duha, Zuhur, Ashar
export type StatusPulang = 'PC' | 'H' | 'S' | 'I' | 'A';
export type StatusKetFinal = 'H' | 'I' | 'S' | 'A';

export interface AttendanceRecord {
  // Composite & Indexing Keys
  attendanceId: string;       // Primary Key (studentId + date)
  tenantId: string;           // Isolation Scope
  classId: string;            // Filtering Key
  studentId: string;
  date: string;               // Format YYYY-MM-DD

  // 5 Sesi Utama dengan Batasan Status Mutlak
  sessions: {
    masuk: { time: string | null; status: StatusMasuk };
    duha: { time: string | null; status: StatusIbadah };
    zuhur: { time: string | null; status: StatusIbadah };
    ashar: { time: string | null; status: StatusIbadah };
    pulang: { time: string | null; status: StatusPulang };
  };

  // PTSP Domain Linkage
  suratId?: {
    izin?: string;            // Referensi ID Dokumen PTSP Surat Izin
    sakit?: string;           // Referensi ID Dokumen PTSP Surat Sakit
  };

  // Processed Output (Purely Replayed/Derived via Service Layer)
  derived: {
    statusHarian: StatusKetFinal;
    poinHarian: number;
  };
}

export interface PointLedger {
  studentId: string;
  total: number;              // Akumulasi Poin Aktif (Pelanggaran - Prestasi)
  history: {
    date: string;
    type: 'PELANGGARAN' | 'PRESTASI';
    description: string;
    delta: number;            // Positif untuk pelanggaran, negatif untuk prestasi
  }[];
}

```

---

## ⚙️ 3. CORE RULE ENGINE (Deterministic Logic)

### A. Aturan Prioritas & Status Harian (Priority Rule Status)

Penentuan satu status harian akhir pada kolom **Ket Final** diselesaikan berdasarkan urutan kekuatan filter (*Hierarchy of Status*):

$$\text{I} > \text{S} > \text{A} > \text{H+} > \text{H} > \text{T/TS/PC}$$

| Kondisi Evaluasi Sesi | Output `Ket Final` |
| --- | --- |
| Terdapat status `I` atau ada Surat Izin dari PTSP | **I** |
| Terdapat status `S` atau ada Surat Sakit dari PTSP | **S** |
| Seluruh sesi bernilai `TS` | **A** |
| Normal (Tidak memenuhi kondisi di atas) | **H** |

### B. Aturan Poin Pelanggaran Non-Kumulatif

* **Kondisi Pelanggaran Ringan:** Jika dalam satu hari terdapat minimal satu status `T`, `TS`, atau `PC`, maka perhitungan poin bersifat *non-cumulative* (tidak dihukum ganda):

$$\text{poin} = \min(5, \text{jumlah pelanggaran unik})$$



*(Artinya: kombinasi T tunggal, T+TS, atau T+TS+PC dalam satu hari yang sama tetap menghasilkan nilai mutlak **5 poin**)*.
* **Kondisi Alpha (`A`):** Poin harian otomatis diberikan nilai mutlak **10 poin**.
* **Kondisi Netral (`I`, `S`, `H+`):** Poin harian bernilai mutlak **0 poin**.

### C. Logika Prestasi & BK Automation

* **Domain Prestasi:** Mengurangi `PointLedger.total` secara langsung (**Hafalan = -10 Poin**, **Sertifikat = -15 Poin**). Logika ini *tidak mengubah* dokumen `attendance`.
* **Otomasi BK:** Membaca nilai aktual `PointLedger.total` untuk memicu aksi terencana secara deterministik:

$$\text{Total Poin} \ge 15 \longrightarrow \text{Konseling}$$


$$\text{Total Poin} \ge 25 \longrightarrow \text{SP I}$$


$$\text{Total Poin} \ge 50 \longrightarrow \text{SP II}$$


$$\text{Total Poin} \ge 75 \longrightarrow \text{SP III}$$


$$\text{Total Poin} \ge 100 \longrightarrow \text{Evaluasi DO}$$



---

## 📊 4. REPRESENTASI VISUAL TABEL LAPORAN (Projection Output)

Seluruh komponen pelaporan di bawah ini diproyeksikan murni dari *Single Source of Truth*: kumpulan dokumen di dalam **Attendance Collection**.

### 1️⃣ Laporan Kehadiran Harian Per Kelas

* **Spesifikasi:** Scan nyata via alat memuat format `HH:mm`. Jika terjadi status tanpa scan (TS, I, S, A), kolom diisi ringkas menggunakan kode status.

**MAN 1 HULU SUNGAI TENGAH**

**LAPORAN KEHADIRAN HARIAN SISWA**

* **Kelas / Hari / Tanggal:** X-A / Senin, 07 Juni 2026
* **Wali Kelas:** Ahmad Fauzi, S.Pd.
* **Komposisi Gender:** L = 8 | P = 7 | Jumlah = 15

| No | ID | Nama Siswa | Masuk | Duha | Zuhur | Ashar | Pulang | Ket | Poin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 26001 | NIZAR QABBANI | **A** | **A** | **A** | **A** | **A** | **A** | 10 |
| 2 | 25031 | Annisatul Asyiyah | 07:10 | 08:45 | **TS** | 15:45 | 16:10 | **H** | 5 |
| 3 | 25035 | Azizah Nur Habibah | 07:20 | 08:45 (H+) | 12:20 (H+) | 15:30 (H+) | 16:05 | **H** | 0 |
| 4 | 25040 | ANDI | 07:40 (T) | 08:50 | 12:20 | 15:50 | 15:30 (PC) | **H** | 5 |

**Rekap Bawah Tabel (Matriks Harian Kelas):**

| H | T | TS | I | S | H+ | PC | A |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | 8 | 2 | 4 | 1 | 0 | 3 | 1 |

*(Catatan: Nilai TS pada rekap bawah dihitung berdasarkan status akhir siswa pada hari tersebut, bukan jumlah total kejadian TS di tiap sesi)*

---

### 2️⃣ Laporan Kehadiran Bulanan Per Kelas

* **Spesifikasi:** Satu baris mewakili satu siswa. Nilai tanggal (1-31) menunjukkan `derived.statusHarian` utama, rekap sisi kanan menghitung total komulatif kategori selama sebulan.

| Nama Siswa | 1 | 2 | 3 | 4 | 5 | ... | 31 | H | T | TS | I | S | H+ | PC | A |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Abdul | H | H | A | H | T | ... | H | 22 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| Annisa | H | H | H | H | H | ... | H | 24 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| Azizah | H | H+ | H+ | H | H | ... | H | 25 | 0 | 0 | 0 | 0 | 3 | 0 | 0 |

---

### 3️⃣ Laporan Individual Siswa (Keperluan Rekap Orang Tua & BK)

* **Spesifikasi:** Kompilasi longitudinal yang melacak riwayat performa harian individu secara detail.

| Tanggal | Masuk | Duha | Zuhur | Ashar | Pulang | Ket | Poin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01/05 | 07:12 | 08:45 | 12:18 | 15:32 | 16:08 | **H** | 0 |
| 02/05 | 07:42 (T) | 08:50 | 12:22 | 15:31 | 16:05 | **T** | 5 |
| 03/05 | **A** | **A** | **A** | **A** | **A** | **A** | 10 |
| 04/05 | 07:18 | **TS** | 12:19 | 15:35 | 16:06 | **H** | 5 |
| 05/05 | 07:21 | 08:47 (H+) | 12:21 (H+) | 15:31 (H+) | 16:04 | **H** | 0 |

**Rekap Akumulasi Individual:**

* **H:** 22 | **T:** 2 | **TS:** 2 | **I:** 3 | **S:** 1 | **H+:** 0 | **PC:** 4 | **A:** 1
* **Total Akumulasi Poin Aktif:** **30 Poin**

---

### 4️⃣ Laporan Monitoring Real-Time Per Kelas (Dashboard View)

* **Spesifikasi:** Tampilan live pemantauan status progres penguncian data harian di hari H.

| Nama Siswa | Masuk | Duha | Zuhur | Ashar | Pulang | Status Progres Real-Time |
| --- | --- | --- | --- | --- | --- | --- |
| Abdul | 07:10 | 08:45 | 12:20 | 15:35 | 16:08 | ✅ Lengkap |
| Annisa | 07:20 | 08:46 | **TS** | -- | -- | 🟡 Menunggu Sesi Ashar |
| Andi | 07:40 (T) | 08:50 | 12:20 | 15:45 | 15:30 (PC) | 🔴 Pelanggaran |
| Azizah | 07:15 | 08:45 (H+) | 12:20 (H+) | 15:30 (H+) | 16:05 | 🟣 Haid |

---

## 📈 5. MONITORING ENGINE & AGGREGATION COUNTER

### A. Rumus KPI Real-Time Per Sesi

$$\text{Kehadiran Sesi (\%)} = \frac{H + H+ + PC_{\text{valid}}}{\text{Total Siswa}} \times 100$$

* **Kehadiran:** `(H + H+) / total`
* **Ketidakhadiran Anomali:** `T + TS + PC`
* **Netral:** `I + S`

### B. Representasi Data Agregasi Sesi Kelas X

Setiap perubahan entri piringan data scan lokal akan memperbarui *widget dashboard tracker* berikut secara langsung:

| Sesi | H | T | TS | H+ | I | S | PC | A | Total Valid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Masuk** | 25 | 3 | 2 | 0 | 1 | 0 | 0 | 0 | 30 |
| **Duha** | 24 | 0 | 4 | 2 | 0 | 0 | 0 | 0 | 30 |
| **Zuhur** | 23 | 0 | 5 | 2 | 0 | 0 | 0 | 0 | 30 |
| **Ashar** | 22 | 0 | 6 | 2 | 0 | 0 | 0 | 0 | 30 |
| **Pulang** | 24 | 0 | 0 | 0 | 1 | 0 | 3 | 2 | 30 |

### C. Alert Rules Engine System

* `TS > 10%` pada sesi apa pun $\longrightarrow$ **Alert Wali Kelas**
* `T > 5%` pada Sesi Masuk $\longrightarrow$ **Discipline Alert**
* `PC > 10%` pada Sesi Pulang $\longrightarrow$ **Pulang Control Alert**
* `H+ > 15%` $\longrightarrow$ **Worship Review**
* `A > 5%` $\longrightarrow$ **System Investigation**

---

## 🛡️ BUILD QUALITY GATE GUARANTEE

1. **Zero UI Calculation Rule:** Seluruh visualisasi string gabungan seperti `15:30 (PC)` atau `08:45 (H+)` ditangani pada tingkat *Service Transformer*. Kode komponen `.tsx` di UI murni deklaratif pasif.
2. **No Firestore Leakage:** Seluruh modul kueri data laporan memanggil data yang tersimpan lokal di IndexedDB Dexie melalui *Repository Layer* untuk memastikan akses instan berkecepatan tinggi tanpa internet.

Cetak biru arsitektur logika dan struktur data terpadu e-MAM V7.7 Enterprise ini siap diturunkan ke tahap pengerjaan kode.