/**
 * SecurityContextBuilder.ts
 * WO-RBAC: Builds SecurityContext from Canonical User
 */

import { SecurityContext } from "./SecurityContext";
import { PermissionResolver } from "./PermissionResolver";
import { CanonicalSecurityUser } from "./types";

export class SecurityContextBuilder {
  public static fromCanonicalUser(user: CanonicalSecurityUser): SecurityContext {
    const permissions = PermissionResolver.resolve(user);
    const scope = user.scope || { classIds: [], academicYear: "" };

    return new SecurityContext(
      user.uid,
      user.tenantId,
      permissions,
      scope,
      user.roles || [],
      user.accountType || "madrasah"
    );
  }

  public static createGuestContext(): SecurityContext {
    const guestUser: CanonicalSecurityUser = {
      uid: "guest-uid",
      tenantId: "public",
      accountType: "madrasah",
      roles: ["siswa"],
      primaryRole: "siswa",
      scope: { classIds: [] }
    };
    return this.fromCanonicalUser(guestUser);
  }

  public static createDeveloperContext(): SecurityContext {
    const devUser: CanonicalSecurityUser = {
      uid: "dev-uid",
      tenantId: "global",
      accountType: "developer",
      roles: ["developer"],
      primaryRole: "developer",
      scope: { isGlobalTenantAccess: true }
    };
    return this.fromCanonicalUser(devUser);
  }
}
