export class SyncEngine {
  private static instance: SyncEngine;
  private intervalId: any = null;

  static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  static start(intervalMs?: number): void {
    const engine = SyncEngine.getInstance();
    void engine.startBackgroundSync(intervalMs);
  }

  static stop(): void {
    const engine = SyncEngine.getInstance();
    void engine.stopBackgroundSync();
  }

  async sync(): Promise<void> {}

  async startBackgroundSync(intervalMs?: number): Promise<void> {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      void this.sync();
    }, intervalMs || 10000);
  }

  async stopBackgroundSync(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const syncEngine = SyncEngine.getInstance();
