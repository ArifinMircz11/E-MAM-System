import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run scaffold:feature <feature-name>');
  process.exit(1);
}

const featureName = args[0];
const baseDir = `src/features/${featureName}`;

if (fs.existsSync(baseDir)) {
  console.error(`Feature '${featureName}' already exists.`);
  process.exit(1);
}

// Read Templates/Rules
const templateConfig = yaml.load(fs.readFileSync('docs/governance/feature-template.yaml', 'utf8')) as any;

// Generate Structure
const folders = ['components', 'hooks', 'store', 'services', 'repositories', 'types'];
fs.mkdirSync(baseDir, { recursive: true });
folders.forEach(folder => fs.mkdirSync(path.join(baseDir, folder)));

// Create Files
const pascalName = featureName.charAt(0).toUpperCase() + featureName.slice(1);

fs.writeFileSync(path.join(baseDir, 'index.ts'), `export * from './components/${pascalName}View';\n`);

fs.writeFileSync(path.join(baseDir, `components/${pascalName}View.tsx`), 
`import React from 'react';

export const ${pascalName}View: React.FC = () => {
  return <div>${pascalName} View</div>;
};
`);

fs.writeFileSync(path.join(baseDir, `services/${featureName}Service.ts`), 
`// Business Logic for ${pascalName}
export class ${pascalName}Service {
  // Logic here
}
`);

fs.writeFileSync(path.join(baseDir, `repositories/${featureName}Repository.ts`), 
`import { BaseRepository } from '@/repositories/BaseRepository';
import type { ${pascalName}Item } from '../types/${featureName}.types';

export class ${pascalName}Repository extends BaseRepository<${pascalName}Item> {
  constructor() {
    super('${featureName}');
  }
}
`);

fs.writeFileSync(path.join(baseDir, `types/${featureName}.types.ts`), 
`import type { AppEntity } from '@/domain/entities/base';

export interface ${pascalName}Item extends AppEntity {
  // Fields
}
`);

console.log(`Feature '${featureName}' scaffolded successfully.`);
