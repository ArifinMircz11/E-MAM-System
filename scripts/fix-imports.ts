import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (file: string) => void) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist' && f !== '.next') {
        walk(dirPath, callback);
      }
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
        callback(dirPath);
      }
    }
  });
}

const targetFiles: string[] = [];
walk('.', (file) => {
  targetFiles.push(file);
});

targetFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Fix Icon imports
  newContent = newContent.replace(
    /import {([^}]+)} from ['"](\.\.\/)+src\/components\/Icons['"]/g,
    "import {$1} from '@/src/components/Icons'",
  );

  // Fix Service imports
  newContent = newContent.replace(/from ['"](\.\.\/)+services\//g, "from '@/services/");

  // Fix Store imports
  newContent = newContent.replace(/from ['"](\.\.\/)+store['"]/g, "from '@/store'");

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
