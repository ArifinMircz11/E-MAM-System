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
walk('./src/layouts', (file) => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) targetFiles.push(file);
});

targetFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Fix imports to root /services/
  // Current components are 1 level deep (components/StudentData.tsx), or 2 level deep (src/modules/dashboard/Dashboard.tsx)

  // Rule: Replace ../services/ or ../../services/ or ../../../services/ with the correct path to root /services/
  // The easiest is just replacing it with an absolute path or a robust relative one.

  newContent = newContent.replace(/from ['"](\.\.\/)+services\//g, "from '@/services/");

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
