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
walk('./src/layouts', (file) => {
  if (file.endsWith('.tsx')) {
    targetFiles.push(file);
  }
});

targetFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace import ... from './Icons' -> import ... from '../components/Icons'
  const newContent = content.replace(/from '\.\/Icons'/g, "from '../components/Icons'");

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
