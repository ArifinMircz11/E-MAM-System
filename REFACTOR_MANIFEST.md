# REFACTOR MANIFEST — e-Mam System Enterprise Refactoring
**Standard Governance:** AGENTS.md v2.0 & GEMINI.md SSOT Compliance  
**Date:** 2026-08-08  
**Status:** DRAFT / APPROVED FOR PHASED EXECUTION  

---

## 1. Executive Summary & Audit Findings

Based on the 6-step architecture audit conducted prior to execution, the system currently exhibits key structural deviations from the **IMAM System Enterprise Architecture Standard**:

1. **Dual / Fragmented Sync Engines:**
   - Primary: `src/services/SyncEngine.ts` vs Secondary: `src/sync/SyncEngine.ts`
   - Unconsolidated Sync Services: `src/services/SyncService.ts`, `src/services/masterSyncService.ts`, `src/services/pointSyncService.ts`, `src/services/UserSyncService.ts`.
2. **Direct Firestore Boundary Violations (Outside Sync Engine):**
   - `src/domain/identityEngine.ts` directly importing `firebase/firestore` (`doc`, `updateDoc`, `getDocs`).
   - `src/modules/settings/TenantSettings.tsx` directly importing `doc`, `updateDoc`.
   - Direct `onSnapshot` / `deleteDoc` / `getDocs` in hooks (`src/hooks/useUnreadNotifications.ts`, `src/hooks/useTeacherAttendanceRecords.ts`, `src/hooks/useLiveComplaint.ts`, `src/hooks/useClassChat.ts`, `src/hooks/usePaginatedQuery.ts`, `src/hooks/useChatbotData.ts`, `src/hooks/useTeacherClassAttendanceData.ts`).
3. **Folder Duplications & Fragmented Core Domains:**
   - Repositories split between `src/repositories/` and feature-level `src/repos/` without unified Dexie mapping.
   - Sync split across `src/core/sync/`, `src/services/sync/`, and `src/sync/`.
   - Realtime split across `src/core/realtime/` and `src/services/realtime/`.
4. **Active TypeScript Compilation Errors (TypeCheck Baseline):**
   - Missing relative component imports in `GlobalSystemBar.tsx` (`OfflineSyncIndicator`, `LocalSearchPalette`).
   - Missing hook import in `ContextualActionButton.tsx` (`useContextualActionButton`).
   - `undefined` property checks in `CapabilityResolver.ts` and `PermissionEngine.ts`.
   - `null` assignment mismatch in `SecurityContextProvider.tsx`.
   - Object interface mismatch in `SecurityContextValidator.ts`.
   - Missing `@types/uuid` in `SettingsRepository.ts` & `systemRepository.ts`.
   - Missing `UserRole.KANKEMENAG` in `src/types/permissions.ts`.

---

## 2. Refactoring Strategy & Phased Execution Plan

Execution strictly adheres to **Phase 0 Audit -> Phase 1 Design -> Phase 2 Implementation -> Phase 3 Verification** per AGENTS.md §70.

```
                  ┌─────────────────────────────────────────┐
                  │ Phase 1: Critical Type & Import Repair  │
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────▼────────────────────┐
                  │ Phase 2: Firestore Access Consolidation │
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────▼────────────────────┐
                  │ Phase 3: SyncEngine & Sync Consolidation│
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────▼────────────────────┐
                  │ Phase 4: Domain & Realtime Layering     │
                  └─────────────────────────────────────────┘
```

---

## 3. Phase Breakdown & File Mapping

### PHASE 1: Fix Baseline TypeCheck Errors & Missing Imports
*Objective: Eliminate all compile-time errors in `npm run typecheck` without changing architecture boundaries.*

| Source File | Target / Action | Reason | Affected Dependencies | Risk |
|---|---|---|---|---|
| `src/components/layout/GlobalSystemBar.tsx` | Fix import paths to `@/features/developer/components/OfflineSyncIndicator` and `@/components/ui/LocalSearchPalette` | Missing module resolution | `GlobalSystemBar.tsx` | Low |
| `src/components/ui/ContextualActionButton.tsx` | Fix import path to `@/hooks/useContextualActionButton` | Relative path error | `ContextualActionButton.tsx` | Low |
| `src/types/permissions.ts` | Add `[UserRole.KANKEMENAG]` mapping in default role permission matrix | Missing enum key in `Record<UserRole, Permission[]>` | `permissionChecker.ts`, `roleRegistry.ts` | Low |
| `src/repositories/SettingsRepository.ts` & `systemRepository.ts` | Replace external `uuid` requirement with native `crypto.randomUUID()` | Avoid uninstalled `@types/uuid` | `SettingsRepository.ts`, `systemRepository.ts` | Low |
| `src/core/authorization/capability/CapabilityResolver.ts` | Add safe optional chaining & array fallback for `context.roles` | Fix TS18048 `possibly undefined` | `CapabilityResolver.ts` | Low |
| `src/core/authorization/engine/PermissionEngine.ts` | Guard `r` undefined check in permission loop | Fix TS18048 `possibly undefined` | `PermissionEngine.ts` | Low |
| `src/core/identity/security-context/SecurityContextProvider.tsx` | Convert `null` to `undefined` for `string \| undefined` properties | Fix TS2322 type mismatch | `SecurityContextProvider.tsx` | Low |
| `src/core/identity/security-context/SecurityContextValidator.ts` | Align `IdentityContext` mock object properties with exact type definitions | Fix TS2345 & TS2339 property mismatch | `SecurityContextValidator.ts` | Low |

---

