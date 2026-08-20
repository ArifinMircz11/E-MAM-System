Berikut versi **AGENTS.md gabungan yang sudah diperbarui**. Saya integrasikan:

* **Architecture Blueprint e-MAM**
* **Pola Pengembangan Fitur Terstruktur**
* **Auto-Fix Protocol / Self-Healing**
* **Offline First + IndexedDB sebagai operational database**
* **Firestore sebagai source of truth**
* **Delta Sync + Master Version**
* **RBAC + Multi Tenant**
* **Repository Layer**
* **Quality Gate sebelum build/deploy**

Saran: ganti isi `AGENTS.md` lama dengan dokumen berikut.

---

# AGENTS.md

# e-MAM System Development Standard

## Integrated Madrasah Academic Manager

Version: 2026.06
Status: **Mandatory Development Guideline**

---

# 1. Vision & Goals

e-MAM adalah platform manajemen akademik madrasah enterprise-grade dengan prinsip:

* Offline First
* Multi Tenant Secure
* Cost Efficient Firestore
* Scalable Architecture
* Self Healing Application
* Strict Separation of Concern
* RBAC Security by Default

Target utama:

1. Firestore sebagai **Source of Truth**
2. IndexedDB/Dexie sebagai **Operational Database**
3. UI tetap berjalan walaupun offline
4. Sinkronisasi dilakukan melalui Sync Engine
5. Biaya Firestore diminimalkan dengan caching dan delta sync

---

# 2. Core Architecture

## 5 Layer Architecture

Semua fitur WAJIB mengikuti struktur:

```
UI
 ↓
Hook
 ↓
Service
 ↓
Repository
 ↓
Data Source
```

---

# Layer 1 — UI Component Layer

Lokasi:

```
src/components/
src/features/
```

Tanggung jawab:

✅ Rendering UI
✅ User interaction
✅ Responsive layout
✅ Menampilkan loading/error state

DILARANG:

❌ Query Firestore langsung
❌ Import Firebase SDK
❌ Memanggil repository langsung
❌ Menyimpan business logic

Contoh benar:

```tsx
const {students, loading} = useStudents();
```

Contoh salah:

```tsx
getDocs(collection(db,"students"))
```

---

# Layer 2 — Hook Layer

Lokasi:

```
src/hooks/
```

Contoh:

```
useStudents.ts
useAttendance.ts
useGrades.ts
```

Tanggung jawab:

* UI state management
* Loading state
* Error handling
* Calling service
* Subscription management

WAJIB:

```typescript
const {
 data,
 isLoading,
 error,
 isSubmitting
}=useFeature();
```

Semua async:

WAJIB menggunakan:

```typescript
useAutoFix()
```

Contoh:

```typescript
const {safeCall}=useAutoFix();


await safeCall(
 ()=>studentService.getStudents(),
 "Student.Load"
);
```

---

# Layer 3 — Service Layer

Lokasi:

```
src/services/
```

Contoh:

```
studentService.ts
attendanceService.ts
gradeService.ts
```

Tanggung jawab:

* Business logic
* Validation
* Transaction flow
* Sync orchestration

WAJIB:

```typescript
try {

}
catch(err){

}
```

Error wajib:

```typescript
sanitizeError(err)
```

Tidak boleh:

```typescript
throw err;
```

---

# Layer 4 — Repository Layer

Lokasi:

```
src/repositories/
```

Contoh:

```
studentRepository.ts
attendanceRepository.ts
```

Tanggung jawab:

* CRUD abstraction
* Firestore access
* IndexedDB access
* Transaction handling

Repository menjadi satu-satunya layer yang boleh:

```
Firestore
IndexedDB
Dexie
API
```

---

# Layer 5 — Data Source Layer

Sumber data:

```
Firestore
      |
      |
 Sync Engine
      |
      |
 IndexedDB/Dexie
```

---

# 3. Database Architecture

## Firestore

Role:

```
SOURCE OF TRUTH
```

Digunakan untuk:

* Master data
* Backup
* Multi device sync
* Audit

---

## IndexedDB / Dexie

Role:

```
OPERATIONAL DATABASE
```

Digunakan untuk:

* Dashboard
* Scanner QR
* Offline activity
* Local query

---

# 4. Offline First Rules

Semua data penting WAJIB tersedia lokal.

Master Data:

```
students
teachers
classes
users
tenants
point_categories
academicConfig
schedules
```

Disimpan lokal.

Login:

DILARANG:

```
load semua collection
```

WAJIB:

```
metadata/version check
↓
delta sync
↓
update cache
```

---

# 5. Synchronization Standard

Gunakan:

```
SyncEngine
SyncQueue
MasterVersion
```

Flow:

```
User Action

↓


IndexedDB Write


↓

syncQueue


↓

Background Sync


↓

Firestore


↓

Update Version
```

---

# 6. Firestore Optimization Rules

## DILARANG

Query tanpa filter:

```typescript
getDocs(collection(db,"students"))
```

WAJIB:

```typescript
where(
 "tenantId",
 "==",
 tenantId
)
```

---

## Realtime Listener

Hanya boleh untuk:

* Chat
* Notification
* Approval Request
* Critical Monitoring

DILARANG:

Dashboard menggunakan:

```
onSnapshot()
```

Dashboard harus:

```
IndexedDB query
```

---

# 7. Firestore Schema & Database Blueprint v1.1

Seluruh struktur koleksi, skema dokumen, metadata standar, aturan penamaan field, penanganan activity_logs, serta sinkronisasi wajib merujuk secara penuh pada dokumen:
👉 **[/IMAM_DATABASE_BLUEPRINT_v1_1.md](/IMAM_DATABASE_BLUEPRINT_v1_1.md)**

