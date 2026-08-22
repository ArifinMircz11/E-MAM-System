import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s, 'utf8');

// 1) Login: remove every client-side developer/debug activation path.
{
  const p = 'src/features/auth/Login.tsx';
  let s = read(p);
  s = s.replace(/\n\s*const \[developerBypass, setDeveloperBypass\] = useState\(false\);/g, '');
  s = s.replace(/\n\s*const \[secretClicks, setSecretClicks\] = useState\(0\);/g, '');
  s = s.replace(/\n\s*const handleSecretClick = \(\) => \{[\s\S]*?\n\s*\};\n/g, '\n');
  s = s.replace(/const isLoginLocked = false;[^\n]*\n/g, 'const isLoginLocked = lockedFeatures.includes(\'login\');\n');
  s = s.replace(/onClick=\{handleSecretClick\}/g, '');
  // If a legacy conditional remains, make it impossible to activate from client state.
  s = s.replace(/\bdeveloperBypass\b/g, 'false');
  s = s.replace(/\bsecretClicks\b/g, '0');
  write(p, s);
}

// 2) App: canonical SecurityContext is the only identity source after login.
{
  const p = 'src/app/App.tsx';
  let s = read(p);
  s = s.replace(/securityContext\?\.tenantId\s*\|\|\s*tenantId\s*\|\|\s*['"]30315537['"]/g, 'securityContext?.tenantId');
  s = s.replace(/securityContext\?\.tenantId\s*\|\|\s*tenantId/g, 'securityContext?.tenantId');
  s = s.replace(/\btenantId:\s*securityContext\?\.tenantId\s*,/g, 'tenantId: securityContext?.tenantId,');
  write(p, s);
}

// 3) Firebase session initialization: provider is authoritative and one lifecycle gate is used.
{
  const p = 'src/services/authService.ts';
  let s = read(p);
  s = s.replace(/import \{ SecurityContextBuilder \} from ['"]@\/core\/identity\/security-context\/SecurityContextBuilder['"];\n/g, '');
  s = s.replace(/import \{ GoogleAuthProvider \} from ['"]firebase\/auth['"];[^\n]*\n/g, '');
  s = s.replace(/import \{ SecurityContext \} from ['"]@\/core\/security\/SecurityContext['"];\n/g, '');
  s = s.replace(/import \{ SecurityContextService \} from ['"]@\/core\/security\/SecurityContextService['"];\n/g, '');
  s = s.replace(/(import \{ LegacyUserAdapter \}[^\n]*\n)/, "$1import { SecurityContextService } from '@/core/security/SecurityContextService';\n");
  s = s.replace(/provider:\s*'google'/g, "provider: firebaseUser.providerData?.[0]?.providerId || 'unknown'");
  s = s.replace(/\n\s*const securityContext = SecurityContextBuilder\.build\([\s\S]*?\n\s*\/\/ 4\. Update Stores/, '\n    // 4. Update Stores');
  s = s.replace(/\n\s*return \{ success: true, status: 'active', user: canonicalUser \};/g, "\n    SecurityContextService.setLifecycleState('READY');\n\n    return { success: true, status: 'active', user: canonicalUser };");
  s = s.replace(/const getSystemContext = \(tenantId = 'default', uid = 'SYSTEM'\): SecurityContext => new SecurityContext\(/, "const getSystemContext = (tenantId: string, uid = 'SYSTEM') => new SecurityContext(");
  s = s.replace(/\n\s*const sysContext = getSystemContext\(tenantId, user\.uid\);/g, '');
  s = s.replace(/\n\s*status: 'Active',/g, "\n      status: 'aktif',");
  write(p, s);
}

// 4) Backend auth: never accept client-controlled requester UID.
{
  const p = 'api/auth/routes.ts';
  let s = read(p);
  s = s.replace(/\n\/\*\*[\s\S]*?Extract requester UID\.[\s\S]*?\n\*\/\nconst getRequesterUid = \([\s\S]*?\n\};\n/g, '\n');
  s = s.replace(/const requesterUid = getRequesterUid\(req\);/g, "const requesterUid = 'system';");
  s = s.replace(/executedBy: requesterUid/g, "executedBy: 'system'");
  write(p, s);
}

// 5) Firestore: authentication is not authorization; require an existing canonical user.
{
  const p = 'firestore.rules';
  let s = read(p);
  s = s.replace(/request\.auth\.token\.email in \[[^\]]*\] \|\|\s*/g, '');
  s = s.replace(/function isValidTenant\(tenantId\) \{[\s\S]*?\n    \}/, `function isValidTenant(tenantId) {\n      return isSignedIn() && hasUserDoc() &&\n        tenantId != '' && tenantId != 'global' && tenantId != 'default' && tenantId != 'unknown' &&\n        currentUser().get('tenantId', '') == tenantId;\n    }`);
  s = s.replace(/allow read: if isSignedIn\(\);/g, 'allow read: if isTenantMatch() || isDeveloper();');
  s = s.replace(/match \/sync_queue\/\{id\} \{\n\s*allow read, write: if isSignedIn\(\);\n\s*\}/, `match /sync_queue/{id} {\n      allow read: if isSignedIn() && isTenantMatch();\n      allow create: if isSignedIn() && isNewDocTenantMatch() && request.resource.data.get('uid', request.auth.uid) == request.auth.uid;\n      allow update: if isSignedIn() && isTenantMatch() && request.resource.data.get('tenantId', '') == resource.data.get('tenantId', '');\n      allow delete: if false;\n    }`);
  s = s.replace(/match \/sync_metadata\/\{deviceId\} \{\n\s*allow read, write: if isSignedIn\(\);\n\s*\}/, `match /sync_metadata/{deviceId} {\n      allow read: if isSignedIn() && isTenantMatch();\n      allow create: if isSignedIn() && isNewDocTenantMatch() && request.resource.data.get('uid', request.auth.uid) == request.auth.uid;\n      allow update: if isSignedIn() && isTenantMatch() && request.resource.data.get('tenantId', '') == resource.data.get('tenantId', '');\n      allow delete: if false;\n    }`);
  s = s.replace(/match \/deleted_records\/\{id\} \{\n\s*allow read, write: if isSignedIn\(\);\n\s*\}/, `match /deleted_records/{id} {\n      allow read: if isSignedIn() && isTenantMatch();\n      allow create, update: if isSignedIn() && isNewDocTenantMatch();\n      allow delete: if false;\n    }`);
  s = s.replace(/match \/sync_conflicts\/\{id\} \{\n\s*allow read, write: if isSignedIn\(\);\n\s*\}/, `match /sync_conflicts/{id} {\n      allow read: if isSignedIn() && isTenantMatch();\n      allow create, update: if isSignedIn() && isNewDocTenantMatch();\n      allow delete: if false;\n    }`);
  s = s.replace(/match \/devices\/\{deviceId\} \{\n\s*allow read, write: if isSignedIn\(\);\n\s*\}/, `match /devices/{deviceId} {\n      allow read: if isSignedIn() && (isTenantMatch() || isDeveloper());\n      allow create: if isSignedIn() && isNewDocTenantMatch() && request.resource.data.get('userId', '') == request.auth.uid;\n      allow update: if isSignedIn() && isTenantMatch() && resource.data.get('userId', '') == request.auth.uid && request.resource.data.get('tenantId', '') == resource.data.get('tenantId', '');\n      allow delete: if isDeveloper() || (isTenantMatch() && resource.data.get('userId', '') == request.auth.uid);\n    }`);
  // Never leave a blanket catch-all privilege path for authenticated users.
  write(p, s);
}

// 6) Admin authorization: no email bypass and no synthetic tenant fallback.
{
  const p = 'api/admin/routes.ts';
  let s = read(p);
  s = s.replace(/\n\s*\/\/ --- ADMIN ROLE VERIFICATION ---[\s\S]*?\n\s*try \{\n\s*\/\/ Verify admin role from Firestore/, '\n\n    // --- ADMIN ROLE VERIFICATION ---\n    try {\n      // Verify admin role from Firestore');
  s = s.replace(/tenantId: tenantId \|\| '30315537'/g, 'tenantId');
  s = s.replace(/tenantId: tenantId \|\| '30315537'/g, 'tenantId');
  write(p, s);
}

console.log('P0 hardening transformation applied.');
