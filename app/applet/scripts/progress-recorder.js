import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const params = {};

args.forEach((arg) => {
  if (arg.startsWith('--')) {
    const [key, ...valueParts] = arg.substring(2).split('=');
    if (valueParts.length > 0) {
      params[key] = valueParts.join('=').replace(/\\n/g, '\n');
    }
  }
});

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const timestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
const fileName = `${timestamp}.md`;
const filePath = path.join(process.cwd(), 'progres', fileName);

const content = `# 📋 PROJECT PROGRESS HISTORY

*   **Tanggal & Waktu:** ${timestamp}
*   **Task:** ${params.task || '-'}
*   **Status Task:** ${params.status || '-'}
*   **Hasil Eksekusi:** ${params.result || '-'}

## 🎯 TUJUAN (OBJECTIVE)
${params.tujuan || '-'}

## 📂 FILE YANG DIMODIFIKASI
${params.file || '-'}

## 🛠️ PEKERJAAN YANG DILAKUKAN
${params.pekerjaan || '-'}

## 🐛 ERROR YANG DITEMUKAN
${params.error || '-'}

## 🔍 PENYEBAB ERROR (ROOT CAUSE)
${params.penyebab || '-'}

## 🔧 PERBAIKAN YANG DILAKUKAN (FIXES)
${params.perbaikan || '-'}

## 🧪 TESTING & VERIFIKASI
${params.testing || '-'}

## 📝 KEPUTUSAN ARSITEKTUR (ADR / NOTES)
${params.keputusan || '-'}

## 🚫 JANGAN DIULANGI LAGI (PREVENTION)
${params.jangan_diulang ? params.jangan_diulang.split('|').map(i => '- ' + i).join('\n') : '-'}

## ⏭️ LANGKAH BERIKUTNYA
${params.berikutnya || '-'}
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Progress recorded at: ./progres/${fileName}`);
