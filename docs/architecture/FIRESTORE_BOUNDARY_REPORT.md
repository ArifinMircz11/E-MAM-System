# FIRESTORE_BOUNDARY_REPORT

This document represents Phase 3A (Firestore Boundary Audit). It categorizes all direct Firestore accesses by architectural layer.

## Summary Metrics

| Layer | Target | Current Count | Status | Priority |
|---|---|---|---|---|
| UI (`src/components/`, `src/hooks/`) | 0 | 108 | 🔴 FAIL | 🔴 Sangat Tinggi |
| Store (`src/store/`) | 0 | 0 | 🔴 FAIL | 🔴 Sangat Tinggi |
| Service (`src/services/`) | 0 | 525 | 🔴 FAIL | 🔴 Sangat Tinggi |
| Repository (`src/database/repositories/`) | 0 | 8 | 🟡 PARTIAL | 🟡 Menengah (Sementara) |
| SyncEngine (`src/sync/`) | Gateway | 0 | 🟢 ALLOWED | 🟢 Rendah |

## Detailed Breakdown

### 1. UI Layer
*Direct Firestore access in UI components and hooks is strictly forbidden. They must use Hooks -> Services.*
```
     26 src/components/SchemaMigrationSection.tsx
     11 src/components/Profile.tsx
      7 src/components/PointCategorySettings.tsx
      6 src/components/Settings.tsx
      4 src/hooks/useTeacherAttendanceRecords.ts
      4 src/hooks/useAdminNotification.ts
      4 src/components/SystemDocumentation.tsx
      4 src/components/Onboarding/ReferenceIdForm.tsx
      4 src/components/Archives.tsx
      3 src/hooks/useTeacherClassAttendanceData.ts
      3 src/components/Dashboard/ReferenceIdEntryModal.tsx
      3 src/components/Assignments.tsx
      2 src/hooks/useUnreadNotifications.ts
      2 src/hooks/useTenant.ts
      2 src/hooks/usePaginatedQuery.ts
      2 src/hooks/useLiveComplaint.ts
      2 src/hooks/useClassChat.ts
      2 src/hooks/useChatbotData.ts
      2 src/components/PWAUpdateNotification.tsx
      2 src/components/Grades.tsx
      2 src/components/GenericView.tsx
      2 src/components/DuplicateStudentsDashboard.tsx
      2 src/components/Admin/OnboardingApproval.tsx
      1 src/hooks/useMutasi.ts
      1 src/hooks/useAuthInitialization.ts
      1 src/hooks/useAlumni.ts
      1 src/components/NotificationLogs.tsx
      1 src/components/Login.tsx
      1 src/components/DeveloperConsole/StudentApprovalModal.tsx
      1 src/components/DataSubmissionForm.tsx
```

### 2. Store Layer
*State managers should not directly call Firestore.*
*No violations found in Store.*

### 3. Service Layer
*Services must route all operational data requests through Dexie Repositories and mutations through SyncQueue.*
```
     54 src/services/schemaRepairService.ts
     42 src/services/offlineAutoProcessService.ts
     36 src/services/systemService.ts
     31 src/services/chatService.ts
     27 src/services/devConsoleService.ts
     22 src/services/seedService.ts
     18 src/services/onboardingService.ts
     18 src/services/authService.ts
     16 src/services/tenantService.ts
     16 src/services/devConsoleActions.ts
     15 src/services/migrationService.ts
     15 src/services/academicService.ts
     14 src/services/teacherService.ts
     13 src/services/summaryService.ts
     12 src/services/studentService.ts
     12 src/services/CacheService.ts
      9 src/services/realtime/userListener.ts
      8 src/services/attentionService.ts
      7 src/services/realtime/pendingApprovalListener.ts
      7 src/services/parentService.ts
      7 src/services/koperasiService.ts
      7 src/services/attendanceSyncService.ts
      6 src/services/scheduleService.ts
      6 src/services/historyService.ts
      5 src/services/userService.ts
      5 src/services/studentAggregateService.ts
      5 src/services/pointSyncService.ts
      5 src/services/liveChatService.ts
      5 src/services/eventService.ts
      5 src/services/dashboardService.ts
      5 src/services/auditService.ts
      5 src/services/auditLogService.ts
      5 src/services/attendanceAggregateService.ts
      4 src/utils/firestoreHelpers.ts
      4 src/services/UserSyncService.ts
      4 src/services/testDataService.ts
      4 src/services/realtime/notificationListener.ts
      4 src/services/gradeService.ts
      4 src/services/firebase.ts
      3 src/services/realtime/tenantListener.ts
      3 src/services/realtime/systemSettingsListener.ts
      3 src/services/realtime/pendingLettersListener.ts
      3 src/services/realtime/announcementListener.ts
      3 src/services/firestoreService.ts
      3 src/services/classService.ts
      2 src/utils/autoFixEngine.ts
      2 src/services/realtime/masterVersionListener.ts
      2 src/services/realtime/Advisor.tsx
      2 src/services/qrService.ts
      2 src/services/masterDataService.ts
      2 src/services/letterService.ts
      2 src/services/dataSubmissionService.ts
      2 src/services/classChatService.ts
      1 src/services/SyncEngine.ts
      1 src/services/pointService.ts
      1 src/services/notificationService.ts
      1 src/services/dbGateway.ts
```

### 4. Repository Layer
*Repositories are temporarily allowed to have Firestore calls while migrating to Dexie-only, but must eventually read/write only to Dexie.*
```
      5 src/database/repositories/newsRepository.ts
      3 src/database/repositories/legacyMessageRepository.ts
```

### 5. SyncEngine Layer
*The SyncEngine is the only allowed gateway to Firestore.*
*No Firestore access found in SyncEngine.*
