// src/core/realtime/listeners/PendingApprovalListener.ts
// Identity Domain - Pending Approval Realtime Listener Contract Implementation

import { realtimeHub } from '../RealtimeHub';
import { REALTIME_REGISTRY } from '../RealtimeRegistry';
import { subscribePendingApprovalsCount } from '@/services/realtime/pendingApprovalListener';

export class PendingApprovalListener {
  private static readonly CONTRACT = REALTIME_REGISTRY.pending_account_approvals;

  /**
   * Activates the pending account approvals realtime listener for the specified tenant & callback.
   */
  static activate(
    isAdminOrDev: boolean,
    tenantId: string | undefined,
    onUpdate: (count: number) => void
  ): void {
    if (!isAdminOrDev || !tenantId) {
      realtimeHub.unsubscribe(this.CONTRACT.key);
      onUpdate(0);
      return;
    }

    if (realtimeHub.has(this.CONTRACT.key)) {
      return; // Already active, avoid redundant re-subscription churn
    }

    const unsub = subscribePendingApprovalsCount(true, onUpdate);

    realtimeHub.subscribe(this.CONTRACT.key, unsub, {
      tenantId,
      customContract: this.CONTRACT,
    });
  }

  /**
   * Deactivates the listener.
   */
  static deactivate(): void {
    realtimeHub.unsubscribe(this.CONTRACT.key);
  }
}
