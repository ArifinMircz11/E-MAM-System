export type BootStage = 
  | 'IDLE'
  | 'CONFIGURATION'
  | 'ENVIRONMENT'
  | 'DATABASE_OPEN'
  | 'MIGRATION'
  | 'TENANT_VALIDATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'SCHEMA_CHECK'
  | 'METADATA_VERSION'
  | 'CACHE_INTEGRITY'
  | 'SYNC_QUEUE'
  | 'FIRESTORE_CONNECTIVITY'
  | 'DELTA_SYNC'
  | 'READY'
  | 'SAFE_MODE_1'
  | 'SAFE_MODE_2'
  | 'SAFE_MODE_3'
  | 'ERROR';

export type SafeModeLevel = 'NORMAL' | 'SAFE_MODE_1' | 'SAFE_MODE_2' | 'SAFE_MODE_3';

export type RuntimeMode = 'SYNC_ACTIVE' | 'SAFE_MODE_QUEUE' | 'SAFE_MODE_READ' | 'EMERGENCY';

export interface HealthScoreItem {
  component: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  score: number; // 0 - 100
  message: string;
}

export interface HealthReport {
  score: number;
  components: {
    database: number;
    migration: number;
    queue: number;
    cache: number;
    security: number;
    tenant: number;
    sync: number;
  };
  status: 'HEALTHY' | 'WARNING' | 'BLOCKED';
  runtimeMode: RuntimeMode;
  items: HealthScoreItem[];
}

export interface BootContextData {
  stage: BootStage;
  safeMode: SafeModeLevel;
  healthScores: HealthScoreItem[];
  healthReport: HealthReport | null;
  overallHealthScore: number;
  runtimeMode: RuntimeMode;
  tenantId: string | null;
  userId: string | null;
  metadataVersion: number;
  syncEnabled: boolean;
  error: string | null;
  startTime: number;
  durationMs?: number;
}

class BootContextStore {
  private data: BootContextData = {
    stage: 'IDLE',
    safeMode: 'NORMAL',
    healthScores: [],
    healthReport: null,
    overallHealthScore: 100,
    runtimeMode: 'SYNC_ACTIVE',
    tenantId: null,
    userId: null,
    metadataVersion: 1,
    syncEnabled: false,
    error: null,
    startTime: Date.now(),
  };

  private listeners: ((context: BootContextData) => void)[] = [];

  public getState(): BootContextData {
    return { ...this.data };
  }

  public setState(partial: Partial<BootContextData>): void {
    this.data = { ...this.data, ...partial };
    this.notify();
  }

  public subscribe(listener: (context: BootContextData) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getState());
      } catch (err) {
        console.error('Error in BootContext listener:', err);
      }
    }
  }
}

export const bootContext = new BootContextStore();

