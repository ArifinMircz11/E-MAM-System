# Field Mapping Contract (e-MAM V7.8)
## PROJECT: e-MAM System Enterprise V7.8
### TYPE: IMMUTABLE DATA STANDARD CONTRACT

Kontrak pemetaan ini menetapkan aturan transformasi data dari struktur lama (Legacy Firestore) ke struktur baru (e-MAM Enterprise V7.8 & Dexie Schema).

---

## 1. IDENTITY DOMAIN MAPPING (`users` + `identity_profiles` + `user_roles`)

### Sumber: Koleksi `users` Legacy

| Legacy Field | Target Field V7.8 | Jenis Transformasi / Rule |
|:---|:---|:---|
| `uid` | `users.authUid` | Salin langsung sebagai pengenal Firebase Authentication. |
| `uid` | `users.id` | Buat deterministic UUID v4/v5 stabil sebagai PK utama `users.id`. |
| `email` | `users.email` | Normalisasi ke huruf kecil (`toLowerCase()`). |
| `displayName` | `identity_profiles.namaLengkap` | Masuk ke tabel profil fisik terpisah. |
| `uid` | `identity_profiles.userId` | Relasikan profil ke akun pengguna via `userId`. |
| `role` | `user_roles.role` | Masuk ke tabel terpisah `user_roles`. Konversi ke uppercase baku (misal: "GURU" atau "ADMIN"). |
| `roles` | `user_roles` | Buat entri multi-role baru di `user_roles` untuk setiap peran di array. |

---

## 2. MASTER DOMAIN MAPPING (`teachers` -> `gtk` & `students`)

### Sumber 1: Koleksi `teachers` Legacy -> Target: `gtk`

| Legacy Field | Target Field V7.8 | Jenis Transformasi / Rule |
|:---|:---|:---|
| `teachersId` | `gtk.teachersId` | Dijadikan nomor identitas bisnis (NIP/NIK). |
| `teachersId` | `gtk.id` | Buat deterministic UUID sebagai PK utama `gtk.id` berdasarkan hash `teachersId`. |
| `namaLengkap` | `gtk.namaLengkap` | Salin langsung sebagai nama lengkap guru. |
| `gender` | `gtk.jenisKelamin` | Normalisasi ke enum baku `L` atau `P`. |
| `active` | `gtk.statusAktif` | Konversi boolean status keaktifan. |
| `phone` | `identity_profiles.kontak.noHp` | Pindahkan data kontak personal ke profil terkait. |
| `address` | `identity_profiles.alamat.jalan` | Pindahkan data alamat ke objek alamat profil terkait. |

### Sumber 2: Koleksi `students` Legacy -> Target: `students`

| Legacy Field | Target Field V7.8 | Jenis Transformasi / Rule |
|:---|:---|:---|
| `idUnik` | `students.idUnik` | Tetap dipertahankan sebagai Business ID untuk scan QR. |
| `idUnik` | `students.id` | Buat deterministic UUID PK utama `students.id` berdasarkan hash `idUnik`. |
| `namaLengkap` | `students.namaLengkap` | Salin langsung nama lengkap siswa. |
| `nisn` | `students.nisn` | Salin langsung (jika kosong, set default empty string `""`). |
| `rombel` | `students.className` | Normalisasi penulisan rombongan belajar (misal: "Kelas IX A"). |
| `statusAktif` | `students.status` | Jika `true`, set `'Aktif'`. Jika `false`, set `'Lulus'` atau `'Pindah'`. |

---

## 3. ACADEMIC DOMAIN MAPPING (`classes` + `academic_years` + `schedules`)

### Sumber 1: Koleksi `classes` Legacy -> Target: `classes`

| Legacy Field | Target Field V7.8 | Jenis Transformasi / Rule |
|:---|:---|:---|
| `classId` | `classes.classId` | Jadikan nomor identitas kelas bisnis. |
| `classId` | `classes.id` | Buat deterministic UUID sebagai PK utama `classes.id`. |
| `academicYear` | `classes.academicYearId` | Lakukan lookup ke tabel `academic_years` berdasarkan nilai string, ambil UUID target. |
| `teacherId` | `classes.waliKelasId` | Lakukan lookup ke tabel `gtk` berdasarkan `teachersId` lama, hubungkan ke UUID `gtk.id`. |

---

## 4. ATTENDANCE DOMAIN MAPPING (`attendance`)

### Sumber: Koleksi `attendance` Legacy -> Target: `attendance_daily`

| Legacy Field | Target Field V7.8 | Jenis Transformasi / Rule |
|:---|:---|:---|
| `tanggal` | `attendance_daily.date` | Salin nilai tanggal (format YYYY-MM-DD). |
| `studentId` | `attendance_daily.studentId` | **Penting**: Cari UUID `students.id` di tabel baru berdasarkan `idUnik` legacy pada field lama, masukkan UUID sebagai FK baru. |
| `classId` | `attendance_daily.classId` | Cari UUID `classes.id` berdasarkan `classId` legacy. |

---

## 5. POINT DOMAIN MAPPING (`poin` + `points` + `point_records`)

### Sumber: Koleksi Poin Legacy -> Target: `point_transactions`

| Legacy Field | Target Field V7.8 | Jenis Transformasi / Rule |
|:---|:---|:---|
| `studentId` | `point_transactions.studentId` | Cari UUID `students.id` berdasarkan `idUnik` legacy. |
| `category` | `point_transactions.categoryId` | Cari UUID kategori poin `point_categories.id` yang sesuai. |
| `points` | `point_transactions.poin` | Salin nilai angka poin mutasi. |
| `type` | `point_transactions.jenis` | Konversi ke enum baku `'Penghargaan'` atau `'Pelanggaran'`. |
