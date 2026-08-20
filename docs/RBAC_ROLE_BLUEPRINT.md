Blueprint RBAC Enterprise e-MAM System

Blueprint ini dirancang mengikuti arsitektur final e-MAM:

UI
    ↓
Zustand Store
    ↓
Service / Use Case
    ↓
Repository
    ↓
Dexie
    ↓
SyncQueue
    ↓
SyncEngine
    ↓
Firestore

Prinsip utama:

* UI tidak pernah menentukan hak akses.
* RBAC tidak berdasarkan nama role, tetapi berdasarkan permission.
* Role hanyalah kumpulan permission.
* Semua pengecekan izin dilakukan di AuthorizationService.
* Dexie menjadi sumber data operasional, termasuk data role dan permission.

⸻

1. Arsitektur RBAC

┌─────────────────────────────┐
│           UI                │
│ Sidebar                     │
│ Header                      │
│ Halaman                     │
│ Tombol                      │
└──────────────┬──────────────┘
               │
               ▼
        Permission Hook
               │
               ▼
     AuthorizationService
               │
      ┌────────┴────────┐
      ▼                 ▼
 PermissionRepository   UserRepository
      │                 │
      ▼                 ▼
            Dexie
               │
         SyncQueue
               │
         SyncEngine
               │
          Firestore

UI hanya bertanya:

“Apakah saya boleh?”

UI tidak pernah menghitung sendiri.

⸻

2. Layer

UI

Tidak boleh ada:

if(role==="admin")

Tidak boleh ada:

if(email==="developer@gmail.com")

Yang diperbolehkan:

const canManageUsers =
authorization.can("user.manage");

⸻

Store

Store hanya mengambil hasil.

Misalnya:

navigationStore
↓
AuthorizationService
↓
allowedMenus

⸻

Service

Pusat seluruh business rule.

Contoh:

AuthorizationService
NavigationService
FeatureService

⸻

Repository

Repository hanya membaca:

users
roles
permissions
role_permissions
user_permissions

Tidak ada business logic.

⸻

3. Struktur Permission

Permission menggunakan format:

resource.action

Contoh

user.read
user.create
user.update
user.delete
student.read
student.update
attendance.scan
attendance.approve
journal.create
journal.approve
letter.approve
finance.report
dashboard.view
system.settings
system.sync
system.logs

Sangat mudah dicari.

⸻

4. Resource

Setiap modul memiliki resource.

Contoh

dashboard
users
teachers
students
attendance
journal
letter
permission
role
settings
finance
ptsp
library
inventory
class
schedule
report
notification
sync
audit
analytics

⸻

5. Action

Action standar

view
read
create
update
delete
approve
reject
export
import
scan
print
sync
restore
manage

Contoh

attendance.scan
attendance.approve
journal.create
journal.approve
student.export
settings.manage

⸻

6. Database RBAC

users

id
tenantId
roleId
status

⸻

roles

id
tenantId
name
description
system
createdAt

⸻

permissions

id
code
resource
action
description

⸻

role_permissions

roleId
permissionId

⸻

user_permissions

Tambahan permission khusus.

userId
permissionId

⸻

feature_flags

tenantId
feature
enabled

⸻

audit_permission

userId
permission
result
createdAt
ip
device

⸻

7. AuthorizationService

Seluruh aplikasi hanya melalui service ini.

can(permission)
cannot(permission)
hasRole()
hasPermission()
getPermissions()
getMenus()
filterNavigation()
filterActions()
filterRoutes()
filterButtons()

⸻

8. NavigationService

Sidebar tidak membaca role.

Sidebar meminta menu.

Sidebar
↓
NavigationService
↓
AuthorizationService
↓
Filtered Menu

⸻

9. Route Protection

Setiap halaman memiliki permission.

/dashboard
permission
dashboard.view
/users
permission
user.read
/users/create
permission
user.create
/attendance
permission
attendance.read

Jika tidak memiliki permission:

403 Forbidden

⸻

