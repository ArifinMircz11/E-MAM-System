/**
 * @license
 * e-Mam System - Tenant-Aware Sync Guard
 * LAYER: CORE SYNC LAYER
 */

export interface SyncGuardState {
  tenantId: string;
  lastPullAt: number;
  lastPushAt: number;
  running: boolean;
  nextAllowedPull: number;
}

export class SyncGuard {
  private states: Map<string, SyncGuardState> = new Map();
  private readonly MIN_PULL_INTERVAL = 60000; // 60 seconds

  private getState(tenantId: string): SyncGuardState {
    let state = this.states.get(tenantId);
    if (!state) {
      state = {
        tenantId,
        lastPullAt: 0,
        lastPushAt: 0,
        running: false,
        nextAllowedPull: 0,
      };
      this.states.set(tenantId, state);
    }
    return state;
  }

  canPull(tenantId: string): { allowed: boolean; remainingMs: number } {
    const state = this.getState(tenantId);
    const now = Date.now();
    if (state.running) {
      return { allowed: false, remainingMs: 0 };
    }
    if (now < state.nextAllowedPull) {
      return { allowed: false, remainingMs: state.nextAllowedPull - now };
    }
    return { allowed: true, remainingMs: 0 };
  }

  startPull(tenantId: string): void {
    const state = this.getState(tenantId);
    state.running = true;
    state.lastPullAt = Date.now();
  }

  endPull(tenantId: string): void {
    const state = this.getState(tenantId);
    state.running = false;
    state.nextAllowedPull = Date.now() + this.MIN_PULL_INTERVAL;
  }

  recordPush(tenantId: string): void {
    const state = this.getState(tenantId);
    state.lastPushAt = Date.now();
    // Push has no cooldown (immediate priority)
  }

  isRunning(tenantId: string): boolean {
    return this.getState(tenantId).running;
  }
}

export const syncGuard = new SyncGuard();
