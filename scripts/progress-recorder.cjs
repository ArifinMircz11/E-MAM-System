const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const progresDir = path.join(rootDir, 'progres');

if (!fs.existsSync(progresDir)) {
  fs.mkdirSync(progresDir, { recursive: true });
}

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

function scanHistory() {
  if (!fs.existsSync(progresDir)) return [];
  const files = fs.readdirSync(progresDir).filter((f) => f.endsWith('.md'));
  const history = [];

  for (const file of files) {
    const filePath = path.join(progresDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const taskMatch = content.match(/\*\*Task:\*\*\s*(.+)/);
      const statusMatch = content.match(/\*\*Status Task:\*\*\s*(.+)/);
      const resultMatch = content.match(/\*\*Hasil Eksekusi:\*\*\s*(.+)/);
      const fileMatch = content.match(/## 📂 FILE \/ AREA YANG DIMODIFIKASI\s*\n([\s\S]*?)\n\n##/);

      history.push({
        fileName: file,
        filePath: `./progres/${file}`,
        task: taskMatch ? taskMatch[1].trim() : '',
        status: statusMatch ? statusMatch[1].trim() : '',
        result: resultMatch ? resultMatch[1].trim() : '',
        files: fileMatch ? fileMatch[1].trim() : '',
        content,
      });
    } catch (e) {}
  }

  return history;
}

const existingHistory = scanHistory();

if (params['check-duplicate']) {
  const currentTask = (params.task || '').toLowerCase();
  const currentFiles = (params.file || '').toLowerCase();

  const found = existingHistory.find((item) => {
    if (!item.task) return false;
    const taskMatch = currentTask && item.task.toLowerCase().includes(currentTask);
    const fileMatch = currentFiles && item.files.toLowerCase().includes(currentFiles);
    return (taskMatch || fileMatch) && item.status === 'SELESAI';
  });

  if (found) {
    console.log('PREVIOUS WORK FOUND');
    console.log(`Task:\n${found.task}`);
    console.log(`Previous Status:\n${found.status}`);
    console.log(`Previous Result:\n${found.result}`);
    console.log(`Previous Progress:\n${found.filePath}`);
    process.exit(0);
  } else {
    console.log('NO DUPLICATE FOUND');
    process.exit(0);
  }
}

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const timestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
const fileName = `${timestamp}.md`;
const filePath = path.join(progresDir, fileName);

let previousRef = params.referensi || '';
let reasonForReaudit = params.reason || '';

if (!previousRef && params.task) {
  const taskKey = params.task.toLowerCase();
  const match = existingHistory
    .slice()
    .reverse()
    .find((h) => h.task.toLowerCase().includes(taskKey));
  if (match) {
    previousRef = match.filePath;
    if (!reasonForReaudit) {
      reasonForReaudit = `Pekerjaan berlanjut atau modul ${params.file || 'terkait'} mengalami pembaruan setelah riwayat sebelumnya.`;
    }
  }
}

const status = params.status || 'SELESAI';
const result = params.result || 'PASS';

let content = `# 📋 PROJECT PROGRESS HISTORY

*   **Tanggal & Waktu:** ${timestamp}
*   **Task:** ${params.task || '-'}
*   **Status Task:** ${status}
*   **Hasil Eksekusi:** ${result}
`;

if (previousRef) {
  content += `*   **Previous Progress:** ${previousRef}\n`;
}

if (reasonForReaudit) {
  content += `*   **Reason for Re-audit:** ${reasonForReaudit}\n`;
}

content += `
## 🎯 TUJUAN (OBJECTIVE)
${params.tujuan || '-'}

## 📂 FILE / AREA YANG DIMODIFIKASI
${params.file || '-'}

## 🛠️ PEKERJAAN YANG DILAKUKAN
${params.pekerjaan || '-'}

## 🐛 ERROR HISTORY
*   **Error:** ${params.error || '-'}
*   **Cause:** ${params.penyebab || '-'}
*   **Fix:** ${params.perbaikan || '-'}
*   **Test:** ${params.testing || 'npm run typecheck && npm run build'}
*   **Result:** ${result}

## 🔧 PERBAIKAN YANG DILAKUKAN
${params.perbaikan || '-'}

## 🧪 TESTING & VERIFIKASI
${params.testing || '-'}

## 📝 KEPUTUSAN ARSITEKTUR
${params.keputusan || '-'}

## 🚫 JANGAN DIULANG
${params.jangan_diulang || '- Audit dasar dan verifikasi telah selesai.'}

## ⏭️ LANGKAH BERIKUTNYA
${params.berikutnya || '-'}
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Progress recorded at: ./progres/${fileName}`);
