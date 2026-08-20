# Enterprise Data Dictionary e-MAM V7.8
## 02. Master Domain (Domain Data Master Referensi)

Dokumen ini mendefinisikan kontrak skema data resmi untuk subsistem Data Master Referensi pada e-MAM System. Data Master menjadi jangkar bagi seluruh entitas transaksional (kehadiran, nilai, jurnal, BK, dsb).

---

### 1. Entity: Tenant / Madrasah (`tenants`)
* **Tujuan**: Menampung data profil madrasah yang menjadi batasan (boundary) utama multi-tenancy sistem.
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.
* **Isolasi Tenant**: Root Tenant (tidak memiliki `tenantId` internal, melainkan dirinya sendiri adalah unit tenant).

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4 atau NSM Madrasah (Deterministic). |
| `nsm` | `string` | Unique / Index | Nomor Statistik Madrasah (12 digit angka unik nasional Kemenag). |
| `npsn` | `string` | Unique / Index | Nomor Pokok Sekolah Nasional (8 digit angka unik Kemendikbudristek). |
| `namaMadrasah` | `string` | Index | Nama resmi madrasah (misal: "MTs Negeri 1 Jakarta"). |
| `jenjang` | `enum` | Index | Tingkat madrasah: `RA` \| `MI` \| `MTs` \| `MA`. |
| `statusMadrasah`| `enum` | Index | Status kepemilikan madrasah: `NEGERI` \| `SWASTA`. |
| `alamat` | `object` | JSON | Alamat fisik madrasah: `{ jalan, rt, rw, desa, kecamatan, kabupaten, provinsi, kodePos }`. |
| `telepon` | `string` | | Nomor telepon resmi instansi madrasah. |
| `email` | `string` | | Alamat email resmi madrasah. |
| `namaKepala` | `string` | | Nama Lengkap Kepala Madrasah saat ini beserta gelar akademisnya. |
| `nipKepala` | `string` | | NIP Kepala Madrasah jika statusnya adalah ASN (PNS/PPPK). |
| `status` | `enum` | Index | Status lisensi/operasional tenant: `ACTIVE` \| `TRIAL` \| `SUSPENDED` \| `EXPIRED`. |
| `createdAt` | `string` | ISO 8601 | Waktu pembuatan tenant di sistem. |
| `updatedAt` | `string` | ISO 8601 | Waktu pembaruan data profil terakhir. |
| `version` | `number` | Integer | Versi dokumen untuk delta sync. |
| `schemaVersion`| `number` | Integer | Versi skema dokumen. |
| `syncStatus` | `enum` | Local-Only | Status sinkronisasi lokal. |
| `deleted` | `boolean` | Index | Penanda soft-delete. |
| `deletedAt` | `string` | ISO 8601 / Null | Waktu soft-delete. |
| `lastModifiedDevice`| `string` | | ID perangkat fisik pembaruan terakhir. |

---

### 2. Entity: GTK - Guru & Tenaga Kependidikan (`gtk`)
* **Tujuan**: Menyimpan data master kepegawaian seluruh pendidik (Guru) dan tenaga kependidikan (Staf TU, Satpam, Penjaga Madrasah, dsb).
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.
* **Isolasi Tenant**: Multi-Tenant (`tenantId` wajib).

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4 (deterministic / stable generated). |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. |
| `nik` | `string` | Unique / Index | Nomor Induk Kependudukan (16 digit). Wajib diisi untuk Non-ASN. |
| `nip` | `string` | Unique / Index | Nomor Induk Pegawai (18 digit). Wajib diisi untuk ASN. |
| `namaLengkap` | `string` | Index | Nama lengkap GTK tanpa gelar akademis. |
| `gelarDepan` | `string` | | Gelar akademis depan (misal: "Drs.", "H.", "Hj."). |
| `gelarBelakang` | `string` | | Gelar akademis belakang (misal: "S.Pd.", "M.Pd.", "M.Si."). |
| `jenisKelamin` | `enum` | `L` \| `P` | Laki-laki (`L`) atau Perempuan (`P`). |
| `tanggalLahir` | `string` | YYYY-MM-DD | Tanggal lahir sesuai SK Kepegawaian / KTP. |
| `employmentStatus`| `enum` | Index | Status kepegawaian: `PNS` \| `PPPK` \| `GTY` \| `GTT` \| `HONORER` \| `KONTRAK`. |
| `asnStatus` | `enum` | Index | Status ASN: `ASN` \| `NON_ASN`. |
| `statusAktif` | `enum` | Index | Status keaktifan mengajar: `AKTIF` \| `CUTI` \| `PENSIUN` \| `MUTASI` \| `NONAKTIF`. |
| `createdAt` | `string` | ISO 8601 | Waktu pendaftaran data GTK. |
| `updatedAt` | `string` | ISO 8601 | Waktu pembaruan data GTK terakhir. |
| `createdBy` | `string` | FK | `userId` admin yang menginput. |
| `updatedBy` | `string` | FK | `userId` admin yang memperbarui terakhir. |
| `version` | `number` | Integer | Versi dokumen. |
| `schemaVersion`| `number` | Integer | Versi skema dokumen. |
| `syncStatus` | `enum` | Local-Only | Status sinkronisasi lokal. |
| `deleted` | `boolean` | Index | Penanda soft-delete. |
| `deletedAt` | `string` | ISO 8601 / Null | Waktu soft-delete. |
| `lastModifiedDevice`| `string` | | ID perangkat fisik pembaruan terakhir. |

