Saya memahami yang Anda maksud. Anda **tidak menginginkan flowchart login**, tetapi **peta besar (Big Picture)** seperti seorang Enterprise Architect menggambarkan sebuah organisasi. Login hanya salah satu titik kecil di dalamnya.

Diagramnya harus cukup luas sehingga ketika nanti kita membahas satu modul, kita langsung tahu posisinya terhadap keseluruhan sistem.

Contohnya seperti berikut.

---

# Enterprise Operational Flow e-MAM

```text
                                    e-MAM SYSTEM
═══════════════════════════════════════════════════════════════════════════════════════

                                    EKOSISTEM MADRASAH

        Developer                Madrasah                  Pengguna               Operasional
             │                       │                          │                       │
             ▼                       ▼                          ▼                       ▼
     Membuat Tenant ───────► Aktivasi Madrasah ───────► Pengguna Bergabung ───► Aktivitas Harian
             │                       │                          │                       │
             │                       │                          │                       │
             ▼                       ▼                          ▼                       ▼
      Konfigurasi Sistem      Setup Madrasah          Login / Klaim Akun         Proses Bisnis
             │                       │                          │                       │
             │                       │                          │                       │
             └─────────────── Semua Data Masuk ke Ekosistem e-MAM ────────────────────┘
                                                │
                                                ▼
═══════════════════════════════════════════════════════════════════════════════════════
                                         DATA MASTER
═══════════════════════════════════════════════════════════════════════════════════════

Tenant
    │
    ├── Profil Madrasah
    ├── Tahun Pelajaran
    ├── Semester
    ├── Struktur Organisasi
    ├── Jurusan
    ├── Tingkat
    ├── Kelas
    ├── Mata Pelajaran
    ├── Guru
    ├── Staf
    ├── Siswa
    ├── Orang Tua
    └── Alumni

            │
            ▼
═══════════════════════════════════════════════════════════════════════════════════════
                                     IDENTITAS PENGGUNA
═══════════════════════════════════════════════════════════════════════════════════════

                   Sudah Punya Akun?
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
          Ya                     Belum
             │                       │
             ▼                       ▼
          Login                Klaim Akun
             │                       │
             │                Data Ada?
             │                       │
             │              ┌────────┴────────┐
             │              │                 │
             │              ▼                 ▼
             │           Ya               Tidak Ada
             │              │                 │
             │              ▼                 ▼
             │        Buat Password      Registrasi Baru
             │              │                 │
             └──────────────┴─────────────────┘
                            │
                            ▼
═══════════════════════════════════════════════════════════════════════════════════════
                                  VALIDASI IDENTITAS
═══════════════════════════════════════════════════════════════════════════════════════

Akun
 │
 ├── Status
 ├── Tenant
 ├── Jenis Akun
 ├── Role
 ├── Permissions
 ├── Perangkat
 ├── Session
 └── Data Lokal

            │
            ▼
═══════════════════════════════════════════════════════════════════════════════════════
                               OPERASIONAL HARIAN MADRASAH
═══════════════════════════════════════════════════════════════════════════════════════

Admin TU
    │
    ├── Kelola Data Master
    ├── PPDB
    ├── Penempatan Kelas
    ├── Surat
    ├── Arsip
    └── Pelayanan

Guru
    │
    ├── Jadwal
    ├── Absensi
    ├── Jurnal
    ├── Penilaian
    ├── Tugas
    └── BK

Siswa
    │
    ├── Jadwal
    ├── Absensi
    ├── Tugas
    ├── Nilai
    ├── Rapor
    └── Surat

Orang Tua
    │
    ├── Monitoring
    ├── Absensi
    ├── Nilai
    ├── Tagihan
    └── Surat

Kepala Madrasah
    │
    ├── Dashboard
    ├── Approval
    ├── Monitoring
    ├── Laporan
    └── Evaluasi

            │
            ▼
═══════════════════════════════════════════════════════════════════════════════════════
                               HASIL OPERASIONAL
═══════════════════════════════════════════════════════════════════════════════════════

Absensi
Nilai
Jurnal
Pelanggaran
Prestasi
Surat
Laporan
Rapor
Kelulusan
Arsip

            │
            ▼
═══════════════════════════════════════════════════════════════════════════════════════
                              OFFLINE-FIRST ENTERPRISE
═══════════════════════════════════════════════════════════════════════════════════════

UI
 │
 ▼
Store
 │
 ▼
Dexie
 │
 ▼
Sync Queue
 │
 ▼
Sync Engine
 │
 ▼
Firestore
```

