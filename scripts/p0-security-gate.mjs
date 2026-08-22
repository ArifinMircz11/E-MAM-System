import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'src/features/auth/Login.tsx',
  'src/app/App.tsx',
  'src/services/authService.ts',
  'api/auth/routes.ts',
  'api/admin/routes.ts',
  'firestore.rules',
  'src/core/impersonation/ImpersonationService.ts',
];

const rules = [
  { name: 'developerBypass', re: /\bdeveloperBypass\b/g },
  { name: 'secretClicks', re: /\bsecretClicks\b/g },
  { name: 'five-click bypass', re: /handleSecretClick|Developer Bypass diaktifkan/gi },
  { name: 'disabled login lock', re: /isLoginLocked\s*=\s*false/g },
  { name: 'legacy hardcoded tenant', re: /30315537/g },
  { name: 'client requester identity', re: /x-requester-uid/g },
  { name: 'email admin bypass', re: /bypassEmails|isBypassed|Admin bypass granted/gi },
  { name: 'default production password', re: /Madrasah2026!/g },
  { name: 'hardcoded Google provider', re: /provider\s*:\s*['"]google['"]/g },
  { name: 'direct impersonation role mutation', re: /setUserData\([^\n]*roles:\s*\[role\]/g },
];

let failures = 0;
for (const relative of files) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const rule of rules) {
    const matches = content.match(rule.re);
    if (matches?.length) {
      console.error(`P0 FAIL: ${rule.name}: ${relative} (${matches.length})`);
      failures += matches.length;
    }
  }
}

// Firestore authentication-only grants are forbidden on protected collections.
const rulesFile = path.join(root, 'firestore.rules');
if (fs.existsSync(rulesFile)) {
  const rulesText = fs.readFileSync(rulesFile, 'utf8');
  for (const collection of ['sync_queue', 'sync_metadata', 'devices', 'deleted_records', 'sync_conflicts']) {
    const block = rulesText.match(new RegExp(`match \\/${collection}\\/\\{[^}]+\\}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`));
    if (block?.[1] && /allow\s+(?:read|write|read,\s*write)\s*:\s*if\s+isSignedIn\(\)\s*;/.test(block[1])) {
      console.error(`P0 FAIL: unscoped Firestore authorization: ${collection}`);
      failures++;
    }
  }
}

if (failures) {
  console.error(`P0 Security Gate: RED (${failures} blocker matches)`);
  process.exit(1);
}

console.log('P0 Security Gate: PASS — no configured blocker patterns found.');
