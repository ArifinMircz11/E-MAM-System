import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { runStructureAudit } from './structure.js';
import { runFeaturesAudit } from './features.js';
import { runUnusedAudit } from './unused.js';
import { runGovernanceAudit } from './governance.js';
import { runFoundationAudit } from './foundation.js';

function printWorkQueue() {
  const registryPath = path.resolve(process.cwd(), 'tasks/task-registry.json');
  console.log('\n📋 WORK QUEUE / DAFTAR PEKERJAAN');
  if (!fs.existsSync(registryPath)) return console.log('⚠️ Task registry tidak ditemukan.');
  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const tasks = Array.isArray(registry.tasks) ? registry.tasks : [];
    const priorityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
    tasks.slice().sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99))
      .forEach((task) => console.log(`• [${task.priority || 'P2'}] ${task.taskId} — ${task.title}`));
    console.log(`Total registered work items: ${tasks.length}`);
  } catch (error) {
    console.log(`⚠️ Task registry gagal dibaca: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function runMandatoryGuard(name: string, script: string): number {
  const bin = process.platform === 'win32'
    ? path.resolve('node_modules/.bin/tsx.cmd')
    : path.resolve('node_modules/.bin/tsx');
  try {
    if (!fs.existsSync(bin)) throw new Error(`tsx executable missing: ${bin}`);
    execFileSync(bin, [script], { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${name}`);
    return 0;
  } catch (error) {
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

function runMainAuditSuite() {
  console.log('=== 🛡️ E-MAM MASTER ARCHITECTURE AUDIT ===\n');
  let total = 0;
  total += runGovernanceAudit();
  console.log('--------------------------------------------------');
  total += runFoundationAudit();
  console.log('--------------------------------------------------');
  total += runStructureAudit();
  console.log('--------------------------------------------------');
  total += runFeaturesAudit();
  console.log('--------------------------------------------------');
  total += runUnusedAudit();
  console.log('--------------------------------------------------');
  total += runMandatoryGuard('Final architecture guard', 'scripts/audit/final-architecture-guard.ts');
  total += runMandatoryGuard('Strict Firestore boundary', 'scripts/audit/firestore-boundary-strict.ts');
  total += runMandatoryGuard('Cloud boundary', 'scripts/audit/cloud-boundary.js');
  total += runMandatoryGuard('Auth flow guard', 'scripts/audit/auth-flow-guard.ts');
  total += runMandatoryGuard('Final target checklist', 'scripts/audit/final-target-checklist.ts');
  printWorkQueue();
  console.log('\n==================================================');
  console.log(total === 0 ? '🎉 MASTER AUDIT PASS / GREEN' : `🛑 MASTER AUDIT FAIL / ${total} finding(s). Production remains BLOCKED.`);
  process.exitCode = total === 0 ? 0 : 1;
}

runMainAuditSuite();
