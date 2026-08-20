# Enterprise Data Dictionary e-MAM V7.8
## 01. Identity Domain (Domain Identitas & Keamanan)

Dokumen ini mendefinisikan kontrak skema data resmi untuk subsistem Identitas, Otentikasi, dan Otorisasi (RBAC) pada e-MAM System. Domain ini menjadi pondasi bagi seluruh isolasi multi-tenant dan penentuan hak akses operasional madrasah.

---

### 1. Entity: User Account (`users`)
* **Tujuan**: Menyimpan informasi akun login otentikasi pengguna yang terhubung langsung dengan Firebase Authentication.
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.
* **Isolasi Tenant**: Multi-Tenant (wajib memiliki `tenantId`).

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4 (deterministic / stable generated). |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. Menentukan batas isolasi tenant. |
| `authUid` | `string` | Unique / Index | Firebase Auth User ID (UID) untuk pencocokan token login. |
| `username` | `string` | Unique / Index | Username unik pengguna untuk fallback non-email login. |
| `email` | `string` | Unique / Index | Alamat email terdaftar dan terverifikasi. |
| `accountType` | `enum` | Index | Kategori akun: `SYSTEM_ADMIN`, `TENANT_USER`, `SERVICE_ACCOUNT`. |
| `status` | `enum` | Index | Status keaktifan akun: `PENDING`, `ACTIVE`, `SUSPENDED`, `INACTIVE`. |
| `createdAt` | `string` | ISO 8601 | Waktu pendaftaran akun (format UTC ISO 8601). |
| `updatedAt` | `string` | ISO 8601 | Waktu pembaruan akun terakhir (format UTC ISO 8601). |
| `createdBy` | `string` | FK | `userId` yang mendaftarkan akun ini. |
| `updatedBy` | `string` | FK | `userId` yang memperbarui akun ini terakhir kali. |
| `version` | `number` | Integer | Versi dokumen untuk kontrol konkurensi (optimistic locking). |
| `schemaVersion`| `number` | Integer | Versi skema dokumen (Default: `1`). |
| `syncStatus` | `enum` | Local-Only | `synced` \| `pending` \| `failed` (Status sinkronisasi lokal). |
| `deleted` | `boolean` | Index | Penanda soft-delete (`true` atau `false`). |
| `deletedAt` | `string` | ISO 8601 / Null | Waktu soft-delete dilakukan. |
| `lastModifiedDevice`| `string` | | ID perangkat fisik terakhir yang merubah baris ini. |

---

### 2. Entity: Identity Profile (`identity_profiles`)
* **Tujuan**: Memisahkan entitas kredensial login (`users`) dari informasi profil fisik/pribadi manusia sesungguhnya. Menghubungkan akun pengguna dengan entitas madrasah (GTK, Siswa, Orang Tua).
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.
* **Relasi**: Satu Akun (`users`) memiliki tepat satu Profil (`identity_profiles`).

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4. |
| `userId` | `string` | **Foreign Key (FK)** | Merujuk ke `users.id` (Unique Index). |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. |
| `namaLengkap` | `string` | Index | Nama lengkap tanpa gelar akademis (gelar diurus di GTK). |
| `nik` | `string` | Unique / Index | Nomor Induk Kependudukan (16 digit) sesuai e-KTP/KK. |
| `nomorIdentitas`| `string` | Index | Nomor identitas opsional (misal Paspor, KITAS, dsb). |
| `tanggalLahir` | `string` | YYYY-MM-DD | Tanggal lahir resmi sesuai dokumen negara. |
| `jenisKelamin` | `enum` | `L` \| `P` | Laki-laki (`L`) atau Perempuan (`P`). |
| `alamat` | `object` | JSON | Struktur alamat detail: `{ jalan, rt, rw, kelurahan, kecamatan, kabupaten, provinsi, kodePos }`. |
| `kontak` | `object` | JSON | Struktur kontak: `{ noHp, noTelp, emailAlternatif, telegramId }`. |
| `avatarUrl` | `string` | URL / Null | Tautan gambar profil pengguna (disimpan di Firebase Storage). |
| `createdAt` | `string` | ISO 8601 | Waktu profil dibuat. |
| `updatedAt` | `string` | ISO 8601 | Waktu profil diperbarui. |
| `createdBy` | `string` | FK | `userId` pembuat profil. |
| `updatedBy` | `string` | FK | `userId` pembaru terakhir profil. |
| `version` | `number` | Integer | Versi dokumen. |
| `schemaVersion`| `number` | Integer | Versi skema dokumen. |
| `syncStatus` | `enum` | Local-Only | Status sinkronisasi lokal. |
| `deleted` | `boolean` | Index | Penanda soft-delete. |
| `deletedAt` | `string` | ISO 8601 / Null | Waktu soft-delete. |
| `lastModifiedDevice`| `string` | | ID perangkat modifikasi terakhir. |

