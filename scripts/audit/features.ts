import fs from 'fs';
import path from 'path';

export function runFeaturesAudit(): number {
  console.log('🔍 [Audit Features] Auditing Feature Isolation & Direct Firestore Access...');

  const srcDir = path.resolve('src');
  let issues = 0;

  function scan(dir: string): void {
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);

      if (fs.statSync(full).isDirectory()) {
        if (file !== 'node_modules' && file !== 'dist') {
          scan(full);
        }
        continue;
      }

      if (!file.endsWith('.ts') && !file.endsWith('.tsx')) {
        continue;
      }

      const content = fs.readFileSync(full, 'utf8');
      const relativePath = path.relative(process.cwd(), full);

      /*
       * ENTERPRISE FIRESTORE LOCK
       *
       * Firebase/Firestore SDK access is permitted ONLY inside:
       *   src/services/sync/
       *   src/services/realtime/
       *   src/services/SyncEngine.ts
       *   src/services/masterSyncService.ts
       *   src/sync/
       *   src/core/sync/
       *
       * Gateways, firebase.ts, domain services, repositories,
       * features, hooks and UI are NOT trusted boundaries.
       */

      const normalized = relativePath.replace(/\\/g, '/');

      const isAuthorizedFirestoreBoundary =
        normalized.startsWith('src/services/sync/') ||
        normalized.startsWith('src/services/realtime/') ||
        normalized === 'src/services/SyncEngine.ts' ||
        normalized === 'src/services/masterSyncService.ts' ||
        normalized.startsWith('src/sync/') ||
        normalized.startsWith('src/core/sync/');

      const hasDirectFirestoreImport =
        /from\s+['"]firebase\/firestore['"]/.test(content) ||
        /from\s+['"]@firebase\/firestore['"]/.test(content);

      if (hasDirectFirestoreImport && !isAuthorizedFirestoreBoundary) {
        console.log(
          `❌ [Rule Violation - Firestore Lock] Direct Firestore import in: ${normalized}`,
        );
        issues++;
      }
    }
  }

  scan(srcDir);

  if (issues === 0) {
    console.log(
      '✅ [Audit Features] Zero illegal Firestore imports detected outside authorized sync boundaries!',
    );
  } else {
    console.log(
      `❌ [Audit Features] Found ${issues} Firestore access violations.`,
    );
  }

  return issues;
}

if (process.argv[1]?.endsWith('features.ts')) {
  runFeaturesAudit();
}
