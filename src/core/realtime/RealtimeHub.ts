// src/core/realtime/RealtimeHub.ts
// Centralized, Leak-Proof, Enterprise Realtime Hub for e-MAM System V7.7

import {
  ActiveRealtimeListener,
  RealtimeListenerContract,
  Unsubscribe,
} from './RealtimeSubscription';
import { RealtimeRegistry } from './RealtimeRegistry';

export class RealtimeHub {
  private static instance: RealtimeHub;
  private activeListeners = new Map<string, ActiveRealtimeListener>();
  private isDestroyed = false;

  public static getInstance(): RealtimeHub {
    if (!RealtimeHub.instance) {
      RealtimeHub.instance = new RealtimeHub();
    }
    return RealtimeHub.instance;
  }

  /**
   * Registers and activates a realtime listener using a key from RealtimeRegistry or custom contract.
   */
  public subscribe(
    key: string,
    unsubscribeFn: Unsubscribe,
    metadata?: { tenantId?: string; userId?: string; customContract?: RealtimeListenerContract }
  ): void {
    if (this.isDestroyed) {
      console.warn(`[RealtimeHub] Cannot subscribe '${key}': Hub is destroyed.`);
      return;
    }

    // Unsubscribe existing listener under same key to eliminate duplicate/ghost listeners
    this.unsubscribe(key);

    const contract = metadata?.customContract || RealtimeRegistry.getContract(key) || {
      key,
      ownerDomain: 'System',
      repository: 'GenericRepository',
      service: 'GenericRealtimeService',
      scope: metadata?.tenantId ? 'TENANT' : 'GLOBAL',
      allowedRoles: ['*'],
      onTriggers: ['ON_LOGIN'],
      offTriggers: ['ON_LOGOUT'],
      description: 'Dynamic subscription',
      requiresTenantId: !!metadata?.tenantId,
    };

    const activeEntry: ActiveRealtimeListener = {
      contract,
      unsubscribeFn,
      subscribedAt: Date.now(),
      tenantId: metadata?.tenantId,
      userId: metadata?.userId,
      status: 'active',
    };

    this.activeListeners.set(key, activeEntry);
    console.log(
      `[RealtimeHub] ✅ Subscribed: ${key} [Domain: ${contract.ownerDomain} | Owner: ${contract.repository}] (Active: ${this.activeListeners.size})`
    );
  }

  /**
   * Backward compatibility alias for register
   */
  public register(
    key: string,
    unsubscribeFn: Unsubscribe,
    metadata?: { tenantId?: string; userId?: string }
  ): void {
    this.subscribe(key, unsubscribeFn, metadata);
  }

  /**
   * Safely unsubscribes a specific listener by key.
   */
  public unsubscribe(key: string): void {
    const entry = this.activeListeners.get(key);
    if (entry) {
      try {
        entry.unsubscribeFn();
      } catch (err) {
        console.warn(`[RealtimeHub] Error while unsubscribing '${key}':`, err);
      }
      this.activeListeners.delete(key);
    }
  }

  /**
   * Backward compatibility alias for unregister
   */
  public unregister(key: string): void {
    this.unsubscribe(key);
  }

  /**
   * Unsubscribes all listeners associated with a specific tenant (e.g., during Tenant Switch or Impersonation).
   */
  public unsubscribeTenant(tenantId: string): void {
    console.log(`[RealtimeHub] 🔄 Cleaning up listeners for Tenant: ${tenantId}`);
    this.activeListeners.forEach((entry, key) => {
      if (entry.tenantId === tenantId || entry.contract.requiresTenantId) {
        this.unsubscribe(key);
      }
    });
  }

  /**
   * Unsubscribes all active listeners (e.g. on Logout or Session reset).
   */
  public unsubscribeAll(): void {
    const count = this.activeListeners.size;
    this.activeListeners.forEach((entry, key) => {
      try {
        entry.unsubscribeFn();
      } catch (err) {
        console.warn(`[RealtimeHub] Error disposing listener '${key}':`, err);
      }
    });
    this.activeListeners.clear();
    console.log(`[RealtimeHub] 🧹 Cleaned up all ${count} active listeners.`);
  }

  /**
   * Backward compatibility alias
   */
  public cleanup(): void {
    this.unsubscribeAll();
  }

  /**
   * Destroys the hub completely.
   */
  public destroy(): void {
    this.unsubscribeAll();
    this.isDestroyed = true;
  }

  /**
   * Active listener count
   */
  public get activeCount(): number {
    return this.activeListeners.size;
  }

  /**
   * Returns list of active listener keys
   */
  public get activeKeys(): string[] {
    return Array.from(this.activeListeners.keys());
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public getActiveKeys(): string[] {
    return this.activeKeys;
  }

  public has(key: string): boolean {
    return this.activeListeners.has(key);
  }

  /**
   * Debug print out for system diagnostics & developer console inspection.
   */
  public debugPrint(): void {
    console.group('🔍 RealtimeHub Active Subscriptions');
    console.log(`Total Active: ${this.activeListeners.size}`);
    this.activeListeners.forEach((entry, key) => {
      const ageSec = Math.round((Date.now() - entry.subscribedAt) / 1000);
      console.log(
        `  • [${entry.contract.ownerDomain}] ${key} -> ${entry.contract.repository} (Tenant: ${entry.tenantId || 'global'}, Uptime: ${ageSec}s)`
      );
    });
    console.groupEnd();
  }
}

export const realtimeHub = RealtimeHub.getInstance();
