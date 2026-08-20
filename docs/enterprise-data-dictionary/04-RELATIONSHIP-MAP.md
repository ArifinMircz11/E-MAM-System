# Enterprise Data Dictionary e-MAM V7.8
## 04. Relationship Map (Peta Relasi Antar Entitas)

Dokumen ini memetakan relasi logis, batasan integritas referensial (Foreign Keys), serta pemisahan arsitektural antara Kunci Sistem (System Primary Key) dengan Nomor Pengenal Operasional (Business ID) di seluruh modul e-MAM System.

---

### 1. Separation of System PK (`id`) vs Business ID

Demi kestabilan relasi antar tabel terhadap perubahan administratif, e-MAM System memisahkan secara ketat fungsi internal database dengan data operasional harian:

```text
+---------------------------------------------------------------------------------+
|                                 SISTEM UTAMA                                    |
|                                                                                 |
|   [System Primary Key: id]   <====== Menjadi FK Relasi Internal Sistem ======>  |
|   - Selalu UUID v4                                                              |
|   - Konsisten di Dexie & Firestore                                              |
|   - Tidak boleh berubah sekalipun data administratif berubah                    |
|                                                                                 |
+---------------------------------------------------------------------------------+
                                         |
                                         | (Dipisahkan dari)
                                         v
+---------------------------------------------------------------------------------+
|                                DATA OPERASIONAL                                 |
|                                                                                 |
|   [Business ID: idUnik / nisn / nip / nik / authUid]                           |
|   - Digunakan untuk Pemindaian QR Card (idUnik)                                 |
|   - Integrasi eksternal Kemenag / Pusdatin (nisn, npsn, nsm)                    |
|   - Pencarian UI harian oleh operator                                           |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

#### Kebijakan Resolusi Scanner QR Card
1. Kamera Scanner membaca teks barcode/QR yang memuat **`idUnik`** siswa (misal: `25001`).
2. Scanner melakukan **query lokal instan** (Index Lookup) ke tabel Dexie `students` berdasarkan `idUnik = "25001"`.
3. Dari pencarian tersebut, sistem mengambil nilai **`id` (System Primary Key)** (misal: `uuid-9876-5432-10ae`).
4. Baris transaksi baru pada tabel `attendance` diisi dengan:
   - `id`: `uuid_studentId_date`
   - `studentId`: `uuid-9876-5432-10ae` (System PK siswa, **bukan** `idUnik`!).
   - `classId`: `uuid_kelas_siswa`
   - `statusGlobal`: `HADIR`

---

### 2. Peta Relasi Utama & Foreign Keys

Berikut adalah daftar resmi foreign key yang menghubungkan tabel-tabel di seluruh Identity, Master, dan Academic Domain:

```text
 tenants (id)
   │
   ├───> users (tenantId)
   │       │
   │       ├───> identity_profiles (userId, tenantId)
   │       └───> user_roles (userId, tenantId)
   │
   ├───> gtk (tenantId) <───────────────────────────┐ (Wali Kelas)
   │       │                                        │
   │       ├───> schedules (teacherId)              │
   │       └───> grades (teacherId)                 │
   │                                                │
   ├───> students (tenantId, classId) ───> classes (waliKelasId)
   │       │                                 ▲
   │       ├───> student_parents (studentId) │ (Pengelompokan Rombel)
   │       ├───> attendance (studentId, classId)
   │       └───> grades (studentId, classId)
   │
   └───> parents (tenantId)
           │
           └───> student_parents (parentId)
```

---

### 3. Matriks Integritas Foreign Keys

| Source Table (Child) | FK Field | Target Table (Parent) | Target PK | Delete Rule | Update Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `users` | `tenantId` | `tenants` | `id` | RESTRICT | CASCADE |
| `identity_profiles`| `userId` | `users` | `id` | CASCADE | CASCADE |
| `identity_profiles`| `tenantId` | `tenants` | `id` | RESTRICT | CASCADE |
| `user_roles` | `userId` | `users` | `id` | CASCADE | CASCADE |
| `user_roles` | `tenantId` | `tenants` | `id` | RESTRICT | CASCADE |
| `gtk` | `tenantId` | `tenants` | `id` | RESTRICT | CASCADE |
| `students` | `tenantId` | `tenants` | `id` | RESTRICT | CASCADE |
| `students` | `classId` | `classes` | `id` | SET NULL | CASCADE |
| `parents` | `tenantId` | `tenants` | `id` | RESTRICT | CASCADE |
| `student_parents` | `studentId` | `students` | `id` | CASCADE | CASCADE |
| `student_parents` | `parentId` | `parents` | `id` | CASCADE | CASCADE |
| `classes` | `tenantId` | `tenants` | `id` | RESTRICT | CASCADE |
| `classes` | `academicYearId` | `academic_years` | `id` | RESTRICT | CASCADE |
| `classes` | `waliKelasId` | `gtk` | `id` | SET NULL | CASCADE |
| `schedules` | `tenantId` | `tenants` | `id` | RESTRICT | CASCADE |
| `schedules` | `classId` | `classes` | `id` | CASCADE | CASCADE |
| `schedules` | `subjectId` | `subjects` | `id` | RESTRICT | CASCADE |
| `schedules` | `teacherId` | `gtk` | `id` | RESTRICT | CASCADE |
| `schedules` | `roomId` | `rooms` | `id` | SET NULL | CASCADE |
| `attendance` | `studentId` | `students` | `id` | CASCADE | CASCADE |
| `attendance` | `classId` | `classes` | `id` | RESTRICT | CASCADE |
| `grades` | `studentId` | `students` | `id` | CASCADE | CASCADE |
| `grades` | `classId` | `classes` | `id` | RESTRICT | CASCADE |
| `grades` | `subjectId` | `subjects` | `id` | RESTRICT | CASCADE |

---

### 4. Kebijakan Cascading & Integritas Offline-First
1. **Soft Delete Baseline**: Di e-MAM System, penghapusan data fisik dihindari untuk menjaga sinkronisasi offline tetap konsisten. Oleh karena itu, aturan `DELETE` di atas sebagian besar diimplementasikan secara logis melalui flag `deleted = true` dan `deletedAt`.
2. **Cascade Soft-Delete**: Apabila entitas induk (misal: `students`) mengalami soft-delete (`deleted = true`), maka seluruh data relasi penghubungnya seperti `student_parents` **wajib** di-soft-delete secara otomatis oleh Service Layer sebelum dimasukkan ke antrean sinkronisasi `sync_queue`.
3. **Restrikasi Multi-Tenant**: Tidak diperbolehkan melakukan operasi `JOIN` atau lookup data lintas `tenantId`. Setiap query Dexie maupun Firestore **WAJIB** diawali dengan kondisi filter `.where('tenantId').equals(activeTenantId)`.
