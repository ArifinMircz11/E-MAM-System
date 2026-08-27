import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'src/features/auth/Login.tsx','src/features/auth/hooks/useLogin.ts','src/app/App.tsx','src/hooks/useAuthInitialization.ts','src/services/authService.ts','src/services/auth/AuthGateway.ts','src/core/security/SecurityContextService.ts','src/core/security/SecurityContext.ts','src/core/security/contextHelper.ts','src/core/identity/security-context/SecurityContext.ts','src/core/identity/security-context/SecurityContextBuilder.ts','src/core/identity/security-context/SecurityContextProvider.tsx','api/auth/routes.ts','api/admin/routes.ts','firestore.rules','src/core/impersonation/ImpersonationService.ts',
];
const rules = [
  { name:'developerBypass', re:/\bdeveloperBypass\b/g }, { name:'secretClicks', re:/\bsecretClicks\b/g },
  { name:'five-click bypass', re:/handleSecretClick|Developer Bypass diaktifkan/gi }, { name:'disabled login lock', re:/isLoginLocked\s*=\s*false/g },
  { name:'legacy hardcoded tenant', re:/30315537/g }, { name:'client requester identity', re:/x-requester-uid/gi },
  { name:'email admin bypass', re:/bypassEmails|isBypassed|Admin bypass granted/gi }, { name:'default production password', re:/Madrasah2026!/g },
  { name:'hardcoded Google provider', re:/provider\s*:\s*['"]google['"]/g }, { name:'GoogleAuthProvider', re:/\bGoogleAuthProvider\b/g },
  { name:'interactive Google gateway', re:/signInWithPopup\s*\(/g }, { name:'direct legacy SecurityContext construction', re:/new\s+SecurityContext\s*\(/g },
  { name:'direct impersonation role mutation', re:/setUserData\([^\n]*roles:\s*\[role\]/g },
];
let failures=0;
for (const relative of files) { const file=path.join(root,relative); if(!fs.existsSync(file)) continue; const content=fs.readFileSync(file,'utf8'); for(const rule of rules){const matches=content.match(rule.re); if(matches?.length){console.error(`P0 FAIL: ${rule.name}: ${relative} (${matches.length})`); failures+=matches.length;}} }
const rulesFile=path.join(root,'firestore.rules');
if(fs.existsSync(rulesFile)){const text=fs.readFileSync(rulesFile,'utf8'); for(const collection of ['sync_queue','sync_metadata','devices','deleted_records','sync_conflicts']){const block=text.match(new RegExp(`match \\/${collection}\\/\\{[^}]+\\}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`)); if(block?.[1]&&/allow\s+(?:read|write|read,\s*write)\s*:\s*if\s+isSignedIn\(\)\s*;/.test(block[1])){console.error(`P0 FAIL: unscoped Firestore authorization: ${collection}`); failures++;}}}
if(failures){console.error(`P0 Security Gate: RED (${failures} blocker matches)`); process.exit(1);}
console.log('P0 Security Gate: PASS — no configured blocker patterns found.');
