/**
 * EVENT BUS
 * Central decoupled communication controller.
 */
import type { EventMap, EventName } from './eventContract';

type Listener<T> = (data: T) => Promise<void>;

class EventBus {
  private listeners: Map<EventName, Listener<any>[]> = new Map();

  subscribe<T extends EventName>(eventName: T, listener: Listener<EventMap[T]>) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);
  }

  async publish<T extends EventName>(eventName: T, data: EventMap[T]) {
    console.log(`[EventBus] Publishing: ${eventName}`, data);
    const listeners = this.listeners.get(eventName) || [];
    for (const listener of listeners) {
      await listener(data);
    }
  }
}

export const eventBus = new EventBus();
