import { execFileSync } from 'node:child_process';

/** e-MAM production gate: fail closed when a mandatory architecture guard fails. */
const checks = [
  ['Foundation boundary', 'scripts/audit/foundation.ts'],
  ['Final architecture guard', 'scripts/audit/final-architecture-guard.ts'],
  ['Strict Firestore boundary', 'scripts/audit/firestore-boundary-strict.ts'],
  ['Auth flow guard', 'scripts/audit/auth-flow-guard.ts'],
  ['Final target checklist', 'scripts/audit/final-target-checklist.ts'],
] as const;

let failed = 0;
console.log('=== E-MAM PRODUCTION GATE ===');
for (const [name, script] of checks) {
  try {
    execFileSync('npx', ['tsx', script], { stdio: 'inherit', cwd: process.cwd() });
    console.log(`PASS ${name}`);
  } catch {
    failed++;
    console.error(`FAIL ${name}`);
  }
}

console.log(`Production Gate: ${failed === 0 ? 'PASS / GREEN' : 'FAIL / BLOCKED'}`);
if (failed > 0) process.exitCode = 1;
