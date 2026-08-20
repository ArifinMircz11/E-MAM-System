// src/core/realtime/listeners/TenantListener.ts
// Organization Domain Tenant Listener Implementation

import { realtimeHub } from '../RealtimeHub';
import { REALTIME_REGISTRY } from '../RealtimeRegistry';

export class TenantListener {
  private static readonly CONTRACT = REALTIME_REGISTRY.tenants;

  static activate(tenantId: string | undefined): void {
    if (!tenantId) {
      realtimeHub.unsubscribe(this.CONTRACT.key);
      return;
    }

    const unsubStub = () => {};
    realtimeHub.subscribe(this.CONTRACT.key, unsubStub, {
      tenantId,
      customContract: this.CONTRACT,
    });
  }

  static deactivate(): void {
    realtimeHub.unsubscribe(this.CONTRACT.key);
  }
}
