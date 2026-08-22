import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const SRC = path.join(ROOT, 'src');

const RULES = [
  {
    id: 'FND-001',
    name: 'UI/Hook/Component → Service only',
    roots: ['src/components', 'src/features', 'src/hooks'],
    forbidden: [
      /from\s+["']firebase\/(?:firestore|app|auth)["']/,
      /from\s+["']@firebase\//,
      /from\s+["']dexie["']/,
      /from\s+["']@\/.*(?:database\/dexie|repositories|syncQueue|SyncEngine)["']/i,
    ],
  },
  {
    id: 'FND-002',
    name: 'Domain/Types are infrastructure-free',
    roots: ['src/domain', 'src/types'],
    forbidden: [
      /from\s+["']react["']/,
      /from\s+["']zustand["']/,
      /from\s+["']dexie["']/,
      /from\s+["']firebase\//,
      /from\s+["']@firebase\//,
    ],
  },
  {
    id: 'FND-003',
    name: 'Application Services do not bypass Repository for operational DB access',
    roots: ['src/services'],
    forbidden: [
      /from\s+["']dexie["']/,
      /from\s+["']@\/core\/database\/dexie["']/,
      /from\s+["']@\/database\/dexie["']/,
    ],
  },
  {
    id: 'FND-004',
    name: 'Repositories never access Firestore directly',
    roots: ['src/repositories'],
    forbidden: [
      /from\s+["']firebase\/firestore["']/,
      /from\s+["']@firebase\/firestore["']/,
      /import\(\s*["']firebase\/firestore["']\s*\)/,
    ],
  },
  {
    id: 'FND-005',
    name: 'Services do not import Firebase SDK directly; SyncEngine is the cloud corridor',
    roots: ['src/services'],
    forbidden: [
      /from\s+["']\.\/firebase["']/,
      /from\s+["']@\/services\/firebase["']/,
      /from\s+["']firebase\//,
      /from\s+["']@firebase\//,
    ],
    allow: ['src/services/SyncEngine.ts'],
  },
];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function rel(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function isAllowed(file: string, allow: string[] = []): boolean {
  const r = rel(file);
  return allow.some((item) => r === item || r.startsWith(`${item}/`));
}

export function runFoundationAudit(): number {
  console.log('🔐 [Audit Foundation] Strict architecture boundary audit...');
  let findings = 0;

  if (!fs.existsSync(SRC)) {
    console.error('❌ [Audit Foundation] src directory not found.');
    return 1;
  }

  for (const rule of RULES) {
    const files = rule.roots.flatMap((root) => walk(path.join(ROOT, root)));
    for (const file of files) {
      if (isAllowed(file, rule.allow)) continue;
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of rule.forbidden) {
        if (pattern.test(content)) {
          console.log(`❌ [${rule.id}] ${rule.name}: ${rel(file)}`);
          findings++;
          break;
        }
      }
    }
  }

  console.log(`🔎 [Audit Foundation] ${findings} strict boundary finding(s).`);
  if (findings === 0) console.log('✅ [Audit Foundation] Foundation boundaries PASS.');
  else console.log('🛑 [Audit Foundation] Foundation is NOT GREEN; remediation required.');
  return findings;
}

if (process.argv[1]?.endsWith('foundation.ts')) {
  process.exitCode = runFoundationAudit() === 0 ? 0 : 1;
}
