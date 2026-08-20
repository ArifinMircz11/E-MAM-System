# DEPENDENCY_INVENTORY

This document represents Phase 1A (100% Coverage). It aggregates the raw findings by file.

## 1. Legacy Repository Imports
| File | Legacy Repo | Count |
|---|---|---|
| src/features/messages/hooks/useConversation.ts | src/repositories | 0 (Migrated) |
| src/features/messages/hooks/useMessages.ts | src/repositories | 0 (Migrated) |
| src/features/messages/services/MessagingService.ts | src/repositories | 0 (Migrated) |
| src/features/users/services/user.service.ts | src/repositories | 0 (Migrated) |
| src/hooks/useAboutContent.ts | src/repositories | 0 (Migrated) |
| src/hooks/useAppInitialization.ts | src/repositories | 0 (Migrated) |

## 2. Firestore CRUD (Outside SyncEngine/SyncRepository)
| File | Occurrences |
|---|---|
| src/services/schemaRepairService.ts | 50 |
| src/services/offlineAutoProcessService.ts | 39 |
| src/services/systemService.ts | 35 |
| src/services/chatService.ts | 30 |
| src/services/devConsoleService.ts | 27 |
| src/components/SchemaMigrationSection.tsx | 26 |
| src/services/seedService.ts | 22 |
| src/services/authService.ts | 17 |
| src/services/onboardingService.ts | 16 |
| src/services/devConsoleActions.ts | 16 |
| src/services/tenantService.ts | 15 |
| src/services/migrationService.ts | 15 |
| src/services/academicService.ts | 15 |
| src/services/teacherService.ts | 13 |
| src/services/summaryService.ts | 11 |
| src/services/studentService.ts | 11 |
| src/services/CacheService.ts | 11 |
| src/components/Profile.tsx | 11 |
| src/services/attentionService.ts | 8 |
| src/services/parentService.ts | 7 |
| src/services/attendanceSyncService.ts | 7 |
| src/components/PointCategorySettings.tsx | 7 |
| src/services/scheduleService.ts | 6 |
| src/services/koperasiService.ts | 6 |
| src/services/historyService.ts | 6 |
| src/repositories/BaseRepository.ts | 6 |
| src/components/Settings.tsx | 6 |
| src/services/realtime/userListener.ts | 5 |
| src/services/realtime/pendingApprovalListener.ts | 5 |
| src/services/pointSyncService.ts | 5 |
| src/services/eventService.ts | 5 |
| src/services/auditService.ts | 5 |
| src/services/auditLogService.ts | 5 |
| src/infrastructure/datasource/SyncDataSource.ts | 5 |
| src/database/repositories/newsRepository.ts | 5 |
| src/services/UserSyncService.ts | 4 |
| src/services/userService.ts | 4 |
| src/services/testDataService.ts | 4 |
| src/services/studentAggregateService.ts | 4 |
| src/services/realtime/notificationListener.ts | 4 |
| src/services/liveChatService.ts | 4 |
| src/services/gradeService.ts | 4 |
| src/services/firebase.ts | 4 |
| src/services/attendanceAggregateService.ts | 4 |
| src/repositories/systemRepository.ts | 4 |
| src/lib/notification-service.ts | 4 |
| src/lib/firebase-admin.ts | 4 |
| src/hooks/useTeacherAttendanceRecords.ts | 4 |
| src/features/students/dashboard/services/studentDashboardService.ts | 4 |
| src/domain/identityEngine.ts | 4 |
| src/components/SystemDocumentation.tsx | 4 |
| src/utils/firestoreHelpers.ts | 3 |
| src/services/realtime/systemSettingsListener.ts | 3 |
| src/services/realtime/pendingLettersListener.ts | 3 |
| src/services/firestoreService.ts | 3 |
| src/services/dashboardService.ts | 3 |
| src/services/classService.ts | 3 |
| src/repositories/studentRepository.ts | 3 |
| src/repositories/authRepository.ts | 3 |
| src/hooks/useTeacherClassAttendanceData.ts | 3 |
| src/hooks/useAdminNotification.ts | 3 |
| src/features/messages/repositories/MessageRepository.ts | 3 |
| src/components/Onboarding/ReferenceIdForm.tsx | 3 |
| src/components/Dashboard/ReferenceIdEntryModal.tsx | 3 |
| src/components/Assignments.tsx | 3 |
| src/components/Archives.tsx | 3 |
| src/utils/autoFixEngine.ts | 2 |
| src/services/realtime/tenantListener.ts | 2 |
| src/services/realtime/masterVersionListener.ts | 2 |
| src/services/realtime/announcementListener.ts | 2 |
| src/services/realtime/Advisor.tsx | 2 |
| src/services/qrService.ts | 2 |
| src/services/masterDataService.ts | 2 |
| src/services/letterService.ts | 2 |
| src/services/dataSubmissionService.ts | 2 |
| src/services/classChatService.ts | 2 |
| src/modules/settings/TenantSettings.tsx | 2 |
| src/hooks/usePaginatedQuery.ts | 2 |
| src/hooks/useChatbotData.ts | 2 |
| src/features/reports/utils/docs/database/FIRESTORE_SCHEMA.md | 2 |
| src/components/DuplicateStudentsDashboard.tsx | 2 |
| src/services/SyncEngine.ts | 1 |
| src/services/pointService.ts | 1 |
| src/services/notificationService.ts | 1 |
| src/services/dbGateway.ts | 1 |
| src/hooks/useUnreadNotifications.ts | 1 |
| src/hooks/useTenant.ts | 1 |
| src/hooks/useMutasi.ts | 1 |
| src/hooks/useLiveComplaint.ts | 1 |
| src/hooks/useClassChat.ts | 1 |
| src/hooks/useAuthInitialization.ts | 1 |
| src/hooks/useAlumni.ts | 1 |
| src/esaf/registry/RuleRegistry.ts | 1 |
| src/core/realtime/RealtimeHub.ts | 1 |
| src/components/PWAUpdateNotification.tsx | 1 |
| src/components/NotificationLogs.tsx | 1 |
| src/components/Login.tsx | 1 |
| src/components/Grades.tsx | 1 |
| src/components/GenericView.tsx | 1 |
| src/components/DeveloperConsole/StudentApprovalModal.tsx | 1 |
| src/components/DataSubmissionForm.tsx | 1 |
| src/components/Admin/OnboardingApproval.tsx | 1 |

