# 🔐 RBAC_MATRIX.md (KERNEL v7.7 STABLE)
Audit tersebut menunjukkan bahwa fondasi RBAC e-MAM sudah baik, tetapi dari perspektif arsitektur enterprise offline-first yang sedang Anda bangun, masih ada beberapa area yang sebaiknya diperkuat agar benar-benar konsisten dengan blueprint v7.7 dan prinsip yang sudah Anda tetapkan.

## Yang Sudah Sangat Baik

### 1. Single Source of Truth Role

```ts
export enum UserRole
```

Ini sudah benar.

Semua modul mengacu pada enum yang sama sehingga tidak ada hardcoded string seperti:

```ts
if(user.role === "admin")
```

yang tersebar di seluruh project.

---

### 2. ProtectedRoute

Layer UI sudah diproteksi.

Alurnya menjadi

```
User Login
      │
      ▼
ProtectedRoute
      │
      ▼
ViewRenderer
      │
      ▼
Feature
```

Ini sesuai best practice.

---

### 3. Role Group

Menggunakan

```
ROLE_GROUPS
```

lebih baik daripada mengecek role satu per satu.

Misalnya

```
MANAGEMENT
OFFICE_STAFF
ACADEMIC_STAFF
```

membuat maintenance jauh lebih mudah.

---

### 4. Tidak ada hardcoded whitelist

Dari audit sebelumnya memang seluruh

```
developer email
super_admin
email bypass
```

sudah dihapus.

Ini sudah sesuai.

---

# Yang Masih Kurang Menurut Arsitektur e-MAM

Justru bagian ini yang paling penting.

## 1. UI bukan Security

Saat ini alurnya masih seperti ini

```
ProtectedRoute
      │
      ▼
Service
      │
      ▼
Repository
```

Masalahnya adalah...

Jika suatu saat developer memanggil

```ts
studentRepository.deleteStudent()
```

langsung dari service,

maka ProtectedRoute sama sekali tidak ikut bekerja.

Artinya

UI ≠ Security.

---

## Yang seharusnya

```
ProtectedRoute
        │
        ▼
Hook
        │
        ▼
Service
        │
        ▼
SecurityService
        │
        ▼
Repository
```

Jadi sebelum Repository dijalankan

selalu

```
SecurityService.can()
```

dieksekusi.

Misalnya

```ts
await securityService.assertPermission(
    Permission.STUDENT_DELETE
)
```

baru Repository berjalan.

Ini merupakan lapisan pertahanan kedua (*defense in depth*).

---

# 2. Role tidak boleh menjadi dasar utama Authorization

Ini salah satu kelemahan terbesar pada RBAC klasik.

Misalnya

```
Guru
```

boleh membuka

```
Nilai
```

tetapi...

Guru A

tidak boleh mengedit

kelas Guru B.

Kalau hanya menggunakan

```
allowedRoles
```

tidak akan bisa.

---

Lebih tepat menggunakan

```
Permission
```

bukan

```
Role
```

Misalnya

```
Role
 │
 ▼
Permission
 │
 ▼
Feature
```

Contoh

```
Guru
```

memiliki

```
student.read
attendance.create
attendance.edit
```

sedangkan

```
Kepala TU
```

punya

```
teacher.edit
employee.create
letter.approve
```

Role hanya kumpulan Permission.

Ini jauh lebih fleksibel.

---

# 3. ViewRenderer masih terlalu besar

Biasanya ditemukan pola seperti

```
switch(view){

case A

case B

case C

...

case Z

}
```

Jika sudah ratusan view,

file bisa mencapai ribuan baris.

Lebih baik memakai

```
Route Registry
```

Misalnya

```
VIEW_REGISTRY

{
 Dashboard:{
   component:Dashboard,
   permission:"dashboard.view"
 }

 Student:{
   component:StudentPage,
   permission:"student.read"
 }
}
```

ViewRenderer cukup melakukan lookup registry sehingga lebih mudah dipelihara.

---

# 4. Repository belum memiliki Guard

Saat ini Repository kemungkinan masih seperti

```
deleteStudent(id)
```

Padahal seharusnya

```
deleteStudent(id){

 SecurityService.assert(
    Permission.STUDENT_DELETE
 )

 return dexie.student.delete(id)

}
```

Jadi walaupun ada developer yang lupa mengecek di UI,

Repository tetap aman.

---

# 5. Firestore Sync juga harus divalidasi

Ini sering terlewat.

Misalnya

```
Sync Engine
```

melakukan

```
push()

pull()

merge()
```

Jika tidak ada validasi,

pengguna bisa mengirim data yang tidak berhak diubah.

Seharusnya

```
Sync Engine

↓

SecurityService

↓

Firestore
```

Sehingga setiap sinkronisasi tetap menghormati izin.

---

# 6. Belum ada Permission Registry

Saat ini kemungkinan hanya ada

```
ROLE_GROUPS
```

Saya menyarankan membuat registry seperti

```
Permission
```

misalnya

```
dashboard.view

student.read

student.create

student.edit

student.delete

attendance.scan

attendance.edit

teacher.read

teacher.edit

schedule.create

letter.approve

report.export
```

Lalu

```
ROLE_PERMISSIONS
```

berisi

```
Developer

↓

Semua Permission

Admin

↓

90%

Guru

↓

40%

Siswa

↓

10%
```

Ini jauh lebih mudah dikembangkan ketika fitur bertambah.

---

# 7. Audit Trail Permission

Setiap aksi penting sebaiknya dicatat.

Contoh

```
User

↓

Permission Check

↓

Repository

↓

Audit Log
```

Misalnya

