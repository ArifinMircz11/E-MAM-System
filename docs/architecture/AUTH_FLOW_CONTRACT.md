# Canonical Authentication Flow Contract

## Login

```text
Login UI
  ↓
Auth Service
  ↓
Firebase Auth (identity/session only)
  ↓
Canonical User Resolver
  ↓
Security Context
  ↓
Tenant + RBAC + Permission
  ↓
Zustand Session Store
  ↓
Route Guard / Workspace
```

## Logout

```text
Logout UI
  ↓
Auth Service
  ↓
Firebase Auth signOut
  ↓
Clear Security Context
  ↓
Clear Zustand session
  ↓
Clear/invalidate sensitive session cache
  ↓
Navigate to Login
```

## Role/roles switching

Role changes must never be implemented by changing a UI role variable alone.

```text
Authorized role/assignment change
  ↓
Canonical User update
  ↓
Repository / local transaction
  ↓
SyncQueue
  ↓
SyncEngine
  ↓
Firestore
  ↓
Canonical User refresh
  ↓
Security Context rebuild
  ↓
Permission recalculation
  ↓
Route/workspace reevaluation
```

For a user with `roles[]`, permissions are derived from the canonical identity and current assignment. UI must not grant access merely because a role string is present in component state.

## Boundary rules

- Firebase Auth is identity/session infrastructure, not the operational database.
- UI must not access Firestore for login/profile/role CRUD.
- UI must not access Dexie directly.
- Role and permission decisions belong to the security/RBAC layer.
- Tenant identity must come from the canonical security context, not arbitrary UI input.
- Logout must invalidate the active security context before protected routes are reachable again.
- Role changes must cause permission and route reevaluation.
- Offline business operations remain available according to the cached, authorized security context and local policy; cloud-only identity operations may require connectivity.
