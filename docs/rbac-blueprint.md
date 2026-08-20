# RBAC Enterprise Blueprint

## Overview
This document outlines the Role-Based Access Control (RBAC) architecture for the e-MAM Enterprise System, integrating seamlessly with the Canonical User Schema (`accountType`, `role`, `roles[]`, `tenantId`, `status`).

## Canonical User Data Contract (SSOT) Reference
Every user record validated within the RBAC authorization engine adheres to the canonical schema:
```json
{
  "accountType": "",
  "role": "",
  "roles": [],
  "tenantId": "",
  "status": ""
}
```

## RBAC Governance & Authorization Flow
1. **No UI/Hook/Repository Access Checks**: Components and hooks never evaluate roles directly. All permission checks flow through `AuthorizationService`.
2. **Permission-Based Evaluation**: Access is granted based on granular permissions (`resource.action`) mapped to primary roles and additional roles (`roles[]`).
3. **Account Type & Tenant Boundaries**: Cross-tenant access is strictly prohibited. `accountType` determines the identity domain (`developer` vs `madrasah`).

## Roles and Responsibilities
- **Developer**: Full system management, accountType administration, cross-tenant maintenance.
- **Admin**: Tenant-level management, role/permission assignments for tenant users.
- **Kepala Madrasah / Wakamad / Kepala TU**: Institutional leadership, approvals, and reporting.
- **Guru / Wali Kelas / Guru BK**: Academic and student guidance operations.
- **Staf / Keuangan / PTSP**: Administrative and operational support.
- **Siswa / Ketua Kelas**: Student self-service and class leadership.
- **Orang Tua**: Dependent student monitoring.

Refer to `/docs/canonical-users.md` for complete canonical user payload examples and validation rules.
