const fs = require('fs');

const files = ['src/services/studentService.ts', 'src/services/teacherService.ts'];
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/sistemJangkar\.tenantId/g, 'tenantId');
  fs.writeFileSync(f, content);
}
console.log('Done');
