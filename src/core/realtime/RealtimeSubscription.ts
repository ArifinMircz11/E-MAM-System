// src/core/realtime/RealtimeSubscription.ts
// Enterprise Realtime Subscription Contracts & Types for e-MAM System V7.7

import { UserRole } from '@/types';

export type RealtimeDomainOwner =
  | 'Authentication'
  | 'Identity'
  | 'Organization'
  | 'Academic'
  | 'Communication'
  | 'Developer'
  | 'System';

export type RealtimeScopeType =
  | 'GLOBAL'
  | 'TENANT'
  | 'ORGANIZATION'
  | 'USER'
  | 'DEVELOPER';

export type RealtimeLifecycleTrigger =
  | 'ON_LOGIN'
  | 'ON_LOGOUT'
  | 'ON_TENANT_CHANGE'
  | 'ON_IMPERSONATION_CHANGE'
  | 'ON_SECURITY_CONTEXT_READY'
  | 'ON_WINDOW_FOCUS'
  | 'ON_WINDOW_BLUR'
  | 'ON_ONLINE'
  | 'ON_OFFLINE';

export interface RealtimeListenerContract {
  /** Unique key identifier for the listener (e.g. 'pending_account_approvals') */
  key: string;
  /** Domain owning this listener (e.g. 'Identity') */
  ownerDomain: RealtimeDomainOwner;
  /** Repository associated with this listener (e.g. 'ApprovalRepository') */
  repository: string;
  /** Service layer managing the logic (e.g. 'PendingApprovalRealtimeService') */
  service: string;
  /** Target scope level (e.g. 'TENANT', 'DEVELOPER', 'USER') */
  scope: RealtimeScopeType;
  /** User roles allowed to initialize this listener */
  allowedRoles: (UserRole | string)[];
  /** Lifecycle ON triggers when this listener must be activated */
  onTriggers: RealtimeLifecycleTrigger[];
  /** Lifecycle OFF triggers when this listener must be destroyed */
  offTriggers: RealtimeLifecycleTrigger[];
  /** Description explaining the purpose and lifecycle of the listener */
  description: string;
  /** Whether the listener requires an active tenantId in SecurityContext */
  requiresTenantId?: boolean;
}

export interface RealtimeContext {
  userId?: string;
  userRole?: UserRole | string;
  tenantId?: string;
  organizationId?: string;
  isImpersonating?: boolean;
  isOnline?: boolean;
  isWindowFocused?: boolean;
}

export type Unsubscribe = () => void;

export interface ActiveRealtimeListener {
  contract: RealtimeListenerContract;
  unsubscribeFn: Unsubscribe;
  subscribedAt: number;
  tenantId?: string;
  userId?: string;
  status: 'active' | 'paused' | 'disposed';
}
