import fs from 'fs';
import path from 'path';

export function runStructureAudit() {
  console.log('🔍 [Audit Structure] Checking Feature Folder Structure...');
  const featuresDir = path.resolve('src/features');
  let issues = 0;

  if (!fs.existsSync(featuresDir)) {
    console.log('⚠️  src/features directory does not exist!');
    return 1;
  }

  const features = fs.readdirSync(featuresDir).filter((file) => {
    return fs.statSync(path.join(featuresDir, file)).isDirectory();
  });

  const mandatorySubdirs = ['components', 'hooks', 'services', 'repositories', 'types'];

  features.forEach((feature) => {
    const featurePath = path.join(featuresDir, feature);
    mandatorySubdirs.forEach((sub) => {
      const subPath = path.join(featurePath, sub);
      if (!fs.existsSync(subPath)) {
        console.log(`⚠️  [Feature: ${feature}] Missing standard layer: /${sub}`);
        issues++;
      }
    });
  });

  if (issues === 0) {
    console.log('✅ [Audit Structure] All features strictly comply with the 5 mandatory layers!');
  } else {
    console.log(`⚠️  [Audit Structure] Total structural recommendations: ${issues}`);
  }

  return issues;
}

if (process.argv[1]?.endsWith('structure.ts')) {
  runStructureAudit();
}
