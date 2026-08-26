import fs from 'node:fs';
import path from 'node:path';

/**
 * e-MAM FINAL ARCHITECTURE GUARD
 *
 * Enforces the target architecture mechanically. This is a guard, not a codemod:
 * it never rewrites application code automatically.
 *
 * Target:
 * UI → Zustand → Service/Use Case → Repository → Dexie → SyncQueue → SyncEngine → Firestore
 */

const SRC = path.resolve('src');
const REPORT = path.resolve('final-architecture-report.json');

const rules = [
  {
    id: 'UI-NO-FIRESTORE',
    description: 'Presentation/UI code must not import or call Firestore SDK.',
    dirs: ['components', 'pages', 'views', 'hooks'],
    patterns: [/firebase\/firestore/, /getFirestore\s*\(/, /getDocs?\s*\(/, /onSnapshot\s*\(/, /setDoc\s*\(/, /updateDoc\s*\(/, /deleteDoc\s*\(/, /addDoc\s*\(/, /writeBatch\s*\(/, /runTransaction\s*\(/],
  },
  {
    id: 'UI-NO-DEXIE',
    description: 'Presentation/UI code must not import or call Dexie/database directly.',
    dirs: ['components', 'pages', 'views', 'hooks'],
    patterns: [/from ['"][^'"]*dexie/, /\bnew\s+Dexie\s*\(/, /\bdb\.[A-Za-z_$][\w$]*\./],
  },
  {
    id: 'UI-NO-SYNCENGINE',
    description: 'UI must not orchestrate SyncEngine directly.',
    dirs: ['components', 'pages', 'views'],
    patterns: [/SyncEngine/, /syncEngine\./],
  },
  {
    id: 'SERVICE-NO-FIRESTORE',
    description: 'Service/use-case layer must not access Firestore SDK directly.',
    dirs: ['services', 'usecases', 'use-cases'],
    patterns: [/firebase\/firestore/, /getFirestore\s*\(/, /getDocs?\s*\(/, /onSnapshot\s*\(/, /setDoc\s*\(/, /updateDoc\s*\(/, /deleteDoc\s*\(/, /addDoc\s*\(/, /writeBatch\s*\(/, /runTransaction\s*\(/],
  },
  {
    id: 'SERVICE-NO-DEXIE',
    description: 'Service/use-case layer must use Repository instead of Dexie directly.',
    dirs: ['services', 'usecases', 'use-cases'],
    patterns: [/from ['"][^'"]*dexie/, /\bnew\s+Dexie\s*\(/, /\bdb\.[A-Za-z_$][\w$]*\./],
  },
  {
    id: 'STORE-NO-CLOUD',
    description: 'Zustand stores must not access Firestore/Firebase directly.',
    dirs: ['stores', 'store'],
    patterns: [/firebase\/firestore/, /firebase\/auth/, /getFirestore\s*\(/, /getDocs?\s*\(/, /setDoc\s*\(/, /updateDoc\s*\(/, /deleteDoc\s*\(/, /addDoc\s*\(/, /onSnapshot\s*\(/],
  },
  {
    id: 'REPO-NO-FIREBASE-AUTH',
    description: 'Repositories must not own authentication/session concerns.',
    dirs: ['repositories', 'repository'],
    patterns: [/firebase\/auth/, /getAuth\s*\(/, /signIn/, /signOut/],
  },
];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

function matchesRule(file: string, rule: (typeof rules)[number]): boolean {
  const normalized = file.replaceAll(path.sep, '/');
  return rule.dirs.some((dir) => normalized.includes(`/src/${dir}/`) || normalized.includes(`/src/${dir}`));
}

const findings: Array<{ rule: string; file: string; line: number; text: string }> = [];

for (const file of walk(SRC)) {
  const normalized = file.replaceAll(path.sep, '/');
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

  for (const rule of rules) {
    if (!matchesRule(file, rule)) continue;
    lines.forEach((text, index) => {
      if (rule.patterns.some((pattern) => pattern.test(text))) {
        findings.push({ rule: rule.id, file: normalized.replace(process.cwd().replaceAll(path.sep, '/') + '/', ''), line: index + 1, text: text.trim() });
      }
    });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  target: 'UI → Zustand → Service/Use Case → Repository → Dexie → SyncQueue → SyncEngine → Firestore',
  passed: findings.length === 0,
  violations: findings.length,
  findings,
};

fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log(`Final architecture guard: ${findings.length === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Violations: ${findings.length}`);
console.log(`Report: ${path.basename(REPORT)}`);

for (const finding of findings) {
  console.log(`❌ [${finding.rule}] ${finding.file}:${finding.line}`);
}

if (findings.length > 0) process.exitCode = 1;
