#!/usr/bin/env node
/**
 * Cloud / persistence boundary audit for e-MAM.
 * Target: UI -> Store -> Service -> Repository -> Dexie -> SyncQueue -> SyncEngine -> Firestore.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
const PROJECT = path.resolve(ROOT, '..');
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git']);

const rules = [
  { id:'CB-001', name:'deprecated dbGateway', patterns:[/@\/services\/dbGateway/, /services\/dbGateway/], message:'Deprecated dbGateway is forbidden in application code.' },
  { id:'CB-002', name:'Firebase SDK in application layer', patterns:[/from\s+['"]firebase\//, /from\s+['"]@firebase\//, /require\(\s*['"]firebase\//], message:'Firebase SDK access must remain inside the approved infrastructure/sync corridor.' },
  { id:'CB-003', name:'Dexie in application layer', patterns:[/from\s+['"]dexie['"]/, /from\s+['"][^'"]*\/database\/dexie/, /from\s+['"][^'"]*\/core\/database/], message:'Application layers must use repositories, not Dexie directly.' },
  { id:'CB-004', name:'FirestoreGateway in application layer', patterns:[/\bFirestoreGateway\b/, /from\s+['"][^'"]*FirestoreGateway['"]/,], message:'Application code must not access the cloud gateway directly.' },
  { id:'CB-005', name:'Firestore operations in application layer', patterns:[/\b(onSnapshot|getDoc|getDocs|addDoc|setDoc|updateDoc|deleteDoc|runTransaction|writeBatch)\s*\(/], message:'Direct Firestore operations are forbidden in application/business layers.' },
];

function walk(dir, out=[]) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}
function relative(file) { return path.relative(PROJECT, file).replaceAll(path.sep, '/'); }
function isApprovedCorridor(file) {
  const rel = relative(file);
  return rel === 'src/services/firebase.ts' || rel === 'src/services/SyncEngine.ts' ||
    rel === 'src/services/masterSyncService.ts' || rel === 'src/services/gateways/FirestoreGateway.ts' ||
    rel.startsWith('src/services/sync/') || rel.startsWith('src/services/realtime/') ||
    rel.startsWith('src/sync/') || rel.startsWith('src/core/sync/') ||
    rel.startsWith('src/core/database/') || rel.startsWith('src/repositories/');
}
function isApplicationLayer(file) {
  const rel = relative(file);
  return ['src/components/','src/pages/','src/views/','src/hooks/','src/features/','src/modules/','src/services/','src/domain/','src/stores/','src/store/']
    .some(prefix => rel.startsWith(prefix)) && !isApprovedCorridor(file);
}

const findings=[];
for (const file of walk(ROOT)) {
  if (!isApplicationLayer(file)) continue;
  const lines=fs.readFileSync(file,'utf8').split(/\r?\n/);
  for (const rule of rules) lines.forEach((text,i)=>{
    if (rule.patterns.some(pattern=>pattern.test(text))) findings.push({id:rule.id,file:relative(file),line:i+1,text:text.trim(),message:rule.message});
  });
}
const report={generatedAt:new Date().toISOString(),target:'UI -> Store -> Service -> Repository -> Dexie -> SyncQueue -> SyncEngine -> Firestore',passed:findings.length===0,violations:findings.length,findings};
fs.writeFileSync(path.resolve(PROJECT,'cloud-boundary-report.json'),JSON.stringify(report,null,2));
console.log(`Cloud boundary audit: ${findings.length===0?'PASS':'FAIL'} (${findings.length} finding(s))`);
for(const finding of findings) console.log(`❌ [${finding.id}] ${finding.file}:${finding.line} — ${finding.message}`);
if(findings.length) process.exitCode=1;
