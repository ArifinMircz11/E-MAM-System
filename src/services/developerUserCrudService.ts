import { userRepositoryImpl } from '@/identity/infrastructure/UserRepositoryImpl';
import type { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { getSecurityContext } from '@/core/security/contextHelper';
import { ArchitectureBoundaryError } from '@/core/boundary/ArchitectureBoundaryError';
import { UserRole, AccountType } from '@/types/roles';

export type DeveloperUserCreateInput = {
  uid: string;
  email: string;
  displayName: string;
  tenantId?: string;
  accountType: AccountType;
  role: UserRole;
  roles?: UserRole[];
  permissions?: string[];
  referenceId?: string | null;
  approvalStatus?: CanonicalUser['approvalStatus'];
  status?: CanonicalUser['status'];
  phone?: string;
  photoURL?: string | null;
};

const requireDeveloper = () => {
  const context = getSecurityContext(true);
  if (!context.isDeveloper || !context.roles?.includes(UserRole.DEVELOPER)) {
    throw new ArchitectureBoundaryError('security', 'USER_CRUD_DEVELOPER_ONLY', 'CRUD users hanya dapat dilakukan oleh Developer.');
  }
  return context;
};

const validateString = (name: string, value: unknown) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ArchitectureBoundaryError('schema', 'USER_FIELD_INVALID', `Field '${name}' wajib berupa string non-empty.`);
  }
};

export const developerUserCrudService = {
  async list(): Promise<CanonicalUser[]> {
    const context = requireDeveloper();
    return userRepositoryImpl.getByTenant(context);
  },

  async get(uid: string): Promise<CanonicalUser | null> {
    const context = requireDeveloper();
    validateString('uid', uid);
    return userRepositoryImpl.getById(context, uid);
  },

  async create(input: DeveloperUserCreateInput): Promise<CanonicalUser> {
    const context = requireDeveloper();
    validateString('uid', input.uid);
    validateString('email', input.email);
    validateString('displayName', input.displayName);
    validateString('accountType', input.accountType);
    validateString('role', input.role);

    const now = Date.now();
    const entity: CanonicalUser = {
      id: input.uid,
      uid: input.uid,
      tenantId: input.tenantId || context.tenantId,
      accountType: input.accountType,
      role: input.role,
      roles: input.roles?.length ? input.roles : [input.role],
      permissions: input.permissions || [],
      referenceId: input.referenceId ?? null,
      isClaimed: false,
      isSso: false,
      approvalStatus: input.approvalStatus || 'pending',
      email: input.email,
      displayName: input.displayName,
      photoURL: input.photoURL ?? null,
      phone: input.phone,
      status: input.status || 'pending',
      syncStatus: 'pending',
      version: 1,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: context.uid,
      updatedBy: context.uid,
      deleted: false,
    };

    if (entity.tenantId !== context.tenantId && !(context.scope?.level === 'global')) {
      throw new ArchitectureBoundaryError('tenant', 'TENANT_ACCESS_DENIED', 'Developer tidak memiliki global scope untuk membuat user lintas tenant.');
    }

    return userRepositoryImpl.create(context, entity) as Promise<CanonicalUser>;
  },

  async update(uid: string, changes: Partial<CanonicalUser>): Promise<CanonicalUser> {
    const context = requireDeveloper();
    validateString('uid', uid);
    if ('id' in changes || 'uid' in changes || 'createdAt' in changes || 'createdBy' in changes || 'version' in changes) {
      throw new ArchitectureBoundaryError('schema', 'USER_IMMUTABLE_FIELD', 'Field identity/metadata immutable tidak boleh diubah melalui Edit User.');
    }
    const existing = await userRepositoryImpl.getById(context, uid);
    if (!existing) throw new ArchitectureBoundaryError('repository', 'USER_NOT_FOUND', `User '${uid}' tidak ditemukan.`);
    const result = await userRepositoryImpl.save(context, { ...existing, ...changes, id: existing.id, uid: existing.uid, createdAt: existing.createdAt, createdBy: existing.createdBy });
    return result as CanonicalUser;
  },

  async remove(uid: string): Promise<void> {
    const context = requireDeveloper();
    validateString('uid', uid);
    await userRepositoryImpl.delete(context, uid);
  },
};

export default developerUserCrudService;
