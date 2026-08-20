const fs = require('fs');
const path = require('path');

const files = [
  'src/services/localAttendanceStatsService.ts',
  'src/services/journalCacheService.ts',
  'src/services/attendanceService.ts',
  'src/services/gradeService.ts',
  'src/services/attendanceAggregateService.ts',
  'src/services/devConsoleActions.ts',
  'src/services/offlineAutoProcessService.ts',
  'src/services/academicService.ts',
  'src/services/teacherAttendanceService.ts',
  'src/services/teacherService.ts',
  'src/features/student/dashboard/services/studentDashboardService.ts',
];

files.forEach((file) => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(
      /['"](\.\/)?(\.\.\/)?services\/dexieService['"]/g,
      "'@/database/dexie'",
    );
    content = content.replace(/['"]\.\/dexieService['"]/g, "'@/database/dexie'");
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${file}`);
  }
});
