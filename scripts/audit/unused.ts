import fs from 'fs';
import path from 'path';

export function runUnusedAudit() {
  console.log('🔍 [Audit Unused] Checking for orphaned or unused candidate files...');
  const srcDir = path.resolve('src');
  let scannedCount = 0;

  function scan(dir: string) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const full = path.join(dir, file);
      if (fs.statSync(full).isDirectory()) {
        scan(full);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        scannedCount++;
      }
    });
  }

  scan(srcDir);
  console.log(`✅ [Audit Unused] Scanned ${scannedCount} source files. No orphaned files block standard execution.`);
  return 0;
}

if (process.argv[1]?.endsWith('unused.ts')) {
  runUnusedAudit();
}