---

# Penjelasan Diagram

Diagram ini **tidak dimulai dari Login**, tetapi dari **ekosistem e-MAM** secara keseluruhan. Alasannya, login tidak pernah menjadi titik awal operasional madrasah. Sebelum seseorang dapat login, harus ada tenant, madrasah, data master, dan identitas pengguna yang sudah terbentuk.

## 1. Ekosistem Madrasah

Bagian paling atas menggambarkan bahwa sistem diawali oleh pembentukan organisasi.

Ada empat kelompok besar:

* **Developer** membangun tenant dan konfigurasi sistem.
* **Madrasah** melakukan setup identitas dan struktur organisasi.
* **Pengguna** bergabung melalui login atau klaim akun.
* **Operasional** menjalankan aktivitas harian.

Keempatnya saling bergantung.

---

## 2. Data Master

Semua proses operasional bergantung pada data master.

Tanpa tahun pelajaran, kelas, guru, dan siswa, modul akademik tidak dapat berjalan.

Karena itu seluruh data master berada di lapisan yang sama.

---

## 3. Identitas Pengguna

Bagian ini menjelaskan bagaimana seseorang berubah dari orang luar menjadi pengguna sistem.

Kemungkinannya hanya dua.

* Sudah memiliki akun.
* Belum memiliki akun.

Jika belum memiliki akun, sistem tidak langsung membuat user, tetapi terlebih dahulu memastikan apakah data orang tersebut sudah ada di data master.

---

## 4. Validasi Identitas

Login bukan hanya memeriksa email dan password.

Setelah berhasil login masih ada proses lain.

Misalnya:

* apakah tenant masih aktif,
* apakah akun aktif,
* apakah role masih berlaku,
* apakah perangkat diizinkan,
* apakah data lokal sudah tersedia.

Barulah pengguna masuk ke operasional.

---

## 5. Operasional Harian

Inilah inti dari sistem.

Setiap aktor memiliki pekerjaan berbeda.

Namun seluruh pekerjaan mereka saling terhubung.

Contohnya:

* Admin TU membuat data siswa.
* Guru mengisi nilai siswa.
* Siswa melihat nilai.
* Orang tua memonitor nilai.
* Kepala madrasah melihat rekap nilai.

Artinya satu data mengalir ke banyak aktor.

---

## 6. Hasil Operasional

Semua aktivitas menghasilkan keluaran.

Misalnya:

* absensi,
* jurnal,
* surat,
* rapor,
* arsip.

Keluaran tersebut bukan akhir proses, melainkan menjadi masukan untuk proses lain seperti evaluasi, pelaporan, atau kenaikan kelas.

---

## 7. Offline-First

Lapisan terakhir menggambarkan bahwa seluruh operasional menggunakan alur yang sama.

UI menghasilkan interaksi pengguna.

Store mengelola keadaan aplikasi.

Dexie menjadi database operasional.

Sync Queue mencatat perubahan.

Sync Engine menyelaraskan data.

Firestore menjadi pusat sinkronisasi.

Dengan demikian, seluruh aktivitas madrasah tetap dapat berlangsung meskipun koneksi internet terputus.

---

## Mengapa Diagram Ini Penting

Diagram ini menjadi **peta induk**. Ketika nanti membahas modul apa pun—Users, Siswa, Guru, BK, PTSP, Rapor, atau Dashboard—kita tidak melihatnya sebagai halaman yang berdiri sendiri, tetapi langsung mengetahui:

* posisi modul tersebut dalam keseluruhan ekosistem,
* proses apa yang menjadi inputnya,
* proses apa yang menerima hasilnya,
* aktor mana yang terlibat,
* dan dampaknya terhadap operasional madrasah secara menyeluruh.

Dengan demikian, setiap keputusan desain selalu dapat ditelusuri kembali ke alur besar sistem, sehingga tidak ada modul yang berkembang secara terpisah dari tujuan utama e-MAM.
