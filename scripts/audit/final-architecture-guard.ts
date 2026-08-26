import fs from 'node:fs';
import path from 'node:path';

/** e-MAM FINAL ARCHITECTURE GUARD — fail closed on forbidden layer dependencies. */
const SRC = path.resolve('src');
const REPORT = path.resolve('final-architecture-report.json');

const rules = [
  ['UI-NO-FIRESTORE', ['components','pages','views','hooks'], [/firebase\/firestore/, /getFirestore\s*\(/, /getDocs?\s*\(/, /onSnapshot\s*\(/, /setDoc\s*\(/, /updateDoc\s*\(/, /deleteDoc\s*\(/, /addDoc\s*\(/, /writeBatch\s*\(/, /runTransaction\s*\(/]],
  ['UI-NO-DEXIE', ['components','pages','views','hooks'], [/from ['"][^'"]*dexie/, /new\s+Dexie\s*\(/, /\bdb\.[A-Za-z_$][\w$]*\./]],
  ['UI-NO-SYNCENGINE', ['components','pages','views'], [/\bSyncEngine\b/, /\bsyncEngine\./]],
  ['SERVICE-NO-FIRESTORE', ['services','usecases','use-cases'], [/firebase\/firestore/, /getFirestore\s*\(/, /getDocs?\s*\(/, /onSnapshot\s*\(/, /setDoc\s*\(/, /updateDoc\s*\(/, /deleteDoc\s*\(/, /addDoc\s*\(/, /writeBatch\s*\(/, /runTransaction\s*\(/]],
  ['SERVICE-NO-DEXIE', ['services','usecases','use-cases'], [/from ['"][^'"]*dexie/, /new\s+Dexie\s*\(/, /\bdb\.[A-Za-z_$][\w$]*\./]],
  ['STORE-NO-CLOUD', ['stores','store'], [/firebase\/firestore/, /firebase\/auth/, /getFirestore\s*\(/, /getDocs?\s*\(/, /setDoc\s*\(/, /updateDoc\s*\(/, /deleteDoc\s*\(/, /addDoc\s*\(/, /onSnapshot\s*\(/]],
  ['REPO-NO-FIREBASE-AUTH', ['repositories','repository'], [/firebase\/auth/, /getAuth\s*\(/, /\bsignIn/, /\bsignOut/]],
] as const;

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules','.git','dist'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    entry.isDirectory() ? walk(full, out) : /\.(ts|tsx)$/.test(entry.name) && out.push(full);
  }
  return out;
}

const findings: Array<{rule:string;file:string;line:number;text:string}> = [];
for (const file of walk(SRC)) {
  const normalized = file.replaceAll(path.sep, '/');
  const relative = path.relative(process.cwd(), file).replaceAll(path.sep, '/');
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const [id, dirs, patterns] of rules) {
    if (!dirs.some((dir) => normalized.includes(`/src/${dir}/`) || normalized.endsWith(`/src/${dir}`))) continue;
    lines.forEach((text, i) => {
      if (patterns.some((pattern) => pattern.test(text))) findings.push({ rule:id, file:relative, line:i+1, text:text.trim() });
    });
  }
}

const report = { generatedAt:new Date().toISOString(), target:'UI → Zustand → Service/Use Case → Repository → Dexie → SyncQueue → SyncEngine → Firestore', passed:findings.length===0, violations:findings.length, findings };
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log(`Final architecture guard: ${findings.length===0 ? 'PASS' : 'FAIL'}`);
for (const f of findings) console.log(`❌ [${f.rule}] ${f.file}:${f.line}`);
if (findings.length) process.exitCode=1;
