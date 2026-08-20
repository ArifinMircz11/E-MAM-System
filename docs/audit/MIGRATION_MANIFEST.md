# MIGRATION_MANIFEST.md (Batch 2 Update)

| ID | Domain | File | Current Layer | Target Layer | Firestore | Dexie | Risk | Dependency | Status | Work Order |
|---|---|---|---|---|---|---|---|---|---|---|
| 007 | Attendance | src/services/attendanceService.ts | Service+Firestore | Service+SyncEngine | Yes | Yes | High | Student,Teacher | Audit | WO-002.3.1 |
| 008 | Attendance | src/repositories/attendanceRepository.ts | Repository+Firestore | Repository (Dexie) | Yes | Yes | High | Attendance | Audit | WO-002.3.1 |
| 009 | Student | src/services/studentService.ts | Service+Firestore | Service+SyncEngine | Yes | Yes | High | Auth,Tenant | Audit | WO-002.3.2 |
| 010 | Student | src/repositories/studentRepository.ts | Repository+Firestore | Repository (Dexie) | Yes | Yes | High | Student | Audit | WO-002.3.2 |
| 011 | Class | src/services/classService.ts | Service+Firestore | Service+SyncEngine | Yes | Yes | Medium | Student | Audit | WO-002.3.3 |
| 012 | Teacher | src/services/teacherService.ts | Service+Firestore | Service+SyncEngine | Yes | Yes | High | Auth,User | Audit | WO-002.3.4 |

*(Daftar ini akan dilanjutkan hingga mencakup seluruh 35+ domain)*
