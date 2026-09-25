import { afterEach, describe, expect, it } from 'vitest';
import { IdentitySessionService } from './IdentitySession';
import type { CanonicalUser } from '@/identity/domain/CanonicalUser';

const makeUser = (overrides: Partial<CanonicalUser> = {}): CanonicalUser => ({
  id: 'user-1',
  uid: 'uid-1',
  tenantId: 'tenant-1',
  accountType: 'madrasah' as CanonicalUser['accountType'],
  role: 'Guru' as CanonicalUser['role'],
  roles: ['Guru' as CanonicalUser['role']],
  permissions: [],
  referenceId: 'teacher-1',
  isClaimed: true,
  isSso: false,
  approvalStatus: 'approved',
  email: 'guru@example.test',
  displayName: 'Guru Test',
  status: 'active',
  syncStatus: 'synced',
  version: 1,
  schemaVersion: 1,
  createdAt: 1,
  updatedAt: 1,
  deleted: false,
  ...overrides,
});

afterEach(() => IdentitySessionService.clear());

describe('IdentitySessionService', () => {
  it('establishes an operational session only from an approved active canonical user', () => {
    const session = IdentitySessionService.establish(makeUser());

    expect(session.uid).toBe('uid-1');
    expect(session.tenantId).toBe('tenant-1');
    expect(session.referenceId).toBe('teacher-1');
    expect(IdentitySessionService.require()).toBe(session);
  });

  it('rejects a pending identity', () => {
    expect(() => IdentitySessionService.establish(makeUser({ approvalStatus: 'pending' }))).toThrow(
      'approvalStatus=pending',
    );
  });

  it('rejects an inactive identity', () => {
    expect(() => IdentitySessionService.establish(makeUser({ status: 'inactive' }))).toThrow(
      'status=inactive',
    );
  });

  it('clears the identity on sign-out', () => {
    IdentitySessionService.establish(makeUser());
    IdentitySessionService.clear();

    expect(IdentitySessionService.get()).toBeNull();
    expect(() => IdentitySessionService.require()).toThrow('No authenticated canonical identity session');
  });
});
