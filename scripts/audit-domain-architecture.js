/**
 * audit-domain-architecture.js
 * 
 * Domain Architecture Compliance Audit Tool for e-MAM System Enterprise.
 * 
 * Single Source of Truth (SSOT): docs/04_DOMAIN_ARCHITECTURE.md
 * 
 * Strictly READ-ONLY Audit Execution:
 * - Checks codebase compliance against docs/04_DOMAIN_ARCHITECTURE.md.
 * - Explicitly reports PASS, FAIL, or NOT_SPECIFIED_IN_BLUEPRINT for each rule.
 * - NO automatic fix or repair execution.
 * - DOES NOT modify application code in repository.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root path configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const BLUEPRINT_PATH = path.join(ROOT_DIR, 'docs', '04_DOMAIN_ARCHITECTURE.md');

// Colors for terminal output
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

// Status Symbols
const SYMBOLS = {
  PASS: `${GREEN}${BOLD}[PASS]${RESET}`,
  FAIL: `${RED}${BOLD}[FAIL]${RESET}`,
  NOT_SPECIFIED: `${YELLOW}${BOLD}[NOT_SPECIFIED_IN_BLUEPRINT]${RESET}`,
};

const results = [];

function recordResult(ruleId, category, description, status, details = []) {
  results.push({
    ruleId,
    category,
    description,
    status, // 'PASS' | 'FAIL' | 'NOT_SPECIFIED_IN_BLUEPRINT'
    details,
  });
}

// Utility: Recursively list files matching extension
function getFilesRecursively(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        files = files.concat(getFilesRecursively(fullPath, extensions));
      }
    } else if (extensions.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

// Utility: Read file safely
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return '';
  }
}

// ============================================================================
// AUDIT RUNNER
// ============================================================================

console.log(`${BOLD}${CYAN}=====================================================================${RESET}`);
console.log(`${BOLD}${CYAN}   e-MAM DOMAIN ARCHITECTURE COMPLIANCE AUDIT                       ${RESET}`);
console.log(`${BOLD}${CYAN}   Single Source of Truth: docs/04_DOMAIN_ARCHITECTURE.md           ${RESET}`);
console.log(`${BOLD}${CYAN}=====================================================================${RESET}\n`);

// Verify SSOT exists
if (!fs.existsSync(BLUEPRINT_PATH)) {
  console.error(`${RED}ERROR: Blueprint file docs/04_DOMAIN_ARCHITECTURE.md not found!${RESET}`);
  process.exit(1);
}

// ----------------------------------------------------------------------------
// 1. SECTION 4.11: Pure Domain Core & Dependency Decoupling
// ----------------------------------------------------------------------------
console.log(`${BOLD}Checking Section 4.11: Pure Domain Core & Dependency Decoupling...${RESET}`);

const domainFiles = [
  ...getFilesRecursively(path.join(ROOT_DIR, 'src', 'domain')),
  ...getFilesRecursively(path.join(ROOT_DIR, 'src', 'types')),
];

const forbiddenDomainImports = [
  { pattern: /from\ ['"]react['"]/, name: 'React' },
  { pattern: /from\ ['"]firebase\/.*['"]/, name: 'Firebase SDK' },
  { pattern: /from\ ['"]zustand['"]/, name: 'Zustand' },
  { pattern: /from\ ['"]dexie['"]/, name: 'Dexie' },
];

let domainViolations = [];
for (const file of domainFiles) {
  const relPath = path.relative(ROOT_DIR, file);
  // Exclude non-domain schema helpers if needed, but domain core must be clean
  const content = readFileContent(file);
  for (const { pattern, name } of forbiddenDomainImports) {
    if (pattern.test(content)) {
      domainViolations.push(`${relPath} imports forbidden framework/SDK: ${name}`);
    }
  }
}

if (domainViolations.length === 0) {
  recordResult(
    'SEC_4.11_DECOUPLING',
    'Domain Decoupling',
    'Domain entities and interfaces in src/domain and src/types MUST NOT import React, Firebase SDK, Zustand, or Dexie',
    'PASS',
    ['Pure domain layer is cleanly decoupled from UI, State, and Database SDKs.']
  );
} else {
  recordResult(
    'SEC_4.11_DECOUPLING',
    'Domain Decoupling',
    'Domain entities and interfaces in src/domain and src/types MUST NOT import React, Firebase SDK, Zustand, or Dexie',
    'FAIL',
    domainViolations
  );
}

// ----------------------------------------------------------------------------
// 2. SECTION 4.2 & 4.3: Identity Domain & Security Checks
// ----------------------------------------------------------------------------
console.log(`${BOLD}Checking Section 4.2 & 4.3: Identity Domain & Permission Engine Evaluation...${RESET}`);

// Check User Entity definition in schema/types
const schemaTypesContent = readFileContent(path.join(ROOT_DIR, 'src', 'types', 'schemas.ts')) +
  readFileContent(path.join(ROOT_DIR, 'src', 'types', 'roles.ts')) +
  readFileContent(path.join(ROOT_DIR, 'src', 'domain', 'entities', 'user.ts'));

const requiredUserFields = ['accountType', 'role', 'roles', 'status'];
const missingUserFields = [];
for (const field of requiredUserFields) {
  if (!schemaTypesContent.includes(field)) {
    missingUserFields.push(`User Entity missing field specification: ${field}`);
  }
}

if (missingUserFields.length === 0) {
  recordResult(
    'SEC_4.2_USER_ENTITY',
    'Identity Domain',
    'User Entity structure contains required fields (accountType, role, roles, status)',
    'PASS',
    ['User Entity adheres to blueprint specifications.']
  );
} else {
  recordResult(
    'SEC_4.2_USER_ENTITY',
    'Identity Domain',
    'User Entity structure contains required fields (accountType, role, roles, status)',
    'FAIL',
    missingUserFields
  );
}

// Check Rule 3: No Direct Hardcoding Role checks in UI Components
const componentFiles = [
  ...getFilesRecursively(path.join(ROOT_DIR, 'src', 'components')),
  ...getFilesRecursively(path.join(ROOT_DIR, 'src', 'features')),
];

const directRoleCheckViolations = [];
const directRolePattern = /user\.role\s*===\s*['"](admin|guru|operator|siswa|headmaster|kepala_madrasah)['"]/g;

for (const file of componentFiles) {
  const relPath = path.relative(ROOT_DIR, file);
  if (relPath.includes('/developer/')) continue; // Developer console internal tools exempt
  const content = readFileContent(file);
  let match;
  while ((match = directRolePattern.exec(content)) !== null) {
    directRoleCheckViolations.push(`${relPath}: Direct hardcoded role evaluation '${match[0]}' found instead of Permission Engine check`);
  }
}

if (directRoleCheckViolations.length === 0) {
  recordResult(
    'SEC_4.2_NO_HARDCODED_ROLES',
    'Identity Domain',
    'Component UI security checks evaluate capabilities via Permission Engine rather than parsing user roles directly',
    'PASS',
    ['No hardcoded UI role comparisons found.']
  );
} else {
  recordResult(
    'SEC_4.2_NO_HARDCODED_ROLES',
    'Identity Domain',
    'Component UI security checks evaluate capabilities via Permission Engine rather than parsing user roles directly',
    'FAIL',
    directRoleCheckViolations
  );
}

// ----------------------------------------------------------------------------
// 3. SECTION 4.5: Student Domain & Invariants
// ----------------------------------------------------------------------------
console.log(`${BOLD}Checking Section 4.5: Student Domain & Invariants...${RESET}`);

const studentTypeContent = readFileContent(path.join(ROOT_DIR, 'src', 'types', 'index.ts')) +
  readFileContent(path.join(ROOT_DIR, 'src', 'types', 'schemas.ts'));

const requiredStudentFields = ['idUnik', 'tenantId', 'nisn', 'name', 'gender', 'birthDate', 'classId', 'parentId', 'status'];
const missingStudentFields = [];

for (const field of requiredStudentFields) {
  if (!studentTypeContent.includes(field)) {
    missingStudentFields.push(`Student Entity missing field: ${field}`);
  }
}

if (missingStudentFields.length === 0) {
  recordResult(
    'SEC_4.5_STUDENT_ENTITY',
    'Student Domain',
    'Student Entity schema contains required properties (idUnik, tenantId, nisn, name, gender, birthDate, classId, parentId, status)',
    'PASS',
    ['Student Entity structure is compliant.']
  );
} else {
  recordResult(
    'SEC_4.5_STUDENT_ENTITY',
    'Student Domain',
    'Student Entity schema contains required properties (idUnik, tenantId, nisn, name, gender, birthDate, classId, parentId, status)',
    'FAIL',
    missingStudentFields
  );
}

// ----------------------------------------------------------------------------
// 4. SECTION 4.6: Teacher Domain & Invariants
// ----------------------------------------------------------------------------
console.log(`${BOLD}Checking Section 4.6: Teacher Domain & Invariants...${RESET}`);

const teacherTypeContent = readFileContent(path.join(ROOT_DIR, 'src', 'types', 'index.ts')) +
  readFileContent(path.join(ROOT_DIR, 'src', 'types', 'schemas.ts'));

const requiredTeacherFields = ['tenantId', 'nip', 'name', 'status'];
const missingTeacherFields = [];

for (const field of requiredTeacherFields) {
  if (!teacherTypeContent.includes(field)) {
    missingTeacherFields.push(`Teacher Entity missing field: ${field}`);
  }
}

if (missingTeacherFields.length === 0) {
  recordResult(
    'SEC_4.6_TEACHER_ENTITY',
    'Teacher Domain',
    'Teacher Entity schema contains required properties (tenantId, nip, name, status)',
    'PASS',
    ['Teacher Entity structure is compliant.']
  );
} else {
  recordResult(
    'SEC_4.6_TEACHER_ENTITY',
    'Teacher Domain',
    'Teacher Entity schema contains required properties (tenantId, nip, name, status)',
    'FAIL',
    missingTeacherFields
  );
}

// ----------------------------------------------------------------------------
// 5. SECTION 4.7: Attendance Domain Architecture & 5-Session Structure
// ----------------------------------------------------------------------------
console.log(`${BOLD}Checking Section 4.7: Attendance Domain & 5-Session Structure...${RESET}`);

const attendanceContent = readFileContent(path.join(ROOT_DIR, 'src', 'types', 'index.ts')) +
  readFileContent(path.join(ROOT_DIR, 'src', 'types', 'schemas.ts')) +
  readFileContent(path.join(ROOT_DIR, 'src', 'domain', 'entities', 'base.ts'));

// 5.1: Check 1 Student + 1 Day = 1 Attendance Document (attendanceId format)
const attKeyViolations = [];
if (!attendanceContent.includes('attendanceId') && !attendanceContent.includes('studentId')) {
  attKeyViolations.push('Attendance record schema does not explicitly define composite primary key attendanceId (${studentId}_${date})');
}

// 5.2: Check 5-Session structure (masuk, duha, zuhur, ashar, pulang)
const sessionNames = ['masuk', 'duha', 'zuhur', 'ashar', 'pulang'];
const missingSessions = [];
for (const s of sessionNames) {
  if (!attendanceContent.includes(s)) {
    missingSessions.push(`Attendance 5-Session structure missing session property: '${s}'`);
  }
}

if (missingSessions.length === 0) {
  recordResult(
    'SEC_4.7_ATTENDANCE_5_SESSIONS',
    'Attendance Domain',
    'Attendance Record enforces 5-Session monitoring structure (masuk, duha, zuhur, ashar, pulang)',
    'PASS',
    ['All 5 sessions are explicitly defined in the schema.']
  );
} else {
  recordResult(
    'SEC_4.7_ATTENDANCE_5_SESSIONS',
    'Attendance Domain',
    'Attendance Record enforces 5-Session monitoring structure (masuk, duha, zuhur, ashar, pulang)',
    'FAIL',
    missingSessions
  );
}

// 5.3: Check PTSP Surat linkage (suratId: { izin, sakit })
if (attendanceContent.includes('suratId') || attendanceContent.includes('izin') || attendanceContent.includes('sakit')) {
  recordResult(
    'SEC_4.7_ATTENDANCE_PTSP_LINK',
    'Attendance Domain',
    'Attendance Record defines linkage to PTSP Leave Approval system (suratId)',
    'PASS',
    ['PTSP leave approval linkage properties detected.']
  );
} else {
  recordResult(
    'SEC_4.7_ATTENDANCE_PTSP_LINK',
    'Attendance Domain',
    'Attendance Record defines linkage to PTSP Leave Approval system (suratId)',
    'FAIL',
    ['Attendance Record schema lacks suratId (PTSP leave approval linkage) properties.']
  );
}

// 5.4: Check Derived Output (statusHarian, poinHarian)
if (attendanceContent.includes('statusHarian') || attendanceContent.includes('poinHarian') || attendanceContent.includes('derived')) {
  recordResult(
    'SEC_4.7_ATTENDANCE_DERIVED_OUTPUT',
    'Attendance Domain',
    'Attendance Record stores derived calculated outputs (derived.statusHarian, derived.poinHarian)',
    'PASS',
    ['Derived daily status and daily points output properties present.']
  );
} else {
  recordResult(
    'SEC_4.7_ATTENDANCE_DERIVED_OUTPUT',
    'Attendance Domain',
    'Attendance Record stores derived calculated outputs (derived.statusHarian, derived.poinHarian)',
    'FAIL',
    ['Attendance Record schema missing derived outputs (derived.statusHarian, derived.poinHarian).']
  );
}

// 5.5: Check Data Access Constraint: Repositories Dexie ONLY
const attRepoFiles = [
  path.join(ROOT_DIR, 'src', 'repositories', 'attendanceRepository.ts'),
  path.join(ROOT_DIR, 'src', 'features', 'attendance', 'services', 'attendanceService.ts'),
  path.join(ROOT_DIR, 'src', 'features', 'presensi', 'repositories', 'presensiRepository.ts'),
];

const attRepoViolations = [];
for (const repoFile of attRepoFiles) {
  if (fs.existsSync(repoFile)) {
    const content = readFileContent(repoFile);
    if (/import.*firebase\/firestore/.test(content)) {
      attRepoViolations.push(`${path.relative(ROOT_DIR, repoFile)} imports firebase/firestore directly instead of Dexie local DB`);
    }
  }
}

if (attRepoViolations.length === 0) {
  recordResult(
    'SEC_4.7_ATTENDANCE_REPO_DEXIE',
    'Attendance Domain',
    'Attendance Repository and Services operate via Dexie local DB ONLY (No direct Firestore imports)',
    'PASS',
    ['Attendance data access strictly follows local-first Dexie architecture.']
  );
} else {
  recordResult(
    'SEC_4.7_ATTENDANCE_REPO_DEXIE',
    'Attendance Domain',
    'Attendance Repository and Services operate via Dexie local DB ONLY (No direct Firestore imports)',
    'FAIL',
    attRepoViolations
  );
}

// ----------------------------------------------------------------------------
// 6. SECTION 4.1 & 4.12: Check Unspecified Domains / Features
// ----------------------------------------------------------------------------
console.log(`${BOLD}Checking Section 4.1 & 4.12: Unspecified Domain Features in Codebase...${RESET}`);

const specifiedDomainsInBlueprint = [
  'identity',
  'academic',
  'student',
  'teacher',
  'attendance',
  'assessment',
  'letter',
  'report',
  'reports',
  'administration',
  'presensi',
  'points',
  'classes',
  'users',
  'auth',
  'profile',
  'journals',
  'events',
  'notifications',
  'developer',
  'settings',
  'akademik',
  'dashboard',
  'audit',
  'messages',
];

const featureDirs = fs.readdirSync(path.join(ROOT_DIR, 'src', 'features'), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

const unspecifiedDomains = [];
for (const feat of featureDirs) {
  if (!specifiedDomainsInBlueprint.includes(feat.toLowerCase())) {
    unspecifiedDomains.push(`Feature directory 'src/features/${feat}' is NOT explicitly specified in Section 4.1 Domain Landscape or Section 4.12 Bounded Contexts`);
  }
}

// Check domain entity files
const entityFiles = getFilesRecursively(path.join(ROOT_DIR, 'src', 'domain', 'entities'))
  .map(f => path.basename(f, '.ts'));

const specifiedEntities = [
  'base',
  'user',
  'academic',
  'class',
  'schedule',
  'teacher',
  'letter',
  'notification',
  'point',
  'profileRequest',
];

for (const entity of entityFiles) {
  if (!specifiedEntities.includes(entity)) {
    unspecifiedDomains.push(`Entity 'src/domain/entities/${entity}.ts' is NOT explicitly specified in docs/04_DOMAIN_ARCHITECTURE.md`);
  }
}

if (unspecifiedDomains.length > 0) {
  recordResult(
    'SEC_4.1_UNSPECIFIED_DOMAINS',
    'Domain Landscape',
    'Codebase domain features and entities present that are not documented in blueprint landscape',
    'NOT_SPECIFIED_IN_BLUEPRINT',
    unspecifiedDomains
  );
} else {
  recordResult(
    'SEC_4.1_UNSPECIFIED_DOMAINS',
    'Domain Landscape',
    'All codebase features and entities are covered in blueprint landscape',
    'PASS',
    ['All codebase domain directories match the architecture blueprint.']
  );
}

// ============================================================================
// AUDIT SUMMARY REPORT
// ============================================================================
console.log(`\n${BOLD}${CYAN}=====================================================================${RESET}`);
console.log(`${BOLD}${CYAN}   AUDIT SUMMARY RESULTS                                           ${RESET}`);
console.log(`${BOLD}${CYAN}=====================================================================${RESET}\n`);

let passCount = 0;
let failCount = 0;
let notSpecifiedCount = 0;

results.forEach((res, index) => {
  let statusSymbol = SYMBOLS.PASS;
  if (res.status === 'FAIL') {
    statusSymbol = SYMBOLS.FAIL;
    failCount++;
  } else if (res.status === 'NOT_SPECIFIED_IN_BLUEPRINT') {
    statusSymbol = SYMBOLS.NOT_SPECIFIED;
    notSpecifiedCount++;
  } else {
    passCount++;
  }

  console.log(`${BOLD}${index + 1}. [${res.ruleId}] ${res.category}:${RESET} ${res.description}`);
  console.log(`   Status: ${statusSymbol}`);
  if (res.details && res.details.length > 0) {
    res.details.forEach(d => console.log(`   - ${d}`));
  }
  console.log('');
});

console.log(`${BOLD}---------------------------------------------------------------------${RESET}`);
console.log(`${BOLD}TOTAL CHECKS:${RESET} ${results.length}`);
console.log(`  ${GREEN}PASS:${RESET} ${passCount}`);
console.log(`  ${RED}FAIL:${RESET} ${failCount}`);
console.log(`  ${YELLOW}NOT_SPECIFIED_IN_BLUEPRINT:${RESET} ${notSpecifiedCount}`);
console.log(`${BOLD}---------------------------------------------------------------------${RESET}\n`);

if (failCount > 0) {
  console.log(`${RED}${BOLD}AUDIT FAILED: ${failCount} domain architecture rule violation(s) detected.${RESET}`);
  console.log(`${YELLOW}Please review the reported FAIL and NOT_SPECIFIED_IN_BLUEPRINT issues.${RESET}\n`);
  process.exit(1);
} else {
  console.log(`${GREEN}${BOLD}AUDIT COMPLETED SUCCESSFULLY: All checked domain architecture rules passed.${RESET}\n`);
  process.exit(0);
}
