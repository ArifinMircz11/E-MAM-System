const fs = require('fs');
const files = [
  'src/services/attendanceService.ts',
  'src/services/pointService.ts',
  'src/services/classService.ts',
  'src/services/studentService.ts',
  'src/services/teacherService.ts',
  'src/services/userService.ts',
  'src/services/dashboardService.ts',
  'src/services/letterService.ts',
  'src/services/notificationService.ts',
  'src/services/eventService.ts',
  'src/services/academicService.ts',
  'src/services/gradeService.ts',
  'src/services/chatService.ts',
  'src/services/classChatService.ts',
  'src/services/complaintService.ts',
  'src/services/newsService.ts',
  'src/services/scheduleService.ts',
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /const tenantId = (?:use)?userStore(?:\.getState\(\))?\.tenantId \|\| '30315537';/g,
    'const tenantId = useUserStore.getState().tenantId; if (!tenantId) throw new Error("tenantId required");',
  );
  content = content.replace(
    /tenantId: payload\.tenantId \|\| '30315537'/g,
    'tenantId: payload.tenantId',
  );
  content = content.replace(/payload\.tenantId \|\| '30315537'/g, 'payload.tenantId');
  fs.writeFileSync(file, content);
}
console.log('Done');
