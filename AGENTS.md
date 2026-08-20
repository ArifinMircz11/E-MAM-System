# AGENTS.md

# IMAM System Enterprise Development Rules v2.0
Enterprise Offline-First Architecture Standard

> Dokumen ini merupakan standar tertinggi pengembangan IMAM System.
>
> Seluruh Developer, AI Coding Agent, Automation Agent, Refactoring Agent,
> Code Reviewer, dan CI Pipeline WAJIB mematuhi seluruh aturan di dalam dokumen ini.
>
> Jika terdapat konflik antara implementasi lama dengan dokumen ini,
> maka dokumen ini menjadi sumber kebenaran utama (Single Source of Truth).

---

# 1. Mission Statement

IMAM System dikembangkan sebagai:

- Enterprise Grade Information System
- Offline First Application
- Local First Architecture
- Multi Tenant Ready
- Secure By Default
- Firestore Cost Efficient
- High Performance
- Highly Maintainable
- AI Assisted Development
- PWA Ready
- Mobile First
- Zero Duplicate Data
- Event Driven Synchronization

Target utama sistem adalah:

- stabil
- cepat
- hemat biaya Firestore
- mudah dipelihara
- mudah dikembangkan
- scalable hingga ribuan tenant
- mampu berjalan penuh ketika offline

DILARANG melakukan quick fix yang merusak arsitektur.

---

# 2. Core Engineering Principles

Seluruh keputusan pengembangan harus mengikuti prioritas berikut:

1. Security
2. Data Integrity
3. Offline First
4. Multi Tenant Isolation
5. Maintainability
6. Scalability
7. Firestore Cost Efficiency
8. Performance
9. Readability
10. Developer Experience

Jika terjadi konflik,
pilih solusi yang mempertahankan urutan prioritas di atas.

---

# 3. Final Enterprise Architecture

Arsitektur resmi IMAM System adalah:

```
                UI Components
                      │
                      ▼
                 Hook Layer
                      │
                      ▼
                Service Layer
                      │
                      ▼
              Repository Layer
              (Dexie Only Access)
                      │
                      ▼
                IndexedDB (Dexie)
            Operational Database
                      │
                      ▼
                Sync Queue (Dexie)
                      │
                      ▼
                 Sync Engine
          (Only Firestore Gateway)
                      │
                      ▼
             Firestore Cloud Database
                Source of Truth
```

Arsitektur ini bersifat MUTLAK.

Tidak boleh diubah tanpa Architecture Decision Record (ADR).

---

# 4. Data Source Responsibilities

## Firestore

Firestore adalah:

- Source of Truth
- Cloud Backup
- Delta Synchronization
- Cross Device Synchronization
- Disaster Recovery

Firestore BUKAN database operasional UI.

---

## IndexedDB (Dexie)

Dexie adalah:

- Operational Database
- Dashboard Source
- Local Cache
- Offline Database
- Query Database
- Reporting Source

UI membaca data dari Dexie.

Bukan Firestore.

---

## Sync Engine

Sync Engine adalah SATU-SATUNYA komponen yang boleh:

- membaca Firestore
- menulis Firestore
- melakukan Delta Sync
- melakukan Full Sync
- menyelesaikan konflik sinkronisasi
- mengelola Sync Queue

Tidak ada komponen lain yang diperbolehkan.

---

# 5. Firestore Access Lock

IMPORT Firebase SDK hanya diperbolehkan pada:

```
src/services/sync/
src/services/SyncEngine.ts
src/services/masterSyncService.ts
src/services/realtime/
```

DILARANG mengimpor:

```
firebase/firestore
firebase/auth
firebase/storage
firebase/functions
```

ke dalam:

```
components/
hooks/
repositories/
modules/
features/
utils/
```

Repository TIDAK BOLEH mengimpor Firebase.

---

# 6. Five Mandatory Layers

Semua fitur WAJIB mengikuti struktur berikut.

```
Feature/

components/
hooks/
services/
repositories/
types/
utils/
```

Tidak boleh membuat struktur lain tanpa alasan arsitektural.

---

# 7. Layer Responsibilities

## Layer 1

Components

