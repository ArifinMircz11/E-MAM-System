#!/usr/bin/env node
/**
 * P0 security hardening audit.
 *
 * Enforces:
 *   P0-B Firestore/Storage authority: no email bypass, no signed-in-only
 *        tenant data, deny-by-default catch-all.
 *   P0-C Tenant authority: no production tenant fallbacks in runtime code.
 *   P0-D SecurityContext: client stores/helpers may not invent developer authority.
 *   P0-E Persistence boundary: Firebase SDK/facade/Dexie access stays in the
 *        approved infrastructure corridor.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'src');
const IGNORE = new Set(['node_modules', 'dist', 'coverage', '.git']);
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs']);
const findings = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXT.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, '/');
}

function add(file, rule, message) {
  findings.push({ file: rel(file), rule, message });
}

function source(file) {
  return fs.readFileSync(file, 'utf8');
}

const runtimeFiles = walk(SRC).filter(file => {
  const r = rel(file);
  return !r.startsWith('src/__tests__/') && !r.startsWith('src/test/');
});

// P0-C / P0-D: production code must never synthesize tenant authority or privilege.
for (const file of runtimeFiles) {
  const text = source(file);
  if (/tenantId\s*\|\|\s*['"](?:default|global|unknown)['"]/.test(text)) {
    add(file, 'P0-C', 'Tenant fallback (default/global/unknown) is forbidden.');
  }
  if (/(?:developer|admin)@(?:example\.com|emam\.internal)/i.test(text) && !rel(file).includes('audit')) {
    add(file, 'P0-D', 'Hard-coded developer/admin email is forbidden as runtime authority.');
  }
}

function auditRules(file, kind) {
  if (!fs.existsSync(file)) return;
  const text = source(file);
  if (/request\.auth\.token\.email/.test(text)) {
    add(file, 'P0-B', `${kind} authorization must not use email claims.`);
  }
  if (/allow\s+write\s*:\s*if\s+true/.test(text)) {
    add(file, 'P0-B', `${kind} public writes are forbidden.`);
  }
  if (kind === 'Firestore') {
    if (/!hasUserDoc\(\)/.test(text)) {
      add(file, 'P0-B', 'Firestore tenant validation must not fail open when users/{uid} is missing.');
    }
    if (/allow\s+(?:read|write|read,\s*write)\s*:\s*if\s+isSignedIn\(\)/.test(text)) {
      add(file, 'P0-B', 'Tenant data must not be authorized by authentication alone.');
    }
    if (!/match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;/.test(text)) {
      add(file, 'P0-B', 'Firestore rules require an explicit deny-by-default catch-all.');
    }
  } else {
    if (/match\s+\/\{allPaths=\*\*\}\s*\{\s*allow\s+read\s*,\s*write\s*:\s*if\s+isSignedIn\(\)/.test(text)) {
      add(file, 'P0-B', 'Storage catch-all must not authorize all authenticated users.');
    }
    if (!/match\s+\/\{allPaths=\*\*\}\s*\{\s*allow\s+read\s*,\s*write\s*:\s*if\s+false;/.test(text)) {
      add(file, 'P0-B', 'Storage rules require an explicit deny-by-default catch-all.');
    }
  }
}

auditRules(path.join(ROOT, 'firestore.rules'), 'Firestore');
auditRules(path.join(ROOT, 'storage.rules'), 'Storage');

// P0-E: direct cloud/database access is restricted to infrastructure corridors.
const approvedFirebase = [
  'src/services/firebase.ts',
  'src/services/gateways/',
  'src/services/sync/',
  'src/infrastructure/',
  'src/core/database/',
];
const approvedDexie = ['src/database/', 'src/core/database/', 'src/services/sync/'];

function allowed(file, prefixes) {
  const r = rel(file);
  return prefixes.some(prefix => r === prefix || r.startsWith(prefix));
}

for (const file of runtimeFiles) {
  const text = source(file);
  const r = rel(file);

  if (/from\s+['"](?:firebase|@firebase)\//.test(text) && !allowed(file, approvedFirebase)) {
    add(file, 'P0-E', 'Firebase SDK import is outside the approved infrastructure corridor.');
  }

  if (/from\s+['"](?:\.\.?\/)+firebase(?:\.ts)?['"]|from\s+['"]@\/services\/firebase['"]/.test(text) && r !== 'src/services/firebase.ts' && !r.startsWith('src/services/gateways/') && !r.startsWith('src/services/sync/')) {
    add(file, 'P0-E', 'Direct firebase facade import is outside the approved infrastructure corridor; use the repository/gateway boundary.');
  }

  if (/from\s+['"]dexie['"]/.test(text) && !allowed(file, approvedDexie)) {
    add(file, 'P0-E', 'Dexie access is outside the approved persistence corridor.');
  }

  if (/services\/dbGateway|@\/services\/dbGateway/.test(text)) {
    add(file, 'P0-E', 'Deprecated dbGateway is forbidden.');
  }
}

if (findings.length) {
  console.error(`P0 SECURITY AUDIT FAILED: ${findings.length} finding(s)`);
  for (const finding of findings) {
    console.error(`[${finding.rule}] ${finding.file} — ${finding.message}`);
  }
  process.exit(1);
}

console.log('P0 SECURITY AUDIT PASS');
console.log('P0-B Firestore/Storage authority: PASS');
console.log('P0-C Tenant authority: PASS');
console.log('P0-D Canonical SecurityContext enforcement: PASS');
console.log('P0-E Repository/Firebase boundary: PASS');
