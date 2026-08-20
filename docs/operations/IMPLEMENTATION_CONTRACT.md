# Implementation Contract

Version: 1.0.0
Status: FINAL

Dokumen ini merupakan kontrak mutlak bagi seluruh implementasi Work Order (WO) dalam arsitektur e-MAM System.

## Execution Rules
Selama proses refactor, **DILARANG KERAS** melakukan hal berikut:
* Tidak ada perubahan business logic.
* Tidak ada perubahan schema Firestore.
* Tidak ada perubahan schema Dexie.
* Tidak ada perubahan struktur collection.
* Tidak ada perubahan PK/FK.
* Tidak ada perubahan RBAC.
* Tidak ada perubahan workflow login.
* Tidak ada perubahan UI.

Yang **BOLEH DIUBAH** hanya:
* Layer
* Dependency
* Import
* Repository
* Service
* SyncEngine
* Adapter
* Wrapper

## Rollback Rule
Jika salah satu pemeriksaan berikut **GAGAL**:
* Build
* TypeCheck
* Lint
* Startup
* Login
* Sync
* Offline
* Developer Console
* Production Safety Gate

Maka wajib melakukan prosedur:
**STOP -> Rollback -> Perbaiki -> Regression -> Baru lanjut**

## Commit Rule
Setiap implementasi harus dilakukan dalam porsi kecil (incremental). Dilarang melakukan satu commit besar untuk seluruh Work Order.
Contoh:
* `WO-002.2-001: Implementasi AuthRepository`
* `WO-002.2-002: Refactor AuthService untuk menggunakan Dexie`

## File Change Rule
Setiap Work Order (WO) Report wajib menyertakan daftar file yang terdampak secara eksplisit:
* Files Added
* Files Modified
* Files Deleted
* Files Moved

## Architecture Validation
Setelah setiap WO selesai, wajib menjalankan audit untuk memastikan alur layer ditaati secara ketat:
`UI` ↓ `Store` ↓ `Service` ↓ `Repository` ↓ `Dexie` ↓ `SyncQueue` ↓ `SyncEngine` ↓ `Firestore`

**Pastikan tidak ada layer yang melompati layer lain.** (Misalnya: UI ke Firestore, atau Repository langsung ke Firestore).