Tanggung jawab:

- Rendering
- UI
- Form
- Event
- Presentation

DILARANG:

- query database
- query Firestore
- business logic
- validasi domain
- evaluasi RBAC
- manipulasi sinkronisasi

Component harus bersifat Pure Presentation.

---

## Layer 2

Hooks

Tanggung jawab:

- orchestration
- loading
- error state
- pagination
- memoization
- lifecycle

Hook tidak boleh memiliki business logic.

Hook hanya menghubungkan UI dengan Service.

---

## Layer 3

Service

Service merupakan pusat seluruh business logic.

Service bertanggung jawab atas:

- Domain Rules
- Validation
- RBAC Evaluation
- Workflow
- Audit Trigger
- Queue Decision
- Sync Decision
- Cache Strategy
- Conflict Resolution

Semua keputusan bisnis wajib berada di layer ini.

---

## Layer 4

Repository

Repository adalah abstraction terhadap Dexie.

Repository bertanggung jawab atas:

- CRUD
- Mapping
- Local Query
- Transaction
- Index Query

Repository TIDAK BOLEH:

- import firebase
- import React
- import UI
- import PermissionChecker
- import SecurityService

Repository hanya mengetahui Dexie.

---

## Layer 5

Data Source

Data Source terdiri dari:

- IndexedDB
- Firestore
- Storage
- API

Akses langsung hanya boleh dilakukan oleh:

- Repository (Dexie)
- Sync Engine (Firestore)

---

# 8. Repository Rules

Repository WAJIB:

- deterministic
- reusable
- stateless

Repository hanya mengakses:

Dexie

Tidak boleh:

Repository → Firestore

Tidak boleh:

Repository → UI

Tidak boleh:

Repository → RBAC

Tidak boleh:

Repository → React

---

# 9. Service Rules

Service WAJIB menjadi pusat seluruh aturan domain.

Service bertanggung jawab atas:

- RBAC
- validation
- workflow
- audit
- queue
- synchronization
- permission
- aggregation

Jika terdapat business rule,

maka rule tersebut HARUS berada pada Service.

---

# 10. Hook Rules

Hook hanya mengatur:

- loading
- error
- state
- orchestration
- subscriptions

Hook tidak boleh:

- query Firestore
- validasi domain
- evaluasi role
- sinkronisasi data

---

# 11. Component Rules

Component harus bersifat:

Pure UI.

Component tidak boleh:

- membaca Firestore
- membaca Dexie
- menghitung summary
- mengevaluasi role
- memutuskan izin akses
- melakukan sinkronisasi

Semua data berasal dari Hook.

---

# 12. Dependency Direction

Seluruh dependency harus mengikuti arah berikut:

```
Component

↓

Hook

↓

Service

↓

Repository

↓

Dexie

↓

Sync Engine

↓

Firestore
```

Dependency terbalik DILARANG.

---

# 13. Dependency Injection Rules

Service tidak boleh membuat instance Repository secara langsung.

Gunakan dependency injection atau singleton yang telah distandarkan.

Hal ini bertujuan:

- testing
- maintainability
- modularity

---

# 14. Single Responsibility Principle

Setiap class harus memiliki SATU tanggung jawab.

Contoh:

StudentService

mengelola siswa.

Bukan:

- siswa
- jadwal
- absensi
- chat

sekaligus.

---

# 15. Architecture Review Rule

Sebelum membuat:

- file baru
- service baru
- repository baru
- hook baru

WAJIB melakukan audit:

1. apakah sudah ada?
2. apakah dapat digunakan ulang?
3. apakah dapat direfactor?
4. apakah dapat digabung?

Duplikasi file DILARANG.

---

# 16. Duplicate Prevention

Tidak boleh membuat:

StudentServiceNew

TeacherServiceFix

TeacherService2

AttendanceServiceLatest

RepositoryV2

RepositoryFinal

RepositoryFix

Semua perubahan dilakukan melalui refactoring.

---

# 17. Architecture First Policy

AI Coding Agent WAJIB:

1. membaca arsitektur
2. membaca repository terkait
3. membaca service terkait
4. membaca hook terkait
5. membaca component terkait