#### Aturan Bisnis GTK (Business Rules Mapping)
1. **Aturan Validasi ASN**: Jika `asnStatus` bernilai `ASN`, maka kolom `nip` **wajib diisi** (18 digit angka valid) dan tidak boleh null/kosong.
2. **Aturan Validasi Non-ASN**: Jika `asnStatus` bernilai `NON_ASN`, maka kolom `nik` **wajib diisi** (16 digit angka valid) dan tidak boleh null/kosong.

---

### 3. Entity: Siswa / Student (`students`)
* **Tujuan**: Menyimpan data identitas siswa resmi yang terdaftar di madrasah.
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.
* **Isolasi Tenant**: Multi-Tenant (`tenantId` wajib).

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4 (stable generated). |
| `idUnik` | `string` | Unique / Index | ID unik internal madrasah untuk pencetakan QR Card (NIM / No. Induk). |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. |
| `nisn` | `string` | Unique / Index | Nomor Induk Siswa Nasional (10 digit angka unik dari Pusdatin). |
| `nik` | `string` | Unique / Index | Nomor Induk Kependudukan siswa (16 digit). |
| `namaLengkap` | `string` | Index | Nama lengkap siswa sesuai Akta Kelahiran. |
| `tanggalLahir` | `string` | YYYY-MM-DD | Tanggal lahir resmi siswa. |
| `jenisKelamin` | `enum` | `L` \| `P` | Laki-laki (`L`) atau Perempuan (`P`). |
| `statusSiswa` | `enum` | Index | Status siswa saat ini: `AKTIF` \| `LULUS` \| `MUTASI` \| `KELUAR`. |
| `classId` | `string` | **Foreign Key (FK)** | Merujuk ke `classes.id`. Null jika belum masuk kelas. |
| `createdAt` | `string` | ISO 8601 | Waktu pendaftaran data siswa. |
| `updatedAt` | `string` | ISO 8601 | Waktu pembaruan data terakhir. |
| `createdBy` | `string` | FK | `userId` yang mendaftarkan siswa. |
| `updatedBy` | `string` | FK | `userId` yang merubah data siswa terakhir. |
| `version` | `number` | Integer | Versi dokumen. |
| `schemaVersion`| `number` | Integer | Versi skema dokumen. |
| `syncStatus` | `enum` | Local-Only | Status sinkronisasi lokal. |
| `deleted` | `boolean` | Index | Penanda soft-delete. |
| `deletedAt` | `string` | ISO 8601 / Null | Waktu soft-delete. |
| `lastModifiedDevice`| `string` | | ID perangkat fisik pembaruan terakhir. |

---

### 4. Entity: Orang Tua / Wali (`parents`)
* **Tujuan**: Menyimpan identitas orang tua (ayah/ibu) atau wali sah dari siswa madrasah.
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.
* **Isolasi Tenant**: Multi-Tenant (`tenantId` wajib).

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4. |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. |
| `nik` | `string` | Unique / Index | Nomor Induk Kependudukan orang tua (16 digit). |
| `namaLengkap` | `string` | Index | Nama lengkap orang tua/wali sesuai KTP. |
| `pekerjaan` | `string` | | Jenis pekerjaan orang tua/wali. |
| `alamat` | `object` | JSON | Struktur alamat e-KTP orang tua. |
| `telepon` | `string` | Index | Nomor ponsel aktif (wajib untuk notifikasi WhatsApp/SMS presensi). |
| `hubungan` | `enum` | | Hubungan dengan siswa: `AYAH` \| `IBU` \| `WALI`. |
| `createdAt` | `string` | ISO 8601 | Waktu pendaftaran data orang tua. |
| `updatedAt` | `string` | ISO 8601 | Waktu pembaruan terakhir. |
| `version` | `number` | Integer | Versi dokumen. |
| `schemaVersion`| `number` | Integer | Versi skema dokumen. |
| `syncStatus` | `enum` | Local-Only | Status sinkronisasi lokal. |
| `deleted` | `boolean` | Index | Penanda soft-delete. |
| `deletedAt` | `string` | ISO 8601 / Null | Waktu soft-delete. |
| `lastModifiedDevice`| `string` | | ID perangkat pembaruan terakhir. |

---

### 5. Entity Relation: Student-Parent Map (`student_parents`)
* **Tujuan**: Menghubungkan siswa dengan satu atau beberapa orang tua/wali (dan sebaliknya) secara ternormalisasi. Mendukung kasus satu keluarga memiliki beberapa anak di madrasah yang sama (1 Parent -> N Students) dan satu siswa memiliki Ayah dan Ibu terdaftar (1 Student -> 2 Parents).
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | Komposit: `studentId_parentId`. |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. |
| `studentId` | `string` | **Foreign Key (FK)** | Merujuk ke `students.id`. |
| `parentId` | `string` | **Foreign Key (FK)** | Merujuk ke `parents.id`. |
| `isPrimary` | `boolean` | | Penanda apakah orang tua ini menjadi kontak darurat utama/penerima notifikasi SMS utama (`true` atau `false`). |
| `createdAt` | `string` | ISO 8601 | Waktu hubungan ini dicatatkan. |
| `version` | `number` | Integer | Versi dokumen. |
| `schemaVersion`| `number` | Integer | Versi skema dokumen. |
| `syncStatus` | `enum` | Local-Only | Status sinkronisasi lokal. |
| `deleted` | `boolean` | Index | Penanda soft-delete. |
| `deletedAt` | `string` | ISO 8601 / Null | Waktu soft-delete. |
| `lastModifiedDevice`| `string` | | ID perangkat fisik pembaruan terakhir. |
