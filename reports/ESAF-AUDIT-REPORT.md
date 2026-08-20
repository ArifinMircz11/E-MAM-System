# ESAF Architecture Governance Audit Report

- **Timestamp**: 2026-07-10T16:48:19.591Z
- **Architecture Score**: **0 / 100**
- **Status**: ❌ FAILED

## Violation Summary
- 🔴 **CRITICAL (P0)**: 27
- ❌ **ERROR (P1)**: 55
- ⚠️ **WARNING (P2)**: 0
- ℹ️ **INFO (P3)**: 0

## Generated Work Orders (6)
### [CRITICAL] WO-ESAF-001-OFFLINE-001: Remediate rule violation: OFFLINE-001
- **Target Rule**: OFFLINE-001
- **Affected Files**:
  - `/scripts/generate_random_attendance.ts`
  - `/scripts/inspectCategories.ts`
  - `/scripts/seed_mock_data.ts`
  - `/src/App.tsx`
  - `/src/components/Profile.tsx`
  - `/src/domain/identityEngine.ts`
  - `/src/hooks/useAppInitialization.ts`
  - `/src/hooks/useAuthInitialization.ts`
  - `/src/repositories/authRepository.ts`
  - `/src/repositories/BaseRepository.ts`
  - `/src/repositories/studentRepository.ts`
  - `/src/repositories/systemRepository.ts`
  - `/src/utils/autoFixEngine.ts`
  - `/src/utils/firestoreHelpers.ts`
  - `/src/components/Dashboard/ReferenceIdEntryModal.tsx`
  - `/src/components/Profile/ProfileCompletionModal.tsx`
  - `/src/core/realtime/RealtimeHub.ts`
  - `/src/database/repositories/newsRepository.ts`
  - `/src/features/messages/repositories/MessageRepository.ts`
  - `/src/features/students/dashboard/services/studentDashboardService.ts`
- **Objective**: Resolve all violations of rule OFFLINE-001 across 20 file(s) to restore architectural compliance.
- **Steps**:
  - Fix /scripts/generate_random_attendance.ts:1 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /scripts/generate_random_attendance.ts:2 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /scripts/inspectCategories.ts:2 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /scripts/seed_mock_data.ts:1 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /scripts/seed_mock_data.ts:2 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/App.tsx:39 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/components/Profile.tsx:16 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/domain/identityEngine.ts:6 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/hooks/useAppInitialization.ts:3 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/hooks/useAuthInitialization.ts:2 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/repositories/authRepository.ts:2 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/repositories/BaseRepository.ts:1 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/repositories/studentRepository.ts:2 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/repositories/systemRepository.ts:1 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/utils/autoFixEngine.ts:4 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/utils/firestoreHelpers.ts:2 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/components/Dashboard/ReferenceIdEntryModal.tsx:9 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/components/Profile/ProfileCompletionModal.tsx:4 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/core/realtime/RealtimeHub.ts:1 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/database/repositories/newsRepository.ts:2 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/features/messages/repositories/MessageRepository.ts:9 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.
  - Fix /src/features/students/dashboard/services/studentDashboardService.ts:2 -> Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern.

### [ERROR] WO-ESAF-002-SEC-001: Remediate rule violation: SEC-001
- **Target Rule**: SEC-001
- **Affected Files**:
  - `/src/components/AccountApproval.tsx`
  - `/src/components/ChatWindowContainer.tsx`
  - `/src/components/CreateAccount.tsx`
  - `/src/components/FloatingActionMenu.tsx`
  - `/src/components/GlobalErrorBoundary.tsx`
  - `/src/components/Messages.tsx`
  - `/src/components/SchemaMigrationSection.tsx`
  - `/src/components/UserDatabaseManagement.tsx`
  - `/src/components/Admin/AccountEditModal.tsx`
  - `/src/components/Admin/OnboardingApproval.tsx`
  - `/src/components/Chatbot/AiAgentPanel.tsx`
  - `/src/components/Chatbot/ChatbotMessageList.tsx`
  - `/src/components/DeveloperConsole/DevFirestoreMonitor.tsx`
  - `/src/components/DeveloperConsole/DevTabFirestoreGov.tsx`
  - `/src/components/DeveloperConsole/DevTabUserControl.tsx`
  - `/src/components/DeveloperConsole/StudentApprovalModal.tsx`
  - `/src/components/Generic/DataExplorerView.tsx`