Baru setelah itu membuat perubahan.

DILARANG langsung menghasilkan kode tanpa audit arsitektur.

---

# 18. Offline First Policy

Offline First merupakan prinsip utama IMAM System.

Seluruh fitur baru WAJIB dapat berjalan tanpa koneksi internet.

Target:

- 100% Create Offline
- 100% Update Offline
- 100% Delete Offline
- Read dari Dexie
- Sinkronisasi otomatis saat koneksi tersedia

Firestore tidak boleh menjadi dependency utama UI.

---

# 19. Local First Principle

Urutan prioritas pembacaan data:

1. Memory Cache
2. IndexedDB (Dexie)
3. Sync Engine
4. Firestore

UI tidak boleh membaca Firestore secara langsung.

---

# 20. Master Data Cache Rules

Master Data berikut WAJIB tersedia di Dexie:

- students
- teachers
- users
- roles
- permissions
- classes
- schedules
- academic_years
- academic_terms
- point_categories
- subjects
- rooms
- tenants
- settings
- metadata

Master Data tidak boleh diunduh ulang setiap login.

Gunakan:

Metadata Version Check

kemudian

Delta Sync.

---

# 21. Cache Strategy

Seluruh cache mengikuti urutan:

Memory Cache

↓

Dexie

↓

Firestore

Memory Cache hanya digunakan untuk:

- Session
- Frequently Accessed Data
- Temporary Lookup

Dexie tetap menjadi sumber utama pembacaan.

---

# 22. Delta Sync Policy

Default Sync adalah:

Delta Sync

Delta Sync dilakukan berdasarkan:

updatedAt

version

metadataVersion

checksum

Tidak boleh melakukan Full Sync jika Delta Sync masih memungkinkan.

---

# 23. Full Sync Policy

Full Sync hanya diperbolehkan ketika:

- First Installation
- Schema Migration
- Corrupted Local Database
- Recovery Mode
- Manual Developer Action

Selain kondisi di atas,

DILARANG melakukan Full Sync.

---

# 24. Metadata Version Rules

Seluruh Master Collection wajib memiliki:

metadataVersion

Saat login:

1. cek metadata
2. bandingkan versi
3. jika sama → gunakan Dexie
4. jika berbeda → Delta Sync

Jangan melakukan download ulang seluruh koleksi.

---

# 25. Sync Queue Rules

Semua perubahan data mengikuti alur berikut:

UI

↓

Hook

↓

Service

↓

Repository

↓

Dexie

↓

Sync Queue

↓

Sync Engine

↓

Firestore

UI tidak boleh menulis Firestore.

---

# 26. Sync Queue Structure

Setiap item Queue minimal memiliki:

id

tenantId

collection

documentId

operation

payload

createdAt

retryCount

lastError

priority

status

deviceId

Queue bersifat generik.

---

# 27. Queue Processing Rules

Sync Engine memproses Queue berdasarkan:

1. priority
2. createdAt
3. retryCount

Queue harus FIFO untuk prioritas yang sama.

---

# 28. Dead Letter Queue

Jika transaksi gagal melebihi batas retry:

pindahkan ke:

deadLetterQueue

Lokasi:

Dexie

Dead Letter Queue tidak pernah dikirim ke Firestore.

---

# 29. Conflict Resolution

Prioritas penyelesaian konflik:

1. Version
2. updatedAt
3. Manual Review

Conflict wajib dicatat ke audit log.

---

# 30. Retry Policy

Retry menggunakan Exponential Backoff.

Contoh:

1 detik

2 detik

4 detik

8 detik

16 detik

Maksimal retry ditentukan oleh konfigurasi sistem.

---

# 31. Firestore Source of Truth

Firestore hanya digunakan untuk:

- Backup
- Synchronization
- Cross Device
- Disaster Recovery

Firestore bukan database operasional.

---

# 32. Firestore Cost Policy

Semua implementasi harus mengurangi:

- Document Read
- Document Write
- Active Listener
- Snapshot Update

Target minimal:

70% lebih hemat dibanding implementasi naïf.

---

# 33. Firestore Query Rules

Seluruh query wajib:

- memiliki tenantId
- menggunakan limit
- menggunakan orderBy yang tepat
- menggunakan composite index

DILARANG:

collection scan

loop ribuan dokumen

full download

---

# 34. Summary Collection Policy

Dashboard tidak boleh menghitung ulang data mentah.

Gunakan collection:

- attendance_summary
- dashboard_summary
- teacher_summary
- student_summary
- finance_summary
- class_summary

Summary diperbarui oleh Domain Service atau Sync Engine.

---

# 35. Aggregation Rules

Gunakan:

Summary Service

Aggregation Service

DILARANG:

getDocs()

kemudian

loop seluruh koleksi.

---

# 36. Realtime Rules

Realtime hanya diperbolehkan untuk:

- Notification
- Approval
- Announcement
- Maintenance
- Chat
- Presence
- Emergency Alert

Master Data tidak menggunakan Realtime.

Master Data menggunakan Delta Sync.

---

# 37. Listener Rules

Setiap listener wajib memiliki cleanup.

Contoh:

return unsubscribe()

Listener wajib dihentikan ketika:

- logout
- tenant berubah
- component unmount
- feature ditutup

---

# 38. Listener Optimization

Dilarang membuat listener ganda.

Gunakan:

RealtimeHub

atau

Listener Registry

agar satu resource hanya memiliki satu listener aktif.

---

# 39. Repository Access Rules

Repository hanya boleh mengakses:

Dexie

Repository tidak boleh:

import firebase

menggunakan onSnapshot

menggunakan getDocs

menggunakan addDoc

menggunakan updateDoc

menggunakan deleteDoc

---

# 40. Database Schema Rules

Seluruh koleksi wajib mengikuti:

IMAM_DATABASE_BLUEPRINT_v1_1.md

Blueprint tersebut merupakan sumber kebenaran struktur database.

---

# 41. Standard Metadata

Seluruh dokumen operasional wajib memiliki:

id

tenantId

createdAt

updatedAt

createdBy

updatedBy

version

schemaVersion

syncStatus

deleted

deletedAt

lastModifiedDevice

Opsional:

migrationVersion

checksum

---

# 42. Naming Convention

Primary Key:

id

Foreign Key:

studentId

teacherId

classId

userId

scheduleId

subjectId

Tidak boleh:

studentsId

teachersId

classesId

---

# 43. Business ID Rules

Primary Key selalu:

id

Business ID dipisahkan.

Contoh:

students

id

idUnik

teachers

id

teachersId

users

id

firebaseUid

Seluruh relasi internal menggunakan Primary Key.

---

# 44. Deterministic ID Policy

DILARANG menggunakan:

addDoc()

Auto-ID Firestore.

Seluruh ID harus:

manual

deterministic

unique

stable

agar sinkronisasi offline tetap konsisten.

---

# 45. Security First Principle

Keamanan adalah prioritas tertinggi.

Seluruh implementasi harus memenuhi:

- Least Privilege
- Zero Trust
- Multi Tenant Isolation
- Secure By Default
- Defense in Depth

Jika terdapat konflik antara kemudahan implementasi dan keamanan,

pilih keamanan.

---

# 46. RBAC Policy

Seluruh akses sistem wajib menggunakan RBAC.

Role tidak boleh diperiksa langsung pada UI.

Contoh yang DILARANG:

if (user.role === "admin")

Seluruh evaluasi izin dilakukan melalui:

PermissionChecker

atau

SecurityService.

---

# 47. RBAC Evaluation Rules

RBAC hanya boleh dievaluasi pada:

Service Layer

Repository tidak mengetahui role.

Component tidak mengetahui role.

Hook tidak mengetahui role.

---

# 48. SecurityService Policy

Seluruh keputusan akses dilakukan melalui:

SecurityService

atau

PermissionChecker.

Contoh:

canReadStudent()

canUpdateAttendance()

canApproveLetter()

canDeleteTeacher()

Tidak boleh membuat logika izin tersebar di berbagai file.

---

# 49. Multi-Tenant Isolation

Seluruh data operasional WAJIB memiliki:

tenantId

Tidak ada pengecualian.

---

# 50. Tenant Query Rules

