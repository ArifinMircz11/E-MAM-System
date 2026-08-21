import { z } from 'zod';
import { AccountType, UserRole } from '@/types/roles';
import type { CanonicalUser } from './CanonicalUser';

/**
 * Runtime validation for the CanonicalUser contract.
 * This schema is the authoritative identity validator.
 * Compatibility fields are intentionally isolated and optional.
 */
export const CanonicalUserSchema = z.object({
  id: z.string().min(1),
  uid: z.string().min(1),
  tenantId: z.string().min(1),
  accountType: z.nativeEnum(AccountType),
  role: z.nativeEnum(UserRole),
  roles: z.array(z.nativeEnum(UserRole)).min(1),
  permissions: z.array(z.string()),
  referenceId: z.string().nullable(),
  isClaimed: z.boolean(),
  isSso: z.boolean(),
  approvalStatus: z.enum(['approved', 'pending', 'rejected']),
  email: z.string(),
  displayName: z.string(),
  photoURL: z.string().nullable().optional(),
  phone: z.string().optional(),
  phoneNumber: z.string().optional(),
  profile: z.object({
    email: z.string(),
    displayName: z.string(),
    photoURL: z.string().nullable().optional(),
    phone: z.string().optional(),
    phoneNumber: z.string().optional(),
    nip: z.string().optional(),
    nik: z.string().optional(),
    nisn: z.string().optional(),
  }).optional(),
  idUnik: z.string().optional(),
  nisn: z.string().optional(),
  nip: z.string().optional(),
  nik: z.string().optional(),
  peran: z.string().optional(),
  studentsId: z.string().nullable().optional(),
  teachersId: z.string().nullable().optional(),
  walasOfClass: z.string().nullable().optional(),
  entityType: z.string().nullable().optional(),
  targetRombel: z.string().nullable().optional(),
  tingkatRombel: z.string().nullable().optional(),
  class: z.string().nullable().optional(),
  status: z.enum(['active', 'pending', 'inactive', 'suspended', 'deleted', 'rejected']),
  syncStatus: z.enum(['synced', 'pending', 'error']),
  rbacVersion: z.number().optional(),
  securityVersion: z.number().optional(),
  scopeType: z.string().optional(),
  scopeId: z.string().optional(),
  scope: z.object({
    level: z.enum(['global', 'tenant', 'department', 'class', 'restricted']),
    ids: z.array(z.string()).optional(),
  }).optional(),
  assignment: z.object({
    departmentId: z.string().optional(),
    positionId: z.string().optional(),
    classId: z.string().optional(),
    studentsId: z.string().optional(),
    teachersId: z.string().optional(),
    scope: z.object({
      level: z.enum(['global', 'tenant', 'department', 'class', 'restricted']),
      ids: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
  metadata: z.object({
    isActivationRequest: z.boolean().optional(),
    requestedAt: z.number().optional(),
    approvedAt: z.number().optional(),
    approvedBy: z.string().optional(),
    lastLoginAt: z.number().optional(),
    lastModifiedDevice: z.string().optional(),
    isOfflineFallback: z.boolean().optional(),
  }).optional(),
  isActive: z.boolean().optional(),
  version: z.number(),
  schemaVersion: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
  lastLoginAt: z.number().nullable().optional(),
  deleted: z.boolean(),
  deletedAt: z.number().optional(),
}) satisfies z.ZodType<CanonicalUser>;

export type CanonicalUserInput = z.input<typeof CanonicalUserSchema>;
export type CanonicalUserOutput = z.output<typeof CanonicalUserSchema>;
