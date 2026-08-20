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
walk('./components', (file) => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) targetFiles.push(file);
});

targetFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Change ../../services to ../services in components/
  newContent = newContent.replace(/from ['"]\.\.\/\.\.\/services\//g, "from '@/services/");
  newContent = newContent.replace(/from ['"]\.\.\/\.\.\/store['"]/g, "from '@/store'");
  newContent = newContent.replace(/from ['"]\.\.\/\.\.\/constants\//g, "from '../constants/");
  newContent = newContent.replace(/from ['"]\.\.\/\.\.\/types['"]/g, "from '../types'");

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