Seluruh query wajib diawali:

tenantId

Contoh:

tenantId

↓

classId

↓

studentId

↓

date

Jangan pernah melakukan query lintas tenant.

---

# 51. Composite Index Rules

Seluruh composite index wajib diawali:

tenantId

Contoh:

[tenantId+updatedAt]

[tenantId+studentId]

[tenantId+teacherId]

[tenantId+classId]

[tenantId+date]

---

# 52. Cross Tenant Protection

Tidak boleh ada operasi:

join

lookup

aggregation

summary

yang mengambil data dari tenant lain.

Seluruh proses harus berada dalam tenant aktif.

---

# 53. PII Protection

Data sensitif wajib dilindungi.

Contoh:

Email

Nomor HP

Alamat

NIK

NISN

Token

Refresh Token

Credential

Password

Tidak boleh muncul pada:

console.log

toast

alert

error message

---

# 54. Audit Logging Policy

Seluruh aktivitas penting wajib dicatat.

Gunakan:

auditLog()

atau

AuditLogService

Audit Log harus tetap tercatat meskipun sinkronisasi dilakukan belakangan.

---

# 55. Audit Log Scope

Minimal aktivitas berikut wajib diaudit:

Login

Logout

Create

Update

Delete

Approval

Reject

Role Change

Permission Change

Sync Failure

Schema Migration

Configuration Change

---

# 56. Activity Log Rules

activity_logs

digunakan untuk:

UI Debug

Developer Diagnostic

Performance Analysis

Lokasi:

Dexie

Tidak pernah dikirim ke Firestore.

---

# 57. Audit Log Rules

audit_logs

digunakan untuk:

Security

Compliance

Traceability

Forensic

Audit Log disinkronkan ke Firestore.

---

# 58. Infinite Loop Protection

Audit wajib menggunakan:

_isAuditLogging

untuk mencegah rekursi.

Tidak boleh terjadi audit memicu audit berikutnya.

---

# 59. Error Handling Policy

Seluruh operasi asynchronous wajib memiliki:

try

catch

safeCall

atau

useAutoFix

Tidak boleh ada Promise yang tidak ditangani.

---

# 60. useAutoFix Rules

Seluruh pemanggilan Service dari Hook wajib menggunakan:

safeCall()

Contoh:

safeCall(

studentService.loadStudents,

"Student.Load"

)

---

# 61. Error Classification

Seluruh error diklasifikasikan menggunakan:

errorClassifier.ts

Minimal kategori:

Network

Permission

Validation

Sync

Database

Unknown

---

# 62. Logging Policy

Gunakan:

Logger

DebugService

AuditLog

ActivityLog

DILARANG menggunakan:

console.log

pada Production.

---

# 63. AI Development Rules

Sebelum membuat kode,

AI wajib melakukan audit:

1. apakah fitur sudah ada

2. apakah service sudah ada

3. apakah repository sudah ada

4. apakah hook sudah ada

5. apakah component sudah ada

6. apakah collection sudah ada

7. apakah summary sudah ada

8. apakah cache sudah ada

9. apakah sync sudah ada

10. apakah realtime sudah ada

Jika sudah ada,

gunakan kembali.

Jangan membuat duplikasi.

---

# 64. Architecture Audit Rule

Sebelum implementasi,

AI wajib melakukan:

Architecture Audit

Root Cause Analysis

Impact Analysis

Dependency Analysis

Cost Analysis

Baru setelah itu membuat kode.

---

# 65. Refactoring Rules

Jika menemukan:

Duplicate Logic

Duplicate Repository

Duplicate Service

Duplicate Hook

Duplicate Component

maka lakukan:

Refactor

bukan membuat file baru.

---

# 66. Work Order (WO) Standard

Seluruh pekerjaan wajib dibagi menjadi Work Order (WO).

Setiap WO minimal memiliki:

Objective

Background

Architecture Audit

Scope

Out of Scope

Architecture Rules

Acceptance Criteria

Testing Plan

Evidence Required

Exit Criteria

Tidak diperbolehkan implementasi besar tanpa WO.

---

# 67. Performance Budget

Target performa:

Dashboard

