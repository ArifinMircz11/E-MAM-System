# e-MAM System — Comprehensive Audit

Date: 2026-08-23
Baseline: `4ed82e06b2a3bce4c554c9b444008623b50106ad`
Post-audit HEAD: `28ac2268316f79eec55fd46b7417c7b81fad3c31`

## Executive decision

The repository is **not yet architecture-clean**. The most dangerous discovered issue was a domain-level `IdentityEngine` performing direct Firestore reads/writes and inferring/overwriting canonical roles. That path has been removed from the application runtime and the obsolete domain module has been deleted.

The repository still contains a large legacy persistence surface, especially in onboarding and other services. Those areas remain explicitly BLOCKED for final Offline-First certification until migrated through Repository -> Dexie -> SyncQueue -> SyncEngine.

## Findings and actions

### P1 — Identity cloud write from domain

**Finding:** `src/domain/identityEngine.ts` imported `FirestoreGateway`, queried `students`, inferred a role, and updated `users/{uid}` directly in Firestore.

**Risk:** bypassed Dexie/SyncQueue, duplicated identity authority, and could overwrite canonical roles based on inferred student/teacher data.

**Action:**
- Removed the `PROFILE_COMPLETED -> IdentityEngine.provisionAccess()` runtime subscription from `src/app/App.tsx`.
- Deleted `src/domain/identityEngine.ts`.
- Canonical identity completion remains owned by `IdentityCompletionService`, which already updates the canonical user through `userRepository` and marks the record pending for sync.

**Status:** FIXED.

### P1 — Legacy dbGateway surface

`src/services/dbGateway.ts` is a deprecated compatibility facade that still re-exports Firestore operations. It must not be used by application runtime code.

**Status:** BLOCKED / MIGRATION REQUIRED.

Known runtime candidate requiring migration includes `src/services/onboardingService.ts`.

### P1 — Service-level direct Firestore persistence

The existing Firestore boundary report records substantial direct Firestore usage in `src/services`, including onboarding, user synchronization, attendance synchronization, realtime listeners, and legacy services.

**Status:** BLOCKED / MIGRATION REQUIRED.

Do not replace `dbGateway` imports with `FirestoreGateway` as a cosmetic fix. The correct target is local operational persistence first, with cloud synchronization owned by the SyncEngine corridor.

### P1 — UI/hooks direct Firestore surface

The existing boundary report records direct Firestore usage in UI/hooks. These are architectural violations even when the cloud call is technically functional.

**Status:** BLOCKED / MIGRATION REQUIRED.

### P1 — Repository purity

Repositories are the intended operational data boundary, but legacy repository implementations still exist alongside the canonical repository layer. Repository code must converge on Dexie-only operational CRUD.

**Status:** PARTIAL.

### P1 — Offline-first certification

Because direct cloud paths remain in the codebase, the application cannot yet be certified as fully operational with internet disconnected.

**Status:** NOT CERTIFIED.

## Required migration order

1. Authentication / canonical user identity.
2. Onboarding and approval workflow.
3. User and teacher/student synchronization.
4. Attendance + QR Scanner.
5. Points ledger.
6. Letters / permissions.
7. Realtime listeners into sync infrastructure.
8. Remaining legacy services and UI hooks.
9. Remove `dbGateway` compatibility facade.
10. Run full audit + typecheck + lint + build + unit/e2e verification.

## Architectural invariant

Every operational mutation must follow:

`UI -> Zustand -> Service/Use Case -> Repository -> Dexie -> SyncQueue -> SyncEngine -> Firestore`

No application feature should use Firestore, Firebase Auth, or Dexie directly.

## Verification note

The two remediation commits contain only the identity-path removal: `App.tsx` was reduced by five lines and the obsolete `IdentityEngine` file was deleted. The remaining blockers are intentionally documented rather than hidden behind a compatibility rewrite.
