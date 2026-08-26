import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src');
const REPORT = path.resolve('firestore-boundary-strict-report.json');

const forbiddenImports = ['firebase/firestore', 'firebase/app', '@firebase/firestore'];
const forbiddenPatterns = [
  /\bgetFirestore\s*\(/, /\bcollection\s*\(/, /\bdoc\s*\(/, /\bgetDoc\s*\(/,
  /\bgetDocs\s*\(/, /\bonSnapshot\s*\(/, /\baddDoc\s*\(/, /\bsetDoc\s*\(/,
  /\bupdateDoc\s*\(/, /\bdeleteDoc\s*\(/, /\bwriteBatch\s*\(/, /\brunTransaction\s*\(/,
];

// Cloud access is allowed ONLY in the canonical sync corridor.
const allowedFiles = new Set([
  'src/services/gateways/FirestoreGateway.ts',
  'src/services/sync/FirestoreSyncDataSource.ts',
  'src/core/offline/FirestoreSyncDataSource.ts',
]);

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const findings: Array<{ file: string; line: number; rule: string; text: string; allowed: boolean }> = [];

for (const file of walk(ROOT)) {
  const relative = path.relative(process.cwd(), file).replaceAll(path.sep, '/');
  const allowed = allowedFiles.has(relative);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((text, index) => {
    for (const imp of forbiddenImports) {
      if (text.includes(imp)) findings.push({ file: relative, line: index + 1, rule: `FORBIDDEN_IMPORT:${imp}`, text: text.trim(), allowed });
    }
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(text)) findings.push({ file: relative, line: index + 1, rule: `FIRESTORE_API:${pattern.source}`, text: text.trim(), allowed });
    }
  });
}

const violations = findings.filter((item) => !item.allowed);
const report = {
  generatedAt: new Date().toISOString(),
  policy: 'Firestore SDK access is restricted to the canonical cloud sync corridor. Repositories and application services must not access Firestore directly.',
  allowedFiles: [...allowedFiles],
  totalFindings: findings.length,
  violations: violations.length,
  passed: violations.length === 0,
  findings,
};
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log(`Strict Firestore boundary: ${violations.length === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Violations: ${violations.length}`);
for (const item of violations) console.log(`❌ ${item.file}:${item.line} — ${item.rule}`);
if (violations.length > 0) process.exitCode = 1;
