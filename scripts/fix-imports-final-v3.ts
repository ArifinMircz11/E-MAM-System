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

  // Fix types imports: from 'src/types' to the correct relative path
  const relativePath = path.relative(path.dirname(file), typesFilePath);
  let rel = relativePath.replace('.ts', '').replace('/index', '');
  if (!rel.startsWith('.')) rel = './' + rel;

  newContent = newContent.replace(/from ['"]src\/types['"]/g, `from '${rel}'`);
  newContent = newContent.replace(/from ['"]\.\.\/src\/types['"]/g, `from '${rel}'`);
  newContent = newContent.replace(/from ['"]\.\.\/\.\.\/src\/types['"]/g, `from '${rel}'`);
  newContent = newContent.replace(/from ['"]\.\.\/\.\.\/\.\.\/src\/types['"]/g, `from '${rel}'`);

  // Fix component imports:
  // Move components/Icons.tsx to src/components/Icons.tsx
  newContent = newContent.replace(/from ['"]\.\.\/Icons['"]/g, "from '../components/Icons'");
  newContent = newContent.replace(
    /from ['"]\.\/\.\.\/components\/Icons['"]/g,
    "from '../components/Icons'",
  );

  // Fix Icons relative paths
  newContent = newContent.replace(
    /from ['"]\.\.\/src\/components\/Icons['"]/g,
    "from '../components/Icons'",
  );

  // Fix layout imports
  newContent = newContent.replace(/from ['"]\.\.\/layouts\/[a-zA-Z]+['"]/g, (match) => {
    const fileName = match.split('/').pop()?.replace("'", '');
    return `from '../layouts/${fileName}'`;
  });

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
