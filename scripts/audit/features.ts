import fs from 'fs';
import path from 'path';

export function runFeaturesAudit() {
  console.log('🔍 [Audit Features] Auditing Feature Isolation & Direct Firestore Access...');
  const srcDir = path.resolve('src');
  let issues = 0;

  function scan(dir: string) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const full = path.join(dir, file);
      if (fs.statSync(full).isDirectory()) {
        if (!file.includes('node_modules') && !file.includes('dist')) {
          scan(full);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(full, 'utf8');
        const relativePath = path.relative(process.cwd(), full);

        // Check Rule 5: Firestore Lock outside sync/realtime
        const isSyncOrRealtime =
          relativePath.includes('services/sync') ||
          relativePath.includes('SyncEngine') ||
          relativePath.includes('masterSyncService') ||
          relativePath.includes('services/realtime') ||
          relativePath.includes('services/gateways') ||
          relativePath.includes('services/firebase') ||
          relativePath.includes('domain/identityEngine');

        if (!isSyncOrRealtime && (content.includes("from 'firebase/firestore'") || content.includes("from '@firebase/firestore'"))) {
          console.log(`❌ [Rule Violation - Firestore Lock] Direct Firestore import in: ${relativePath}`);
          issues++;
        }
      }
    });
  }

  scan(srcDir);

  if (issues === 0) {
    console.log('✅ [Audit Features] Zero illegal Firestore imports detected outside Sync Engine!');
  } else {
    console.log(`❌ [Audit Features] Found ${issues} Firestore access violations.`);
  }

  return issues;
}

if (process.argv[1]?.endsWith('features.ts')) {
  runFeaturesAudit();
}
