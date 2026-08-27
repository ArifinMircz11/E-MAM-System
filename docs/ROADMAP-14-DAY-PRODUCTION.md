# e-MAM System — 14-Day Production Roadmap

**Tanggal:** 27 Agustus 2026  
**Target:** Production Ready  
**Baseline:** ~80% progress engineering  
**Prinsip:** Offline-First, Dexie sebagai operational database, Firestore sebagai sync/cloud layer.

## Target Arsitektur

UI → Zustand Store → Service / Use Case → Repository → Dexie → SyncQueue → SyncEngine → Firestore

**Definition of Production Ready:**
- Tidak ada critical architecture/security violation.
- Seluruh mutation operasional masuk Dexie terlebih dahulu.
- UI/Store tidak mengakses Dexie atau Firestore secara langsung.
- Cloud access terpusat melalui SyncEngine/FirestoreGateway.
- QR dan Absensi tetap berjalan saat internet mati.
- Reconnect, delta sync, conflict dan idempotency teruji.
- Tenant isolation dan RBAC teruji.
- Typecheck, lint, unit, E2E, audit dan build PASS.
- Production deployment + smoke test PASS.
- Backup/recovery tervalidasi.

---

# Hari 1 — Architecture Boundary Freeze
- Audit UI → Store → Service → Repository.
- Audit seluruh direct Dexie access.
- Audit seluruh direct Firestore/Firebase CRUD.
- Tetapkan canonical service/repository path.
- Perbaiki violation P0.
- Jalankan architecture/dependency/repository/dexie audit.

**Checkpoint:** 0 critical boundary violation.

# Hari 2 — Canonical Identity, RBAC & Tenant
- Finalisasi P0-1 Login → Canonical Identity.
- Validasi users/auth UID.
- Validasi role/roles.
- Validasi tenantId di semua operational path.
- Audit authorization backend + Firestore rules.
- Selesaikan security PR yang relevan.

**Checkpoint:** identity + RBAC + tenant isolation PASS.

# Hari 3 — Schema, PK/FK & Dexie
- Audit seluruh schema TypeScript/Zod.
- Cocokkan PK/FK domain.
- Cocokkan Firestore collection ↔ Dexie table.
- Audit index dan compound index.
- Pastikan schema tidak menjadi source of truth ganda.
- Validasi migration/seeder.

**Checkpoint:** schema/relationship integrity PASS.

# Hari 4 — Repository Layer
- Audit seluruh repository.
- Pastikan CRUD operational melalui Repository.
- Hilangkan bypass dari hooks/components/services.
- Validasi BaseRepository + tenant scope.
- Tambahkan test repository.

**Checkpoint:** Repository boundary PASS.

# Hari 5 — SyncQueue / Outbox
- Finalisasi queue contract.
- Pastikan Create/Update/Delete menghasilkan outbox mutation.
- FIFO/order.
- Retry metadata.
- Idempotency key.
- Dead-letter handling.
- Persistence saat aplikasi ditutup.

**Checkpoint:** SyncQueue PASS.

# Hari 6 — Canonical SyncEngine
- Finalisasi SyncEngine.
- Dexie queue → SyncEngine → FirestoreGateway.
- Retry/backoff.
- Network recovery.
- Batch processing.
- Error isolation.
- Observability/logging.

**Checkpoint:** SyncEngine core PASS.

# Hari 7 — Version-Based + Delta Sync
- Implementasi/validasi version metadata.
- Delta sync.
- Cursor/version checkpoint.
- Reconnect recovery.
- Duplicate prevention.
- Conflict policy.
- Test concurrent update.

**Checkpoint:** sync consistency PASS.

# Hari 8 — QR Scanner Offline
- QR scanner tanpa internet.
- Resolve siswa dari Dexie.
- Simpan hasil scan lokal.
- Queue mutation.
- Duplicate scan protection.
- Reconnect sync.
- E2E offline test.

**Checkpoint:** QR Offline PASS.

# Hari 9 — Attendance Engine
- Student attendance.
- Teacher attendance.
- Offline attendance.
- Date/class/student constraints.
- Idempotency.
- Sync/reconnect.
- Conflict handling.
- E2E.

**Checkpoint:** Attendance Offline PASS.

# Hari 10 — Modul Operasional
Audit dan finalisasi:
- Jurnal Guru.
- Poin.
- Surat/Izin.
- Data Siswa.
- Data Guru.
- Kelas.
- PTSP.
- BK jika masuk release scope.

Setiap modul wajib mengikuti:
UI → Store → Service → Repository → Dexie → SyncQueue → SyncEngine.

**Checkpoint:** seluruh release-scope module PASS.

# Hari 11 — Dashboard, Summary & Audit Log
- Dashboard menggunakan Summary Collection.
- Hindari query agregasi berat dari UI.
- Validasi student point summaries.
- Dashboard summaries.
- Audit logs.
- Reporting/read model.
- Offline cache/read behavior.

**Checkpoint:** reporting/dashboard PASS.

# Hari 12 — Full Automated Audit & Security
Jalankan:
- architecture audit
- dependency audit
- Firestore boundary
- Dexie boundary
- repository boundary
- service flow
- sync boundary
- tenant audit
- RBAC audit
- schema/relationship audit
- security audit
- production gate

**Checkpoint:** zero P0/P1 blocker.

# Hari 13 — Testing & Production E2E
Jalankan:
- typecheck
- lint
- unit test
- integration test
- E2E
- offline E2E
- reconnect E2E
- conflict/idempotency E2E
- tenant isolation E2E
- auth/RBAC E2E
- QR/Attendance E2E
- build

**Checkpoint:** semua required CI/production tests PASS.

# Hari 14 — Production Release Gate
- Review seluruh blocker.
- Verify Production environment.
- Firebase configuration.
- Firestore indexes/rules.
- Vercel deployment.
- Smoke test Production.
- Backup/recovery test.
- Monitoring/logging.
- Dokumentasi final.
- Update PROGRESS.md.
- Tag release.

**FINAL CHECKPOINT:**
## PRODUCTION READY

Tidak ada release jika salah satu critical gate gagal.

---

# Priority Order

**P0**
1. Architecture Boundary
2. Identity/RBAC/Tenant
3. Schema/PK/FK
4. Repository/Dexie
5. SyncQueue
6. SyncEngine
7. Version + Delta Sync
8. QR Offline
9. Attendance Offline
10. Security

**P1**
11. Jurnal
12. Poin
13. Surat/Izin
14. PTSP
15. Dashboard/Summary
16. Audit/Reporting

**Release**
17. Automated Audit
18. E2E
19. Production Deployment
20. Backup/Recovery
21. Final Production Gate

---

# Daily Tracking Rule

Setiap hari wajib mencatat:

- Selesai
- Belum selesai
- Blocker
- Critical violations
- Test result
- Commit/PR
- Persentase aktual

**Jangan menaikkan persentase hanya karena kode dibuat.**
Progress hanya naik setelah implementation + audit + test pada scope tersebut lulus.

## Target Akhir

**Hari 1–4:** Boundary & data foundation  
**Hari 5–7:** Sync core  
**Hari 8–10:** Operational modules  
**Hari 11–12:** Reporting + security + audit  
**Hari 13:** Full testing  
**Hari 14:** Production release gate

**Goal: 100% roadmap + Production Ready.**
