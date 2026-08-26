import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const reportPath = path.resolve('final-target-checklist.json');

const checks = [
  ['src exists', fs.existsSync(root)],
  ['repository layer exists', fs.existsSync(path.join(root, 'repositories')) || fs.existsSync(path.join(root, 'repository'))],
  ['service/use-case layer exists', ['services', 'usecases', 'use-cases'].some((d) => fs.existsSync(path.join(root, d)))],
  ['store layer exists', fs.existsSync(path.join(root, 'stores')) || fs.existsSync(path.join(root, 'store'))],
  ['sync layer exists', fs.existsSync(path.join(root, 'sync'))],
  ['database layer exists', fs.existsSync(path.join(root, 'database')) || fs.existsSync(path.join(root, 'db'))],
  ['audit scripts exist', fs.existsSync(path.resolve('scripts/audit'))],
  ['final architecture contract exists', fs.existsSync(path.resolve('docs/architecture/FINAL-TARGET-GUARD.md'))],
  ['firestore boundary manifest exists', fs.existsSync(path.resolve('docs/audit/FIRESTORE_BOUNDARY_MIGRATION_MANIFEST.md'))],
] as const;

const result = {
  generatedAt: new Date().toISOString(),
  target: 'Offline-First e-MAM: UI → Zustand → Service/Use Case → Repository → Dexie → SyncQueue → SyncEngine → Firestore',
  passed: checks.every(([, ok]) => ok),
  checks: checks.map(([name, ok]) => ({ name, passed: ok })),
};

fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

for (const [name, ok] of checks) console.log(`${ok ? '✅' : '❌'} ${name}`);
console.log(`Report: ${path.basename(reportPath)}`);

if (!result.passed) process.exitCode = 1;