---

### 3. Entity: Role Assignment (`user_roles`)
* **Tujuan**: Mengelola penugasan peran (Role) dan cakupan izin akses (Permissions Scope) secara dinamis sesuai matriks RBAC e-MAM System. Mendukung penugasan multi-role per user.
* **Tipe Koleksi**: Firestore Top-Level & Dexie Table.

#### Skema Struktur Data
| Field Name | Type | Key/Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Primary Key (PK)** | UUID versi 4 atau komposit (`userId_role`). |
| `userId` | `string` | **Foreign Key (FK)** | Merujuk ke `users.id`. |
| `tenantId` | `string` | **Foreign Key (FK)** | Merujuk ke `tenants.id`. Membatasi hak role hanya di tenant ini. |
| `role` | `enum` | Index | Peran sistem yang diberikan (Lihat daftar di bawah). |
| `permissions` | `array<string>`| | Kumpulan override permission spesifik (jika ada). |
| `scope` | `object` | JSON | Cakupan akses instansial (misal: `{ classIds: ['CLASS_1', 'CLASS_2'], subjectIds: ['SUBJ_A'] }`). |
| `assignedAt` | `string` | ISO 8601 | Waktu penugasan role dilakukan. |
| `assignedBy` | `string` | FK | `userId` administrator yang menugaskan role ini. |
| `version` | `number` | Integer | Versi dokumen. |
| `schemaVersion`| `number` | Integer | Versi skema dokumen. |
| `syncStatus` | `enum` | Local-Only | Status sinkronisasi lokal. |
| `deleted` | `boolean` | Index | Penanda soft-delete. |
| `deletedAt` | `string` | ISO 8601 / Null | Waktu soft-delete. |
| `lastModifiedDevice`| `string` | | ID perangkat modifikasi terakhir. |

---

### Peran Sistem Resmi (System Roles)

Penetapan nama peran harus baku di seluruh layer kode pemrograman (Case Sensitive, Uppercase):

1. **`DEVELOPER`**: Akses tingkat tinggi, memotong seluruh validasi tenant, khusus tim teknis pusat e-MAM dan simulasi integrasi.
2. **`ADMIN`**: Administrator Madrasah lokal. Pemilik kontrol penuh atas data konfigurasi madrasah, pembuatan akun GTK, dan sinkronisasi darurat.
3. **`KAMAD`**: Kepala Madrasah. Hak akses pembacaan seluruh performa akademik madrasah, persetujuan surat keluar (PTSP), dan disposisi surat masuk.
4. **`KEPTU`**: Kepala Tata Usaha. Pengelola utama administrasi persuratan, inventaris madrasah, data master GTK, dan penugasan staf.
5. **`GURU`**: Guru Mata Pelajaran. Hak input presensi mandiri, pengisian jurnal mengajar kelas, dan penilaian akademis rombel yang diampunya.
6. **`GURU_BK`**: Guru Bimbingan Konseling. Hak akses khusus mencatat poin pelanggaran, konseling siswa, penanganan prestasi, dan mediasi orang tua.
7. **`STAF`**: Staf Administrasi / Tata Usaha. Memiliki hak operasional terbatas pada modul PTSP (Pelayanan Terpadu Satu Pintu) dan absensi harian umum.
8. **`SISWA`**: Siswa Madrasah. Akses melihat profil pribadi, riwayat absensi mandiri, pengumuman, perolehan nilai, kartu QR, dan akumulasi poin BK.
9. **`ORANG_TUA`**: Orang Tua / Wali Siswa. Akses memantau kehadiran anak, pengumuman madrasah, nilai akademis, dan catatan pelanggaran/prestasi anak.

---

### Validasi Domain & Aturan Keamanan Identitas (Security Rules Contract)
1. **Aturan Satu Profil**: Sistem tidak memperbolehkan satu `userId` memiliki lebih dari satu `identity_profiles`. Validasi harus dikunci pada level Service Layer sebelum enqueue sync.
2. **Isolasi Multi-Tenant Mutlak**: Data peran `user_roles` harus diverifikasi memiliki kecocokan `tenantId` dengan transaksi yang sedang diproses. Service Layer wajib melempar exception `PERMISSION_DENIED` jika ada upaya modifikasi data milik tenant lain.
3. **Pemberian Hak Akses (Least Privilege)**: Akun dengan role `GURU` tidak boleh melihat riwayat konseling BK bersifat rahasia kecuali siswa tersebut adalah wali kelasnya (scope `classId` rombel terkait).
