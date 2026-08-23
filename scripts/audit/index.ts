import fs from 'node:fs';
import path from 'node:path';
import { runStructureAudit } from './structure.js';
import { runFeaturesAudit } from './features.js';
import { runUnusedAudit } from './unused.js';
import { runGovernanceAudit } from './governance.js';
import { runFoundationAudit } from './foundation.js';

function printWorkQueue() {
  const registryPath = path.resolve(process.cwd(), 'tasks/task-registry.json');

  console.log('\n📋 WORK QUEUE / DAFTAR PEKERJAAN');
  console.log('--------------------------------------------------');

  if (!fs.existsSync(registryPath)) {
    console.log('⚠️ Task registry tidak ditemukan. Daftar pekerjaan tidak dapat dibaca.');
    return;
  }

  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const tasks = Array.isArray(registry.tasks) ? registry.tasks : [];

    if (tasks.length === 0) {
      console.log('• Tidak ada pekerjaan yang terdaftar.');
      return;
    }

    const priorityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
    tasks
      .slice()
      .sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99))
      .forEach((task) => {
        console.log(`• [${task.priority || 'P2'}] ${task.taskId} — ${task.title}`);
      });

    console.log(`Total registered work items: ${tasks.length}`);
    console.log('Catatan: status selesai/in-progress/blocked dilacak oleh progress recorder.');
    console.log('Gunakan `npm run progress` sebelum pekerjaan baru untuk membaca riwayat pekerjaan.');
  } catch (error) {
    console.log(`⚠️ Task registry gagal dibaca: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function runMainAuditSuite() {
  console.log('=== 🛡️ E-MAM SYSTEM FOUNDATION & ENTERPRISE AUDIT SUITE ===\n');

  const governanceIssues = runGovernanceAudit();
  console.log('--------------------------------------------------');
  const foundationIssues = runFoundationAudit();
  console.log('--------------------------------------------------');
  const structIssues = runStructureAudit();
  console.log('--------------------------------------------------');
  const featureIssues = runFeaturesAudit();
  console.log('--------------------------------------------------');
  const unusedIssues = runUnusedAudit();

  printWorkQueue();

  console.log('\n==================================================');
  const total = governanceIssues + foundationIssues + structIssues + featureIssues + unusedIssues;
  if (total === 0) {
    console.log('🎉 ALL REGISTERED AUDITS PASSED.');
  } else {
    console.log(`🛑 AUDIT SUITE FAILED with ${total} finding(s).`);
    console.log('No architecture GREEN claim is permitted while findings remain.');
  }

  process.exitCode = total === 0 ? 0 : 1;
}

runMainAuditSuite();
