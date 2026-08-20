# Enterprise Data Dictionary e-MAM V7.8
## 03. Academic Domain (Domain Akademik & Pembelajaran)

Dokumen ini mendefinisikan kontrak skema data resmi untuk subsistem Akademik, Rombongan Belajar (Kelas), Jadwal Pelajaran, Penugasan Guru, Presensi, dan Penilaian Pembelajaran pada e-MAM System.

---

### 1. Entity: Academic Year (`academic_years`)
* **Tujuan**: Menetapkan kalender tahun ajaran aktif di madrasah (misal: "2025/2026").
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4 atau String representatif (misal: `AY_2025_2026`). |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. |
| `tahunMulai` | `number` | | Tahun dimulainya tahun pelajaran (misal: `2025`). |
| `tahunSelesai`| `number` | | Tahun selesainya tahun pelajaran (misal: `2026`). |
| `labelTP` | `string` | Index | Nama tampilan resmi (misal: "2025/2026"). |
| `status` | `enum` | Index | `AKTIF` \| `SELESAI` (Hanya ada 1 TP aktif per tenant). |
| `createdAt` | `string` | ISO 8601 | Waktu pendaftaran. |
| `updatedAt` | `string` | ISO 8601 | Waktu pembaruan. |
| `version` | `number` | Integer | Versi dokumen. |
| `schemaVersion`| `number` | Integer | Versi skema dokumen. |
| `syncStatus` | `enum` | Local-Only | Status sinkronisasi lokal. |
| `deleted` | `boolean` | Index | Penanda soft-delete. |

---

### 2. Entity: Semester (`semesters`)
* **Tujuan**: Membagi tahun pelajaran ke dalam satuan semester pembelajaran (Ganjil/Genap).
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4 atau String (misal: `AY_2025_2026_GANJIL`). |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. |
| `academicYearId`| `string`| **Foreign Key (FK)** | Merujuk ke `academic_years.id`. |
| `nama` | `enum` | Index | Jenis semester: `GANJIL` \| `GENAP`. |
| `status` | `enum` | Index | Status keaktifan: `AKTIF` \| `SELESAI`. |
| `createdAt` | `string` | ISO 8601 | Waktu pembuatan. |
| `updatedAt` | `string` | ISO 8601 | Waktu pembaruan. |
| `version` | `number` | Integer | Versi dokumen. |
| `schemaVersion`| `number` | Integer | Versi skema dokumen. |

---

### 3. Entity: Class / Rombongan Belajar (`classes`)
* **Tujuan**: Mengelola data kelompok belajar siswa (Rombel / Kelas).
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4. |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. |
| `academicYearId`| `string`| **Foreign Key (FK)** | Merujuk ke `academic_years.id`. |
| `namaKelas` | `string` | Index | Nama kelas rombel (misal: "Kelas IX-A", "Kelas VII-3"). |
| `tingkat` | `number` | Index | Angka tingkat rombel (misal: `7` \| `8` \| `9` untuk MTs). |
| `waliKelasId` | `string` | **Foreign Key (FK)** | Merujuk ke `gtk.id` (Wali kelas yang bertanggung jawab). |
| `kapasitas` | `number` | | Jumlah kursi siswa maksimum di kelas ini. |
| `createdAt` | `string` | ISO 8601 | Waktu pembuatan. |
| `updatedAt` | `string` | ISO 8601 | Waktu pembaruan. |
| `version` | `number` | Integer | Versi dokumen. |
| `schemaVersion`| `number` | Integer | Versi skema dokumen. |

---

### 4. Entity: Subject / Mata Pelajaran (`subjects`)
* **Tujuan**: Daftar mata pelajaran kurikulum madrasah (misal: Akidah Akhlak, Fikih, Matematika).
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4 atau Kode Mapel (Deterministic). |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. |
| `kodeMapel` | `string` | Unique / Index | Kode unik mata pelajaran (misal: `MAPEL_FIKIH_IX`). |
| `namaMapel` | `string` | Index | Nama resmi mata pelajaran (misal: "Fikih"). |
| `kelompok` | `enum` | Index | Kelompok pelajaran Kemenag: `KELOMPOK_A` \| `KELOMPOK_B` \| `KELOMPOK_C` \| `MUATAN_LOKAL`. |
| `createdAt` | `string` | ISO 8601 | Waktu pembuatan. |
| `updatedAt` | `string` | ISO 8601 | Waktu pembaruan. |
| `version` | `number` | Integer | Versi dokumen. |

---

### 5. Entity: Room / Ruang Kelas (`rooms`)
* **Tujuan**: Mendefinisikan ruangan fisik yang digunakan untuk tempat belajar atau rapat.
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4. |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. |
| `namaRuang` | `string` | Index | Nama ruangan fisik (misal: "Laboratorium Komputer", "Ruang Kelas 9A"). |
| `tipe` | `enum` | Index | Tipe ruangan: `KELAS` \| `LABORATORIUM` \| `PERPUSTAKAAN` \| `AULA` \| `KANTOR`. |
| `kapasitas` | `number` | | Kapasitas tampung ruangan fisik. |
| `lokasi` | `string` | | Keterangan lokasi gedung (misal: "Gedung B Lantai 2"). |
| `createdAt` | `string` | ISO 8601 | Waktu pembuatan. |

