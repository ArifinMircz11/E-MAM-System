/**
 * @license
 * e-Mam System - Conflict Resolver with Domain Strategies
 * LAYER: CORE SYNC LAYER
 */

import { AuditLogger } from '@/services/AuditLogger';

export interface ConflictResolutionResult {
  winner: 'local' | 'server';
  entity: any;
}

export class ConflictResolver {
  static async resolve(
    collection: string,
    localEntity: any,
    serverEntity: any,
  ): Promise<ConflictResolutionResult> {
    const entityId = localEntity?.id || serverEntity?.id || 'unknown';
    const tenantId = localEntity?.tenantId || serverEntity?.tenantId || 'global';

    // 1. Attendance Conflict Strategy
    if (collection === 'attendances' || collection === 'attendance') {
      const sourcePriority = (src: string) => {
        switch (src?.toUpperCase()) {
          case 'SCANNER': return 100;
          case 'TEACHER_EDIT':
          case 'TEACHER': return 80;
          case 'IMPORT': return 50;
          default: return 60;
        }
      };

      const localPriority = sourcePriority(localEntity?.source || localEntity?.recordedBy);
      const serverPriority = sourcePriority(serverEntity?.source || serverEntity?.recordedBy);

      if (localPriority > serverPriority) {
        return this.logAndReturn('local', localEntity, serverEntity, collection, entityId, tenantId, `Attendance source priority override (${localPriority} > ${serverPriority})`);
      } else if (serverPriority > localPriority) {
        return this.logAndReturn('server', localEntity, serverEntity, collection, entityId, tenantId, `Attendance source priority override (${serverPriority} > ${localPriority})`);
      }
    }

    // 2. Letter / Approval Workflow State Machine Strategy
    if (collection === 'letters' || collection === 'permissions' || collection === 'approval_requests') {
      const stateRank = (status: string) => {
        switch (status?.toUpperCase()) {
          case 'SIGNED':
          case 'APPROVED': return 100;
          case 'REJECTED': return 90;
          case 'PENDING':
          case 'SUBMITTED': return 50;
          default: return 10;
        }
      };

      const localRank = stateRank(localEntity?.status);
      const serverRank = stateRank(serverEntity?.status);

      // Prevent regression from SIGNED/APPROVED to PENDING
      if (serverRank >= 100 && localRank < 100) {
        return this.logAndReturn('server', localEntity, serverEntity, collection, entityId, tenantId, 'Protected workflow: Cannot overwrite SIGNED/APPROVED with PENDING');
      }
      if (localRank >= 100 && serverRank < 100) {
        return this.logAndReturn('local', localEntity, serverEntity, collection, entityId, tenantId, 'Protected workflow: Local SIGNED/APPROVED preserved');
      }
    }

    // 3. Default Timestamp Strategy (Latest updatedAt wins)
    const localTime = localEntity?.updatedAt ? new Date(localEntity.updatedAt).getTime() : 0;
    const serverTime = serverEntity?.updatedAt ? new Date(serverEntity.updatedAt).getTime() : 0;

    if (serverTime >= localTime) {
      return this.logAndReturn('server', localEntity, serverEntity, collection, entityId, tenantId, 'Server updatedAt is newer or equal');
    } else {
      return this.logAndReturn('local', localEntity, serverEntity, collection, entityId, tenantId, 'Local updatedAt is newer');
    }
  }

  private static async logAndReturn(
    winner: 'local' | 'server',
    localEntity: any,
    serverEntity: any,
    collection: string,
    entityId: string,
    tenantId: string,
    reason: string
  ): Promise<ConflictResolutionResult> {
    await AuditLogger.log('system', 'CONFLICT_RESOLVED', 'SyncEngine', 'warning', {
      collection,
      entityId,
      reason,
      localUpdatedAt: localEntity?.updatedAt,
      serverUpdatedAt: serverEntity?.updatedAt,
      winner,
      tenantId,
    });

    import('./SyncMonitor')
      .then(({ useSyncMonitor }) => {
        const current = useSyncMonitor.getState().conflictCount;
        useSyncMonitor.getState().updateStatus({ conflictCount: current + 1 });
      })
      .catch(() => {});

    return { winner, entity: winner === 'local' ? localEntity : serverEntity };
  }
}
