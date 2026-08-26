import { seedInitialData } from './seedService';

export class AppInitializationService {
  private static initialized = false;
  static async initialize(): Promise<void> {
    if (AppInitializationService.initialized) return;
    AppInitializationService.initialized = true;
    try {
      await seedInitialData();
    } catch {}
  }
}
