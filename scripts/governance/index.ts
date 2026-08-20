#!/usr/bin/env ts-node
/**
 * @license
 * e-Mam System - Governance Entry Point
 * LAYER: SCRIPTS / GOVERNANCE
 */

import { GovernanceRunner } from './runner';

async function main() {
  try {
    const runner = new GovernanceRunner();
    await runner.executeAudit();
  } catch (err: any) {
    console.error('[Governance] Fatal error occurred during governance execution:', err);
    process.exit(1);
  }
}

main();
