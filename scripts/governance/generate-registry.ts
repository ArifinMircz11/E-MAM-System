import fs from 'fs';
import { load } from 'js-yaml';
import path from 'path';

const manifestPath = 'docs/governance/entity-registry.yaml';
const outputPath = 'src/domain/registry/entities.generated.ts';

try {
  const fileContents = fs.readFileSync(manifestPath, 'utf8');
  const data = load(fileContents) as { entities: string[] };

  const tsContent = `// Auto-generated file. Do not edit manually.
export const GENERATED_ENTITIES = [
${data.entities.map(e => `  '${e}',`).join('\n')}
] as const;

export type GeneratedEntity = typeof GENERATED_ENTITIES[number];
`;

  fs.writeFileSync(outputPath, tsContent);
  console.log('Registry generated successfully at', outputPath);
} catch (e) {
  console.error('Error generating registry:', e);
  process.exit(1);
}
