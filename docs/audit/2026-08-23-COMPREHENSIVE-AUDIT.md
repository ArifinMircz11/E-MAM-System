# e-MAM System — Comprehensive Audit

Date: 2026-08-23
Baseline: `4ed82e06b2a3bce4c554c9b444008623b50106ad`

## Executive decision

The repository is **not yet architecture-clean**. Two P1 persistence/boundary problems have now been remediated in runtime: the obsolete domain-level IdentityEngine cloud path and the onboarding service's direct Firestore path.

The remaining codebase still contains a large legacy persistence surface. Final Offline-First certification remains blocked until the global cloud boundary and critical offline workflows are migrated and verified.

## Findings and actions

### P1 — Identity cloud write from domain

**Finding:** `src/domain/identityEngine.ts` imported `FirestoreGateway`, queried `students`, inferred a role, and updated `users/{uid}` directly in Firestore.

**Action:** removed the runtime subscription and deleted the obsolete domain module. Canonical identity completion remains behind the repository/sync path.

**Status:** FIXED.

### P1 — Onboarding service direct Firestore persistence

**Finding:** `src/services/onboardingService.ts` imported Firebase/dbGateway and performed Firestore transactions, reads, writes and realtime listeners.

**Action:**
- Added `src/repositories/OnboardingRepository.ts`.
- Gate 1 submission now commits request + user status to Dexie first and queues synchronization.
- Gate 2 submission now commits request + user status to Dexie first and queues synchronization.
- Approval/rejection now updates request + user + master record in a local Dexie transaction, then queues the corresponding cloud mutations.
- Pending onboarding subscriptions now use Dexie `liveQuery`; Firestore `onSnapshot` was removed from the onboarding service.
- `onboardingService.ts` is now an orchestration/audit layer and contains no Firebase/dbGateway imports.

**Status:** FIXED for the onboarding runtime path.

### P1 — Legacy dbGateway surface

`src/services/dbGateway.ts` remains a deprecated compatibility facade that still exposes Firestore operations. It must not be used by application runtime code.

**Status:** BLOCKED / MIGRATION REQUIRED.

### P1 — Service-level direct Firestore persistence

The existing boundary report records substantial direct Firestore usage in services, including user synchronization, attendance synchronization, realtime listeners and legacy services.

**Status:** BLOCKED / MIGRATION REQUIRED.

Do not replace `dbGateway` imports with `FirestoreGateway` as a cosmetic fix. The correct target is local operational persistence first, with cloud synchronization owned by the SyncEngine corridor.

### P1 — UI/hooks direct Firestore surface

The existing boundary report records direct Firestore usage in UI/hooks. These remain architectural violations.

**Status:** BLOCKED / MIGRATION REQUIRED.

### P1 — Repository purity

The canonical repository foundation resolves Dexie dynamically and `SyncRepository` provides tenant-aware queueing, coalescing, retries and dead-letter handling. Legacy repository implementations still require migration.

**Status:** PARTIAL.

### P1 — Offline-first certification

Because direct cloud paths remain elsewhere in the codebase, the application cannot yet be certified as fully operational with internet disconnected.

**Status:** NOT CERTIFIED.

## Required migration order

1. Authentication / canonical user identity — substantially stabilized.
2. Onboarding and approval workflow — migrated to Dexie + SyncQueue.
3. User and teacher/student synchronization.
4. Attendance + QR Scanner.
5. Points ledger.
6. Letters / permissions.
7. Realtime listeners into local/reactive sync infrastructure.
8. Remaining legacy services and UI hooks.
9. Remove `dbGateway` compatibility facade.
10. Run full audit + typecheck + lint + build + unit/e2e verification.

## Architectural invariant

Every operational mutation must follow:

`UI -> Zustand -> Service / Use Case -> Repository -> Dexie -> SyncQueue -> SyncEngine -> Firestore`

No application feature should use Firestore, Firebase Auth, or Dexie directly.

## Verification note

Repository changes were made directly against `main`. Tooling in this session does not provide a local npm execution environment, so typecheck/lint/build must be confirmed by the repository CI/deployment pipeline before declaring the remediation compile-clean.