10. Component Protection

Tombol juga memiliki permission.

Tambah Guru
↓
teacher.create
Hapus Guru
↓
teacher.delete
Export Excel
↓
teacher.export

⸻

11. Sidebar

Definisi menu

{
    title: "Manajemen User",
    icon: Users,
    permission: "user.read",
    children:[
        {
            title:"Daftar User",
            permission:"user.read"
        },
        {
            title:"Tambah User",
            permission:"user.create"
        }
    ]
}

NavigationService otomatis menghapus menu yang tidak boleh diakses.

⸻

12. Header

Header hanya menerima informasi.

Role
Tenant
Madrasah
Sync Status
Offline Queue
Academic Year
Current Semester

Tidak menghitung permission.

⸻

13. Feature Flag

Menu muncul jika:

Permission
AND
Feature Enabled

Contoh

Perpustakaan
↓
library.read
↓
feature.library == true

Jika modul dimatikan:

Menu hilang.

⸻

14. Multi-Tenant

Semua permission memiliki konteks tenant.

Developer
↓
Semua tenant
Admin
↓
Tenant sendiri
Guru
↓
Tenant sendiri

Tidak boleh membaca tenant lain.

⸻

15. Developer

Developer bukan bypass email.

Developer adalah role sistem.

Permission:

system.*
tenant.*
user.*
audit.*
sync.*
backup.*
restore.*
logs.*
settings.*
analytics.*

Tidak ada hardcode email di UI.

⸻

16. Audit Log

Semua aktivitas penting dicatat.

User
Permission
Resource
Action
Result
Device
Timestamp
Offline
Sync Status

⸻

17. Offline First

Role dan permission disimpan di Dexie.

Login
↓
Download Permission
↓
Dexie
↓
Offline
↓
AuthorizationService membaca Dexie
↓
Tidak membutuhkan internet

Ketika internet kembali:

SyncEngine
↓
Sinkronisasi perubahan role
↓
Dexie diperbarui

⸻

18. Hierarki Role Standar e-MAM

Level	Role	Scope
0	Developer	Semua tenant dan seluruh sistem
1	Kemenag	Seluruh madrasah nasional
2	Kanwil	Seluruh madrasah dalam wilayah
3	Administrator	Satu tenant/madrasah
4	Kepala Madrasah	Satu tenant
5	Kepala TU	Satu tenant
6	Staf TU	Satu tenant
7	Guru	Data pembelajaran dan kelas yang diampu
8	Guru BK	Layanan BK dan poin siswa
9	Wali Kelas	Kelas yang menjadi tanggung jawab
10	Siswa	Data pribadi dan layanan siswa
11	Orang Tua/Wali	Data anak yang ditautkan

Catatan: Hierarki ini hanya menunjukkan cakupan (scope) administrasi, bukan pewarisan hak akses. Setiap role memperoleh hak akses secara eksplisit melalui permission.

19. Alur Otorisasi

User Login
      │
      ▼
Load User Profile
      │
      ▼
Load Roles
      │
      ▼
Load Permissions
      │
      ▼
Simpan ke Dexie
      │
      ▼
AuthorizationService
      │
      ├── Filter Routes
      ├── Filter Sidebar
      ├── Filter Header Context
      ├── Filter Buttons
      ├── Filter Actions
      └── Validasi API/Use Case
      │
      ▼
UI Merender Hasil

Evaluasi terhadap Arsitektur e-MAM

Kriteria	Status
Offline-First	✅
Dexie sebagai database operasional	✅
UI bebas business logic	✅
Permission-Based RBAC	✅
Multi-Tenant	✅
Sinkronisasi melalui SyncEngine	✅
Mudah dikembangkan	✅
Enterprise Ready	✅

Blueprint ini dapat dijadikan standar resmi implementasi RBAC untuk seluruh modul e-MAM System sehingga seluruh navigasi, halaman, aksi, dan API mengikuti satu mekanisme otorisasi yang konsisten dan skalabel.