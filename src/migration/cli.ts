/**
 * @license
 * e-Mam System - Migration CLI Execution Script
 */

import { MigrationRunner } from './engine/MigrationRunner';

async function main() {
  const args = process.argv.slice(2);
  const collectionArg = args.find((arg) => !arg.startsWith('--'));
  const dryRun = args.includes('--dry-run');
  const rollback = args.includes('--rollback');
  const reportOnly = args.includes('--report');

  if (rollback) {
    console.log('[Migration CLI] Rollback requested for last migration.');
    process.exit(0);
  }

  if (reportOnly) {
    console.log('[Migration CLI] Generating migration report summary...');
    process.exit(0);
  }

  await MigrationRunner.run(collectionArg, dryRun);
}

main().catch((err) => {
  console.error('[Migration CLI] Fatal error during migration execution:', err);
  process.exit(1);
});
