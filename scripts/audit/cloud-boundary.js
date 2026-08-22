#!/usr/bin/env node
/**
 * Cloud / persistence boundary audit for e-MAM.
 *
 * Target architecture:
 *   UI -> Store -> Service -> Repository -> Dexie -> SyncQueue -> SyncEngine -> Firestore
 *
 * This audit intentionally fails on application-layer bypasses. It is kept
 * dependency-free so it can run in CI, locally, or from the governance engine.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../src');
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git']);

const rules = [
  {
    id: 'CB-001',
    name: 'deprecated dbGateway',
    patterns: [
      /@\/services\/dbGateway/, 
      /services\/dbGateway/, 
    ],
    applies: () => true,
    message: 'Deprecated dbGateway is forbidden in application code.',
  },
  {
    id: 'CB-002',
    name: 'Firebase SDK in application layer',
    patterns: [
      /from\s+['"]firebase\//,
      /from\s+['"]@firebase\//,
      /require\(\s*['"]firebase\//,
    ],
    applies: (file) => !isInfrastructureCorridor(file),
    message: 'Firebase SDK access must remain inside the approved infrastructure/sync corridor.',
  },
  {
    id: 'CB-003',
    name: 'Dexie in UI/hooks/services',
    patterns: [
      /from\s+['"]dexie['"]/, 
      /from\s+['"][^'"]*\/database\/dexie/, 
      /from\s+['"][^'"]*\/core\/database/, 
    ],
    applies: (file) => isUiOrServiceLayer(file),
    message: 'UI/hooks/services must use repositories, not Dexie directly.',
  },
  {
    id: 'CB-004',
    name: 'FirestoreGateway in UI/hooks',
    patterns: [
      /FirestoreGateway/, 
      /from\s+['"][^'"]*FirestoreGateway['"]/, 
    ],
    applies: (file) => /\/(features|modules|hooks)\//.test(file),
    message: 'UI/features/hooks must not access the cloud gateway directly.',
  },
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function relative(file) {
  return path.relative(path.resolve(__dirname, '../..'), file).replaceAll(path.sep, '/');
}

function isInfrastructureCorridor(file) {
  const rel = relative(file);
  return [
    'src/services/firebase.ts',
    'src/services/gateways/',
    'src/services/sync/',
    'src/infrastructure/',
    'src/core/database/',
  ].some(prefix => rel === prefix || rel.startsWith(prefix));
}

function isUiOrServiceLayer(file) {
  const rel = relative(file);
  return [
    'src/hooks/',
    'src/features/',
    'src/modules/',
    'src/services/',
  ].some(prefix => rel.startsWith(prefix));
}

const findings = [];
for (const file of walk(ROOT)) {
  const source = fs.readFileSync(file, 'utf8');
  for (const rule of rules) {
    if (!rule.applies(file)) continue;
    if (rule.patterns.some(pattern => pattern.test(source))) {
      findings.push({ id: rule.id, file: relative(file), message: rule.message });
    }
  }
}

if (findings.length) {
  console.error(`Cloud boundary audit FAILED: ${findings.length} finding(s)`);
  for (const finding of findings) {
    console.error(`[${finding.id}] ${finding.file} — ${finding.message}`);
  }
  process.exitCode = 1;
} else {
  console.log('Cloud boundary audit PASS: no application-layer persistence/cloud bypasses detected.');
}
