export interface QuotaStateSnapshot {
  isQuotaExceeded: boolean;
}

let quotaExceeded = false;

export const QuotaState = {
  isQuotaExhausted(): boolean {
    return quotaExceeded;
  },

  markExhausted(): void {
    quotaExceeded = true;
  },

  reset(): void {
    quotaExceeded = false;
  },

  snapshot(): QuotaStateSnapshot {
    return { isQuotaExceeded: quotaExceeded };
  },
};

// Backward-compatible read-only facade for legacy consumers.
export const quotaState = {
  get isQuotaExceeded(): boolean {
    return QuotaState.isQuotaExhausted();
  },
  checkQuota: (): boolean => !QuotaState.isQuotaExhausted(),
};
