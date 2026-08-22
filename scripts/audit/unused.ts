import { spawnSync } from 'node:child_process';

export function runUnusedAudit(): number {
  console.log('🔍 [Audit Unused] Running Knip for real unused/orphan detection...');

  const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(executable, ['knip', '--no-progress'], {
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    console.error(`❌ [Audit Unused] Could not execute Knip: ${result.error.message}`);
    return 1;
  }

  const code = result.status ?? 1;
  if (code === 0) {
    console.log('✅ [Audit Unused] Knip reports no blocking unused exports/files.');
  } else {
    console.log(`❌ [Audit Unused] Knip exited with status ${code}.`);
  }

  return code;
}

if (process.argv[1]?.endsWith('unused.ts')) {
  process.exitCode = runUnusedAudit();
}
