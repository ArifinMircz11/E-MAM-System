import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const reportPath = path.resolve('final-target-checklist.json');

function existsAny(paths: string[]): boolean {
  return paths.some((relative) => fs.existsSync(path.resolve(relative)));
}

const checks = [
  ['src exists', fs.existsSync(root)],
  ['repository layer exists', existsAny(['src/repositories', 'src/repository'])],
  ['service/use-case layer exists', existsAny(['src/services', 'src/usecases', 'src/use-cases'])],
  ['Zustand store layer exists', existsAny(['src/stores', 'src/store'])],
  ['sync engine/corridor exists', existsAny(['src/sync', 'src/core/sync', 'src/core/offline', 'src/services/sync', 'src/services/SyncEngine.ts'])],
  ['database/Dexie layer exists', existsAny(['src/database', 'src/db', 'src/core/database'])],
  ['audit scripts exist', fs.existsSync(path.resolve('scripts/audit'))],
  ['final architecture contract exists', fs.existsSync(path.resolve('docs/architecture/FINAL-TARGET-GUARD.md'))],
  ['Firestore boundary manifest exists', existsAny(['docs/audit/FIRESTORE_BOUNDARY_MIGRATION_MANIFEST.md', 'docs/architecture/FIRESTORE_BOUNDARY_MIGRATION_PLAN.md'])],
  ['production gate exists', fs.existsSync(path.resolve('scripts/audit/production-gate.ts'))],
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
