import fs from 'node:fs';
import path from 'node:path';

const FEATURES_DIR = path.resolve('src/features');

const OPTIONAL_LAYERS = [
  'components',
  'hooks',
  'services',
  'types',
  'repositories',
];

function getFeatureDirs(): string[] {
  if (!fs.existsSync(FEATURES_DIR)) return [];

  return fs
    .readdirSync(FEATURES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function hasFiles(dir: string): boolean {
  if (!fs.existsSync(dir)) return false;

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .some((entry) => entry.isFile());
}

export function runStructureAudit(): number {
  console.log('🔍 [Audit Structure] Checking Feature Architecture...');

  const features = getFeatureDirs();
  let findings = 0;

  for (const feature of features) {
    const featurePath = path.join(FEATURES_DIR, feature);

    for (const layer of OPTIONAL_LAYERS) {
      const layerPath = path.join(featurePath, layer);

      if (fs.existsSync(layerPath) && !hasFiles(layerPath)) {
        console.log(
          `⚠️ [Feature: ${feature}] Empty layer detected: /${layer}`,
        );
        findings++;
      }
    }
  }

  if (findings === 0) {
    console.log(
      '✅ [Audit Structure] No structural violations found.',
    );
  } else {
    console.log(
      `⚠️ [Audit Structure] ${findings} structural findings.`,
    );
  }

  return findings;
}
