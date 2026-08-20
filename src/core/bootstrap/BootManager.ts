import { BootSequence } from './BootSequence';
import type { BootContextData } from './BootContext';
import { bootContext } from './BootContext';
import { HealthManager } from './HealthManager';

export class BootManager {
  private static instance: BootManager;
  private initialized = false;

  public static getInstance(): BootManager {
    if (!BootManager.instance) {
      BootManager.instance = new BootManager();
    }
    return BootManager.instance;
  }

  public async boot(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }
    console.log('🚀 BootManager: Starting Enterprise Runtime Boot Sequence...');
    const success = await BootSequence.execute();
    this.initialized = success;
    return success;
  }

  public getContext(): BootContextData {
    return bootContext.getState();
  }

  public subscribe(listener: (ctx: BootContextData) => void): () => void {
    return bootContext.subscribe(listener);
  }

  public async refreshHealth() {
    return await HealthManager.evaluateHealth();
  }
}

export const bootManager = BootManager.getInstance();