```
Guru A

DELETE STUDENT

Denied

2026-06-26 08:15
```

atau

```
Admin

APPROVE LETTER

Success

2026-06-26 08:17
```

Ini membantu audit keamanan dan pelacakan aktivitas.

---

# 8. Multi-Tenant Validation

Karena e-MAM menggunakan

```
tenantId
```

setiap Repository harus memvalidasi

```
currentTenant

==

recordTenant
```

Bukan hanya role.

Contoh

```
Guru MAN 1
```

tidak boleh membaca

```
Siswa MAN 2
```

meskipun sama-sama berperan sebagai Guru.

---

# Rekomendasi Arsitektur RBAC e-MAM V8

Agar selaras dengan blueprint offline-first yang telah Anda tetapkan, alur otorisasi sebaiknya menjadi:

```text
                    Authentication
                          │
                          ▼
                  CurrentUserContext
                          │
                          ▼
                  SecurityService
         (Role + Permission + Tenant)
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
 ProtectedRoute      Service Layer     Sync Engine
         │                │                │
         └────────────────┼────────────────┘
                          ▼
                     Repository
                          │
                          ▼
                    Dexie (Offline)
                          │
                          ▼
                     Sync Queue
                          │
                          ▼
                     Firestore
```

## Kesimpulan

Saya menilai implementasi saat ini berada pada tingkat **8,8/10** untuk RBAC. Fondasi seperti `UserRole`, `ROLE_GROUPS`, dan `ProtectedRoute` sudah kuat dan konsisten. Namun, agar sepenuhnya sejalan dengan arsitektur e-MAM yang menjadikan **Firestore sebagai source of truth**, **Dexie sebagai operational database**, serta menerapkan pola **UI → Hook → Service → Repository → Dexie → Sync Engine → Firestore**, saya menyarankan evolusi dari **Role-Based Access Control (RBAC)** menjadi kombinasi **Role + Permission + Tenant + Defense in Depth**.

Dengan menambahkan **SecurityService** sebagai gerbang otorisasi tunggal, **Permission Registry**, validasi di tingkat **Repository** dan **Sync Engine**, serta pemeriksaan **tenantId** pada setiap operasi data, arsitektur otorisasi e-MAM akan menjadi lebih aman, lebih mudah dipelihara, dan siap berkembang untuk kebutuhan enterprise di masa depan.

## 1. EVOLUSI ARSITEKTUR IZIN (ACTION-BASED PERMISSION)
Sistem e-Mam v7.7 bertransisi dari *Role-based* murni menuju **Action-Based Permission** dengan atribut **Scope**.

- **Role**: Pengguna (Developer, Admin, Wali Kelas, dll).
- **Domain**: Area data (Siswa, Absensi, BK, Surat).
- **Action**: Operasi yang dijalankan (`read`, `write_limited`, `write_full`, `approve`, `manage`).
- **Scope**: Batasan data (`global`, `class`, `self`).

## 2. MATRIKS IZIN PER DOMAIN

### A. Domain: Data Siswa & Administrasi
| Fitur | Dev | Admin | TU | Kesiswaan | Wali Kelas | Guru |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Read (Full/Global) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Read (Class Scope)| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update (Limited) | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Update (Full) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Documents | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### B. Domain: Kehadiran (Attendance)
| Fitur | Role | Level | Aksi |
| :--- | :--- | :--- | :--- |
| **Input/Scan Harian**| Guru/Wali/Staf | Class Scope | `create`, `write_limited` |
| **Validasi/Koreksi** | Kesiswaan/Kurikulum| Global/Class | `approve` |
| **Monitoring/Analytic**| Kepsek/Wakamad/Admin| Global | `read_analytics` |

### C. Domain: BK & Kedisiplinan
| Role | Aksi | Deskripsi |
| :--- | :--- | :--- |
| **Guru/Wali Kelas** | `create_draft` | Input laporan awal pelanggaran/prestasi. |
| **Guru BK** | `approve`, `finalize` | Validasi, pemberian poin, konseling. |
| **Kesiswaan** | `manage`, `read_full` | Monitoring tren kedisiplinan. |

### D. Domain: E-Letter (Surat)
| Role | Aksi | Deskripsi |
| :--- | :--- | :--- |
| **Siswa/Ortu** | `submit`, `read_status` | Pengajuan surat; monitoring status. |
| **TU/Admin** | `manage`, `workflow` | Review, approval, penomoran, disposisi. |

## 3. PEMBAGIAN AUDIT & CHAT BERDASARKAN KONTEKS
- **Audit Log**:
    - `system`: Hanya Developer / Admin.
    - `academic`: Admin / Kesiswaan / Kurikulum.
    - `security`: Developer / Admin.
- **Direct Chat**:
    - Routing berbasis relasi (Wali Kelas ↔ Orang Tua, Guru ↔ Siswa, dll), bukan broadcast ke seluruh role.

## 4. IMPLEMENTASI ATURAN FIRESTORE (SECURITY RULES)
Penerapan di `firestore.rules` wajib menggunakan *Granular Permission* seperti berikut:

```javascript
// Contoh implementasi untuk Update Terbatas Wali Kelas
allow update: if request.auth != null && 
              request.auth.token.role == 'wali_kelas' &&
              request.resource.data.tenantId == resource.data.tenantId &&
              resource.data.classId == request.auth.token.classId && // Filter Scope
              // Validasi field yang boleh diubah saja
              request.resource.data.diff(resource.data).affectedKeys().hasOnly(['alamat', 'teleponOrangTua']); 
```

*Dokumen ini adalah acuan izin akses operasional. Perubahan matriks ini wajib melalui tinjauan keamanan.*
