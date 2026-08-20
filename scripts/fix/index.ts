import { runFixStructure } from './structure.js';
import { runFixImports } from './imports.js';

console.log('=== 🛠️ RUNNING IMAM SYSTEM AUTO-FIX SUITE ===\n');
runFixStructure();
runFixImports();
console.log('\n==================================================');
console.log('✅ Auto-Fix Suite completed successfully.');
