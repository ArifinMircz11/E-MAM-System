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
  try {
    execFileSync('npx', ['tsx', script], { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${name}`);
    return 0;
  } catch {
    console.error(`❌ ${name}`);
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

  // Mandatory architecture/security guards. A failure blocks the audit.
  total += runMandatoryGuard('Final architecture guard', 'scripts/audit/final-architecture-guard.ts');
  total += runMandatoryGuard('Strict Firestore boundary', 'scripts/audit/firestore-boundary-strict.ts');
  total += runMandatoryGuard('Auth flow guard', 'scripts/audit/auth-flow-guard.ts');
  total += runMandatoryGuard('Final target checklist', 'scripts/audit/final-target-checklist.ts');

  printWorkQueue();
  console.log('\n==================================================');
  if (total === 0) console.log('🎉 MASTER AUDIT PASS / GREEN');
  else console.log(`🛑 MASTER AUDIT FAIL / ${total} finding(s). Production remains BLOCKED.`);
  process.exitCode = total === 0 ? 0 : 1;
}

runMainAuditSuite();