- **Objective**: Resolve all violations of rule SEC-001 across 17 file(s) to restore architectural compliance.
- **Steps**:
  - Fix /src/components/AccountApproval.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/ChatWindowContainer.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/CreateAccount.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/FloatingActionMenu.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/GlobalErrorBoundary.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/Messages.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/SchemaMigrationSection.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/UserDatabaseManagement.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/Admin/AccountEditModal.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/Admin/OnboardingApproval.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/Chatbot/AiAgentPanel.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/Chatbot/ChatbotMessageList.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/DeveloperConsole/DevFirestoreMonitor.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/DeveloperConsole/DevTabFirestoreGov.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/DeveloperConsole/DevTabUserControl.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/DeveloperConsole/StudentApprovalModal.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.
  - Fix /src/components/Generic/DataExplorerView.tsx:1 -> Delegate all permission and role checks to PermissionChecker or SecurityService.

### [ERROR] WO-ESAF-003-ARCH-001: Remediate rule violation: ARCH-001
- **Target Rule**: ARCH-001
- **Affected Files**:
  - `/src/repositories/authRepository.ts`
  - `/src/repositories/BaseRepository.ts`
  - `/src/repositories/studentRepository.ts`
  - `/src/repositories/systemRepository.ts`
  - `/src/database/repositories/newsRepository.ts`
  - `/src/features/messages/repositories/MessageRepository.ts`
- **Objective**: Resolve all violations of rule ARCH-001 across 6 file(s) to restore architectural compliance.
- **Steps**:
  - Fix /src/repositories/authRepository.ts:1 -> Repositories must be pure TypeScript classes interacting only with Dexie.
  - Fix /src/repositories/authRepository.ts:2 -> Repositories must be pure TypeScript classes interacting only with Dexie.
  - Fix /src/repositories/BaseRepository.ts:1 -> Repositories must be pure TypeScript classes interacting only with Dexie.
  - Fix /src/repositories/BaseRepository.ts:11 -> Repositories must be pure TypeScript classes interacting only with Dexie.
  - Fix /src/repositories/studentRepository.ts:1 -> Repositories must be pure TypeScript classes interacting only with Dexie.
  - Fix /src/repositories/studentRepository.ts:2 -> Repositories must be pure TypeScript classes interacting only with Dexie.
  - Fix /src/repositories/systemRepository.ts:1 -> Repositories must be pure TypeScript classes interacting only with Dexie.
  - Fix /src/repositories/systemRepository.ts:2 -> Repositories must be pure TypeScript classes interacting only with Dexie.
  - Fix /src/database/repositories/newsRepository.ts:1 -> Repositories must be pure TypeScript classes interacting only with Dexie.
  - Fix /src/database/repositories/newsRepository.ts:2 -> Repositories must be pure TypeScript classes interacting only with Dexie.
  - Fix /src/features/messages/repositories/MessageRepository.ts:8 -> Repositories must be pure TypeScript classes interacting only with Dexie.
  - Fix /src/features/messages/repositories/MessageRepository.ts:9 -> Repositories must be pure TypeScript classes interacting only with Dexie.

### [ERROR] WO-ESAF-004-SYNC-001: Remediate rule violation: SYNC-001
- **Target Rule**: SYNC-001
- **Affected Files**:
  - `/src/database/repositories/AuthRepository.ts`
  - `/src/database/repositories/BaseRepository.ts`
  - `/src/database/repositories/DashboardSummaryRepository.ts`
  - `/src/database/repositories/journalRepository.ts`
  - `/src/database/repositories/messageRepository.ts`
  - `/src/database/repositories/newsRepository.ts`
  - `/src/database/repositories/studentRepository.ts`
  - `/src/database/repositories/SyncRepository.ts`
  - `/src/features/messages/repositories/MessageRepository.ts`
  - `/src/features/users/repositories/user.repository.ts`
