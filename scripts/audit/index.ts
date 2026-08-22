import { runStructureAudit } from './structure.js';
import { runFeaturesAudit } from './features.js';
import { runUnusedAudit } from './unused.js';
import { runGovernanceAudit } from './governance.js';
import { runFoundationAudit } from './foundation.js';
import { runScriptIntegrityAudit } from './script-integrity.js';

function runMainAuditSuite() {
  console.log('=== 🛡️ E-MAM SYSTEM FOUNDATION & ENTERPRISE AUDIT SUITE ===\n');

  const governanceIssues = runGovernanceAudit();
  console.log('--------------------------------------------------');
  const scriptIntegrityIssues = runScriptIntegrityAudit();
  console.log('--------------------------------------------------');
  const foundationIssues = runFoundationAudit();
  console.log('--------------------------------------------------');
  const structIssues = runStructureAudit();
  console.log('--------------------------------------------------');
  const featureIssues = runFeaturesAudit();
  console.log('--------------------------------------------------');
  const unusedIssues = runUnusedAudit();

  console.log('\n==================================================');
  const total = governanceIssues + scriptIntegrityIssues + foundationIssues + structIssues + featureIssues + unusedIssues;
  if (total === 0) {
    console.log('🎉 ALL REGISTERED AUDITS PASSED.');
  } else {
    console.log(`🛑 AUDIT SUITE FAILED with ${total} finding(s).`);
    console.log('No architecture GREEN claim is permitted while findings remain.');
  }

  process.exitCode = total === 0 ? 0 : 1;
}

runMainAuditSuite();
