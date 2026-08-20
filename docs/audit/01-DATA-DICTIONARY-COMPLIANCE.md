# Enterprise Data Dictionary e-MAM V7.8
## 01. Audit Kepatuhan Kamus Data (Data Dictionary Compliance Audit)

Dokumen ini adalah laporan audit teknis komprehensif yang memetakan status kepatuhan dari basis kode (codebase) saat ini terhadap **Enterprise Data Dictionary V7.8** serta kontrak skema lokal Dexie.

---

### 1. RINGKASAN STATUS KEPATUHAN (COMPLIANCE INDEX)

#### IDENTITY DOMAIN
| Entity Table | Status | Deskripsi Temuan & Kesenjangan (Gaps) |
| :--- | :---: | :--- |
| `users` | ❌ | Struktur schema masih menggunakan `uid` (dari Firebase) sebagai penentu utama di beberapa modul, sedangkan kontrak mewajibkan Primary Key berupa deterministic stable UUID `id` dan `authUid` sebagai index pendukung. Field `username` belum diimplementasikan di model Zod. |
| `identity_profiles` | ❌ | **SANGAT KRITIS / TOTAL GAP**. Tidak ditemukan Zod Schema (`IdentityProfileSchema`), Model, maupun deklarasi Table Dexie untuk entitas ini di `db.ts`. |
| `user_roles` | ❌ | **TOTAL GAP**. Tidak ada tabel Dexie `user_roles`. Relasi role saat ini masih menempel langsung pada properti `roles` di dalam tabel `users`, melanggar normalisasi multi-tenant RBAC. |

#### MASTER DOMAIN
| Entity Table | Status | Deskripsi Temuan & Kesenjangan (Gaps) |
| :--- | :---: | :--- |
| `tenants` | ❌ | Deklarasi tabel Dexie saat ini masih sangat minimalis (`id, tenantCode, slug, npsn, tenantsId`), belum mencakup field-field profil madrasah esensial seperti `nsm`, `namaMadrasah`, `jenjang`, `statusMadrasah`, dll. |
| `gtk` | ❌ | Struktur data master pendidik saat ini terduplikasi antara tabel `gtk` dan tabel `teachers` (melanggar Golden Rule pencegahan duplikasi data). Zod schema masih bernama `TeacherSchema` (bukan `GtkSchema`). Indeks `[tenantId+statusAktif]` belum diimplementasikan (masih menggunakan `[tenantId+status]`). |
| `students` | ❌ | Terjadi konflik arsitektur: Versi 16 Dexie menetapkan `idUnik` sebagai Primary Key utama tabel `students`, sedangkan kontrak V7.8 menetapkan deterministic UUID `id` sebagai Primary Key dan `idUnik` sebagai indeks bisnis. Zod schema masih memakai `statusAktif` (boolean) bukannya `statusSiswa` (enum). |
| `parents` | ❌ | **TOTAL GAP**. Tabel di Dexie dinamakan `orang_tua` secara legacy, belum disesuaikan menjadi `parents`. Tidak ada Zod schema atau repository formal untuk mengelola entitas ini. |
| `student_parents` | ❌ | **TOTAL GAP**. Tabel penengah relasi banyak-ke-banyak antara siswa dan orang tua ini sama sekali belum didefinisikan secara schema, table, maupun repository. |

#### ACADEMIC DOMAIN
| Entity Table | Status | Deskripsi Temuan & Kesenjangan (Gaps) |
| :--- | :---: | :--- |
| `academic_years` | ❌ | Belum memiliki Zod Schema resmi. Tabel Dexie masih menggunakan indeks `[tenantId+isActive]` dari versi legacy, bukan `[tenantId+status]` sesuai kontrak V7.8. |
| `semesters` | ❌ | Belum memiliki Zod Schema resmi. Terjadi duplikasi nama properti tabel di `db.ts` antara `semester` (singular) dan `semesters` (plural). |
| `classes` | ❌ | Zod Schema `ClassSchema` mendefinisikan tahun ajaran secara flat string `academicYear`, bukannya foreign key `academicYearId` yang merujuk ke tabel `academic_years`. |
| `subjects` | ❌ | Belum memiliki Zod Schema resmi. Terjadi duplikasi nama properti tabel di `db.ts` antara `mata_pelajaran` dan `subjects`. |
| `rooms` | ❌ | Belum memiliki Zod Schema resmi. Terjadi duplikasi nama properti tabel di `db.ts` antara `ruang` dan `rooms`. |
| `schedules` | ❌ | Belum memiliki Zod Schema resmi. Terjadi duplikasi nama properti tabel di `db.ts` antara `jadwal` dan `schedules`. |
| `attendance` | ❌ | Struktur index komposit multi-tenant `[tenantId+classId+date]` dan `[tenantId+date]` belum terbentuk di tabel `attendance` (saat ini masih menggunakan variasi nama kolom legacy seperti `tanggal` bukannya `date`). |
| `grades` | ❌ | **TOTAL GAP**. Belum memiliki Zod Schema resmi. Tabel Dexie dinamai `penilaian` bukannya `grades`, dan belum ada repository formal khusus untuk entitas ini. |

