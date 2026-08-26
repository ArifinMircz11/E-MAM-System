import { spawnSync } from 'node:child_process';

const dryRun = process.argv.includes('--dry-run');
const fixArgs = dryRun ? ['tsx', 'scripts/fix/auth-flow-autofix.ts', '--dry-run'] : ['tsx', 'scripts/fix/auth-flow-autofix.ts'];
const auditArgs = ['tsx', 'scripts/audit/auth-flow-guard.ts'];

console.log(`=== e-MAM AUTH AUDIT + ${dryRun ? 'DRY-RUN' : 'SAFE AUTO-FIX'} ===`);

const fix = spawnSync('npx', fixArgs, { stdio: 'inherit', shell: true });
if (fix.status !== 0) process.exit(fix.status ?? 1);

const audit = spawnSync('npx', auditArgs, { stdio: 'inherit', shell: true });
process.exit(audit.status ?? 1);
