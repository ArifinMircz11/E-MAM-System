# Firestore Boundary Migration Manifest

## Objective

Drive direct Firestore access in UI/presentation code to **0 violations** while preserving business behavior.

## Canonical flow

UI → Zustand → Service/Use Case → Repository → Dexie → SyncQueue → SyncEngine → Firestore

## P0 migration queue

| Priority | File | Direct cloud responsibility | Target boundary | Status |
|---|---|---|---|---|
| P0 | `src/components/DeveloperConsole/StudentApprovalModal.tsx` | Read `classes` | Class Repository/Service | TODO |
| P0 | `src/components/SchemaMigrationSection.tsx` | Migration reads/writes | Dedicated migration service/gateway | TODO |
| P0 | `src/components/Login.tsx` | Read `ticker` | Public/local cache service | TODO |
| P0 | `src/components/Onboarding/ReferenceIdForm.tsx` | Write `audit_logs` | AuditLog Service → Repository/SyncQueue | TODO |
| P0 | `src/components/Profile.tsx` | Read/write `profile_update_requests` | Profile Service → Repository/SyncQueue | TODO |
| P0 | `src/components/Assignments.tsx` | Read `teachers`, `classes` | Assignment Service + repositories | TODO |
| P0 | `src/components/DuplicateStudentsDashboard.tsx` | Read `students` | Student Repository | TODO |
| P0 | `src/components/PointCategorySettings.tsx` | Read/write `point_categories` | Point Category Repository/Service | TODO |
| P0 | `src/components/NotificationLogs.tsx` | Read `audit_notifications` | Notification Repository/Service | TODO |
| P0 | `src/components/SystemDocumentation.tsx` | Read `documentation` | Documentation Repository/Service | TODO |

## Rules

1. UI/components must not import `firebase/firestore`.
2. UI/components must not call Firestore SDK functions.
3. Reads must resolve from Dexie through Repository/Service.
4. Writes must persist locally first and enqueue synchronization.
5. Cloud access is centralized behind SyncEngine/cloud gateway.
6. Developer migration tooling may require a controlled cloud gateway, but must not leak SDK access into presentation components.
7. Every migration must finish with `npm run audit:firestore`, typecheck, lint, and build.

## Definition of Done

- Strict boundary audit reports `0` violations.
- No UI component imports Firestore SDK.
- Offline reads do not require network connectivity.
- Offline writes remain durable in Dexie/SyncQueue.
- Reconnect sync is handled by SyncEngine.
- Existing business behavior is covered by tests.
