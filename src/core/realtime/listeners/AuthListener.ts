// src/core/realtime/listeners/AuthListener.ts
// Authentication Domain Realtime Listener Implementation

import { realtimeHub } from '../RealtimeHub';
import { REALTIME_REGISTRY } from '../RealtimeRegistry';

export class AuthListener {
  private static readonly CONTRACT = REALTIME_REGISTRY.canonical_users;

  static activate(tenantId: string | undefined, onUpdate?: (data: any) => void): void {
    if (!tenantId) {
      realtimeHub.unsubscribe(this.CONTRACT.key);
      return;
    }

    // Proxy listener registration
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
