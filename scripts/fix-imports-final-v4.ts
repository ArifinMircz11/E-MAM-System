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
  if (file.endsWith('.tsx') || file.endsWith('.ts')) targetFiles.push(file);
});
walk('./components', (file) => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) targetFiles.push(file);
});

targetFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Icons fixes
  if (file.startsWith('components/')) {
    newContent = newContent.replace(/from ['"]\.\.\/components\/Icons['"]/g, "from './Icons'");
    newContent = newContent.replace(/from ['"]\.\.\/Icons['"]/g, "from './Icons'");
  }

  // Dashboard module fixes
  if (file.startsWith('src/modules/dashboard/')) {
    newContent = newContent.replace(/from ['"]\.\/Dashboard\//g, "from './");
  }

  // Store/Service/Hooks fixes
  newContent = newContent.replace(/from ['"]\.\.\/store['"]/g, "from '@/store'");
  newContent = newContent.replace(/from ['"]\.\.\/services\//g, "from '@/services/");

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
