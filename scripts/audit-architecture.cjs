/**
 * @license
 * e-Mam System - Architecture Static Compliance Analyzer (audit-architecture.cjs)
 * Enforces Offline-First, Local-First, and Zero Firestore Leak doctrines.
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Allowed folders for Firebase Firestore SDK imports
const ALLOWED_FIREBASE_FOLDERS = [
  path.join('src', 'services', 'sync'),
  path.join('src', 'services', 'masterSyncService.ts'),
  path.join('src', 'services', 'realtime'),
  path.join('src', 'sync'),
  path.join('src', 'infrastructure', 'sync'),
  path.join('src', 'services', 'SyncEngine.ts'),
];

let criticalErrors = 0;
let warnings = 0;

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function isAllowedFirebasePath(filePath) {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  for (const allowed of ALLOWED_FIREBASE_FOLDERS) {
    if (relativePath.includes(allowed) || relativePath === allowed) {
      return true;
    }
  }
  return false;
}

function runAudit() {
  console.log('\x1b[36m====================================================\x1b[0m');
  console.log('\x1b[36m  e-Mam System Architecture Static Compliance Audit  \x1b[0m');
  console.log('\x1b[36m====================================================\x1b[0m');

  if (!fs.existsSync(SRC_DIR)) {
    console.error('\x1b[31m[ERROR] /src directory not found!\x1b[0m');
    process.exit(1);
  }

  const allFiles = walkDir(SRC_DIR);
  console.log(`[Info] Scanning ${allFiles.length} files under /src...\n`);

  allFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(path.join(__dirname, '..'), file);

    // Check Category A: Firestore Leak
    if (content.includes("from 'firebase/firestore'") || content.includes('from "@firebase/firestore"') || content.includes("import('firebase/firestore')")) {
      if (!isAllowedFirebasePath(file)) {
        console.error(`\x1b[41m[PELANGGARAN KRITIS KELAS A]\x1b[00m \x1b[31mFirestore SDK import detected outside allowed sync gateway in: ${relativePath}\x1b[0m`);
        criticalErrors++;
      }
    }

    // Check Category B: Repository Inheritance Check (*repository.ts or *Repository.ts)
    if ((file.endsWith('repository.ts') || file.endsWith('Repository.ts')) && !file.endsWith('BaseRepository.ts') && !file.endsWith('IRepository.ts')) {
      if (!content.includes('extends BaseRepository')) {
        console.warn(`\x1b[33m[WARNING KATEGORI B]\x1b[0m Repository does not extend BaseRepository: ${relativePath}`);
        warnings++;
      }
    }

    // Check Category C: Runtime .filter() in Repositories
    if ((file.endsWith('repository.ts') || file.endsWith('Repository.ts')) && !file.endsWith('BaseRepository.ts')) {
      if (content.includes('.filter(')) {
        console.warn(`\x1b[33m[WARNING KATEGORI C]\x1b[0m Potential anti-pattern runtime .filter() in repository: ${relativePath}. Consider Dexie compound index.`);
        warnings++;
      }
    }
  });

  console.log('\n\x1b[36m----------------------------------------------------\x1b[0m');
  console.log(`Scan Summary: ${allFiles.length} files scanned.`);
  console.log(`Critical Errors (Firestore Leaks): ${criticalErrors}`);
  console.log(`Structural Warnings: ${warnings}`);
  console.log('\x1b[36m----------------------------------------------------\x1b[0m');

  if (criticalErrors > 0) {
    console.error('\x1b[41m AUDIT FAILED: Critical Architecture Violations Detected! \x1b[0m');
    process.exit(1);
  } else {
    console.log('\x1b[32m AUDIT PASSED: All local-first architecture guardrails verified successfully. \x1b[0m');
    process.exit(0);
  }
}

runAudit();
