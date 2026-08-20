import { listenerRegistry } from "@/core/monitoring/ListenerRegistry";

export class ListenerManager {
  private listeners = new Map<string, () => void>();

  register(
    id: string,
    unsubscribe: () => void,
    source: string
  ) {
    if (this.listeners.has(id)) {
      console.warn("Duplicate listener", id);
      this.stop(id);
    }

    this.listeners.set(id, unsubscribe);

    listenerRegistry.register({
      id,
      source,
      createdAt: Date.now(),
      stop: unsubscribe
    });
  }

  stop(id: string) {
    const fn = this.listeners.get(id);
    fn?.();
    this.listeners.delete(id);
    listenerRegistry.remove(id);
  }

  remove(id: string) {
    this.stop(id);
  }

  stopAll() {
    for (const id of this.listeners.keys()) {
      this.stop(id);
    }
  }

  destroyAll() {
    this.stopAll();
  }
}
