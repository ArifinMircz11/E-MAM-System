/**
 * @license
 * e-Mam System - ESAF CLI Execution Script
 */

import { ESAFEngine } from '../src/esaf/engine/ESAFEngine';

async function main() {
  const engine = new ESAFEngine();
  const report = await engine.runAudit();
  if (!report.passed) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[ESAF CLI] Fatal error during audit execution:', err);
  process.exit(1);
});
