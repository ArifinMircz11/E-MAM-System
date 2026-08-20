// src/core/realtime/RealtimeLifecycle.ts
// Realtime Lifecycle Manager for e-MAM System V7.7

import { realtimeHub } from './RealtimeHub';
import { RealtimeRegistry } from './RealtimeRegistry';
import { RealtimeContextResolver } from './RealtimeContextResolver';
import { RealtimeScope } from './RealtimeScope';
import { RealtimeContext, RealtimeLifecycleTrigger } from './RealtimeSubscription';
import { SecurityContextService } from '@/core/security/SecurityContextService';

export class RealtimeLifecycleManager {
  private static instance: RealtimeLifecycleManager;
  private currentContext: RealtimeContext = RealtimeContextResolver.resolveContext();
  private isInitialized = false;

  public static getInstance(): RealtimeLifecycleManager {
    if (!RealtimeLifecycleManager.instance) {
      RealtimeLifecycleManager.instance = new RealtimeLifecycleManager();
    }
    return RealtimeLifecycleManager.instance;
  }

  /**
   * Initializes the lifecycle manager to observe context changes.
   */
  public initialize(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('[RealtimeLifecycle] 🚀 Initializing Realtime Lifecycle Manager...');

    SecurityContextService.subscribe((state) => {
      if (state === 'READY' && SecurityContextService.isReady()) {
        this.handleTrigger('ON_SECURITY_CONTEXT_READY');
      } else if (state === 'SIGNED_OUT') {
        this.handleTrigger('ON_LOGOUT');
      } else if (state === 'ERROR') {
        realtimeHub.unsubscribeAll();
      }
    });

    if (SecurityContextService.isReady()) {
      this.syncContextAndSubscriptions('ON_SECURITY_CONTEXT_READY');
    }
  }

  /**
   * Handles lifecycle trigger events deterministically.
   */
  public handleTrigger(trigger: RealtimeLifecycleTrigger, updatedContext?: Partial<RealtimeContext>): void {
    const previousContext = { ...this.currentContext };
    this.currentContext = {
      ...RealtimeContextResolver.resolveContext(),
      ...updatedContext,
    };

    console.log(`[RealtimeLifecycle] ⚡ Event Triggered: ${trigger}`);

    switch (trigger) {
      case 'ON_LOGOUT':
        realtimeHub.unsubscribeAll();
        break;

      case 'ON_TENANT_CHANGE':
        if (previousContext.tenantId) {
          realtimeHub.unsubscribeTenant(previousContext.tenantId);
        }
        this.syncContextAndSubscriptions(trigger);
        break;

      case 'ON_IMPERSONATION_CHANGE':
        realtimeHub.unsubscribeAll();
        this.syncContextAndSubscriptions(trigger);
        break;

      case 'ON_LOGIN':
      case 'ON_SECURITY_CONTEXT_READY':
      case 'ON_ONLINE':
      case 'ON_WINDOW_FOCUS':
        this.syncContextAndSubscriptions(trigger);
        break;

      case 'ON_OFFLINE':
      case 'ON_WINDOW_BLUR':
        // Custom background strategy if needed
        break;
    }
  }

  /**
   * Synchronizes active subscriptions against RealtimeRegistry contracts.
   */
  private syncContextAndSubscriptions(trigger: RealtimeLifecycleTrigger): void {
    if (!SecurityContextService.isReady()) {
      console.log('[RealtimeLifecycle] SecurityContext not READY. Postponing subscription synchronization.');
      return;
    }

    const context = this.currentContext;
    if (!context.userId || !context.isOnline) {
      return;
    }

    const contracts = RealtimeRegistry.getAllContracts();

    contracts.forEach((contract) => {
      const isAllowed = RealtimeScope.isContractAllowedForContext(contract, context);
      const isAlreadyActive = realtimeHub.has(contract.key);

      if (isAllowed && contract.onTriggers.includes(trigger)) {
        if (!isAlreadyActive) {
          console.log(`[RealtimeLifecycle] 📡 Contract matched for key '${contract.key}' on trigger '${trigger}'`);
          // Realtime listener activations are delegated through dedicated Domain Services
        }
      } else if (!isAllowed && isAlreadyActive) {
        if (contract.offTriggers.includes(trigger) || !isAllowed) {
          console.log(`[RealtimeLifecycle] 🔕 Contract contract deactivated for key '${contract.key}' on trigger '${trigger}'`);
          realtimeHub.unsubscribe(contract.key);
        }
      }
    });
  }

  public getCurrentContext(): RealtimeContext {
    return this.currentContext;
  }
}

export const realtimeLifecycle = RealtimeLifecycleManager.getInstance();
