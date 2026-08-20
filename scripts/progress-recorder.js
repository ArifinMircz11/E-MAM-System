import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = process.cwd();
const progresDir = path.join(rootDir, 'progres');
const tasksFilePath = path.join(rootDir, 'tasks', 'task-registry.json');

// Ensure directories exist
if (!fs.existsSync(progresDir)) {
  fs.mkdirSync(progresDir, { recursive: true });
}

// Load Task Registry
function loadTaskRegistry() {
  if (fs.existsSync(tasksFilePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(tasksFilePath, 'utf8'));
      return data.tasks || [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

const taskRegistry = loadTaskRegistry();

// Standardize status
function normalizeStatus(rawStatus) {
  if (!rawStatus) return 'in_progress';
  const s = String(rawStatus).toLowerCase().trim();
  if (['completed', 'selesai', 'done', 'pass', 'success'].includes(s)) return 'completed';
  if (['in_progress', 'sedang_dikerjakan', 'progress', 'running'].includes(s)) return 'in_progress';
  if (['blocked', 'terhambat', 'error', 'failed', 'gagal'].includes(s)) return 'blocked';
  if (['pending', 'belum_dikerjakan', 'todo'].includes(s)) return 'pending';
  return 'in_progress';
}

// Read History
export function readHistory() {
  if (!fs.existsSync(progresDir)) return [];
  const files = fs.readdirSync(progresDir);
  const records = [];

  // Map to group json and md files by timestamp
  const timestampMap = new Map();

  files.forEach((file) => {
    if (file.endsWith('.json')) {
      const filePath = path.join(progresDir, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const ts = file.replace('.json', '');
        records.push({
          ...data,
          status: normalizeStatus(data.status),
          timestamp: data.timestamp || ts,
          filePath: `./progres/${file}`,
          files: Array.isArray(data.files) ? data.files : typeof data.files === 'string' ? data.files.split(',').map((f) => f.trim()) : [],
        });
        timestampMap.set(ts, true);
      } catch (e) {}
    }
  });

  // Fallback: parse .md files if corresponding .json doesn't exist
  files.forEach((file) => {
    if (file.endsWith('.md')) {
      const ts = file.replace('.md', '');
      if (!timestampMap.has(ts)) {
        const filePath = path.join(progresDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const taskMatch = content.match(/\*\*Task:\*\*\s*(.+)/);
          const statusMatch = content.match(/\*\*Status Task:\*\*\s*(.+)/);
          const resultMatch = content.match(/\*\*Hasil Eksekusi:\*\*\s*(.+)/);
          const fileMatch = content.match(/## 📂 FILE [^\n]*\n([\s\S]*?)\n\n##/);
          const objectiveMatch = content.match(/## 🎯 TUJUAN [^\n]*\n([\s\S]*?)\n\n##/);
          const workMatch = content.match(/## 🛠️ PEKERJAAN [^\n]*\n([\s\S]*?)\n\n##/);

          const taskName = taskMatch ? taskMatch[1].trim() : 'General Task';
          // Try to map taskName to taskId from registry
          const regItem = taskRegistry.find((r) => r.title.toLowerCase().includes(taskName.toLowerCase()) || taskName.toLowerCase().includes(r.taskId.toLowerCase()));
          const taskId = regItem ? regItem.taskId : `WO-CUSTOM-${ts.slice(-6)}`;

          records.push({
            taskId,
            title: regItem ? regItem.title : taskName,
            status: normalizeStatus(statusMatch ? statusMatch[1].trim() : 'completed'),
            result: resultMatch ? resultMatch[1].trim() : 'PASS',
            timestamp: ts,
            files: fileMatch ? fileMatch[1].trim().split(',').map((f) => f.trim()) : [],
            summary: objectiveMatch ? objectiveMatch[1].trim() : workMatch ? workMatch[1].trim() : taskName,
            changes: workMatch ? [workMatch[1].trim()] : [],
            filePath: `./progres/${file}`,
          });
        } catch (e) {}
      }
    }
  });

  // Sort by timestamp
  return records.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

// Get task status mapped by taskId
export function getTaskStatus(taskId) {
  const history = readHistory();
  const taskRecords = history.filter((r) => r.taskId === taskId || (taskId && r.taskId && r.taskId.toLowerCase() === taskId.toLowerCase()));
  if (taskRecords.length === 0) return 'pending';
  const latest = taskRecords[taskRecords.length - 1];
  return latest.status;
}

// Get Work Summary against Task Registry
export function getWorkSummary(currentTaskId) {
  const history = readHistory();
  const latestByTask = new Map();

  history.forEach((rec) => {
    if (rec.taskId) {
      latestByTask.set(rec.taskId, rec);
    }
  });

  const completed = [];
  const inProgress = [];
  const blocked = [];
  const pending = [];

  const registeredIds = new Set();

  taskRegistry.forEach((task) => {
    registeredIds.add(task.taskId);
    const lastRecord = latestByTask.get(task.taskId);
    const status = lastRecord ? lastRecord.status : 'pending';

    const item = {
      taskId: task.taskId,
      title: task.title,
      priority: task.priority || 'P2',
      status,
      lastRecord: lastRecord || null,
    };

    if (status === 'completed') completed.push(item);
    else if (status === 'in_progress') inProgress.push(item);
    else if (status === 'blocked') blocked.push(item);
    else pending.push(item);
  });

  // Include unregistered tasks found in history
  latestByTask.forEach((rec, taskId) => {
    if (!registeredIds.has(taskId)) {
      const item = {
        taskId,
        title: rec.title || taskId,
        priority: 'P2',
        status: rec.status,
        lastRecord: rec,
      };
      if (rec.status === 'completed') completed.push(item);
      else if (rec.status === 'in_progress') inProgress.push(item);
      else if (rec.status === 'blocked') blocked.push(item);
      else pending.push(item);
    }
  });

  let currentTask = null;
  if (currentTaskId) {
    const matchedReg = taskRegistry.find((t) => t.taskId.toLowerCase() === currentTaskId.toLowerCase() || t.title.toLowerCase().includes(currentTaskId.toLowerCase()));
    if (matchedReg) {
      currentTask = {
        taskId: matchedReg.taskId,
        title: matchedReg.title,
        status: getTaskStatus(matchedReg.taskId),
        lastRecord: latestByTask.get(matchedReg.taskId) || null,
      };
    } else {
      currentTask = {
        taskId: currentTaskId,
        title: currentTaskId,
        status: getTaskStatus(currentTaskId),
        lastRecord: latestByTask.get(currentTaskId) || null,
      };
    }
  }

  return { completed, inProgress, blocked, pending, currentTask };
}

// Preflight Output
export function preflight(currentTaskId) {
  const summary = getWorkSummary(currentTaskId);

  console.log('════════════════════════════════════════');
  console.log(' e-MAM PROGRESS RECORDER PREFLIGHT');
  console.log('════════════════════════════════════════');

  if (summary.currentTask) {
    console.log('Task saat ini:');
    console.log(`${summary.currentTask.taskId} — ${summary.currentTask.title}`);
  }

  console.log('\nRIWAYAT PEKERJAAN');
  console.log('✅ SUDAH DIKERJAKAN');
  console.log('────────────────────────────────────────');
  if (summary.completed.length === 0) console.log('• (Belum ada)');
  else {
    summary.completed.forEach((item) => {
      console.log(`• ${item.taskId.padEnd(12)} — ${item.title}`);
    });
  }

  console.log('\n🔄 SEDANG / PERNAH DIKERJAKAN');
  console.log('────────────────────────────────────────');
  if (summary.inProgress.length === 0) console.log('• (Belum ada)');
  else {
    summary.inProgress.forEach((item) => {
      console.log(`• ${item.taskId.padEnd(12)} — ${item.title}`);
      if (item.lastRecord) {
        console.log(`  Status terakhir : ${item.lastRecord.status}`);
        if (item.lastRecord.files && item.lastRecord.files.length > 0) {
          console.log(`  File terakhir   : ${item.lastRecord.files[0]}`);
        }
      }
    });
  }

  if (summary.blocked.length > 0) {
    console.log('\n⚠️ TERHAMBAT / BLOCKED');
    console.log('────────────────────────────────────────');
    summary.blocked.forEach((item) => {
      console.log(`• ${item.taskId.padEnd(12)} — ${item.title}`);
    });
  }

  console.log('\n⏳ BELUM DIKERJAKAN');
  console.log('────────────────────────────────────────');
  if (summary.pending.length === 0) console.log('• (Semua task selesai)');
  else {
    summary.pending.forEach((item) => {
      console.log(`• ${item.taskId.padEnd(12)} — ${item.title}`);
    });
  }

  console.log('════════════════════════════════════════');
  console.log('[PROGRESS PREFLIGHT]');
  console.log(`✅ Completed  : ${summary.completed.length}`);
  console.log(`🔄 In Progress: ${summary.inProgress.length}`);
  console.log(`⚠️ Blocked    : ${summary.blocked.length}`);
  console.log(`⏳ Pending    : ${summary.pending.length}`);

  if (summary.currentTask) {
    const hasPrev = summary.currentTask.lastRecord !== null;
    const action = !hasPrev ? 'START NEW' : summary.currentTask.status === 'completed' ? 'RE-AUDIT / CONTINUE' : 'CONTINUE';
    console.log(`Current Task  : ${summary.currentTask.taskId} — ${summary.currentTask.title}`);
    console.log(`Previous exec : ${hasPrev ? 'FOUND (' + summary.currentTask.lastRecord.filePath + ')' : 'NOT FOUND'}`);
    console.log(`Action        : ${action}`);
  }
  console.log('════════════════════════════════════════\n');
}

// Record Progress function
export function recordProgress(data) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  const taskId = data.taskId || data.task || 'WO-GEN-001';
  const matchedReg = taskRegistry.find((t) => t.taskId.toLowerCase() === taskId.toLowerCase() || t.title.toLowerCase().includes(taskId.toLowerCase()));
  const finalTaskId = matchedReg ? matchedReg.taskId : taskId;
  const title = matchedReg ? matchedReg.title : data.title || data.task || taskId;

  const status = normalizeStatus(data.status || 'completed');
  const result = data.result || (status === 'completed' ? 'PASS' : 'FAIL');

  const filesList = Array.isArray(data.files)
    ? data.files
    : typeof data.file === 'string'
      ? data.file.split(',').map((f) => f.trim())
      : typeof data.files === 'string'
        ? data.files.split(',').map((f) => f.trim())
        : [];

  const recordObj = {
    taskId: finalTaskId,
    title,
    status,
    result,
    timestamp,
    startedAt: data.startedAt || new Date().toISOString(),
    completedAt: status === 'completed' ? new Date().toISOString() : null,
    files: filesList,
    summary: data.summary || data.tujuan || data.pekerjaan || '-',
    changes: Array.isArray(data.changes) ? data.changes : data.pekerjaan ? [data.pekerjaan] : [],
    error: data.error && data.error !== '-' ? data.error : null,
    cause: data.cause && data.cause !== '-' ? data.cause : data.penyebab && data.penyebab !== '-' ? data.penyebab : null,
    fix: data.fix && data.fix !== '-' ? data.fix : data.perbaikan && data.perbaikan !== '-' ? data.perbaikan : null,
    testing: data.testing || 'npm run typecheck && npm run build',
    preventions: data.preventions ? (Array.isArray(data.preventions) ? data.preventions : [data.preventions]) : data.jangan_diulang ? [data.jangan_diulang] : ['- Audit dasar dan verifikasi telah selesai.'],
    nextStep: data.nextStep || data.berikutnya || '-',
  };

  // Write JSON file
  const jsonFileName = `${timestamp}.json`;
  const jsonFilePath = path.join(progresDir, jsonFileName);
  fs.writeFileSync(jsonFilePath, JSON.stringify(recordObj, null, 2), 'utf8');

  // Write MD file for human readability
  const mdFileName = `${timestamp}.md`;
  const mdFilePath = path.join(progresDir, mdFileName);
  const mdContent = `# 📋 PROJECT PROGRESS HISTORY

*   **TaskId:** ${recordObj.taskId}
*   **Title:** ${recordObj.title}
*   **Tanggal & Waktu:** ${timestamp}
*   **Status Task:** ${recordObj.status}
*   **Hasil Eksekusi:** ${recordObj.result}

## 🎯 TUJUAN / SUMMARY
${recordObj.summary}

## 📂 FILE / AREA YANG DIMODIFIKASI
${recordObj.files.join(', ') || '-'}

## 🛠️ PEKERJAAN YANG DILAKUKAN
${recordObj.changes.join('\n') || '-'}

## 🐛 ERROR HISTORY
*   **Error:** ${recordObj.error || '-'}
*   **Cause:** ${recordObj.cause || '-'}
*   **Fix:** ${recordObj.fix || '-'}
*   **Test:** ${recordObj.testing}
*   **Result:** ${recordObj.result}

## 📝 KEPUTUSAN ARSITEKTUR
${data.keputusan || '-'}

## 🚫 JANGAN DIULANG
${recordObj.preventions.join('\n') || '-'}

## ⏭️ LANGKAH BERIKUTNYA
${recordObj.nextStep}
`;

  fs.writeFileSync(mdFilePath, mdContent, 'utf8');

  console.log(`Progress recorded at:`);
  console.log(`  JSON: ./progres/${jsonFileName}`);
  console.log(`  MD  : ./progres/${mdFileName}`);
  return recordObj;
}

// CLI Execution Mode
const args = process.argv.slice(2);
const params = {};

args.forEach((arg) => {
  if (arg.startsWith('--')) {
    const keyParts = arg.substring(2).split('=');
    const key = keyParts[0];
    const valueParts = keyParts.slice(1);
    if (valueParts.length > 0) {
      params[key] = valueParts.join('=').replace(/\\n/g, '\n');
    } else {
      params[key] = 'true';
    }
  }
});

// Run Preflight if requested or by default if --preflight or --task provided without record flag
if (params.preflight || params.check || (params.task && !params.status && !params.summary && !params.pekerjaan)) {
  const currentTask = params.task || params.taskId || params.preflight;
  preflight(typeof currentTask === 'string' ? currentTask : 'WO-PROG-001');
} else if (params.task || params.taskId || params.status || params.summary) {
  recordProgress(params);
} else {
  // Default CLI run: show preflight
  preflight('WO-PROG-001');
}
