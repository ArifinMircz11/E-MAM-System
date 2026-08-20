
import { promises as fs } from 'fs';
import path from 'path';

async function fixImports(dir) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      await fixImports(fullPath);
    } else if (file.endsWith('.ts')) {
      let content = await fs.readFile(fullPath, 'utf8');
      
      // Fix imports from src/lib/ or src/types/ or src/utils/
      // Matches imports like '../../src/lib/...'
      // Needs to be replaced with '../src/lib/...'
      content = content.replace(/from '(\.\.\/)+src\/(.*)(\.js)?'/g, "from '../src/$2.js'");

      await fs.writeFile(fullPath, content);
      console.log(`Fixed imports in ${fullPath}`);
    }
  }
}

fixImports('./api').catch(console.error);
