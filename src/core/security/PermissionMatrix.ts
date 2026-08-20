/**
 * PermissionMatrix.ts
 * WO-RBAC-05: Permission Matrix Registry & Role Permission Map
 */

import { AppPermission, SystemRole } from "./types";

export const PermissionMatrix: Record<SystemRole, AppPermission[]> = {
  developer: [
    "*"
  ],
  admin: [
    "student:profile:view",
    "student:profile:create",
    "student:profile:update",
    "student:profile:delete",
    "teacher:profile:view",
    "teacher:profile:create",
    "teacher:profile:update",
    "attendance:record:view",
    "attendance:record:create",
    "attendance:approval:approve",
    "letter:submission:view",
    "letter:submission:create",
    "letter:approval:approve",
    "point:record:view",
    "point:record:create",
    "system:user:manage",
    "audit:log:view",
    "madrasah:view",
    "madrasah:update"
  ],
  kamad: [
    "student:profile:view",
    "teacher:profile:view",
    "attendance:record:view",
    "attendance:approval:approve",
    "letter:approval:approve",
    "audit:log:view"
  ],
  keptu: [
    "student:profile:view",
    "teacher:profile:view",
    "letter:submission:view",
    "system:user:manage"
  ],
  guru: [
    "student:profile:view",
    "attendance:record:view",
    "attendance:record:create",
    "point:record:create",
    "letter:submission:create"
  ],
  guru_bk: [
    "student:profile:view",
    "point:record:create",
    "point:record:view",
    "letter:submission:view"
  ],
  staf: [
    "student:profile:view",
    "letter:submission:view"
  ],
  siswa: [
    "attendance:record:view",
    "point:record:view",
    "letter:submission:create",
    "letter:submission:view"
  ],
  orang_tua: [
    "student:profile:view",
    "attendance:record:view",
    "point:record:view",
    "letter:submission:view"
  ]
};

export const ALL_PERMISSIONS_REGISTRY: AppPermission[] = [
  "student:profile:view",
  "student:profile:create",
  "student:profile:update",
  "student:profile:delete",
  "teacher:profile:view",
  "teacher:profile:create",
  "teacher:profile:update",
  "attendance:record:create",
  "attendance:record:view",
  "attendance:approval:approve",
  "letter:submission:create",
  "letter:submission:view",
  "letter:approval:approve",
  "point:record:view",
  "point:record:create",
  "system:user:manage",
  "system:tenant:manage",
  "audit:log:view",
  "madrasah:view",
  "madrasah:create",
  "madrasah:update",
  "madrasah:delete",
  "madrasah:restore",
  "madrasah:archive"
];
