import fs from 'fs';
import path from 'path';

export function runFixStructure() {
  console.log('🔧 [Fix Structure] Verifying and scaffolding missing feature directory layers...');
  const featuresDir = path.resolve('src/features');

  if (!fs.existsSync(featuresDir)) return;

  const mandatorySubdirs = ['components', 'hooks', 'services', 'repositories', 'types'];
  const features = fs.readdirSync(featuresDir).filter((file) => {
    return fs.statSync(path.join(featuresDir, file)).isDirectory();
  });

  features.forEach((feature) => {
    const featurePath = path.join(featuresDir, feature);
    mandatorySubdirs.forEach((sub) => {
      const subPath = path.join(featurePath, sub);
      if (!fs.existsSync(subPath)) {
        fs.mkdirSync(subPath, { recursive: true });
        console.log(`✨ Created missing layer directory: src/features/${feature}/${sub}`);
      }
    });
  });

  console.log('✅ [Fix Structure] Feature layer structures verified and updated.');
}

if (process.argv[1]?.endsWith('structure.ts')) {
  runFixStructure();
}
