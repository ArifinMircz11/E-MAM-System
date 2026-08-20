# Layer Compliance Audit Report

This report documents violations of the architecture layering rules defined in `AGENTS.md` and `GEMINI.md`.

## Compliance Matrix

| Layer | Imports | Status |
| ----- | ------- | ------ |
| UI    | Domain/Feature | OK |
| Hook  | Service/Domain | OK |
| Service | SyncEngine/Repository | Violation Found |
| Repository | Firestore (Direct) | OK |

## Boundary Violations (P0 - Critical)

| File | Violation | Layer | Severity | Recommendation |
| ---- | --------- | ----- | -------- | -------------- |
| `src/services/realtime/*` | Direct Firestore access | Service | P0 | Migrate to Sync Engine / Realtime Hub |
| `src/services/koperasiService.ts` | Direct Firestore access | Service | P1 | Route through Repository |
| `src/services/devConsoleService.ts` | Direct Firestore access | Service | P1 | Route through Repository |

## Recommendation

All direct Firestore interactions (except in `SyncEngine` or restricted `realtime` listeners) MUST be migrated to use the Repository pattern or the `SyncEngine` for delta synchronization.
