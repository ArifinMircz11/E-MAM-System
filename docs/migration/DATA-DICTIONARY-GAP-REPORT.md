# Data Dictionary Gap Report (e-MAM V7.8 Compliance Audit)
## PROJECT: e-MAM System Enterprise V7.8
### STATUS: AUDITED & GAP IDENTIFIED

Laporan ini memetakan kesenjangan (gap) antara koleksi data Firestore Legacy dengan entitas target yang diwajibkan oleh **Enterprise Data Dictionary V7.8** serta kontrak database Dexie lokal.

---

## 1. PEMETAAN ENTITAS LEGACY VS TARGET V7.8

Berikut adalah tabel pemetaan kesenjangan komprehensif untuk seluruh modul utama e-MAM:

| No | Koleksi Legacy Firestore | Entitas Target V7.8 | Status Kepatuhan | Kesenjangan Utama (Major Gaps) & Solusi |
|:---|:---|:---|:---:|:---|
| 1 | `users` | `users` + `identity_profiles` + `user_roles` | ❌ TOTAL GAP | **Kritis**: Akun (`users`) saat ini menampung data profil fisik dan array role sekaligus. <br>**Solusi**: Pecah menjadi 3 entitas terpisah: `users` (otentikasi), `identity_profiles` (profil fisik), dan `user_roles` (multi-role RBAC terisolasi). |
| 2 | `teachers` | `gtk` | ❌ NON-COMPLIANT | **Kesenjangan**: Penamaan `teachers` melanggar aturan singular dan Golden Rule penamaan. Data personal (`phone`, `address`) masih flat. <br>**Solusi**: Migrasi ke `gtk` dengan format PK deterministic UUID, pisahkan data personal ke `identity_profiles`, dan simpan data kepegawaian esensial saja di `gtk`. |
| 3 | `students` | `students` | ❌ NON-COMPLIANT | **Kesenjangan**: Menggunakan `idUnik` (bisnis) sebagai PK, bukan deterministic `id` UUID. Field rombel menggunakan penamaan legacy `tingkatRombel` dan `rombel`. <br>**Solusi**: Mapping `id` sebagai UUID baru berdasarkan `idUnik`, letakkan `idUnik` sebagai indeks bisnis, dan normalkan rombel ke `className`. |
| 4 | `classes` | `classes` | ❌ NON-COMPLIANT | **Kesenjangan**: Field `academicYear` bertipe string langsung (misal: "2025/2026"), bukan foreign key. <br>**Solusi**: Ganti menjadi `academicYearId` yang merujuk ke tabel `academic_years`. |
| 5 | `attendance` | `attendance_daily` | ❌ NON-COMPLIANT | **Kesenjangan**: Menggunakan penamaan properti legacy `tanggal` (bukan `date`) dan `studentId` merujuk ke `idUnik` legacy (bukan UUID `id` siswa). <br>**Solusi**: Ganti ke tabel `attendance_daily`, mapping `tanggal` ke `date`, dan map `studentId` ke UUID `id` siswa yang baru hasil migrasi. |
| 6 | `poin`, `points`, `point_records`, `point_transactions`, `student_points` | `point_transactions` | ❌ TOTAL GAP | **Kesenjangan**: Terdapat 5 tabel terpisah yang saling tumpang tindih untuk pencatatan poin kedisiplinan. <br>**Solusi**: Konsolidasikan seluruh riwayat poin lama ke dalam satu entitas transaksi tunggal yaitu `point_transactions` dengan schema yang seragam. |
| 7 | `academic_years` | `academic_years` | ❌ NON-COMPLIANT | **Kesenjangan**: Indeks multi-tenant `[tenantId+status]` belum terintegrasi di skema Dexie. <br>**Solusi**: Sesuaikan deklarasi Dexie dan samakan properti status keaktifan. |
| 8 | `schedules` | `schedules` | ❌ NON-COMPLIANT | **Kesenjangan**: Tidak memiliki Zod schema resmi dan properti status keaktifan yang konsisten. <br>**Solusi**: Buat Zod schema `ScheduleSchema` dan mapping properti yang tepat. |
| 9 | `letters` | `student_letters` | ❌ NON-COMPLIANT | **Kesenjangan**: Nama koleksi tidak konsisten, enum status masih menggunakan format lama (`approved`, `rejected` dll). <br>**Solusi**: Rename ke `student_letters` dan transformasikan status surat ke enum baku (`Signed`, `Ditolak`, `Pending`). |
| 10 | `parents` (legacy `orang_tua`) | `parents` + `student_parents` | ❌ TOTAL GAP | **Kesenjangan**: Belum ada model penengah relasi siswa dan wali murid. <br>**Solusi**: Tambahkan tabel `parents` untuk profil orang tua dan tabel penengah `student_parents` (Many-to-Many). |

---

## 2. DETAIL AUDIT STRUKTUR PENANDA DAN METADATA WAJIB

Sesuai aturan **AGENTS.md (Rule 41 - Standard Metadata)**, seluruh dokumen bisnis yang disinkronkan ke Firestore wajib memiliki metadata pelacakan audit. 

### Evaluasi Kepatuhan Metadata Legacy:
- **`tenantId`**: Tersedia di ~85% dokumen legacy. Untuk dokumen yang tidak memilikinya (misal global config), harus diisi secara dinamis dengan default tenant atau disaring saat migrasi.
- **`createdAt` / `updatedAt`**: Legacy menggunakan representasi campuran (Firestore Timestamp, ISO string, epoch milliseconds). Seluruh waktu wajib diseragamkan menjadi **ISO 8601 UTC String** (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- **`createdBy` / `updatedBy`**: Seringkali kosong atau bertipe null pada legacy. Wajib diisi ID user system administrator saat migrasi jika data asli tidak tersedia.
- **`version` / `schemaVersion`**: Tidak terdefinisi di data legacy. Wajib di-seeding dengan nilai default `version: 1` dan `schemaVersion: 1` untuk inisialisasi konkurensi database offline Dexie.
- **`syncStatus`**: Merupakan penanda lokal Dexie. Saat migrasi selesai dimasukkan ke Dexie, nilai ini diset menjadi `'synced'` agar Sync Engine mengetahui data tersebut sudah sinkron dengan Cloud dan mencegah pengiriman ulang yang membengkakkan kuota write Firestore.

---

## 3. REKOMENDASI INTERVENSI LAYER MIGRASI

1. **Strict Mapping Layer (No Bypass)**:
   Mappers wajib diletakkan pada folder `/src/migration/firestore/mappers/` untuk mengisolasi logika transformasi dari domain operasional aktif.
2. **Deterministic UUID Key Generator**:
   Seluruh primary key (`id`) hasil migrasi wajib dihasilkan secara deterministik menggunakan skema hash UUID v5 (menggunakan namespace tenant + ID legacy) atau format unik stabil agar record yang sama jika di-import ulang tidak menghasilkan duplikat.
3. **Pembersihan Data Koruptif**:
   Setiap baris data yang kehilangan field mandatory (seperti `idUnik` pada siswa atau `npsn` pada guru) wajib ditolak oleh Validation Layer dan dicatat dalam file log error penolakan.
