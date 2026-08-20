export interface MigrationBackupMetadata {
  migrationId: string;
  startedAt: string;
  completedAt?: string;
  backupPoint: string;
  rollbackAvailable: boolean;
  status: 'PENDING' | 'COMMITTED' | 'ROLLED_BACK';
  error?: string;
}

class MigrationGuardManager {
  private activeBackup: MigrationBackupMetadata | null = null;
  private history: MigrationBackupMetadata[] = [];

  public startMigration(migrationId: string): MigrationBackupMetadata {
    const backupId = `backup-${migrationId}-${Date.now()}`;
    this.activeBackup = {
      migrationId,
      startedAt: new Date().toISOString(),
      backupPoint: backupId,
      rollbackAvailable: true,
      status: 'PENDING'
    };
    console.log(`[MIGRATION_GUARD] Started migration '${migrationId}'. Backup point created: ${backupId}`);
    return this.activeBackup;
  }

  public commitMigration(): void {
    if (!this.activeBackup) {
      throw new Error('MIGRATION_GUARD_ERROR: No active migration to commit.');
    }
    this.activeBackup.completedAt = new Date().toISOString();
    this.activeBackup.status = 'COMMITTED';
    this.history.push(this.activeBackup);
    console.log(`[MIGRATION_GUARD] Migration '${this.activeBackup.migrationId}' successfully committed.`);
    this.activeBackup = null;
  }

  public rollbackMigration(reason: string): void {
    if (!this.activeBackup) {
      throw new Error('MIGRATION_GUARD_ERROR: No active migration to rollback.');
    }
    this.activeBackup.completedAt = new Date().toISOString();
    this.activeBackup.status = 'ROLLED_BACK';
    this.activeBackup.error = reason;
    this.history.push(this.activeBackup);
    console.warn(`[MIGRATION_GUARD] Rolled back migration '${this.activeBackup.migrationId}' due to: ${reason}`);
    this.activeBackup = null;
  }

  public getHistory(): MigrationBackupMetadata[] {
    return [...this.history];
  }
}

export const migrationGuard = new MigrationGuardManager();
