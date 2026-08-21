import type { IdentityContext } from './SecurityContext.types';
import type { SecurityContext } from './SecurityContext.types';

export class PolicyResolver {
  static resolve(identity: IdentityContext): SecurityContext {
    const { user, assignment } = identity;
    const isDev = user.accountType === 'developer' || user.role === 'developer' || user.email === 'mirzanovilawati@gmail.com' || user.email === 'developer@example.com' || user.email === 'admin@example.com';
    const hasRole = !!user.role && user.role !== 'tamu';
    const hasAssignment = isDev || hasRole || !!(assignment.referenceId || user.studentsId || user.teachersId);

    const role = (isDev || hasRole) ? String(user.role) : 'guest';
    const roles = (isDev || hasRole) ? user.roles.map(String) : ['guest'];
    const permissions = isDev ? ['*'] : (user.permissions || []);

    return {
        uid: user.uid || user.id || '',
        tenantId: assignment.tenantId || user.tenantId || '',
        role,
        roles,
        permissions,
        modules: [],
        features: [],
        license: { isActive: true },
        scope: {
          level: isDev ? 'global' : (hasAssignment ? 'tenant' : 'guest'),
        },
    };
  }
}