- **Objective**: Resolve all violations of rule SYNC-001 across 10 file(s) to restore architectural compliance.
- **Steps**:
  - Fix /src/database/repositories/AuthRepository.ts:1 -> Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing.
  - Fix /src/database/repositories/BaseRepository.ts:1 -> Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing.
  - Fix /src/database/repositories/DashboardSummaryRepository.ts:1 -> Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing.
  - Fix /src/database/repositories/journalRepository.ts:1 -> Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing.
  - Fix /src/database/repositories/messageRepository.ts:1 -> Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing.
  - Fix /src/database/repositories/newsRepository.ts:1 -> Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing.
  - Fix /src/database/repositories/studentRepository.ts:1 -> Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing.
  - Fix /src/database/repositories/SyncRepository.ts:1 -> Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing.
  - Fix /src/features/messages/repositories/MessageRepository.ts:1 -> Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing.
  - Fix /src/features/users/repositories/user.repository.ts:1 -> Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing.

### [CRITICAL] WO-ESAF-005-TENANT-001: Remediate rule violation: TENANT-001
- **Target Rule**: TENANT-001
- **Affected Files**:
  - `/src/database/repositories/auditRepository.ts`
  - `/src/database/repositories/notificationRepository.ts`
  - `/src/database/repositories/PointRepository.ts`
  - `/src/database/repositories/PointSummaryRepository.ts`
  - `/src/database/repositories/SyncRepository.ts`
- **Objective**: Resolve all violations of rule TENANT-001 across 5 file(s) to restore architectural compliance.
- **Steps**:
  - Fix /src/database/repositories/auditRepository.ts:1 -> Ensure all operational queries start with tenantId composite index or filter (e.g. db.collection.where("[tenantId+... ]").equals([tenantId, ...])).
  - Fix /src/database/repositories/notificationRepository.ts:1 -> Ensure all operational queries start with tenantId composite index or filter (e.g. db.collection.where("[tenantId+... ]").equals([tenantId, ...])).
  - Fix /src/database/repositories/PointRepository.ts:1 -> Ensure all operational queries start with tenantId composite index or filter (e.g. db.collection.where("[tenantId+... ]").equals([tenantId, ...])).
  - Fix /src/database/repositories/PointSummaryRepository.ts:1 -> Ensure all operational queries start with tenantId composite index or filter (e.g. db.collection.where("[tenantId+... ]").equals([tenantId, ...])).
  - Fix /src/database/repositories/SyncRepository.ts:1 -> Ensure all operational queries start with tenantId composite index or filter (e.g. db.collection.where("[tenantId+... ]").equals([tenantId, ...])).

### [ERROR] WO-ESAF-006-HOOK-001: Remediate rule violation: HOOK-001
- **Target Rule**: HOOK-001
- **Affected Files**:
  - `/src/hooks/useAdminNotification.ts`
  - `/src/hooks/useAppInitialization.ts`
  - `/src/hooks/useAttendanceAnalytics.ts`
  - `/src/hooks/useAuthInitialization.ts`
  - `/src/hooks/useDashboardBK.ts`
  - `/src/hooks/useDashboardSync.ts`
  - `/src/hooks/useMasterData.ts`
  - `/src/hooks/useOfflineSync.ts`
  - `/src/hooks/useTeacherAttendanceRecords.ts`
  - `/src/hooks/useTeacherClassAttendanceData.ts`
  - `/src/services/hooks/useLetters.ts`
  - `/src/features/reports/hooks/useReports.ts`
