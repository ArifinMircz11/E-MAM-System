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

targetFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');

  // Fix imports like '../src/types' to '../types'
  let newContent = content.replace(/from '\.\.\/src\/types'/g, "from '../types'");

  // Fix imports like '../../src/types' to '../../types'
  newContent = newContent.replace(/from '\.\.\/\.\.\/src\/types'/g, "from '../../types'");

  // Fix wrong relative paths for Layout
  // If in components/, import from ../layouts/Layout
  if (file.startsWith('components/')) {
    newContent = newContent.replace(/from '\.\.\/layouts\/Layout'/g, "from './Layout'");
  }

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
