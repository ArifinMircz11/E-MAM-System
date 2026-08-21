import { runStructureAudit } from './structure.js';
import { runFeaturesAudit } from './features.js';
import { runUnusedAudit } from './unused.js';

function runMainAuditSuite() {
  console.log('=== 🛡️ E-MAM ENTERPRISE REPOSITORY AUDIT SUITE ===\n');

  const structIssues = runStructureAudit();
  console.log('--------------------------------------------------');
  const featureIssues = runFeaturesAudit();
  console.log('--------------------------------------------------');
  const unusedIssues = runUnusedAudit();

  const total = structIssues + featureIssues + unusedIssues;
  console.log('\n==================================================');

  if (total === 0) {
    console.log('✅ AUDIT PASSED: no findings from the repository audit suite.');
    return 0;
  }

  console.log(`⚠️ AUDIT FAILED: ${total} finding(s)/recommendation(s) require review.`);
  return 1;
}

process.exitCode = runMainAuditSuite();
