import { runStructureAudit } from './structure.js';
import { runFeaturesAudit } from './features.js';
import { runUnusedAudit } from './unused.js';

function runMainAuditSuite() {
  console.log('=== 🛡️ IMAM SYSTEM ENTERPRISE ARCHITECTURE AUDIT SUITE ===\n');

  const structIssues = runStructureAudit();
  console.log('--------------------------------------------------');
  const featureIssues = runFeaturesAudit();
  console.log('--------------------------------------------------');
  const unusedIssues = runUnusedAudit();

  console.log('\n==================================================');
  const total = structIssues + featureIssues + unusedIssues;
  if (total === 0) {
    console.log('🎉 ALL AUDITS PASSED PERFECTLY! Architecture is Enterprise Grade & Compliant.');
  } else {
    console.log(`⚠️ AUDIT SUITE COMPLETE with ${total} overall findings/recommendations.`);
  }
}

runMainAuditSuite();
