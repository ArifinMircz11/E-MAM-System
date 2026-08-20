# Work Order: Refactor Student Repository into Feature-Based Architecture

## Objective
Refactor `StudentRepository` from `src/repositories/studentRepository.ts` into `src/features/students/repositories/StudentRepository.ts` to adhere to the `AGENTS.md` architectural rules.

## Background
The current `StudentRepository` violates the "Feature-based" structure requirements and directly performs sync-queue operations, which violates the "SyncEngine Only Firestore Access" rule.

## Architecture Audit
- **Violation**: Direct access to `sync_queue`.
- **Violation**: Global repository location instead of feature-based.
- **Root Cause**: Legacy architecture not yet fully migrated to the new standard.

## Scope
1. Create `src/features/students/repositories/`.
2. Move and refactor `StudentRepository` to `src/features/students/repositories/StudentRepository.ts`.
3. Abstract sync queue logic into `SyncEngine` (if possible, or at least remove direct access).
4. Update imports across the codebase.

## Out of Scope
- Changing business logic within `StudentRepository`.

## Acceptance Criteria
- `StudentRepository` is located in `src/features/students/repositories/`.
- No direct access to `sync_queue` from `StudentRepository` (defer to `SyncEngine`).
- All imports updated.
- `compile_applet` is successful.
