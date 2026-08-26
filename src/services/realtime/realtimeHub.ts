type UnsubscribeFn = () => void;

export class RealtimeHub {
  private static instance: RealtimeHub;
  private unsubscribers: Map<string, UnsubscribeFn> = new Map();

  static getInstance(): RealtimeHub {
    if (!RealtimeHub.instance) {
      RealtimeHub.instance = new RealtimeHub();
    }
    return RealtimeHub.instance;
  }

  register(key: string, unsub: UnsubscribeFn): void {
    if (this.unsubscribers.has(key)) {
      this.unsubscribers.get(key)!();
    }
    this.unsubscribers.set(key, unsub);
  }

  subscribe(key: string, unsub: UnsubscribeFn): void {
    this.register(key, unsub);
  }

  unregister(key: string): void {
    if (this.unsubscribers.has(key)) {
      this.unsubscribers.get(key)!();
      this.unsubscribers.delete(key);
    }
  }

  unsubscribe(key: string): void {
    this.unregister(key);
  }

  unsubscribeAll(): void {
    this.unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
    this.unsubscribers.clear();
  }
}

export const realtimeHub = RealtimeHub.getInstance();
