# 06. RBAC DAN HAK AKSES

## e-MAM System Enterprise V7.8

**Version:** 1.0.0  
**Status:** APPROVED — FOUNDATION LOCK  
**Document Type:** Enterprise RBAC, Identity, Organization Scope, Navigation & Access Blueprint  
**SSOT:** `docs/06_RBAC_DAN_HAK_AKSES.md`

> Dokumen ini mengunci kontrak identitas, organisasi, RBAC, permission, scope, navigation/menu, dashboard resolution, impersonation, dan developer authority. Jika terdapat konflik dengan dokumen lama, aturan pada blueprint ini menjadi aturan V7.8 yang berlaku untuk implementasi baru dan remediation.

---

# 6.0 Tujuan

Blueprint ini memastikan keputusan akses e-MAM tidak dibentuk oleh UI, model User lokal, atau fallback identifier, tetapi melalui rantai authority yang terverifikasi.

```text
Authentication
      ↓
Verified Auth Claims + Authoritative Membership
      ↓
CanonicalUser
      ↓
SecurityContext
      ↓
AuthorizationService
      ↓
PermissionResolver
      ↓
ScopeResolver
      ↓
Route / Navigation / Dashboard Resolver
      ↓
UI
```

**Authority rule:** `CanonicalUser` adalah kontrak identity aplikasi, tetapi **bukan sumber authority RBAC**. Privilege harus berasal dari verified claims dan authoritative membership.

---

# 6.1 Identity Contract

## 6.1.1 CanonicalUser

`CanonicalUser` menjawab: **siapa akun ini?**

Canonical identity minimal mencakup:

```text
uid
id
referenceId
accountType
tenantId
organizationId
displayName
email
phoneNumber
status
createdAt
updatedAt
```

Normalisasi:

```text
Firebase Auth
    ↓
IdentityNormalizer
    ↓
CanonicalUser
```

### Aturan keras

- Firebase Auth `uid` adalah immutable identity akun.
- `referenceId` adalah referensi profil/domain, bukan pengganti `uid`.
- `studentId`, `studentsId`, `idUnik`, NIK, NIP, email, atau username tidak boleh menjadi fallback identity akun login.
- Pola `referenceId || idUnik || studentsId` dilarang.
- `Attendance.studentsId/studentId` adalah FK ke Student, bukan identity akun login.
- `Student.id` adalah identity entity Student sesuai database contract.
- Compatibility field boleh dipertahankan pada mapper/adapter, tetapi tidak boleh dipromosikan menjadi identity authority baru tanpa evidence dari schema/mapper.

## 6.1.2 Identity Resolution untuk Profil

Jika halaman membutuhkan profil Student/GTK:

```text
SecurityContext.referenceId
        ↓
StudentRepository / TeacherRepository / StaffRepository
        ↓
Domain Entity
        ↓
Store → Hook → UI
```

Tidak boleh:

```text
user.referenceId || student.idUnik || attendance.studentsId
```

---

# 6.2 Organization Architecture

```text
Kementerian Agama RI
        ↓
Direktorat Jenderal Pendidikan Islam
        ↓
Kanwil Kementerian Agama Provinsi
        ↓
Kantor Kementerian Agama Kabupaten/Kota
        ↓
Madrasah
        ↓
Unit Kerja (opsional)
```

Contoh:

```text
Kementerian Agama RI
        ↓
Kanwil Kemenag Provinsi Kalimantan Selatan
        ↓
Kankemenag Kabupaten Hulu Sungai Tengah
        ↓
MAN 1 Hulu Sungai Tengah
```

### Organization Scope vs Functional Role

Organization scope menentukan **wilayah data**. Functional role menentukan **kapabilitas bisnis**.

```text
Organization / Account Scope
Developer
Kementerian
Kanwil Provinsi
Kankemenag Kabupaten/Kota
Madrasah

Functional Role
Administrator
Kepala Madrasah
Kepala Tata Usaha
Wakil Kepala
Guru
BK
Tata Usaha
Operator
Siswa
Orang Tua
Tamu
```

---

# 6.3 Developer Authority

`Developer` adalah account type dengan authority platform tertinggi karena merupakan pembuat dan pengelola akun utama sistem.

```text
Developer
   ↓
Platform Authority
   ↓
Create / Provision Organization Accounts
   ↓
Kementerian → Kanwil → Kankemenag → Madrasah
```