---

### 2. AUDIT STRUKTUR INDEX & SCHEMA DEXIE (DEXIE GAP ANALYSIS)

Berdasarkan analisis file `/src/core/database/db.ts`:

1. **Schema Versioning Gap**:
   Database lokal saat ini berada pada skema Versi 18, namun skema versi 18 tersebut hanya menambahkan tabel pendukung Identity Center (`user_sessions`, `user_devices`, `user_activity_logs`). Struktur tabel utama masih mewarisi indeks legacy dari Versi 12.
2. **Missing Database Properties (Properties Mismatch)**:
   Class `EMamDatabase` tidak mendeklarasikan properti tipe `Table` untuk entitas-entitas baru berikut:
   * `identity_profiles`
   * `user_roles`
   * `parents`
   * `student_parents`
   * `grades`
3. **Legacy Table Naming (Bahasa Indonesia vs Inggris Mismatch)**:
   Masih terdapat banyak tabel lama dalam Bahasa Indonesia yang berjalan paralel atau tumpang tindih dengan tabel Bahasa Inggris, menyebabkan kebingungan data:
   * `pengguna` vs `users`
   * `siswa` vs `students`
   * `orang_tua` vs `parents`
   * `tahun_pelajaran` vs `academic_years`
   * `semester` vs `semesters`
   * `daftar_kelas` / `kelas` vs `classes`
   * `mata_pelajaran` vs `subjects`
   * `ruang` vs `rooms`
   * `jadwal` vs `schedules`
   * `absensi_siswa` vs `attendance`
   * `absensi_guru` vs `teacher_attendance`
   * `jurnal` vs `journals`
   * `poin` vs `points`

---

### 3. AUDIT REPOSITORY COMPLIANCE & BOUNDARY VIOLATIONS

#### A. Kepatuhan Lapisan Repository (Repository Compliance)
Secara arsitektur, seluruh repository lokal terletak di `/src/database/repositories/`. 
* **Repository yang Ada**: `studentRepository.ts`, `attendanceRepository.ts`, `classRepository.ts`, `teacherRepository.ts`, `userRepository.ts`, dll.
* **Repository yang Hilang (Gaps)**:
  * `identityProfileRepository.ts`
  * `userRoleRepository.ts` (yang ada saat ini mem-bypass langsung ke tabel `users`)
  * `parentRepository.ts`
  * `studentParentRepository.ts`
  * `gradeRepository.ts`

#### B. Pelanggaran Batas Arsitektur (Boundary Violations)
Golden Rules IMAM mewajibkan isolasi ketat di mana komponen UI **DILARANG KERAS** mengakses SDK Firebase Firestore secara langsung.
* **Temuan Pelanggaran di UI Components**:
  Ditemukan setidaknya **34 baris pelanggaran** di mana komponen UI memanggil fungsi `collection(db, ...)` secara langsung untuk membaca/menulis ke Firestore (melewati lapisan Hook, Service, dan Repository):
  * `src/components/DeveloperConsole/StudentApprovalModal.tsx` (mengambil data `classes` langsung dari Firestore)
  * `src/components/SchemaMigrationSection.tsx` (melakukan scan koleksi `students`, `teachers`, `users`, `tenants` langsung di Firestore)
  * `src/components/Login.tsx` (melakukan kueri langsung ke koleksi `ticker` Firestore)
  * `src/components/SystemDocumentation.tsx` (membaca koleksi `documentation` langsung dari Firestore)
  * `src/components/Onboarding/ReferenceIdForm.tsx` (menulis data audit langsung ke Firestore)
  * `src/components/Profile.tsx` (membaca/menulis data `profile_update_requests` langsung dari Firestore)
  * `src/components/Assignments.tsx` (membaca data `teachers` dan `classes` langsung dari Firestore)
  * `src/components/DuplicateStudentsDashboard.tsx` (membaca siswa langsung dari Firestore)
  * `src/components/PointCategorySettings.tsx` (membaca/menulis kategori poin langsung di Firestore)

---

### 4. STATUS ANALISIS TYPECHECK (TSC ACTIVE ERRORS)

Hasil pemeriksaan tipe statis (`npx tsc --noEmit`) menunjukkan beberapa kegagalan kompilasi aktif yang dikategorikan ke dalam 3 kelompok utama:

