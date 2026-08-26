import fs from 'node:fs';
import path from 'node:path';

/**
 * e-MAM AUTH FLOW GUARD
 * Audits login → identity → security context → RBAC → session → logout.
 * This guard detects suspicious boundary violations; it does not rewrite code.
 */

const SRC = path.resolve('src');
const REPORT = path.resolve('auth-flow-audit-report.json');

const scanDirs = ['components', 'pages', 'views', 'hooks', 'stores', 'services', 'features', 'core', 'app'];
const files: string[] = [];

function walk(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
}

for (const dir of scanDirs) walk(path.join(SRC, dir));

const findings: Array<{ severity: 'ERROR' | 'WARN'; rule: string; file: string; line: number; text: string }> = [];
const hits: Record<string, string[]> = {};

function addHit(key: string, file: string) {
  (hits[key] ??= []).push(file);
}

for (const file of files) {
  const rel = path.relative(process.cwd(), file).replaceAll(path.sep, '/');
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

  lines.forEach((text, i) => {
    const line = i + 1;
    const checks: Array<[string, RegExp, 'ERROR' | 'WARN']> = [
      ['AUTH_FIRESTORE_COUPLING', /firebase\/firestore|getFirestore\s*\(|getDoc\s*\(|getDocs\s*\(|setDoc\s*\(|updateDoc\s*\(|deleteDoc\s*\(/, 'ERROR'],
      ['AUTH_DIRECT_FIREBASE_AUTH_IN_UI', /firebase\/auth/, 'ERROR'],
      ['LOGIN_ENTRYPOINT', /signInWithEmailAndPassword|signInWithPopup|signInWithRedirect|signInAnonymously/, 'WARN'],
      ['LOGOUT_ENTRYPOINT', /signOut\s*\(/, 'WARN'],
      ['AUTH_STATE_LISTENER', /onAuthStateChanged\s*\(/, 'WARN'],
      ['CANONICAL_USER', /CanonicalUser|canonicalUser|validateCanonicalUser|resolveCanonicalUser/, 'WARN'],
      ['SECURITY_CONTEXT', /SecurityContext|securityContext|useSecurityContext/, 'WARN'],
      ['ROLE', /\brole\b|\broles\b|hasRole|checkRole|roleNormalizer/, 'WARN'],
      ['PERMISSION', /permission|Permission|hasPermission|canAccess|RBAC/, 'WARN'],
      ['TENANT', /tenantId|TenantContext|tenantContext/, 'WARN'],
      ['SESSION', /session|Session|authSession|currentUser/, 'WARN'],
    ];

    for (const [rule, pattern, severity] of checks) {
      if (pattern.test(text)) {
        addHit(rule, rel);
        if (severity === 'ERROR') findings.push({ severity, rule, file: rel, line, text: text.trim() });
      }
    }
  });
}

// Structural expectations. Multiple independent implementations are suspicious.
const unique = (key: string) => [...new Set(hits[key] ?? [])];
const loginFiles = unique('LOGIN_ENTRYPOINT');
const logoutFiles = unique('LOGOUT_ENTRYPOINT');
const authStateFiles = unique('AUTH_STATE_LISTENER');
const canonicalFiles = unique('CANONICAL_USER');
const securityFiles = unique('SECURITY_CONTEXT');

const structuralWarnings: string[] = [];
if (loginFiles.length === 0) structuralWarnings.push('No Firebase login entrypoint detected. Verify AuthService or alternate provider manually.');
if (logoutFiles.length === 0) structuralWarnings.push('No logout entrypoint detected. Verify canonical logout workflow manually.');
if (authStateFiles.length > 3) structuralWarnings.push(`Auth state listener appears in ${authStateFiles.length} files; consolidate to one canonical session listener where appropriate.`);
if (canonicalFiles.length === 0) structuralWarnings.push('No CanonicalUser resolver/validator symbol detected.');
if (securityFiles.length === 0) structuralWarnings.push('No SecurityContext symbol detected.');

const roleFiles = unique('ROLE');
if (roleFiles.length > 12) structuralWarnings.push(`Role logic appears across ${roleFiles.length} files; audit for duplicated role/permission decisions.`);

const report = {
  generatedAt: new Date().toISOString(),
  target: 'Login UI → Auth Service → Firebase Auth → Canonical User → Security Context → RBAC/Tenant → Session → Workspace',
  logoutTarget: 'Logout UI → Auth Service → Firebase signOut → clear security/session context → safe navigation',
  passed: findings.length === 0,
  errors: findings.length,
  warnings: structuralWarnings.length,
  inventory: {
    loginEntryPoints: loginFiles,
    logoutEntryPoints: logoutFiles,
    authStateListeners: authStateFiles,
    canonicalUserReferences: canonicalFiles,
    securityContextReferences: securityFiles,
    roleReferences: roleFiles,
    permissionReferences: unique('PERMISSION'),
    tenantReferences: unique('TENANT'),
    sessionReferences: unique('SESSION'),
  },
  findings,
  structuralWarnings,
};

fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log('=== e-MAM AUTH FLOW AUDIT ===');
console.log(`Errors: ${findings.length}`);
console.log(`Structural warnings: ${structuralWarnings.length}`);
console.log(`Report: ${path.basename(REPORT)}`);
for (const finding of findings) console.log(`❌ [${finding.rule}] ${finding.file}:${finding.line}`);
for (const warning of structuralWarnings) console.log(`⚠️ ${warning}`);

if (findings.length > 0) process.exitCode = 1;
