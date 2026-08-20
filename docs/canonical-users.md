# Canonical User Blueprint (Data Contract SSOT)

## Overview
This document defines the Canonical User Schema as the official Data Contract (Single Source of Truth) for user identity and role assignment across the e-MAM Enterprise System.

## Canonical User JSON Schema
```json
{
  "accountType": "",
  "role": "",
  "roles": [],
  "tenantId": "",
  "status": ""
}
```

*Note: Do NOT add, remove, or rename fields. Maintain strict backward compatibility.*

---

## Field Semantics

### 1. `accountType`
Represents the user's organization domain.
* **Current supported values**:
  * `developer` (system-wide developer & maintenance domain)
  * `madrasah` (tenant-specific educational institution domain)
* *Architectural Note*: Future values (such as `kemenag`, `kanwil`, etc.) may be added without changing the core schema.

### 2. `role`
Represents the user's primary organizational role.
* **Supported Examples**:
  * `developer`
  * `admin`
  * `kepala_madrasah`
  * `wakil_kepala_madrasah`
  * `kepala_tata_usaha`
  * `guru`
  * `staf`
  * `siswa`
  * `orang_tua`

### 3. `roles[]`
Represents additional organizational responsibilities or sub-roles assigned to the user.
* **Supported Examples**:
  * `wali_kelas`
  * `guru_bk`
  * `operator_emis`
  * `tim_kurikulum`
  * `tim_penjamin_mutu`
  * `panitia_ujian`
  * `tim_keuangan`
  * `operator_ptsp`
  * `operator_persuratan`
  * `kepala_perpustakaan`
  * `ketua_kelas`

### 4. `tenantId`
Represents the organization/madrasah tenant identifier. Mandatory for all organization users (`madrasah` account type).

### 5. `status`
Represents the account status (e.g., `active`, `suspended`, `pending`).

---

## Canonical User JSON Examples

### 1. Developer
```json
{
  "accountType": "developer",
  "role": "developer",
  "roles": [],
  "tenantId": "system",
  "status": "active"
}
```

### 2. Admin
```json
{
  "accountType": "madrasah",
  "role": "admin",
  "roles": [],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 3. Kepala Madrasah
```json
{
  "accountType": "madrasah",
  "role": "kepala_madrasah",
  "roles": [],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 4. Wakil Kepala Madrasah
```json
{
  "accountType": "madrasah",
  "role": "wakil_kepala_madrasah",
  "roles": [],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 5. Kepala Tata Usaha
```json
{
  "accountType": "madrasah",
  "role": "kepala_tata_usaha",
  "roles": [],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 6. Guru
```json
{
  "accountType": "madrasah",
  "role": "guru",
  "roles": [],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 7. Guru + Wali Kelas
```json
{
  "accountType": "madrasah",
  "role": "guru",
  "roles": ["wali_kelas"],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 8. Guru + Guru BK
```json
{
  "accountType": "madrasah",
  "role": "guru",
  "roles": ["guru_bk"],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 9. Guru + Guru BK + Operator EMIS
```json
{
  "accountType": "madrasah",
  "role": "guru",
  "roles": ["guru_bk", "operator_emis"],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 10. Staf
```json
{
  "accountType": "madrasah",
  "role": "staf",
  "roles": [],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 11. Tim Keuangan
```json
{
  "accountType": "madrasah",
  "role": "staf",
  "roles": ["tim_keuangan"],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 12. PTSP
```json
{
  "accountType": "madrasah",
  "role": "staf",
  "roles": ["operator_ptsp"],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 13. Kepala Perpustakaan
```json
{
  "accountType": "madrasah",
  "role": "staf",
  "roles": ["kepala_perpustakaan"],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 14. Siswa
```json
{
  "accountType": "madrasah",
  "role": "siswa",
  "roles": [],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 15. Ketua Kelas
```json
{
  "accountType": "madrasah",
  "role": "siswa",
  "roles": ["ketua_kelas"],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

### 16. Orang Tua
```json
{
  "accountType": "madrasah",
  "role": "orang_tua",
  "roles": [],
  "tenantId": "tenant_man_1_surakarta",
  "status": "active"
}
```

---

## Account Type Governance
* `accountType` defines the user's organization domain.
* Changing `accountType` changes the user's identity domain.
* Therefore:
  * Only users with the primary role `developer` are allowed to change `accountType`.
  * Administrators may manage users within their current `accountType`, but cannot move a user to another `accountType`.
  * Any `accountType` change must be audited and logged.
  * A change of `accountType` requires recalculation of permissions, scopes, navigation, dashboard, and available modules during the next session initialization.

---

## Role Management
* Administrators may update `role` and `roles[]` according to RBAC policy.
* Developers may update any role or account type for maintenance or migration purposes.
* Users cannot change their own `accountType`.

---

## Validation Rules
* `accountType` is mandatory.
* `role` is mandatory.
* `roles[]` cannot contain duplicates.
* `status` is mandatory.
* `tenantId` is mandatory for organization users.
* Every `role` must be valid for the selected `accountType`.
* Every additional role in `roles[]` must be compatible with the selected `accountType`.

---

## Security Rules
* Changing `accountType` is a privileged system operation.
* It must require Developer permission.
* It must generate an Audit Log.
* It must invalidate the active Security Context.
* It must force regeneration of the Security Context on the next login.
