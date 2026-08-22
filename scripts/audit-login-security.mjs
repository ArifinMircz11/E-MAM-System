import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = [
  'src/features/auth/Login.tsx',
  'src/app/App.tsx',
  'src/services/authService.ts',
  'src/core/security/contextHelper.ts',
  'src/core/identity/security-context/PolicyResolver.ts',
  'src/core/impersonation/ImpersonationService.ts',
  'api/auth/routes.ts',
  'firestore.rules',
];

const forbidden = [
  { pattern: /30315537/g, rule: 'hardcoded tenant fallback' },
  { pattern: /developerBypass|secretClicks|Developer Bypass/g, rule: 'production developer bypass' },
  { pattern: /x-requester-uid/g, rule: 'unverified requester identity header' },
  { pattern: /provider\s*:\s*['"]google['"]/g, rule: 'hardcoded Google provider in generic session initialization' },
  { pattern: /!hasUserDoc\(\)/g, rule: 'tenant authorization that accepts missing CanonicalUser' },
  { pattern: /allow\s+(read|write|read,\s*write):\s*if\s+isSignedIn\(\)/g, rule: 'authenticated-only Firestore authorization' },
  { pattern: /tenantId\s*[:=]\s*['"](?:global|default|unknown)['"]/g, rule: 'legacy tenant fallback' },
  { pattern: /tenantId\s*\|\|\s*['"](?:global|default|unknown)['"]/g, rule: 'legacy tenant fallback expression' },
  { pattern: /developer_uid|Developer Administrator/g, rule: 'synthetic developer identity' },
  { pattern: /role\s*===\s*['"]developer['"].*email|email.*===.*developer@example\.com/g, rule: 'email-based developer privilege' },
];

let failures = 0;
for (const relative of targets) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const check of forbidden) {
    const matches = content.match(check.pattern);
    if (matches?.length) {
      failures += matches.length;
      console.error(`SECURITY: ${relative}: ${check.rule} (${matches.length})`);
    }
  }
}

const rulesFile = path.join(root, 'firestore.rules');
if (fs.existsSync(rulesFile)) {
  const rules = fs.readFileSync(rulesFile, 'utf8');
  for (const collection of ['sync_queue', 'sync_metadata', 'devices', 'deleted_records', 'sync_conflicts']) {
    const block = rules.match(new RegExp(`match\\s+/${collection}\\/\\{[^}]+\\}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`));
    if (block && /isSignedIn\(\)/.test(block[1]) && !/isDeveloper\(\)|isTenantMatch\(\)/.test(block[1])) {
      failures += 1;
      console.error(`SECURITY: firestore.rules: ${collection} still allows authenticated-only access.`);
    }
  }
}

if (failures > 0) {
  console.error(`\nLogin security audit FAILED: ${failures} violation(s).`);
  process.exit(1);
}

console.log('Login security audit PASSED.');
