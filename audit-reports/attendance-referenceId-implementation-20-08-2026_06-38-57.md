# Attendance ReferenceId Implementation

## Objective
Implement canonical ReferenceId integrity for Student Attendance.

## Mandatory architecture
UI
→ Zustand Store
→ Attendance Service / Use Case
→ Attendance Repository
→ Dexie
→ SyncQueue
→ SyncEngine
→ Firestore

## Rules
1. Dexie is the operational source of truth.
2. Firestore must never be accessed directly by UI.
3. Attendance Service must not directly write Firestore.
4. Attendance Repository owns attendance CRUD against Dexie.
5. Every attendance record must have a stable identity.
6. Student identity must resolve through canonical student reference.
7. ReferenceId must remain unchanged during offline → online synchronization.
8. Sync retry must be idempotent.
9. Sync must not create duplicate attendance records.
10. tenantId must participate in identity/isolation.
11. Existing valid data must not be destroyed.
12. Do not perform broad/global replacements.
13. Preserve existing QR Scanner offline workflow.
14. Preserve existing session structure:
   masuk, duha, zuhur, ashar, pulang.

## Audit targets
- src/features/attendance/services/attendanceService.ts
- src/repositories/attendanceRepository.ts
- src/features/attendance/hooks/
- src/features/attendance/components/QRScanner.tsx
- src/sync/SyncDispatcher.ts
- src/sync/handlers/attendance.handler.ts
- src/services/SyncEngine.ts
- src/repositories/SyncRepository.ts
- Student schema/repository
- Dexie attendance schema

## Acceptance criteria
- Canonical student reference is deterministic and stable.
- Attendance references the canonical student identity.
- Offline attendance works without network.
- Dexie write happens before synchronization.
- SyncQueue receives the operation.
- SyncEngine is the only cloud synchronization boundary.
- Firestore receives the same logical record identity.
- Repeated synchronization does not duplicate attendance.
- Existing attendance records remain readable.
- TypeScript passes.
- Build passes.
- Tests pass.
