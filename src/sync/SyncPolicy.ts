/**
 * @license
 * e-Mam System - Sync Policy Registry
 * LAYER: CORE SYNC LAYER
 */

export type SyncMode = 'static' | 'delta' | 'queue' | 'realtime';

export interface SyncPolicyConfig {
  mode: SyncMode;
  ttlMinutes?: number;
  interval?: number; // in milliseconds
  description: string;
}

export interface SyncMetadataRecord {
  id: string;
  collection: string;
  tenantId: string;
  version: number;
  lastSyncAt: number;
  checksum: string;
  status: string;
  entity?: string;
  updatedAt?: number;
}

export const SYNC_POLICIES: Record<string, SyncPolicyConfig> = {
  // Static collections: Sync on first install or metadata change
  roles: { mode: 'static', ttlMinutes: 43200, description: 'Static roles, 30 days TTL' },
  permissions: { mode: 'static', ttlMinutes: 43200, description: 'Static permissions, 30 days TTL' },
  point_categories: { mode: 'static', ttlMinutes: 10080, description: 'Point categories, 7 days TTL' },
  academic_years: { mode: 'static', ttlMinutes: 10080, description: 'Academic years, 7 days TTL' },
  academic_terms: { mode: 'static', ttlMinutes: 10080, description: 'Academic terms, 7 days TTL' },
  settings: { mode: 'static', ttlMinutes: 1440, description: 'Settings, 1 day TTL' },

  // Dynamic collections: Sync delta updatedAt with interval
  students: { mode: 'delta', interval: 900000, ttlMinutes: 15, description: 'Students dynamic data, 15m interval' },
  teachers: { mode: 'delta', interval: 900000, ttlMinutes: 15, description: 'Teachers dynamic data, 15m interval' },
  classes: { mode: 'delta', interval: 1800000, ttlMinutes: 30, description: 'Classes dynamic data' },
  schedules: { mode: 'delta', interval: 1800000, ttlMinutes: 30, description: 'Schedules dynamic data' },

  // Transaction collections: Sync via SyncQueue
  attendance: { mode: 'queue', description: 'Transaction data, queue driven' },
  point_transactions: { mode: 'queue', description: 'Transaction data, queue driven' },
  journals: { mode: 'queue', description: 'Transaction data, queue driven' },
  letters: { mode: 'queue', description: 'Transaction data, queue driven' },
  approval: { mode: 'queue', description: 'Transaction data, queue driven' },
};

export function getSyncPolicy(collectionName: string): SyncPolicyConfig {
  return SYNC_POLICIES[collectionName] || { mode: 'delta', ttlMinutes: 15, interval: 900000, description: 'Default delta policy' };
}
