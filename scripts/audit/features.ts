import fs from 'node:fs';
import path from 'node:path';

/** Feature audit: Firestore SDK is allowed only in the canonical sync/cloud corridor. */
const SRC = path.resolve('src');
const ALLOWED = new Set([
  'src/services/firebase.ts',
  'src/services/gateways/FirestoreGateway.ts',
  'src/services/SyncEngine.ts',
  'src/services/masterSyncService.ts',
]);
const ALLOWED_PREFIXES = ['src/services/sync/', 'src/services/realtime/', 'src/sync/', 'src/core/sync/'];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    entry.isDirectory() ? walk(full, out) : /\.(ts|tsx)$/.test(entry.name) && out.push(full);
  }
  return out;
}

function isAllowed(relative: string): boolean {
  return ALLOWED.has(relative) || ALLOWED_PREFIXES.some((prefix) => relative.startsWith(prefix));
}

const findings: Array<{ rule: string; file: string; line: number; text: string }> = [];
for (const file of walk(SRC)) {
  const relative = path.relative(process.cwd(), file).replaceAll(path.sep, '/');
  if (isAllowed(relative)) continue;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((text, i) => {
    if (/from\s+['"](?:firebase\/firestore|@firebase\/firestore)['"]/.test(text) || /require\(\s*['"](?:firebase\/firestore|@firebase\/firestore)['"]\s*\)/.test(text)) {
      findings.push({ rule: 'FEATURE-NO-DIRECT-FIRESTORE', file: relative, line: i + 1, text: text.trim() });
    }
  });
}

console.log(`🔍 [Audit Features] Firestore boundary findings: ${findings.length}`);
for (const finding of findings) console.log(`❌ [${finding.rule}] ${finding.file}:${finding.line}`);
const report = { generatedAt: new Date().toISOString(), passed: findings.length === 0, violations: findings.length, findings };
fs.writeFileSync(path.resolve('features-audit-report.json'), JSON.stringify(report, null, 2));
if (findings.length) process.exitCode = 1;
