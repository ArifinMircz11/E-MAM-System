const fs = require('fs');
const path = require('path');

function replaceRecursively(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceRecursively(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      const pattern1 =
        /const\s+tenantId\s*=\s*useUserStore\.getState\(\)\.tenantId\s*\|\|\s*'30315537';/g;
      if (pattern1.test(content)) {
        content = content.replace(
          pattern1,
          'const tenantId = useUserStore.getState().tenantId;\n        if (!tenantId) throw new Error("tenantId required");',
        );
        modified = true;
      }

      const pattern2 = /tenantId\s*\|\|\s*'30315537'/g;
      if (pattern2.test(content)) {
        content = content.replace(pattern2, 'tenantId');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

replaceRecursively('src/services');
replaceRecursively('src/features');
replaceRecursively('src/components');
replaceRecursively('src/hooks');
replaceRecursively('src/lib');
replaceRecursively('src/store');

console.log('Complete');