## 3. Direct db.table() calls (Outside Repositories)
| File | Occurrences |
|---|---|
| src/sync/syncEngine.ts | 1 |
| src/services/auditService.ts | 1 |
| src/database/MigrationRegistry.ts | 1 |
| src/components/Schedule.tsx | 1 |

## 4. UI Role Checks (UserRole.* / role ===)
| File | Occurrences |
|---|---|
| src/features/audit/components/AuditRBACDashboard.tsx | 68 |
| src/constants/dashboard.ts | 60 |
| src/layouts/Sidebar.tsx | 50 |
| src/types/roles.ts | 41 |
| src/services/authService.ts | 38 |
| src/components/AllFeatures.tsx | 37 |
| src/types/permissions.ts | 32 |
| src/core/security/rbac/roles.ts | 32 |
| src/components/CreateAccount.tsx | 32 |
| src/components/NotificationCenter.tsx | 27 |
| src/modules/dashboard/Dashboard.tsx | 23 |
| src/routes/ViewRegistry.ts | 22 |
| src/features/users/components/UserManagement.tsx | 22 |
| src/features/users/utils/roleRegistry.ts | 21 |
| src/services/attentionService.ts | 20 |
| src/components/AccountApproval.tsx | 19 |
| src/routes/ViewRenderer.tsx | 17 |
| src/components/Profile.tsx | 16 |
| src/components/DeveloperConsole/DevTabManajemenMadrasah.tsx | 16 |
| src/components/Messages.tsx | 15 |
| src/components/Letters.tsx | 15 |
| src/components/PointsView.tsx | 13 |
| src/components/UserDatabaseManagement.tsx | 12 |
| src/lib/studentMapping.ts | 11 |
| src/features/gtk/TeacherData.tsx | 9 |
| src/components/AttendanceView.tsx | 9 |
| src/services/seedService.ts | 8 |
| src/services/realtime/Advisor.tsx | 8 |
| src/features/students/components/StudentDataMain.tsx | 8 |
| src/components/TeachingJournal.tsx | 8 |
*(Showing top 30 files with highest occurrences out of total 893 matches)*

