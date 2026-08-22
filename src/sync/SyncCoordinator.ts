import { SyncEngine } from '@/services/SyncEngine';
import { sessionManager } from '@/core/session/sessionManager';

export class SyncCoordinatorClass {
  private activePromises: Map<string, Promise<void>> = new Map();

  async requestSync(_force = false): Promise<void> {
    const tenantId = sessionManager.getCurrentTenantId();
    if (!tenantId) {
      console.warn('[SyncCoordinator] Tenant ID tidak tersedia, mengabaikan requestSync (FAIL CLOSED).');
      return;
    }
    const flightKey = `sync_${tenantId}`;
    if (this.activePromises.has(flightKey)) return this.activePromises.get(flightKey)!;

    const syncPromise = (async () => {
      try {
        await SyncEngine.processQueue();
      } finally {
        this.activePromises.delete(flightKey);
      }
    })();
    this.activePromises.set(flightKey, syncPromise);
    return syncPromise;
  }

  async requestPush(): Promise<void> {
    await SyncEngine.processQueue();
  }

  startBackgroundSync(intervalMs = 300000): void {
    SyncEngine.start(intervalMs);
  }

  stopBackgroundSync(): void {
    SyncEngine.stop();
  }
}

export const syncCoordinator = new SyncCoordinatorClass();
export default syncCoordinator;