### Ringkasan Aturan Utama v1.1:
1. **35+1 Rule**: 35 Firestore Top-Level Collections + 1 Local Dexie Table (`activity_logs`).
2. **activity_logs vs audit_logs**:
   * `activity_logs`: Simpan lokal di Dexie saja. ❌ Jangan disinkronkan ke Firestore.
   * `audit_logs`: Disimpan lokal dan ✔ disinkronkan ke Firestore untuk melacak aksi keamanan penting.
3. **Konvensi Penamaan (Naming Conventions)**:
   * Primary Key wajib: `id`.
   * Foreign Key wajib berbentuk singular (seperti `studentId`, `teacherId`, `classId`, dll.). ❌ Tidak boleh menggunakan nama jamak seperti `studentsId`.
4. **Pemisahan PK vs Business ID**:
   * `students`: PK `id`, Business ID `idUnik` (NIM pada QR Card).
   * `teachers`: PK `id`, Business ID `teachersId` (NIP/NIK).
   * `users`: PK `id`, Business ID `firebaseUid`.
   * Seluruh relasi internal wajib merujuk ke PK (`id`), bukan Business ID.
5. **Standard Metadata**:
   * Setiap dokumen operasional wajib memiliki metadata standar: `id`, `tenantId`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `version`, `schemaVersion`, `syncStatus`, `deleted`, `deletedAt`, `lastModifiedDevice`, serta field opsional `migrationVersion` dan `checksum`.
6. **Sync Queue & DLQ**:
   * Format `sync_queue` bersifat generik.
   * Transaksi gagal masuk `deadLetterQueue` lokal saja (Dexie) dan tidak pernah disinkronkan ke cloud.

---

# ID Policy

DILARANG:

```typescript
addDoc()
```

```typescript
doc(collection())
```

```typescript
.autoId
```

WAJIB:

Manual ID:

```
studentId
teacherId
classId
tenantId
```

atau deterministic:

```
tenantId_year_studentId
```

---

# 8. Security Standard

## RBAC

Security harus:

```
Firestore Rules
+
Application Permission
```

Tidak cukup hanya hide menu.

---

# Tenant Isolation

SEMUA query:

WAJIB:

```typescript
tenantId
```

Tidak boleh:

```
cross tenant query
```

---

# 9. Auto Fix Protocol (Self Healing)

Semua async operation wajib mengikuti:

```
Operation

↓

safeCall()

↓

Error Classification

↓

Recovery

↓

Audit
```

---

## useAutoFix

Contoh:

```typescript
const {safeCall}=useAutoFix();


await safeCall(
 async()=>{
   await service.save()
 },
 "Attendance.Save"
)
```

---

# Error Classification

Lokasi:

```
src/utils/errorClassifier.ts
```

Kategori:

```
NETWORK_ERROR

AUTH_ERROR

PERMISSION_ERROR

VALIDATION_ERROR

SYNC_ERROR

UNKNOWN_ERROR
```

---

# 10. Listener Cleanup

Semua:

```
onSnapshot
```

WAJIB:

```typescript
useEffect(()=>{

const unsub =
onSnapshot(...)


return ()=>unsub()

},[])
```

---

# 11. Audit System

Data sensitif wajib:

```
audit_logs
```

Contoh:

* delete user
* perubahan nilai
* perubahan presensi
* approval

Gunakan:

```typescript
auditLog()
```

---

# Infinite Loop Protection

Global error handler:

WAJIB:

```typescript
_isAuditLogging
```

untuk mencegah:

```
error

↓

audit error

↓

error

↓

loop
```

---

# 12. State Management Rules

Zustand:

DILARANG menyimpan:

```
Firebase User Object
DocumentSnapshot
Class Instance
Function reference
```

Gunakan:

```typescript
sanitizeForJSON()
```

---

# 13. Feature Development Checklist

## Feature:

```
[Nama Feature]
```

---

## Schema

□ Update schema
□ Manual ID
□ tenantId
□ Rules update
□ Master version update

---

## Repository

□ Buat repository
□ CRUD abstraction
□ Firestore + IndexedDB support

---

## Service

□ try/catch
□ sanitizeError
□ auditLog
□ transaction/writeBatch

---

## Hook

□ useAutoFix
□ loading state
□ error state
□ submitting state
□ useCallback

---

## UI

□ Tidak akses database
□ Mobile first
□ Loading indicator
□ Error handling

---

## QA

□ npm run lint

□ npm run build

□ Unit test jika kritikal

□ RBAC test

□ Offline test

□ Sync test

---

# 14. Folder Standard

```
src/

components/
    Feature/

features/
    Feature/

hooks/
    useFeature.ts

services/
    featureService.ts

repositories/
    featureRepository.ts

database/
    dexie.ts

sync/
    syncEngine.ts

utils/
    errorClassifier.ts
    firestoreHelpers.ts

tests/

```

---

# 15. Golden Rules

## WAJIB

✅ UI tidak boleh akses Firestore
✅ Firestore adalah source of truth
✅ IndexedDB adalah operational database
✅ Semua async memakai useAutoFix
✅ Semua error memakai sanitizeError
✅ Semua dokumen memiliki tenantId
✅ Semua ID deterministic
✅ Dashboard membaca cache lokal
✅ Sync menggunakan delta sync
✅ Build harus bersih sebelum release

---

# 16. Architecture Governance

Perubahan besar:

* Database migration
* Struktur folder
* Authentication flow
* Sync Engine
* State architecture

WAJIB mendapat review arsitektur.

---

# End of AGENTS.md

**Dokumen ini adalah standar hidup e-MAM System dan menjadi instruksi utama bagi developer manusia maupun AI coding agent.**

---