---

### 6. Entity: Schedule / Jadwal Pelajaran (`schedules`)
* **Tujuan**: Menetapkan hari dan jam pelajaran untuk suatu mata pelajaran di suatu kelas.
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4. |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. |
| `semesterId` | `string` | **Foreign Key (FK)** | Merujuk ke `semesters.id`. |
| `classId` | `string` | **Foreign Key (FK)** | Merujuk ke `classes.id`. |
| `subjectId` | `string` | **Foreign Key (FK)** | Merujuk ke `subjects.id`. |
| `teacherId` | `string` | **Foreign Key (FK)** | Merujuk ke `gtk.id` (Pendidik pengampu mata pelajaran). |
| `roomId` | `string` | **Foreign Key (FK)** | Merujuk ke `rooms.id`. |
| `hari` | `enum` | Index | Nama hari: `SENIN` \| `SELASA` \| `RABU` \| `KAMIS` \| `JUMAT` \| `SABTU` \| `MINGGU`. |
| `jamKeMulai` | `number` | | Jam pelajaran ke- (angka, misal `1` = Jam pertama, `3` = Jam ketiga). |
| `jamKeSelesai`| `number` | | Jam pelajaran ke- selesai. |
| `waktuMulai` | `string` | HH:MM | Format waktu mulai fisik (misal: "07:30"). |
| `waktuSelesai`| `string` | HH:MM | Format waktu selesai fisik (misal: "08:45"). |
| `createdAt` | `string` | ISO 8601 | Waktu pembuatan jadwal. |
| `updatedAt` | `string` | ISO 8601 | Waktu pembaruan jadwal. |
| `version` | `number` | Integer | Versi dokumen. |

---

### 7. Entity: Student Attendance / Kehadiran Siswa (`attendance`)
* **Tujuan**: Mencatat riwayat presensi harian siswa (baik presensi madrasah pagi/pulang maupun presensi per jam pelajaran).
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | Deterministic: `studentId_date` (mencegah duplikasi). |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. |
| `studentId` | `string` | **Foreign Key (FK)** | Merujuk ke `students.id`. |
| `classId` | `string` | **Foreign Key (FK)** | Merujuk ke `classes.id`. |
| `date` | `string` | YYYY-MM-DD (Index)| Tanggal pelaksanaan presensi. |
| `statusGlobal`| `enum` | Index | Status kehadiran hari ini: `HADIR` \| `IZIN` \| `SAKIT` \| `ALPHA` \| `TERLAMBAT` \| `DISPENSASI`. |
| `sessions` | `object` | JSON | Detail jam scan: `{ tapMasuk: { time, deviceId }, tapPulang: { time, deviceId } }`. |
| `notes` | `string` | | Keterangan/catatan tambahan presensi (misal: nomor surat izin). |
| `createdAt` | `string` | ISO 8601 | Waktu dokumen dicatat pertama kali. |
| `updatedAt` | `string` | ISO 8601 | Waktu dokumen diperbarui terakhir. |
| `version` | `number` | Integer | Versi dokumen. |
| `syncStatus` | `enum` | Local-Only | Status sinkronisasi lokal. |

---

### 8. Entity: Student Grade / Penilaian Akademik (`grades`)
* **Tujuan**: Menyimpan pencatatan nilai harian, nilai tugas, UTS, UAS, dan nilai rapor siswa.
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4. |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. |
| `semesterId` | `string` | **Foreign Key (FK)** | Merujuk ke `semesters.id`. |
| `studentId` | `string` | **Foreign Key (FK)** | Merujuk ke `students.id`. |
| `classId` | `string` | **Foreign Key (FK)** | Merujuk ke `classes.id`. |
| `subjectId` | `string` | **Foreign Key (FK)** | Merujuk ke `subjects.id`. |
| `teacherId` | `string` | **Foreign Key (FK)** | Merujuk ke `gtk.id` (Penilai). |
| `jenisPenilaian`| `enum` | Index | `HARIAN` \| `TUGAS` \| `UTS` \| `UAS` \| `RAPOR`. |
| `namaPenilaian`| `string` | | Nama spesifik ujian/tugas (misal: "UH-1 Turunan Fungsi"). |
| `nilaiAngka` | `number` | Range: 0 - 100 | Nilai kuantitatif siswa. |
| `nilaiHuruf` | `string` | | Nilai kualitatif konversi (misal: "A" \| "B" \| "C"). |
| `catatan` | `string` | | Deskripsi kemajuan belajar siswa. |
| `date` | `string` | YYYY-MM-DD | Tanggal pemberian nilai. |
| `createdAt` | `string` | ISO 8601 | Waktu pembuatan. |
| `updatedAt` | `string` | ISO 8601 | Waktu pembaruan. |
| `version` | `number` | Integer | Versi dokumen. |