< 2 detik

Login

< 3 detik

Page Navigation

< 500 ms

Realtime Update

< 1 detik

Sync Queue

< 30 detik

---

# 68. Memory Usage Policy

Hindari:

- memory leak
- duplicate listener
- duplicate cache
- infinite rendering
- unnecessary re-render

Gunakan cleanup dan memoization bila diperlukan.

---

# 69. Quality Before Speed

Kecepatan implementasi tidak boleh mengorbankan:

- Architecture
- Security
- Offline First
- Maintainability
- Firestore Efficiency

Selalu pilih solusi yang lebih mudah dipelihara dalam jangka panjang.

---

# 70. AI Agent Development Workflow (Mandatory)

Seluruh AI Coding Agent wajib mengikuti workflow berikut sebelum menghasilkan kode.

## Phase 0 — Architecture Audit

Sebelum membuat kode:

- Audit struktur feature
- Audit repository
- Audit service
- Audit hook
- Audit collection
- Audit summary collection
- Audit Sync Engine
- Audit Security
- Audit RBAC
- Audit Offline

Output wajib:

- Root Cause
- Existing Architecture
- Impact Analysis
- Recommended Solution

Tidak boleh langsung membuat kode.

---

## Phase 1 — Design

Rancang:

- folder
- interfaces
- repository
- service
- hook
- component

Pastikan tetap sesuai blueprint.

---

## Phase 2 — Implementation

Urutan implementasi:

Repository

↓

Service

↓

Hook

↓

UI

↓

Testing

---

## Phase 3 — Verification

Checklist:

✅ Build Green

✅ Lint Green

✅ Type Check Green

✅ Tenant Safe

✅ Offline Safe

✅ Sync Safe

✅ RBAC Safe

✅ Audit Safe

---

# 71. Refactoring Rules

AI diperbolehkan melakukan refactoring apabila menemukan:

- duplicate logic
- duplicate service
- duplicate repository
- duplicate query
- duplicate hook

Dengan syarat:

Tidak mengubah business rule.

Prioritas:

1. remove duplicate
2. simplify architecture
3. improve readability
4. improve performance
5. reduce Firestore reads

---

# 72. Performance Rules

Target minimal:

App startup < 3 detik

Dashboard < 500 ms

Firestore Read turun ≥ 70%

Firestore Listener turun ≥ 80%

Realtime Listener hanya event penting

Delta Sync default

Summary Collection default

Dexie sebagai operational database

---

# 73. Build Quality Gate

AI tidak boleh menyatakan pekerjaan selesai apabila:

Build gagal

Lint gagal

TypeScript error

Circular dependency baru

Repository mengimpor Firebase

UI mengakses Firestore

Hook mengakses Firestore

Service melewati Repository

Repository membaca Firestore

---

# 74. Firestore Cost Rules

Dilarang:

getDocs seluruh collection

loop ribuan document

snapshot collection besar

count manual

aggregate di client

Wajib:

summary collection

metadata version

delta sync

incremental update

local cache

---

# 75. Sync Rules

Sync Engine adalah SATU-SATUNYA komponen yang boleh:

mengakses Firestore

mengirim mutation

mengambil delta

mengambil metadata

mengambil version

Repository:

hanya Dexie

Service:

tidak boleh query Firestore

UI:

tidak mengetahui Firestore

---

# 76. Repository Rules

Repository bertanggung jawab atas:

CRUD Dexie

mapping entity

query Dexie

pagination

index usage

Tidak boleh:

Firebase SDK

Permission

RBAC

Toast

Alert

Navigation

---

# 77. Service Rules

Service bertanggung jawab:

business rule

RBAC

validation

workflow

sync request

summary update request

Tidak boleh:

render UI

akses DOM

mengakses Firebase langsung

---

# 78. Hook Rules

Hook bertanggung jawab:

loading

error

state

memoization

subscription

cleanup

Tidak boleh:

business rule kompleks

akses Firestore

---

# 79. UI Rules

Component hanya boleh:

render

event

presentation

Tidak boleh:

Firestore

Dexie

Business Logic

Permission Logic

---

# 80. Final Golden Rules

