import fs from 'node:fs';
import path from 'node:path';

/**
 * SAFE AUTH AUTO-FIX
 *
 * Only performs deterministic, low-risk cleanup:
 * - removes exact duplicate import lines
 * - removes exact duplicate blank lines
 * - creates a machine-readable change report
 *
 * It deliberately DOES NOT rewrite Firebase Auth, CanonicalUser,
 * SecurityContext, RBAC, tenant, route guards, or logout logic.
 * Those require semantic migration.
 */

const SRC = path.resolve('src');
const REPORT = path.resolve('auth-flow-autofix-report.json');
const DRY_RUN = process.argv.includes('--dry-run');

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const changes: Array<{ file: string; removed: string[] }> = [];

for (const file of walk(SRC)) {
  const original = fs.readFileSync(file, 'utf8');
  const lines = original.split(/\r?\n/);
  const seenImports = new Set<string>();
  const output: string[] = [];
  const removed: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^import\s/.test(trimmed)) {
      if (seenImports.has(trimmed)) {
        removed.push(`duplicate import: ${trimmed}`);
        continue;
      }
      seenImports.add(trimmed);
    }
    output.push(line);
  }

  const normalized: string[] = [];
  for (const line of output) {
    if (line.trim() === '' && normalized.at(-1)?.trim() === '') continue;
    normalized.push(line);
  }

  const next = normalized.join('\n');
  if (next !== original) {
    const rel = path.relative(process.cwd(), file).replaceAll(path.sep, '/');
    changes.push({ file: rel, removed });
    if (!DRY_RUN) fs.writeFileSync(file, next);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  mode: DRY_RUN ? 'dry-run' : 'write',
  changedFiles: changes.length,
  changes,
  protectedSemanticAreas: [
    'Firebase Auth',
    'CanonicalUser',
    'SecurityContext',
    'RBAC',
    'tenant isolation',
    'route guards',
    'logout lifecycle',
    'role/roles switching',
  ],
};

fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log(`Auth auto-fix mode: ${DRY_RUN ? 'DRY-RUN' : 'WRITE'}`);
console.log(`Changed files: ${changes.length}`);
console.log(`Report: ${path.basename(REPORT)}`);

if (changes.length) {
  for (const change of changes) console.log(`🛠️ ${change.file}`);
}
