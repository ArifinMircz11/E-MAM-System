// src/core/realtime/listeners/NotificationListener.ts
// Communication Domain Realtime Notification Listener Implementation

import { realtimeHub } from '../RealtimeHub';
import { REALTIME_REGISTRY } from '../RealtimeRegistry';

export class NotificationListener {
  private static readonly CONTRACT = REALTIME_REGISTRY.notifications;

  static activate(userId: string | undefined, onUpdate?: (unreadCount: number) => void): void {
    if (!userId) {
      realtimeHub.unsubscribe(this.CONTRACT.key);
      return;
    }

    const unsubStub = () => {};
    realtimeHub.subscribe(this.CONTRACT.key, unsubStub, {
      userId,
      customContract: this.CONTRACT,
    });
  }

  static deactivate(): void {
    realtimeHub.unsubscribe(this.CONTRACT.key);
  }
}
