
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
      // Match: from '.../src/...'
      // Do not add .js if it already has one
      content = content.replace(/from '(\.\.?\/)+src\/(.*)(?<!\.js)'/g, "from '$1src/$2.js'");
      content = content.replace(/from '(\.\.?\/)+src\/(.*)(?<!\.js)'/g, "from '$1src/$2.js'");
      
      // Fix imports from local files like ./services or ../services
      content = content.replace(/from '(\.\.?\/)(?!.*\.js)([^']+)'/g, "from '$1$2.js'");

      await fs.writeFile(fullPath, content);
      console.log(`Fixed imports in ${fullPath}`);
    }
  }
}

fixImports('./api').catch(console.error);
