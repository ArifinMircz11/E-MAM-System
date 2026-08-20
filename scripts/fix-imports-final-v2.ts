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

const typesFilePath = path.resolve('./src/types/index.ts');

targetFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Find all imports of 'types'
  newContent = newContent.replace(/from ['"](.*)types['"]/g, (match, importPath) => {
    // If it already contains 'src/types' or './types', we skip
    if (match.includes('src/types') || match.includes('./types')) return match;

    const absoluteImportPath = path.resolve(path.dirname(file), importPath + '.ts'); // Approximate
    const relativePath = path.relative(path.dirname(file), typesFilePath);

    let resultPath = relativePath.replace('.ts', '').replace('/index', '');
    if (!resultPath.startsWith('.')) {
      resultPath = './' + resultPath;
    }

    return `from '${resultPath}'`;
  });

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
