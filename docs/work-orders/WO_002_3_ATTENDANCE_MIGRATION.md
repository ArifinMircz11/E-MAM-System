# WO-002.3: Attendance Domain Migration

## Objectives
- Ensure all Attendance operations (Scanning, Listing, Updating, Deleting) use Dexie & SyncEngine exclusively for writes and reads on the client.
- Eliminate direct Firestore imports in Attendance UI components.
- Secure Multi-Tenant Boundaries for all Attendance queries.

## Tasks
1. Verify `src/features/attendance/services/attendanceService.ts` is fully detached from Firestore (Done in previous steps).
2. Refactor `src/hooks/useAttendanceAnalytics.ts` to fetch from Dexie/Repositories instead of Firestore.
3. Verify `src/components/AttendanceView.tsx` and `src/components/AttendancePanel.tsx` do not import Firestore.
4. Verify `src/hooks/useDashboardSync.ts` uses attendanceRepository for dashboard summaries instead of pulling raw queries from Firebase.

## Status
- `attendanceService.ts`: ✅ Completed
- `attendanceSyncService.ts`: ✅ Created
- `useAttendanceAnalytics.ts`: ⏳ In Progress
- UI Components: ⏳ Pending Verification

## Golden Rules Checked
- No `firebase/firestore` imports in UI or features.
- All reads go to `attendanceRepository`.
- All writes go to `enqueueSync` (`syncRepository.enqueue`).
