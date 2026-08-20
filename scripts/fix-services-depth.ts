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
walk('./src', (file) => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) targetFiles.push(file);
});

targetFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');

  // Calculate relative depth from root
  const depth = file.split('/').length - 1;
  const relativePathToRoot = '../'.repeat(depth - 1); // components is depth 1
  // Wait, that's not quite right.
  // components/App.tsx -> depth 2. Relative to root is just ../
  // components/StudentData/Modal.tsx -> depth 3. Relative to root is ../../

  const rel = '../'.repeat(file.split('/').length - 1);

  // Fix imports from ../../../services to correct depth
  // The goal is just 'services/' at root level, so we just need '../../services' relative to /components/
  // The simplest is to replace `from '@/services/` with `from '${rel}services/`

  // Actually, just standardize all `../../../services/` in components to `../services/`
  // if 1 level deep, or `../../services/` if 2 levels deep.

  // Let's use a simpler heuristic:
  const newContent = content.replace(/from ['"](\.\.\/)+services\//g, (match, p1) => {
    const parts = file.split('/');
    const depth = parts.length - 2; // For components/x.tsx, depth=1
    return `from '${'../'.repeat(depth + 1)}services/`;
  });

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
