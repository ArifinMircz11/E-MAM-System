import { runStructureAudit } from './structure.js';
import { runFeaturesAudit } from './features.js';
import { runUnusedAudit } from './unused.js';
import { runGovernanceAudit } from './governance.js';

function runMainAuditSuite() {
  console.log('=== 🛡️ IMAM SYSTEM ENTERPRISE ARCHITECTURE AUDIT SUITE ===\n');

  const governanceIssues = runGovernanceAudit();
  console.log('--------------------------------------------------');
  const structIssues = runStructureAudit();
  console.log('--------------------------------------------------');
  const featureIssues = runFeaturesAudit();
  console.log('--------------------------------------------------');
  const unusedIssues = runUnusedAudit();

  console.log('\n==================================================');
  const total = governanceIssues + structIssues + featureIssues + unusedIssues;
  if (total === 0) {
    console.log('🎉 ALL AUDITS PASSED PERFECTLY! Architecture is Enterprise Grade & Compliant.');
  } else {
    console.log(`⚠️ AUDIT SUITE COMPLETE with ${total} overall findings/recommendations.`);
  }

  process.exitCode = total === 0 ? 0 : 1;
}

runMainAuditSuite();
