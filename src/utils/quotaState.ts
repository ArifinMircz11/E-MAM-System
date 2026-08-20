// src/utils/quotaState.ts

export class QuotaState {
  public static quotaExhaustedUntil: number = 0;

  public static isQuotaExhausted(): boolean {
    return QuotaState.quotaExhaustedUntil > Date.now();
  }

  public static markExhausted() {
    QuotaState.quotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
    console.warn('⚠️ [Firestore] Quota exhausted (resource-exhausted). Entering offline cache mode (15m cooldown).');
  }
}