- **Objective**: Resolve all violations of rule HOOK-001 across 12 file(s) to restore architectural compliance.
- **Steps**:
  - Fix /src/hooks/useAdminNotification.ts:12 -> Hooks must interact exclusively with Services.
  - Fix /src/hooks/useAppInitialization.ts:2 -> Hooks must interact exclusively with Services.
  - Fix /src/hooks/useAppInitialization.ts:3 -> Hooks must interact exclusively with Services.
  - Fix /src/hooks/useAppInitialization.ts:14 -> Hooks must interact exclusively with Services.
  - Fix /src/hooks/useAttendanceAnalytics.ts:8 -> Hooks must interact exclusively with Services.
  - Fix /src/hooks/useAuthInitialization.ts:2 -> Hooks must interact exclusively with Services.
  - Fix /src/hooks/useAuthInitialization.ts:3 -> Hooks must interact exclusively with Services.
  - Fix /src/hooks/useDashboardBK.ts:2 -> Hooks must interact exclusively with Services.
  - Fix /src/hooks/useDashboardSync.ts:3 -> Hooks must interact exclusively with Services.
  - Fix /src/hooks/useMasterData.ts:2 -> Hooks must interact exclusively with Services.
  - Fix /src/hooks/useOfflineSync.ts:9 -> Hooks must interact exclusively with Services.
  - Fix /src/hooks/useTeacherAttendanceRecords.ts:4 -> Hooks must interact exclusively with Services.
  - Fix /src/hooks/useTeacherClassAttendanceData.ts:4 -> Hooks must interact exclusively with Services.
  - Fix /src/hooks/useTeacherClassAttendanceData.ts:8 -> Hooks must interact exclusively with Services.
  - Fix /src/services/hooks/useLetters.ts:6 -> Hooks must interact exclusively with Services.
  - Fix /src/features/reports/hooks/useReports.ts:16 -> Hooks must interact exclusively with Services.


