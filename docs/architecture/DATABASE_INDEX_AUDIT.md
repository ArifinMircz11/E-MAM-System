# DATABASE_INDEX_AUDIT

## 1. Executive Summary
Audit of database indices (Firestore and Dexie) for the e-MAM System to optimize query performance, reduce Firestore costs, and ensure architectural compliance.

## 2. Status
- [x] Firestore Query Audit (Initial)
- [x] Dexie Index Audit (Initial)
- [x] Composite Index Analysis
- [x] Performance Recommendations

## 4. Findings - Detailed

### 4.1 Dexie Indices
- Analysis of `src/core/database/db.ts` shows a robust indexing strategy with extensive use of `tenantId` in composite indices (e.g., `[tenantId+status]`, `[tenantId+classId]`, `[teachersId+date]`).
- The Dexie schema versioning (up to version 27) suggests frequent schema evolution.
- Potential unused indices may exist in older versions, but the current schema seems generally well-indexed for typical CRUD operations.

### 4.2 Firestore Query Patterns (Realtime Listeners)

| Listener File | Query | Required Composite Index |
| :--- | :--- | :--- |
| `announcementListener.ts` | `where('tenantId', '==', tenantId), where('date', '>', ...)` | `[tenantId, date]` |
| `notificationListener.ts` (1) | `where('type', '==', 'info'), where('targetRole', 'in', ...), where('isRead', '==', false)` | `[type, targetRole, isRead]` |
| `notificationListener.ts` (2) | `where('userId', '==', userId), where('isRead', '==', false), where('type', 'not-in', ...)` | `[userId, isRead, type]` |
| `notificationListener.ts` (3) | `where('userId', '==', userId), where('type', '==', 'chat'), where('isRead', '==', false)` | `[userId, type, isRead]` |
| `pendingLettersListener.ts` (Staff)| `where('tenantId', '==', tenantId), where('status', 'in', ...)` | `[tenantId, status]` |
| `pendingLettersListener.ts` (Other)| `where('tenantId', '==', tenantId), where('userId', '==', userId), where('status', 'in', ...)` | `[tenantId, userId, status]` |

## 5. Recommendations
- [ ] Map Firestore Realtime Listeners to specific composite indices in `firestore.indexes.json`.
- [ ] Validate `firestore.rules` for index requirements to ensure they match these queries.
- [ ] Propose optimizations for `notificationListener.ts` to reduce listener count (currently polling, not listener).
