import { execFileSync } from 'node:child_process';
import path from 'node:path';

/** e-MAM production gate: fail closed when any mandatory guard fails. */
const checks = [
  ['Foundation boundary', 'scripts/audit/foundation.ts'],
  ['Final architecture guard', 'scripts/audit/final-architecture-guard.ts'],
  ['Strict Firestore boundary', 'scripts/audit/firestore-boundary-strict.ts'],
  ['Cloud boundary', 'scripts/audit/cloud-boundary.js'],
  ['Auth flow guard', 'scripts/audit/auth-flow-guard.ts'],
  ['Final target checklist', 'scripts/audit/final-target-checklist.ts'],
] as const;

function run(script: string): void {
  const bin = process.platform === 'win32'
    ? path.resolve('node_modules/.bin/tsx.cmd')
    : path.resolve('node_modules/.bin/tsx');
  execFileSync(bin, [script], { stdio: 'inherit', cwd: process.cwd() });
}

let failed = 0;
console.log('=== E-MAM PRODUCTION GATE ===');
for (const [name, script] of checks) {
  try {
    run(script);
    console.log(`✅ ${name}`);
  } catch {
    failed++;
    console.error(`❌ ${name}`);
  }
}

console.log(`\nProduction Gate: ${failed === 0 ? 'PASS / GREEN' : 'FAIL / BLOCKED'}`);
if (failed > 0) process.exitCode = 1;
