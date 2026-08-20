// src/core/realtime/RealtimeRegistry.ts
// Single Source of Truth (SSOT) Realtime Registry for e-MAM System V7.7

import { RealtimeListenerContract } from './RealtimeSubscription';
import { UserRole } from '@/types';

export const REALTIME_REGISTRY: Record<string, RealtimeListenerContract> = {
  // Identity Domain
  pending_account_approvals: {
    key: 'pending_account_approvals',
    ownerDomain: 'Identity',
    repository: 'ApprovalRepository',
    service: 'PendingApprovalRealtimeService',
    scope: 'TENANT',
    allowedRoles: [UserRole.ADMIN, UserRole.DEVELOPER, 'admin', 'developer'],
    onTriggers: ['ON_LOGIN', 'ON_SECURITY_CONTEXT_READY', 'ON_TENANT_CHANGE'],
    offTriggers: ['ON_LOGOUT', 'ON_IMPERSONATION_CHANGE'],
    description: 'Tracks pending account registration and profile update requests count in realtime.',
    requiresTenantId: true,
  },
  canonical_users: {
    key: 'canonical_users',
    ownerDomain: 'Identity',
    repository: 'UserRepository',
    service: 'UserRealtimeService',
    scope: 'TENANT',
    allowedRoles: [UserRole.ADMIN, UserRole.DEVELOPER, 'admin', 'developer'],
    onTriggers: ['ON_LOGIN', 'ON_SECURITY_CONTEXT_READY'],
    offTriggers: ['ON_LOGOUT'],
    description: 'Tracks user account updates and identity changes within active tenant.',
    requiresTenantId: true,
  },

  // System Domain
  master_version: {
    key: 'master_version',
    ownerDomain: 'System',
    repository: 'SystemRepository',
    service: 'MasterVersionRealtimeService',
    scope: 'GLOBAL',
    allowedRoles: ['*'],
    onTriggers: ['ON_LOGIN', 'ON_SECURITY_CONTEXT_READY'],
    offTriggers: ['ON_LOGOUT'],
    description: 'Monitors system master version bump to trigger automatic Delta Sync across local Dexie cache.',
  },
  system_settings: {
    key: 'system_settings',
    ownerDomain: 'System',
    repository: 'SystemRepository',
    service: 'SystemSettingsRealtimeService',
    scope: 'GLOBAL',
    allowedRoles: ['*'],
    onTriggers: ['ON_LOGIN', 'ON_SECURITY_CONTEXT_READY'],
    offTriggers: ['ON_LOGOUT'],
    description: 'Listens for system-wide feature locks, RBAC policies, and broadcast banners.',
  },

  // Communication Domain
  notifications: {
    key: 'notifications',
    ownerDomain: 'Communication',
    repository: 'NotificationRepository',
    service: 'NotificationRealtimeService',
    scope: 'USER',
    allowedRoles: ['*'],
    onTriggers: ['ON_LOGIN', 'ON_SECURITY_CONTEXT_READY'],
    offTriggers: ['ON_LOGOUT'],
    description: 'Listens for targeted unread notifications and chat alerts for active logged-in user.',
  },
  announcements: {
    key: 'announcements',
    ownerDomain: 'Communication',
    repository: 'AnnouncementRepository',
    service: 'AnnouncementRealtimeService',
    scope: 'TENANT',
    allowedRoles: ['*'],
    onTriggers: ['ON_LOGIN', 'ON_SECURITY_CONTEXT_READY'],
    offTriggers: ['ON_LOGOUT'],
    description: 'Listens for school/madrasah level announcements.',
    requiresTenantId: true,
  },
  pending_letters: {
    key: 'pending_letters',
    ownerDomain: 'Communication',
    repository: 'LetterRepository',
    service: 'LetterRealtimeService',
    scope: 'TENANT',
    allowedRoles: ['*'],
    onTriggers: ['ON_LOGIN', 'ON_SECURITY_CONTEXT_READY'],
    offTriggers: ['ON_LOGOUT'],
    description: 'Tracks pending official letter status and verification queue count in realtime.',
    requiresTenantId: true,
  },
  chat_sync: {
    key: 'chat_sync',
    ownerDomain: 'Communication',
    repository: 'ChatRepository',
    service: 'ChatRealtimeService',
    scope: 'USER',
    allowedRoles: ['*'],
    onTriggers: ['ON_LOGIN', 'ON_SECURITY_CONTEXT_READY'],
    offTriggers: ['ON_LOGOUT'],
    description: 'Listens for direct messages, staff group discussions, and student chat rooms.',
  },

  // Organization Domain
  tenants: {
    key: 'tenants',
    ownerDomain: 'Organization',
    repository: 'TenantRepository',
    service: 'TenantRealtimeService',
    scope: 'DEVELOPER',
    allowedRoles: [UserRole.DEVELOPER, UserRole.ADMIN, 'developer', 'admin'],
    onTriggers: ['ON_LOGIN', 'ON_SECURITY_CONTEXT_READY'],
    offTriggers: ['ON_LOGOUT'],
    description: 'Listens for multi-tenant configurations and tenant onboarding state.',
  },

  // Developer Domain
  sync_monitor: {
    key: 'sync_monitor',
    ownerDomain: 'Developer',
    repository: 'SyncQueueRepository',
    service: 'SyncMonitorRealtimeService',
    scope: 'DEVELOPER',
    allowedRoles: [UserRole.DEVELOPER, 'developer'],
    onTriggers: ['ON_LOGIN', 'ON_SECURITY_CONTEXT_READY'],
    offTriggers: ['ON_LOGOUT'],
    description: 'Monitors real-time offline sync queue state and Firestore gateway telemetry.',
  },
};

export class RealtimeRegistry {
  /**
   * Retrieves a contract definition from the registry by key.
   */
  static getContract(key: string): RealtimeListenerContract | undefined {
    return REALTIME_REGISTRY[key];
  }

  /**
   * Returns all registered listener contracts.
   */
  static getAllContracts(): RealtimeListenerContract[] {
    return Object.values(REALTIME_REGISTRY);
  }

  /**
   * Filter contracts by domain owner.
   */
  static getContractsByDomain(domain: string): RealtimeListenerContract[] {
    return this.getAllContracts().filter((c) => c.ownerDomain === domain);
  }
}

export type ListenerKey = keyof typeof REALTIME_REGISTRY;