Aturan:

1. Developer authority ditentukan oleh server-side verified account authority, bukan email pattern, hardcoded UID, atau localStorage.
2. Developer boleh melakukan provisioning akun tingkat organisasi sesuai policy platform.
3. Developer tidak boleh menghapus audit trail.
4. Impersonation/override developer wajib memiliki provenance, actor asli, effective user, target organization/tenant, alasan, timestamp, dan audit record.
5. Developer global scope adalah exception terkontrol, bukan role check yang tersebar di UI.

---

# 6.4 Account Type & Functional Role

`accountType` menjelaskan kelas akun/otoritas organisasi. `role`/`roles` menjelaskan fungsi dalam context tersebut.

Contoh:

```text
accountType = madrasah
role        = teacher
roles       = [wali_kelas]
```

Tidak boleh menyimpulkan organization scope hanya dari functional role.

---

# 6.5 Authority Source

```text
Firebase Auth
     ↓
Verified Custom Claims
     +
Authoritative Membership / Organization Assignment
     ↓
SecurityContext
     ↓
Effective Role / Permission / Scope
```

`CanonicalUser` boleh memuat projection seperti `accountType`, `role`, atau `roles`, tetapi authorization engine tidak boleh mempercayai projection tersebut jika authoritative claims/membership tersedia.

```text
CanonicalUser = WHO
SecurityContext = IN WHAT CONTEXT
Claims + Membership = AUTHORITY
```

---

# 6.6 SecurityContext

`SecurityContext` adalah runtime security contract.

Minimal:

```text
uid
effectiveUser
accountType
organizationId
tenantId
roles
permissions
scope
sessionState
impersonationContext
```

Lifecycle:

```text
BOOTSTRAPPING
    ↓
AUTHENTICATED
    ↓
IDENTITY_RESOLVED
    ↓
AUTHORITY_RESOLVED
    ↓
READY
```

UI dan feature hanya boleh mengonsumsi context setelah `READY`.

---

# 6.7 Permission-First Authorization

Authorization berbasis capability/permission:

```text
can("students.read")
can("students.create")
can("attendance.approve")
```

Dilarang tersebar di UI:

```typescript
role === "ADMIN"
role === "GURU"
role === "SISWA"
```

Role boleh digunakan oleh policy engine untuk menghitung permission, tetapi feature/UI mengonsumsi hasil permission/capability yang sudah di-resolve.

---

# 6.8 RBAC + ABAC

RBAC menjawab **apa tindakan yang boleh dilakukan**. ABAC/Scope menjawab **data mana yang boleh disentuh**.

```text
Verified Authority
      ↓
RBAC Policy
      ↓
Permission
      ↓
Scope Policy
      ↓
Authorization Decision
```

Scope minimum:

```text
Global
National
Province
District/City
Tenant/Madrasah
Class
Subject
Personal
Related Child
```

---

# 6.9 Organization Scope Matrix

| Account Level | Scope Data | Contoh |
|---|---|---|
| Developer | Global platform | Seluruh tenant, dengan audit override |
| Kementerian | Nasional | Provinsi/kabupaten/madrasah yang diotorisasi |
| Kanwil Provinsi | Provinsi | Kabupaten/kota dan madrasah dalam provinsi |
| Kankemenag Kabupaten/Kota | Kabupaten/Kota | Madrasah dalam wilayah tersebut |
| Madrasah | Satu tenant/madrasah | Data internal madrasah |
| Guru/BK/TU/Siswa/Orang Tua | Membership + role + scope | Subset data yang diizinkan |

---

# 6.10 Navigation & Menu RBAC

Navigation bukan authority. Navigation adalah **projection dari permission yang sudah resolved**.

```text
SecurityContext
      ↓
PermissionResolver
      ↓
NavigationResolver
      ↓
Navigation Registry
      ↓
Sidebar / Bottom Navigation / Mobile Navigation
      ↓
UI
```

Dilarang:

```typescript
if (role === "admin") showAdminMenu();
```

Gunakan:

```text
navigation item
   ↓
requiredPermission
   ↓
PermissionResolver
   ↓
visible / hidden
```

**Menu hidden bukan security boundary.** Route guard, service authorization, repository scope, dan Firestore Rules tetap wajib.

---

# 6.11 Route & Dashboard Resolution

Route:

