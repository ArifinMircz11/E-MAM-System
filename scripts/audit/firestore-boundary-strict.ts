import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src');
const REPORT = path.resolve('firestore-boundary-strict-report.json');

const forbiddenImports = [
  'firebase/firestore',
  'firebase/app',
];

const forbiddenPatterns = [
  /\bgetFirestore\s*\(/,
  /\bcollection\s*\(/,
  /\bdoc\s*\(/,
  /\bgetDoc\s*\(/,
  /\bgetDocs\s*\(/,
  /\bonSnapshot\s*\(/,
  /\baddDoc\s*\(/,
  /\bsetDoc\s*\(/,
  /\bupdateDoc\s*\(/,
  /\bdeleteDoc\s*\(/,
  /\bwriteBatch\s*\(/,
  /\brunTransaction\s*\(/,
];

const allowedSegments = [
  `${path.sep}sync${path.sep}`,
  `${path.sep}database${path.sep}`,
  `${path.sep}repositories${path.sep}`,
];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const findings: Array<{
  file: string;
  line: number;
  rule: string;
  text: string;
  allowedLayer: boolean;
}> = [];

for (const file of walk(ROOT)) {
  const relative = path.relative(process.cwd(), file).replaceAll(path.sep, '/');
  const allowedLayer = allowedSegments.some((segment) => file.includes(segment));
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

  lines.forEach((text, index) => {
    for (const imp of forbiddenImports) {
      if (text.includes(imp)) {
        findings.push({ file: relative, line: index + 1, rule: `FORBIDDEN_IMPORT:${imp}`, text: text.trim(), allowedLayer });
      }
    }

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(text)) {
        findings.push({ file: relative, line: index + 1, rule: `FIRESTORE_API:${pattern.source}`, text: text.trim(), allowedLayer });
      }
    }
  });
}

const violations = findings.filter((item) => !item.allowedLayer);
const report = {
  generatedAt: new Date().toISOString(),
  root: 'src',
  policy: 'UI/feature code must not access Firestore directly. Cloud access belongs behind Repository/Sync boundary.',
  totalFindings: findings.length,
  violations: violations.length,
  passed: violations.length === 0,
  findings,
};

fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));

console.log('=== E-MAM STRICT FIRESTORE BOUNDARY AUDIT ===');
console.log(`Findings: ${findings.length}`);
console.log(`Violations outside allowed data/sync layers: ${violations.length}`);
console.log(`Report: ${path.relative(process.cwd(), REPORT)}`);

if (violations.length > 0) {
  for (const item of violations) {
    console.log(`❌ ${item.file}:${item.line} — ${item.rule}`);
  }
  process.exitCode = 1;
} else {
  console.log('✅ FIRESTORE BOUNDARY PASS');
}
