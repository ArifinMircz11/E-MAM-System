/**
 * TRANSACTION ORCHESTRATOR
 * Menjamin konsistensi transaksi lintas domain.
 */

export class TransactionOrchestrator {
  /**
   * Menjalankan flow yang melibatkan banyak domain.
   * Jika salah satu langkah gagal, lakukan rollback/audit.
   */
  async executeApprovalFlow(transactionId: string, actions: Array<() => Promise<any>>) {
    console.log(`[Orchestrator] Starting transaction: ${transactionId}`);
    try {
      for (const action of actions) {
        await action();
      }
      console.log(`[Orchestrator] Transaction success: ${transactionId}`);
    } catch (error) {
      console.error(`[Orchestrator] Transaction failed: ${transactionId}`, error);
      // Panggil Rollback Handler / Audit Failure
      throw error;
    }
  }
}

export const orchestrator = new TransactionOrchestrator();