```text
Authenticated Session
      ↓
SecurityContext READY
      ↓
RouteResolver
      ↓
AuthorizationService
      ↓
Route allowed / denied
```

Dashboard:

```text
SecurityContext
      ↓
DashboardResolver
      ↓
Dashboard capability
      ↓
Dashboard UI
```

Dilarang memilih dashboard dengan pemeriksaan role mentah yang tersebar.

---

# 6.12 Login Flow Blueprint

```text
[Login Page]
      ↓
Credential Submission
      ↓
Firebase Auth
      ↓
Verified UID
      ↓
Claims Refresh / Verification
      ↓
Authoritative Membership Resolution
      ↓
IdentityNormalizer
      ↓
CanonicalUser
      ↓
SecurityContextBuilder
      ↓
Authority / Tenant / Scope Resolution
      ↓
SecurityContext = READY
      ↓
DashboardResolver
      ↓
Route + Navigation Resolver
      ↓
Dashboard
```

Jika authority tidak dapat diverifikasi:

```text
LOGIN → AUTHENTICATED → AUTHORITY_UNRESOLVED → Access Denied / Identity Completion Flow
```

Tidak boleh fallback ke tenant, role, atau identity default.

---

# 6.13 Login Claim Contract

Contoh:

```json
{
  "sub": "firebase-auth-uid",
  "accountType": "madrasah",
  "organizationId": "org-hst",
  "tenantId": "madrasah-30315464",
  "role": "teacher",
  "roles": ["wali_kelas"],
  "referenceId": "teacher-001",
  "scope": {
    "classIds": ["class-7a"],
    "subjectIds": ["math-7"]
  },
  "schemaVersion": 1
}
```

Claims harus diterbitkan/divalidasi oleh server-side authority. Client tidak boleh menaikkan privilege dengan mengubah cache claim lokal.

---

# 6.14 GTK / Student Account Mapping

### GTK

```text
Firebase UID
   ↓
CanonicalUser.referenceId
   ↓
Teacher/Staff Repository
   ↓
GTK Entity
```

### Student

```text
Firebase UID
   ↓
CanonicalUser.referenceId
   ↓
StudentRepository
   ↓
Student Entity
```

### Attendance

```text
CanonicalUser
   ↓
Student Entity
   ↓
Student.id
   ↓
Attendance.studentsId / studentId
```

`Attendance.studentsId/studentId` tidak boleh dipakai untuk menemukan identity akun login.

---

# 6.15 Impersonation

```text
Developer / Authorized Actor
        ↓
Impersonation Request
        ↓
Policy Validation
        ↓
Target Membership Validation
        ↓
Effective SecurityContext
        ↓
Application
```

Context wajib mempertahankan:

```text
actorUid
actorAccountType
effectiveUid
effectiveAccountType
targetOrganizationId
targetTenantId
reason
ticketId
startedAt
```

UI menggunakan **effective context** untuk menu, route, dashboard, dan data. Audit tetap mencatat actor asli.

---

# 6.16 UI Access Contract

UI hanya boleh:

```text
read resolved state
request capability
invoke use case
render result
```

UI tidak boleh:

```text
read Firebase Auth directly for authorization
read Firestore directly
read Dexie directly
resolve tenantId manually
resolve role manually
construct security scope
use legacy identity fallback
```

Business data flow:

```text
UI → Hook → Store → Service → Repository → Dexie → SyncQueue → SyncEngine → Firestore
```

---

# 6.17 Developer / Admin Account Provisioning

```text
Developer
  ↓
Kementerian account
  ↓
Kanwil account
  ↓
Kankemenag account
  ↓
Madrasah account
  ↓
Functional accounts
  ├── Kamad
  ├── Keptu
  ├── Guru
  ├── BK
  ├── TU/Staff
  ├── Operator
  ├── Siswa
  └── Orang Tua
```

Setiap provisioning wajib menetapkan:

```text
uid / account identity
organizationId
accountType
membership
role(s)
permission policy
scope
status
```

Tidak boleh membuat akun dengan authority implisit atau default tenant.

---

# 6.18 Forbidden Identity & RBAC Patterns

```text
referenceId || idUnik || studentsId     ❌
user.id || student.id                  ❌
currentUser.email sebagai authority    ❌
localStorage.user sebagai authority    ❌
role === "admin" tersebar di UI       ❌
role === "guru" untuk menentukan menu ❌
global/default/unknown tenant          ❌
Firestore users.role sebagai authority ❌
Dexie users.role sebagai authority     ❌
UI editable role sebagai authority     ❌
```

