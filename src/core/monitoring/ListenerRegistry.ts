export interface ListenerInfo {
  id: string;
  source: string;
  createdAt: number;
  stop?: () => void;
}

class ListenerRegistry {
  private listeners = new Map<string, ListenerInfo>();

  register(listener: ListenerInfo) {
    this.listeners.set(listener.id, listener);
  }

  remove(id: string) {
    this.listeners.delete(id);
  }

  clear() {
    this.listeners.clear();
  }

  count() {
    return this.listeners.size;
  }

  all() {
    return Array.from(this.listeners.values());
  }

  list() {
    return this.all();
  }

  destroyAll() {
    this.listeners.forEach(item => {
      item.stop?.();
    });
    this.listeners.clear();
  }

  debug() {
    console.table(this.all());
  }
}

export const listenerRegistry = new ListenerRegistry();