Apabila terdapat konflik:

Selalu pilih:

✅ Offline First

✅ Dexie First

✅ Delta Sync

✅ Summary Collection

✅ Repository Pattern

✅ Service Pattern

✅ Multi Tenant

✅ Low Firestore Cost

✅ High Maintainability

✅ Enterprise Architecture

---

# 81. AI Coding Agent Oath

Seluruh AI Coding Agent wajib mematuhi prinsip berikut:

1. Tidak melakukan quick fix.

2. Selalu mencari akar masalah (Root Cause).

3. Selalu melakukan Architecture Review sebelum implementasi.

4. Selalu meminimalkan Firestore Read, Write, Listener, dan Cost.

5. Selalu menjaga isolasi multi-tenant.

6. Selalu mempertahankan Offline-First Architecture.

7. Selalu mengikuti Layer Architecture:
UI → Hook → Service → Repository → Dexie → Sync Engine → Firestore.

8. Tidak pernah mengakses Firestore di luar Sync Engine.

9. Tidak pernah mengakses Dexie langsung dari UI.

10. Tidak pernah mengorbankan arsitektur demi solusi cepat.

11. Setiap implementasi harus meningkatkan maintainability, scalability, security, dan performance.

12. Target akhir adalah menghasilkan IMAM System yang enterprise-grade, offline-first, multi-tenant, hemat biaya Firestore, mudah dipelihara, dan siap digunakan dalam skala besar.

---

# 82. Architecture Decision Record (ADR) Standard

Setiap perubahan arsitektur, pemilihan teknologi baru, atau penyimpangan dari standar wajib didokumentasikan dalam bentuk ADR.

Format ADR minimal harus mencakup:

- **Title**: Nama keputusan arsitektur.
- **Context**: Latar belakang mengapa keputusan ini diperlukan.
- **Decision**: Keputusan yang diambil secara spesifik.
- **Consequences**: Dampak positif dan negatif dari keputusan tersebut (trade-offs).
- **Status**: Proposed, Accepted, atau Deprecated.

ADR harus disetujui oleh tim sebelum diimplementasikan.

---

# 83. Domain Freeze & 5 Master Documents (Mandatory Standard)

Sebelum melakukan refactor atau implementasi fitur, AI dan seluruh developer WAJIB mematuhi **5 Master Documents** berikut yang telah dibekukan (Domain Freeze):

1. **Master Domain**: Aktor (Pengembang, Kanwil, Kemenag, Admin, Kepala Madrasah, Kepala TU, Staf TU, Guru Mapel, Wali Kelas, Guru BK, Siswa/Wali), Entitas (User, Teacher, Student, Class, Attendance, Journal, Letter, Point, Schedule, Announcement, Notification), dan Relasi antar entitas.
2. **Master Workflow**: Alur bisnis utama yang meliputi Login & Session Initialization, Attendance QR/GPS, Workflow Pengajuan Surat (Siswa → Wali Kelas → Guru BK → Kepala TU → Kepala Madrasah), dan Sync Queue Pipeline.
3. **Master Permission**: Standar RBAC dan daftar izin mutlak (e.g., `attendance.read`, `attendance.create`, `letter.read`, `letter.verify`, `letter.approve`). Dilarang keras melakukan hardcode role check di UI.
4. **Master Navigation**: Registry menu dan rute aplikasi resmi (Dashboard, Attendance, Journal, Letter, Point, Teacher, Student, QR, Settings, Reports). Dilarang membuat route baru di luar registry tanpa ADR.
5. **Master Event**: Katalog Event Bus standar (AttendanceCreated, LetterApproved, PointCreated, StudentPromoted, UserLoggedIn, dll.).

## Domain Freeze Rules:
- AI **dilarang keras** membuat aktor, role, permission, workflow, route, event, atau entitas baru tanpa analisis dampak dan persetujuan pengguna.
- Perubahan wajib melalui update dokumentasi Master Documents terlebih dahulu sebelum penulisan kode.

---

# END OF DOCUMENT

Version : Enterprise Final v2.1 (Domain Freeze Edition)

Status : ACTIVE

This document is the highest-priority development standard for the IMAM System project.