### PHASE 2: Firestore Access Boundary Consolidation
*Objective: Enforce Rule §5 & §39 — Zero direct `firebase/firestore` imports in UI, Hooks, Domain, or Modules. Route all Firestore operations through `dbGateway` / Sync Engine gateway.*

| Source File | Target Action | Reason | Affected Dependencies | Risk |
|---|---|---|---|---|
| `src/domain/identityEngine.ts` | Refactor `firebase/firestore` calls to use `dbGateway` adapter methods | AGENTS.md §5: Domain/Services must not directly import Firebase SDK | `UserSyncService.ts`, `identityEngine.ts` | Medium |
| `src/modules/settings/TenantSettings.tsx` | Refactor `doc`/`updateDoc` imports from `firebase/firestore` to `@/services/dbGateway` | AGENTS.md §5: Modules must not import `firebase/firestore` directly | `TenantSettings.tsx` | Low |
| `src/hooks/useTeacherAttendanceRecords.ts` | Replace `deleteDoc` and `getDocsOptimized` direct usage with `teacherAttendanceRepository` & Dexie/SyncEngine calls | AGENTS.md §5 & §10: Hooks must not write/delete directly in Firestore | `TeacherAttendanceView.tsx` | Medium |
| `src/hooks/useUnreadNotifications.ts` | Wrap `onSnapshot` inside `RealtimeHub` / `notificationListener` | AGENTS.md §37-38: No raw loose listeners in hooks | Notification UI components | Low |
| `src/hooks/useLiveComplaint.ts` | Route live complaints listener through `RealtimeHub` | AGENTS.md §37-38: Centralized listener cleanup | `LiveComplaintWindow.tsx` | Low |
| `src/hooks/useClassChat.ts` | Route class chat listener through `RealtimeHub` | AGENTS.md §37-38: Single active listener | `ChatWindowContainer.tsx` | Low |
| `src/hooks/useChatbotData.ts` | Replace direct `getDocSafe` Firestore call with Dexie repository reader | AGENTS.md §19: Local First (Dexie) read priority | `Chatbot.tsx` | Low |
| `src/hooks/useTeacherClassAttendanceData.ts` | Replace direct `getDocSafe` / `getDocsOptimized` with `classRepository` and `teacherRepository` Dexie queries | AGENTS.md §11 & §19: Read operational data from Dexie | `TeacherClassAttendance.tsx` | Medium |

---

### PHASE 3: Sync Engine Consolidation & Repository Alignment
*Objective: Enforce AGENTS.md §4, §25, §75 — Consolidation of dual SyncEngines into `src/services/SyncEngine.ts` and single gateway architecture.*

| Source File | Target Action | Reason | Affected Dependencies | Risk |
|---|---|---|---|---|
| `src/sync/SyncEngine.ts` | Consolidate into `src/services/SyncEngine.ts` and deprecate duplicate | AGENTS.md §16 & §75: Single SyncEngine instance | `SyncCoordinator.ts`, `SyncWorker.ts`, `useOfflineSync.ts` | High |
| `src/sync/ConflictResolver.ts` | Consolidate under `src/services/sync/ConflictResolver.ts` | AGENTS.md §29: Centralized conflict resolution | `SyncEngine.ts` | Medium |
| `src/services/SyncService.ts` | Merge orphan methods into `src/services/SyncEngine.ts` | AGENTS.md §16: Eliminate duplicate services | `useDashboardSync.ts` | Medium |
| `src/services/masterSyncService.ts` | Ensure entrypoint delegates strictly to `SyncEngine` for Delta Sync | AGENTS.md §22: Standardize Delta Sync | `AppInitializationService.ts` | Low |
| `src/services/pointSyncService.ts` | Align point queue processing with standard `SyncQueue` | AGENTS.md §25: Standard Sync Queue pipeline | `PointsView.tsx` | Low |

---

### PHASE 4: Domain Service & Realtime Layering Verification
*Objective: Enforce AGENTS.md §7, §12 — Strict Layering (`UI -> Hook -> Service -> Repository -> Dexie -> Sync Queue -> Sync Engine -> Firestore`).*

| Source File | Target Action | Reason | Affected Dependencies | Risk |
|---|---|---|---|---|
| `src/services/teacherService.ts` & `src/features/teachers/` | Verify `TeacherService` acts as single domain orchestrator over `DexieTeacherRepository` | AGENTS.md §9: Service is central business logic | `useTeachers.ts` | Medium |
| `src/services/studentService.ts` & `src/features/students/` | Verify `StudentService` acts as single domain orchestrator over `DexieStudentRepository` | AGENTS.md §9: Service is central business logic | `useStudents.ts` | Medium |
| `src/features/attendance/services/attendanceService.ts` | Verify attendance domain rules, QR validation, and summary calculations reside strictly in Service | AGENTS.md §9: No domain logic in UI/Hooks | `AttendancePanel.tsx` | Medium |
| `src/core/realtime/RealtimeHub.ts` & `src/services/realtime/` | Consolidate all subscription registries into `RealtimeHub` | AGENTS.md §38: Prevent duplicate listeners | `useRealtimeSubscriptions.ts` | Medium |

---

## 4. Acceptance & Verification Gates

After completing each Phase, the following quality gates **MUST** pass before advancing to the next phase:

1. **`npm run typecheck`** MUST return 0 errors.
2. **`npm run audit`** MUST confirm 0 direct Firestore violations outside Sync Engine.
3. **`compile_applet`** MUST build clean without runtime or bundling errors.
4. **No `--unsafe` or `as any` casting permitted** to suppress valid structural errors.

---
*Signed by: Principal Enterprise Software Architect & AI Agent*
