Service:
src/services/attendanceAggregateService.ts

Responsibilities
- Fetch monthly class attendance summaries.
- Maintain cache logic (24 hours).
- Perform self-healing aggregation if summary is missing (querying raw attendance).
- Update missing summaries in Firestore.

Current Dependency
UI / Dashboard
 ↓
Service (attendanceAggregateService)
 ↓
Firestore (getDoc, getDocs, setDoc)

Target Dependency
UI / Dashboard
 ↓
Hook (useAttendanceAnalytics)
 ↓
Service (attendanceAggregateService)
 ↓
SummaryRepository (Dexie)
 ↓
SyncEngine
 ↓
Firestore

Firestore Usage
☑ getDoc (Reading 'attendance_monthly_summaries')
☑ setDoc (Self-healing 'attendance_monthly_summaries')
□ updateDoc
□ addDoc
□ deleteDoc
□ onSnapshot
□ runTransaction
□ writeBatch
☑ Query (Querying 'attendance' for self-healing)

Dexie Equivalent
- `localDb.attendance_monthly_summaries.get(...)`
- Data availability guaranteed by SyncEngine downloading 'attendance_monthly_summaries' on background or delta sync.

Sync Strategy
- Background Delta Sync for `attendance_monthly_summaries`.
- Summary computation triggered by cloud functions OR domain service and enqueued into `sync_queue`.

Risk
- Low. This is purely read/cache logic for reports. No critical write operations rely on this.
