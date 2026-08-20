import type { HealthReport, RuntimeMode } from '../bootstrap/BootContext';
import type { PolicyEvaluationResult } from '../policy/SyncPolicy';

export interface RuntimeContextData {
  application: {
    name: string;
    version: string;
    environment: string;
  };
  tenant: {
    tenantId: string | null;
    isTenantValid: boolean;
  };
  user: {
    userId: string | null;
    isAuthenticated: boolean;
    roles: string[];
  };
  permissions: string[];
  schema: {
    schemaVersion: number;
    migrationStatus: 'IDLE' | 'COMPLETED' | 'ROLLED_BACK';
  };
  metadata: {
    metadataVersion: number;
    checksum?: string;
  };
  health: HealthReport | null;
  policy: PolicyEvaluationResult | null;
  runtimeMode: RuntimeMode;
  initializedAt: string | null;
}

class RuntimeContextManager {
  private data: RuntimeContextData = {
    application: {
      name: 'e-Mam System',
      version: '8.2',
      environment: 'production'
    },
    tenant: {
      tenantId: null,
      isTenantValid: false
    },
    user: {
      userId: null,
      isAuthenticated: false,
      roles: []
    },
    permissions: [],
    schema: {
      schemaVersion: 1,
      migrationStatus: 'IDLE'
    },
    metadata: {
      metadataVersion: 1
    },
    health: null,
    policy: null,
    runtimeMode: 'SYNC_ACTIVE',
    initializedAt: null
  };

  private listeners: ((context: RuntimeContextData) => void)[] = [];

  public getState(): RuntimeContextData {
    return JSON.parse(JSON.stringify(this.data));
  }

  public setState(partial: Partial<RuntimeContextData>): void {
    this.data = { ...this.data, ...partial };
    this.notify();
  }

  public setTenant(tenantId: string): void {
    if (!tenantId) {
      throw new Error('TENANT_VALIDATION_ERROR: tenantId cannot be empty or undefined');
    }
    this.data.tenant = {
      tenantId,
      isTenantValid: true
    };
    this.notify();
  }

  public setUser(userId: string, roles: string[] = [], permissions: string[] = []): void {
    this.data.user = {
      userId,
      isAuthenticated: Boolean(userId),
      roles
    };
    this.data.permissions = permissions;
    this.notify();
  }

  public setHealthAndPolicy(health: HealthReport, policy: PolicyEvaluationResult): void {
    this.data.health = health;
    this.data.policy = policy;
    this.data.runtimeMode = policy.runtimeMode;
    this.notify();
  }

  public subscribe(listener: (context: RuntimeContextData) => void): () => void {
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
        console.error('Error in RuntimeContext listener:', err);
      }
    }
  }
}

export const runtimeContext = new RuntimeContextManager();
