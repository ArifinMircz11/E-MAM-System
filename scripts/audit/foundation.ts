import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const SRC = path.join(ROOT, 'src');

interface Rule {
  id: string;
  name: string;
  roots: string[];
  forbidden: RegExp[];
  allow?: string[];
}

const FIREBASE = [
  /from\s+["']firebase\/(?:firestore|app|auth|storage)["']/,
  /from\s+["']@firebase\//,
  /import\(\s*["']firebase\//,
];

const DEXIE = [
  /from\s+["']dexie["']/,
  /from\s+["']@\/.*(?:database\/dexie|core\/database\/dexie)["']/i,
];

const REPOSITORY = [
  /from\s+["']@\/.*repositories(?:\/|["'])/i,
  /from\s+["']\.\.?\/.*repositories(?:\/|["'])/i,
];

const SYNC = [
  /from\s+["']@\/.*(?:syncQueue|SyncQueue|SyncEngine|services\/sync)(?:\/|["'])/i,
  /from\s+["']\.\.?\/.*(?:syncQueue|SyncQueue|SyncEngine|services\/sync)(?:\/|["'])/i,
];

const RULES: Rule[] = [
  {
    id: 'FND-001',
    name: 'UI/Hook/Component/Page → Service boundary',
    roots: ['src/components', 'src/features', 'src/hooks', 'src/pages', 'src/app'],
    forbidden: [...FIREBASE, ...DEXIE, ...REPOSITORY, ...SYNC],
  },
  {
    id: 'FND-002',
    name: 'Zustand stores → Service boundary',
    roots: ['src/stores', 'src/store'],
    forbidden: [...FIREBASE, ...DEXIE, ...REPOSITORY, ...SYNC],
  },
  {
    id: 'FND-003',
    name: 'Domain/Types are infrastructure-free',
    roots: ['src/domain', 'src/types'],
    forbidden: [
      /from\s+["']react["']/,
      /from\s+["']react-dom["']/,
      /from\s+["']zustand["']/,
      /from\s+["']dexie["']/,
      ...FIREBASE,
    ],
  },
  {
    id: 'FND-004',
    name: 'Application Services do not bypass Repository for operational DB access',
    roots: ['src/services'],
    forbidden: [...DEXIE, ...REPOSITORY],
    allow: ['src/services/SyncEngine.ts', 'src/services/sync', 'src/core/sync', 'src/infrastructure/sync'],
  },
  {
    id: 'FND-005',
    name: 'Application Services do not access Firestore directly',
    roots: ['src/services'],
    forbidden: FIREBASE,
    allow: [
      'src/services/SyncEngine.ts',
      'src/services/sync',
      'src/core/sync',
      'src/infrastructure/sync',
      'src/infrastructure/firestore',
    ],
  },
  {
    id: 'FND-006',
    name: 'Repositories never access Firestore directly',
    roots: ['src/repositories', 'src/core/database', 'src/database'],
    forbidden: FIREBASE,
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