## Detailed Violations (82)
| Rule ID | Severity | File:Line | Evidence & Recommendation |
|---|---|---|---|
| `OFFLINE-001` | **CRITICAL** | `/scripts/generate_random_attendance.ts:1` | **Evidence**: `Direct Firebase import "firebase/app" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/scripts/generate_random_attendance.ts:2` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/scripts/inspectCategories.ts:2` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/scripts/seed_mock_data.ts:1` | **Evidence**: `Direct Firebase import "firebase/app" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/scripts/seed_mock_data.ts:2` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/App.tsx:39` | **Evidence**: `Direct Firebase import "firebase/auth" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/components/Profile.tsx:16` | **Evidence**: `Direct Firebase import "firebase/auth" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/domain/identityEngine.ts:6` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/hooks/useAppInitialization.ts:3` | **Evidence**: `Direct Firebase import "firebase/auth" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/hooks/useAuthInitialization.ts:2` | **Evidence**: `Direct Firebase import "firebase/auth" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/repositories/authRepository.ts:2` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/repositories/BaseRepository.ts:1` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/repositories/studentRepository.ts:2` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/repositories/systemRepository.ts:1` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/utils/autoFixEngine.ts:4` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/utils/firestoreHelpers.ts:2` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/components/Dashboard/ReferenceIdEntryModal.tsx:9` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/components/Profile/ProfileCompletionModal.tsx:4` | **Evidence**: `Direct Firebase import "firebase/auth" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/core/realtime/RealtimeHub.ts:1` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/database/repositories/newsRepository.ts:2` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/features/messages/repositories/MessageRepository.ts:9` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `OFFLINE-001` | **CRITICAL** | `/src/features/students/dashboard/services/studentDashboardService.ts:2` | **Evidence**: `Direct Firebase import "firebase/firestore" in non-service file.`<br/>**Fix**: Move all Firestore interactions into Sync Engine or Service layer; components and repos must use Dexie via Repository pattern. |
| `SEC-001` | **ERROR** | `/src/components/AccountApproval.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/ChatWindowContainer.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/CreateAccount.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/FloatingActionMenu.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/GlobalErrorBoundary.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/Messages.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/SchemaMigrationSection.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/UserDatabaseManagement.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/Admin/AccountEditModal.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/Admin/OnboardingApproval.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/Chatbot/AiAgentPanel.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/Chatbot/ChatbotMessageList.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/DeveloperConsole/DevFirestoreMonitor.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/DeveloperConsole/DevTabFirestoreGov.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/DeveloperConsole/DevTabUserControl.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/DeveloperConsole/StudentApprovalModal.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `SEC-001` | **ERROR** | `/src/components/Generic/DataExplorerView.tsx:1` | **Evidence**: `Direct user role evaluation found inside UI component.`<br/>**Fix**: Delegate all permission and role checks to PermissionChecker or SecurityService. |
| `ARCH-001` | **ERROR** | `/src/repositories/authRepository.ts:1` | **Evidence**: `Repository imports forbidden module "@/services/firebase".`<br/>**Fix**: Repositories must be pure TypeScript classes interacting only with Dexie. |
| `ARCH-001` | **ERROR** | `/src/repositories/authRepository.ts:2` | **Evidence**: `Repository imports forbidden module "firebase/firestore".`<br/>**Fix**: Repositories must be pure TypeScript classes interacting only with Dexie. |
| `ARCH-001` | **ERROR** | `/src/repositories/BaseRepository.ts:1` | **Evidence**: `Repository imports forbidden module "firebase/firestore".`<br/>**Fix**: Repositories must be pure TypeScript classes interacting only with Dexie. |
| `ARCH-001` | **ERROR** | `/src/repositories/BaseRepository.ts:11` | **Evidence**: `Repository imports forbidden module "@/services/firebase".`<br/>**Fix**: Repositories must be pure TypeScript classes interacting only with Dexie. |
| `ARCH-001` | **ERROR** | `/src/repositories/studentRepository.ts:1` | **Evidence**: `Repository imports forbidden module "../services/firebase".`<br/>**Fix**: Repositories must be pure TypeScript classes interacting only with Dexie. |
| `ARCH-001` | **ERROR** | `/src/repositories/studentRepository.ts:2` | **Evidence**: `Repository imports forbidden module "firebase/firestore".`<br/>**Fix**: Repositories must be pure TypeScript classes interacting only with Dexie. |
| `ARCH-001` | **ERROR** | `/src/repositories/systemRepository.ts:1` | **Evidence**: `Repository imports forbidden module "firebase/firestore".`<br/>**Fix**: Repositories must be pure TypeScript classes interacting only with Dexie. |
| `ARCH-001` | **ERROR** | `/src/repositories/systemRepository.ts:2` | **Evidence**: `Repository imports forbidden module "../services/firebase".`<br/>**Fix**: Repositories must be pure TypeScript classes interacting only with Dexie. |
| `ARCH-001` | **ERROR** | `/src/database/repositories/newsRepository.ts:1` | **Evidence**: `Repository imports forbidden module "@/services/firebase".`<br/>**Fix**: Repositories must be pure TypeScript classes interacting only with Dexie. |
| `ARCH-001` | **ERROR** | `/src/database/repositories/newsRepository.ts:2` | **Evidence**: `Repository imports forbidden module "firebase/firestore".`<br/>**Fix**: Repositories must be pure TypeScript classes interacting only with Dexie. |
| `ARCH-001` | **ERROR** | `/src/features/messages/repositories/MessageRepository.ts:8` | **Evidence**: `Repository imports forbidden module "@/services/firebase".`<br/>**Fix**: Repositories must be pure TypeScript classes interacting only with Dexie. |
| `ARCH-001` | **ERROR** | `/src/features/messages/repositories/MessageRepository.ts:9` | **Evidence**: `Repository imports forbidden module "firebase/firestore".`<br/>**Fix**: Repositories must be pure TypeScript classes interacting only with Dexie. |
| `SYNC-001` | **ERROR** | `/src/database/repositories/AuthRepository.ts:1` | **Evidence**: `Repository performs write without db.transaction enclosing syncQueue operations.`<br/>**Fix**: Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing. |
| `SYNC-001` | **ERROR** | `/src/database/repositories/BaseRepository.ts:1` | **Evidence**: `Repository performs write without db.transaction enclosing syncQueue operations.`<br/>**Fix**: Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing. |
| `SYNC-001` | **ERROR** | `/src/database/repositories/DashboardSummaryRepository.ts:1` | **Evidence**: `Repository performs write without db.transaction enclosing syncQueue operations.`<br/>**Fix**: Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing. |
| `SYNC-001` | **ERROR** | `/src/database/repositories/journalRepository.ts:1` | **Evidence**: `Repository performs write without db.transaction enclosing syncQueue operations.`<br/>**Fix**: Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing. |
| `SYNC-001` | **ERROR** | `/src/database/repositories/messageRepository.ts:1` | **Evidence**: `Repository performs write without db.transaction enclosing syncQueue operations.`<br/>**Fix**: Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing. |
| `SYNC-001` | **ERROR** | `/src/database/repositories/newsRepository.ts:1` | **Evidence**: `Repository performs write without db.transaction enclosing syncQueue operations.`<br/>**Fix**: Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing. |
| `SYNC-001` | **ERROR** | `/src/database/repositories/studentRepository.ts:1` | **Evidence**: `Repository performs write without db.transaction enclosing syncQueue operations.`<br/>**Fix**: Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing. |
| `SYNC-001` | **ERROR** | `/src/database/repositories/SyncRepository.ts:1` | **Evidence**: `Repository performs write without db.transaction enclosing syncQueue operations.`<br/>**Fix**: Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing. |
| `SYNC-001` | **ERROR** | `/src/features/messages/repositories/MessageRepository.ts:1` | **Evidence**: `Repository performs write without db.transaction enclosing syncQueue operations.`<br/>**Fix**: Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing. |
| `SYNC-001` | **ERROR** | `/src/features/users/repositories/user.repository.ts:1` | **Evidence**: `Repository performs write without db.transaction enclosing syncQueue operations.`<br/>**Fix**: Use db.transaction("rw", [db.collection, db.syncQueue], async () => { ... }) to guarantee atomic write and sync queueing. |
| `TENANT-001` | **CRITICAL** | `/src/database/repositories/auditRepository.ts:1` | **Evidence**: `Dexie query in repository missing tenantId scoping.`<br/>**Fix**: Ensure all operational queries start with tenantId composite index or filter (e.g. db.collection.where("[tenantId+... ]").equals([tenantId, ...])). |
| `TENANT-001` | **CRITICAL** | `/src/database/repositories/notificationRepository.ts:1` | **Evidence**: `Dexie query in repository missing tenantId scoping.`<br/>**Fix**: Ensure all operational queries start with tenantId composite index or filter (e.g. db.collection.where("[tenantId+... ]").equals([tenantId, ...])). |
| `TENANT-001` | **CRITICAL** | `/src/database/repositories/PointRepository.ts:1` | **Evidence**: `Dexie query in repository missing tenantId scoping.`<br/>**Fix**: Ensure all operational queries start with tenantId composite index or filter (e.g. db.collection.where("[tenantId+... ]").equals([tenantId, ...])). |
| `TENANT-001` | **CRITICAL** | `/src/database/repositories/PointSummaryRepository.ts:1` | **Evidence**: `Dexie query in repository missing tenantId scoping.`<br/>**Fix**: Ensure all operational queries start with tenantId composite index or filter (e.g. db.collection.where("[tenantId+... ]").equals([tenantId, ...])). |
| `TENANT-001` | **CRITICAL** | `/src/database/repositories/SyncRepository.ts:1` | **Evidence**: `Dexie query in repository missing tenantId scoping.`<br/>**Fix**: Ensure all operational queries start with tenantId composite index or filter (e.g. db.collection.where("[tenantId+... ]").equals([tenantId, ...])). |
| `HOOK-001` | **ERROR** | `/src/hooks/useAdminNotification.ts:12` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/services/firebase".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/hooks/useAppInitialization.ts:2` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/services/firebase".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/hooks/useAppInitialization.ts:3` | **Evidence**: `Hook imports forbidden low-level database/cloud module "firebase/auth".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/hooks/useAppInitialization.ts:14` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/database/dexie".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/hooks/useAttendanceAnalytics.ts:8` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/services/firebase".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/hooks/useAuthInitialization.ts:2` | **Evidence**: `Hook imports forbidden low-level database/cloud module "firebase/auth".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/hooks/useAuthInitialization.ts:3` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/services/firebase".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/hooks/useDashboardBK.ts:2` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/database/dexie".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/hooks/useDashboardSync.ts:3` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/services/firebase".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/hooks/useMasterData.ts:2` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/database/dexie".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/hooks/useOfflineSync.ts:9` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/database/dexie".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/hooks/useTeacherAttendanceRecords.ts:4` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/services/firebase".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/hooks/useTeacherClassAttendanceData.ts:4` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/services/firebase".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/hooks/useTeacherClassAttendanceData.ts:8` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/services/firebase".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/services/hooks/useLetters.ts:6` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/services/firebase".`<br/>**Fix**: Hooks must interact exclusively with Services. |
| `HOOK-001` | **ERROR** | `/src/features/reports/hooks/useReports.ts:16` | **Evidence**: `Hook imports forbidden low-level database/cloud module "@/services/firebase".`<br/>**Fix**: Hooks must interact exclusively with Services. |