---

# 6.19 Required Architecture Boundaries

Identity/authorization:

```text
Contract
  ↓
IdentityNormalizer
  ↓
CanonicalUser
  ↓
SecurityContext
  ↓
AuthorizationService
  ↓
PermissionResolver
  ↓
ScopeResolver
  ↓
Navigation / Route / Dashboard Resolver
  ↓
Store
  ↓
Hook
  ↓
UI
```

Business data:

```text
UI
 ↓
Hook
 ↓
Store
 ↓
Service
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
```

---

# 6.20 Audit Requirements Per Feature

Setiap feature wajib diaudit terhadap:

| Area | Audit |
|---|---|
| Identity | SecurityContext/CanonicalUser yang benar |
| Reference | Tidak ada fallback `idUnik/studentsId/studentId` |
| Tenant | Tenant berasal dari SecurityContext |
| RBAC | Capability berasal dari PermissionResolver |
| Scope | Query dibatasi authoritative scope |
| Navigation | Menu berasal dari Navigation Registry |
| Route | Centralized authorization |
| Dashboard | DashboardResolver digunakan |
| UI | Tidak ada direct Firestore/Dexie |
| Service | Business authorization ditegakkan |
| Repository | Persistence melalui repository |
| Sync | Mutation masuk SyncQueue |
| Audit | Tindakan sensitif tercatat |

Output:

```text
FEATURE
FILE
OLD IDENTITY/RBAC RESOLUTION
NEW RESOLUTION
AUTHORITY SOURCE
SCOPE
REASON
SEVERITY
TEST RESULT
```

---

# 6.21 Quality Gates

```text
G1 Build
G2 TypeScript
G3 Lint
G4 Architecture Compliance
G5 Identity Compliance
G6 RBAC Compliance
G7 Tenant Isolation
G8 Offline Compliance
G9 Security Rules
G10 Regression Test
```

Jika salah satu gate gagal, Work Order tidak boleh ditutup.

---

# 6.22 Definition of Done

```text
[ ] CanonicalUser menjadi identity contract tunggal
[ ] Firebase UID menjadi primary account identity
[ ] Verified claims + membership menjadi authority RBAC
[ ] SecurityContext READY menjadi runtime security context
[ ] Tenant scope tidak dapat ditentukan UI
[ ] Role tidak digunakan sebagai hardcoded UI authorization
[ ] PermissionResolver menjadi sumber capability UI
[ ] Navigation Registry menjadi sumber menu
[ ] RouteResolver menjadi sumber route authorization
[ ] DashboardResolver menjadi sumber dashboard selection
[ ] Developer authority tervalidasi server-side
[ ] Impersonation memiliki provenance + audit
[ ] referenceId || idUnik || studentsId tidak digunakan sebagai identity fallback
[ ] Attendance FK tetap menggunakan Student identity
[ ] Repository menjadi persistence boundary
[ ] SyncQueue menjadi pending mutation SSOT
[ ] SyncEngine menjadi synchronization boundary
[ ] Firestore Rules menjadi final security boundary
[ ] Semua feature melewati Feature RBAC Audit
```

---

# 6.23 Governance Lock

```text
Blueprint / SSOT
      ↓
Quality Pipeline
      ↓
Read-Only Audit
      ↓
Work Order
      ↓
Approval
      ↓
Implementation
      ↓
Verification
      ↓
Quality Gate
      ↓
Merge / Release
```

Dilarang melakukan refactor identity, RBAC, navigation, tenant scope, atau authorization secara ad-hoc di luar Work Order.

---

# 6.24 Final Architecture Lock

```text
                    AUTHORITY
                       │
          Verified Claims + Membership
                       │
                       ▼
                 SecurityContext
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
       Tenant         RBAC      Impersonation
         │             │             │
         └─────────────┼─────────────┘
                       ▼
              Permission / Scope
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Route       Navigation    Dashboard
          │            │            │
          └────────────┼────────────┘
                       ▼
                       UI

Business Data:

UI → Hook → Store → Service → Repository → Dexie
                                      ↓
                                  SyncQueue
                                      ↓
                                  SyncEngine
                                      ↓
                                  Firestore
```

**Status: FOUNDATION LOCKED — e-MAM V7.8**