#### Kategori 1: Pelanggaran Kontrak `AppEntity` pada Repository
Beberapa tipe entitas tidak memenuhi batasan generik `AppEntity` yang didefinisikan pada `BaseRepository` karena properti meta wajib (`createdAt`, `updatedAt`, `deleted`, `syncStatus`, `version`) di set sebagai optional atau hilang dari deklarasi:
* `SurveyAnswerRepository.ts`: Tipe `SurveyAnswer` kehilangan `updatedAt, syncStatus, version, deleted`.
* `SurveyQuestionRepository.ts`: Tipe `SurveyQuestion` kehilangan `createdAt, updatedAt, syncStatus, version, deleted`.
* `SurveyStatisticsRepository.ts`: Tipe `SurveyStatistics` kehilangan `createdAt, syncStatus, version, deleted`.
* `SurveyTemplateRepository.ts`: Tipe `SurveyTemplate` kehilangan `createdAt, updatedAt, syncStatus, version, deleted`.
* `UserDeviceRepository.ts` & `UserSessionRepository.ts`: Kehilangan properti dasar `AppEntity`.
* `studentRepository.ts`: Konflik tipe `id` pada `StudentSchema` di mana `id` diset sebagai optional karena beralih ke `idUnik` sebagai PK, sedangkan parent `AppEntity` mewajibkan `id` bertipe `string` non-optional.

#### Kategori 2: Modul UI Baru yang Belum Lengkap (Missing Shadcn-ui Modules)
Ditemukan dependensi impor fiktif ke folder `@/components/ui/` pada modul manajemen pengguna yang baru saja ditambahkan, menyebabkan error impor fatal:
* `UserDrawer.tsx` mengimpor module fiktif `@/components/ui/drawer` & `@/components/ui/tabs`.
* `UserListPage.tsx` mengimpor module fiktif `@/components/ui/button`, `@/components/ui/card`, `@/components/ui/input`.
* `UserListPage.tsx` mencoba membaca properti statistik (`google`, `email`, `device`, `suspended`) yang tidak terdefinisi di objek penampung.

#### Kategori 3: Inkompatibilitas Seeder & Domain Service
* `DexieOperationalSeeder.ts` menggunakan properti legacy `tenantsId` pada data GTK, padahal model tipe modern hanya mengenal properti tunggal `tenantId` (menimbulkan error pencocokan properti).
* `UserAccountService.ts` mengalami error tipe karena tipe Zod `User` tidak cocok dengan batasan entitas domain `UserEntity` (kekurangan bidang `authProvider`, `emailVerified`, dll).

---

### 5. RENCANA PERBAIKAN STRATEGIS (TACTICAL BACKLOG)

Untuk menyelaraskan sistem dengan e-MAM V7.8, langkah-langkah perbaikan wajib dieksekusi secara berurutan:

1. **Langkah 1: Perbaikan Modul UI Pengguna yang Rusak**
   * Mengganti seluruh impor shadcn fiktif (`@/components/ui/...`) di `UserDrawer.tsx` dan `UserListPage.tsx` dengan komponen UI standar yang ada di dalam proyek atau menyusun markup Tailwind murni yang mandiri.
2. **Langkah 2: Migrasi Skema Dexie ke Versi Terbaru (V19/V20)**
   * Mendefinisikan class properti lengkap untuk seluruh entitas baru pada `EMamDatabase` di `db.ts`.
   * Menulis deklarasi toko data Dexie yang baru sesuai dengan Kontrak Skema lokal Dexie pada Versi terbaru (misal: `version(19)`), menetapkan indeks komposit multi-tenant secara tepat, serta menyelaraskan tipe Primary Key untuk siswa (`id` UUID + `idUnik` index).
3. **Langkah 3: Sinkronisasi Zod Schemas & Tipe Entitas**
   * Memperbarui `schemas.ts` agar menyelaraskan model Zod `StudentSchema`, `AttendanceDailySchema`, `ClassSchema` dengan Enterprise Data Dictionary.
   * Membuat Zod Schema baru untuk entitas yang absen: `IdentityProfileSchema`, `ParentSchema`, `StudentParentSchema`, `GradeSchema`, `AcademicYearSchema`, `SemesterSchema`, `SubjectSchema`, `RoomSchema`, `ScheduleSchema`.
4. **Langkah 4: Pembuatan Repository Baru & Perbaikan AppEntity**
   * Mengimplementasikan repository baru untuk melengkapi domain yang kosong.
   * Memperbaiki inkompatibilitas tipe `AppEntity` pada model dengan menambahkan properti metadata wajib secara konsisten.
5. **Langkah 5: Pembersihan & Isolasi Firestore (Boundary Enforcement)**
   * Merefaktor komponen-komponen UI yang masih mengakses Firestore langsung agar memanggil domain Service atau Hook lokal yang membaca data dari database operasional Dexie.
