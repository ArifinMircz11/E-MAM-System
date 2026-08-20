# Enterprise Data Dictionary e-MAM V7.8
## 05. Dexie Schema Contract (Kontrak Skema Dexie Lokal)

Dokumen ini mendefinisikan implementasi fisik dari Enterprise Data Dictionary pada IndexedDB lokal menggunakan **Dexie.js**. Skema ini dirancang untuk pencarian offline berkinerja tinggi, pengurutan, serta isolasi data multi-tenant menggunakan indeks komposit multi-atribut.

---

### 1. Deklarasi Toko Data Lokal (Dexie Stores Reference)

Skema toko data (stores) di bawah ini wajib dikonfigurasikan pada inisialisasi class `EMamDatabase` di `/src/core/database/db.ts`:

```typescript
this.version(18).stores({
  // --- IDENTITY DOMAIN ---
  users: 'id, tenantId, authUid, username, email, accountType, status, version, syncStatus',
  identity_profiles: 'id, userId, tenantId, nik, namaLengkap, version, syncStatus',
  user_roles: 'id, userId, tenantId, role, [tenantId+role], version, syncStatus',

  // --- MASTER DOMAIN ---
  tenants: 'id, nsm, npsn, namaMadrasah, status, version, syncStatus',
  gtk: 'id, tenantId, nik, nip, namaLengkap, employmentStatus, asnStatus, statusAktif, [tenantId+statusAktif], version, syncStatus',
  students: 'id, idUnik, tenantId, nisn, nik, namaLengkap, statusSiswa, classId, [tenantId+classId], [tenantId+statusSiswa], version, syncStatus',
  parents: 'id, tenantId, nik, namaLengkap, telepon, version, syncStatus',
  student_parents: 'id, tenantId, studentId, parentId, [tenantId+studentId], [tenantId+parentId], version, syncStatus',

  // --- ACADEMIC DOMAIN ---
  academic_years: 'id, tenantId, status, [tenantId+status], version, syncStatus',
  semesters: 'id, tenantId, academicYearId, status, [tenantId+status], version, syncStatus',
  classes: 'id, tenantId, academicYearId, tingkat, waliKelasId, [tenantId+academicYearId], version, syncStatus',
  subjects: 'id, tenantId, kodeMapel, namaMapel, kelompok, version, syncStatus',
  rooms: 'id, tenantId, namaRuang, tipe, version, syncStatus',
  schedules: 'id, tenantId, classId, teacherId, roomId, hari, [tenantId+classId], version, syncStatus',
  attendance: 'id, tenantId, studentId, classId, date, statusGlobal, [tenantId+date], [tenantId+classId+date], version, syncStatus',
  grades: 'id, tenantId, studentId, classId, semesterId, subjectId, jenisPenilaian, [tenantId+classId+subjectId], version, syncStatus',

  // --- INFRASTRUCTURE & LOGGING ---
  sync_queue: 'id, tenantId, collection, documentId, operation, status, createdAt',
  dead_letter_queue: 'id, tenantId, collection, documentId, operation, createdAt',
  audit_logs: 'id, tenantId, userId, action, createdAt, syncStatus',
  activity_logs: 'id, type, message, timestamp' // LOCAL ONLY (Tidak di-sync)
});
```

---

### 2. Penjelasan Indeks Komposit Multi-Tenant (Composite Indexes)

Untuk menjamin kueri lokal berjalan secepat kilat (sub-millisecond) dan aman dari kebocoran tenant (Multi-Tenant Leak), e-MAM mewajibkan penggunaan indeks komposit pada tabel-tabel rawan data besar:

#### A. Indeks `[tenantId+statusAktif]` (Tabel `gtk`)
* **Tujuan**: Memungkinkan pencarian cepat untuk memisahkan daftar Guru/Staf yang masih aktif mengajar dari yang sudah pensiun/cuti di satu tenant tertentu.
* **Contoh Kueri**:
  ```typescript
  const activeGtk = await db.gtk
    .where('[tenantId+statusAktif]')
    .equals([activeTenantId, 'AKTIF'])
    .toArray();
  ```

#### B. Indeks `[tenantId+classId]` & `[tenantId+statusSiswa]` (Tabel `students`)
* **Tujuan**: Menyaring daftar siswa berdasarkan kelas aktif mereka serta status keaktifan sekolah tanpa perlu melakukan scan seluruh database.
* **Contoh Kueri**:
  ```typescript
  const classStudents = await db.students
    .where('[tenantId+classId]')
    .equals([activeTenantId, selectedClassId])
    .filter(s => s.statusSiswa === 'AKTIF')
    .toArray();
  ```

#### C. Indeks `[tenantId+classId+date]` (Tabel `attendance`)
* **Tujuan**: Pencarian rekap absensi kelas harian secara instan untuk rendering tabel absensi interaktif.
* **Contoh Kueri**:
  ```typescript
  const classAttendanceToday = await db.attendance
    .where('[tenantId+classId+date]')
    .equals([activeTenantId, classId, todayDateStr])
    .toArray();
  ```

---

### 3. Kebijakan Migrasi Skema Lokal (Local Schema Upgrades)

Ketika rilis e-MAM V7.8 diluncurkan, IndexedDB perangkat pengguna mungkin masih berada pada versi skema lama (v12/v16). Sistem penanganan migrasi wajib mengikuti protokol aman:

1. **Incremental Versions**: Jangan pernah memodifikasi versi yang sudah berjalan (`version(12)` atau sebelumnya). Buat penambahan versi baru (`version(18)`) untuk merefleksikan perubahan skema V7.8.
2. **Upgrade Hook**: Definisikan fungsi transformasi data jika ada modifikasi nama kolom yang signifikan dari skema lama ke skema baru (misal: jika ada data legacy dari tabel indonesian `siswa` yang perlu dilarikan ke `students`).
3. **Pembersihan Cache Otomatis**: Jika terjadi error fatal corrupt schema saat proses inisialisasi aplikasi, sistem akan menangkap exception, melakukan `db.delete()`, meluncurkan database kosong baru, dan meminta `SyncEngine` melakukan pemulihan data penuh (Recovery Mode) dari Cloud Firestore.
