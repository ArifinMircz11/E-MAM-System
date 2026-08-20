import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (file: string) => void) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist' && f !== '.next') {
        walk(dirPath, callback);
      }
    } else {
      callback(path.join(dir, f));
    }
  });
}

const targetFiles: string[] = [];
walk('./src', (file) => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    targetFiles.push(file);
  }
});
walk('./components', (file) => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    targetFiles.push(file);
  }
});

targetFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // 1. Fix Layout Imports in components/
  if (file.startsWith('components/')) {
    newContent = newContent.replace(/from '\.\/Layout'/g, "from '../src/layouts/Layout'");
    newContent = newContent.replace(/from '\.\/Icons'/g, "from '../src/components/Icons'");
  }

  // 2. Fix Layout Imports in others
  newContent = newContent.replace(/from '\.\.\/layouts\/Layout'/g, "from '../src/layouts/Layout'");
  newContent = newContent.replace(
    /from '\.\.\/components\/Icons'/g,
    "from '../src/components/Icons'",
  );

  // 3. Fix Type Imports
  // If in src/hooks/, need import from ../types (pointing to src/types)
  if (file.startsWith('src/hooks/')) {
    newContent = newContent.replace(/from '\.\.\/\.\.\/types'/g, "from '../types'");
    newContent = newContent.replace(/from '\.\.\/types'/g, "from '../types'");
  }

  // Actually, simplest rule if types are in /src/types is always point relative to /src/types
  // ../../types -> ../types (if from /src/hooks)
  // Let's replace all '../../types' with '../src/types' and './types' with 'src/types' etc...
  // Wait, let's just use absolute imports from 'src/...'
  newContent = newContent.replace(/from '(\.\.\/)+types'/g, "from 'src/types'");

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
