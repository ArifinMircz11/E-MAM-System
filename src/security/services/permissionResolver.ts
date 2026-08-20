export class PermissionResolver {
  static hasPermission(user: { permissions?: string[] }, permission: string): boolean {
    return user.permissions?.includes(permission) ?? false;
  }

  static hasRole(user: { roles?: string[] }, role: string): boolean {
    return user.roles?.includes(role) ?? false;
  }
}
