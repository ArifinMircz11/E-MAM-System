/**
 * RolePolicy.ts
 * WO-RBAC: Role policy rules
 */

import { SystemRole } from "./types";

export const RolePolicy = {
  isSystemRole(role: SystemRole): boolean {
    return ["developer", "admin"].includes(role);
  },

  isManagementRole(role: SystemRole): boolean {
    return ["kamad", "keptu"].includes(role);
  },

  isTeacherRole(role: SystemRole): boolean {
    return ["guru", "guru_bk"].includes(role);
  },

  isStudentOrParentRole(role: SystemRole): boolean {
    return ["siswa", "orang_tua"].includes(role);
  }
};
