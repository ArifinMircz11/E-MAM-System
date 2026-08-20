/**
 * @license
 * e-Mam System - Sync Telemetry & Observability
 * LAYER: CORE SYNC LAYER
 */

import { logAudit } from '@/services/auditLogService';

export type SyncEventType =
  | 'SYNC_STARTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_FAILED'
  | 'SYNC_BLOCKED_COOLDOWN'
  | 'SYNC_RETRY';

export interface SyncTelemetryPayload {
  tenantId: string;
  timestamp: number;
  duration?: number;
  queueSize?: number;
  collection?: string;
  reason?: string;
  remainingMs?: number;
}

export class SyncTelemetry {
  static record(event: SyncEventType, payload: SyncTelemetryPayload) {
    const logEntry = {
      event,
      ...payload,
      createdAt: new Date().toISOString(),
    };
    console.log(`[SyncTelemetry] [${event}]`, logEntry);

    try {
      if (payload.tenantId && (event === 'SYNC_FAILED' || event === 'SYNC_COMPLETED')) {
        logAudit({
          tenantId: payload.tenantId,
          userId: 'SYSTEM',
          action: event,
          category: 'SYSTEM',
          details: JSON.stringify(payload),
        }).catch(() => {});
      }
    } catch (e) {
      // Non-blocking telemetry
    }
  }
}
