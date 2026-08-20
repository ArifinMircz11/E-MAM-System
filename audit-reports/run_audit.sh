#!/bin/bash
OUTPUT_FILE="audit-reports/full_project_audit_v7.8.txt"
> $OUTPUT_FILE
exec >> $OUTPUT_FILE 2>&1

echo "============================================================"
echo "e-MAM ENTERPRISE V7.8"
echo "FULL PROJECT STATIC AUDIT — READ ONLY"
echo "============================================================"

echo -e "\n=== 01. REPOSITORY STATE ==="
git status --short || true
git branch --show-current || true
git log -1 --oneline || true

echo -e "\n=== 02. PROJECT STRUCTURE ==="
find . -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/build/*" -not -path "*/coverage/*" -not -path "*/.git/*" -exec ls -lh {} + | awk '{print $9, $5}'

echo -e "\n=== 03. SOURCE FILE INVENTORY ==="
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \)

echo -e "\n=== 04. USER / IDENTITY AUDIT ==="
grep -rnE 'interface User|type User|UserDto|UserModel|CanonicalUser|FirebaseUser|auth\.currentUser|currentUser\.uid|currentUser\.email|firebaseUser|referenceId|accountType' src/ || true

echo -e "\n=== 05. USER OBJECT CONSTRUCTION ==="
grep -rnE ':\s*User\s*=|as\s+User|new User|const user\s*=|let user\s*=|user\s*=\s*\{' src/ || true

echo -e "\n=== 06. ROLE / RBAC AUDIT ==="
grep -rnE '\brole\b|\broles\b|permission|permissions|AuthorizationService|PermissionResolver|RoleResolver|RBAC|can\(|hasPermission|isAllowed|accountType' src/ || true

echo -e "\n=== 07. TENANT / ORGANIZATION AUDIT ==="
grep -rnE 'tenantId|organizationId|ministryId|provinceId|districtId|schoolId|scope|tenantScope|OrganizationResolver|ScopeResolver' src/ || true

echo -e "\n=== 08. IDENTITY BYPASS AUDIT ==="
grep -rnE 'localStorage.*user|sessionStorage.*user|auth\.currentUser|currentUser\.uid|currentUser\.email|firebaseUser|user\.tenantId|user\.role|user\.roles' src/ || true

echo -e "\n=== 09. FIREBASE / FIRESTORE AUDIT ==="
grep -rnE 'from ['\''"]firebase|firebase/firestore|getDocs|getDoc|setDoc|addDoc|updateDoc|deleteDoc|onSnapshot|collection\(|doc\(' src/ || true

echo -e "\n=== 10. FIRESTORE OUTSIDE SYNC AUDIT ==="
find src -type f -not -path "*/sync/*" -not -path "*/services/sync/*" -not -name "*SyncEngine*" -exec grep -HnE 'firebase/firestore|getDocs|getDoc|setDoc|addDoc|updateDoc|deleteDoc|onSnapshot|collection\(|doc\(' {} + || true

echo -e "\n=== 11. DEXIE AUDIT ==="
grep -rnE 'Dexie|from ['\''"]dexie|new Dexie|\.table\(|db\.|transaction\(' src/ || true

echo -e "\n=== 12. DEXIE OUTSIDE DATABASE LAYER ==="
find src -type f -not -path "*/database/*" -not -path "*/dexie/*" -not -path "*/repositories/*" -not -path "*/repository/*" -not -name "*Repository*" -exec grep -HnE 'from ['\''"]dexie|new Dexie|\.table\(|db\.' {} + || true

echo -e "\n=== 13. REPOSITORY AUDIT ==="
grep -rnE 'Repository|BaseRepository|RepositoryBase|\.create\(|\.update\(|\.delete\(|\.find\(|\.get\(|\.list\(' src/ || true

echo -e "\n=== 14. SERVICE AUDIT ==="
grep -rnE 'Service|UseCase|useCase|execute\(|business|workflow|domain' src/ || true

echo -e "\n=== 15. ZUSTAND / STORE AUDIT ==="
grep -rnE 'zustand|create\(|use[A-Za-z]+Store|Store|set\(|get\(' src/ || true

echo -e "\n=== 16. NAVIGATION / ROUTING AUDIT ==="
grep -rnE 'react-router|createBrowserRouter|createRoutesFromElements|Route|Routes|navigate\(|useNavigate|NavLink|sidebar|navigation|menu|breadcrumb' src/ || true

echo -e "\n=== 17. HARD-CODED ROLE UI AUDIT ==="
grep -rnE 'role\s*===|role\s*!==|role\s*==|role\s*!=|roles\.includes|role\.includes|ADMIN|GURU|SISWA|STAFF|TU|BK|KEPALA' src/ || true

echo -e "\n=== 18. DIRECT FIRESTORE / DEXIE IN UI ==="
find src/features src/pages src/components -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | xargs grep -HnE 'firebase/firestore|from ['\''"]dexie|new Dexie|getDocs|getDoc|setDoc|addDoc|updateDoc|deleteDoc|onSnapshot|db\.table|db\.' || true

echo -e "\n=== 19. SYNC ENGINE AUDIT ==="
grep -rnE 'SyncEngine|SyncQueue|syncQueue|queue|delta|retry|backoff|conflict|offline|online|lastSync|syncStatus' src/ || true

echo -e "\n=== 20. CANONICAL SECURITY FLOW ==="
grep -rnE 'SecurityContext|SecurityContextService|AuthorizationService|PermissionResolver|ScopeResolver|DashboardResolver|CanonicalUser|IdentityResolver' src/ || true

echo -e "\n=== 21. EVENT BUS AUDIT ==="
grep -rnE 'EventBus|eventBus|publish\(|emit\(|subscribe\(|dispatch\(' src/ || true

echo -e "\n=== 22. LOCAL STORAGE AUDIT ==="
grep -rnE 'localStorage|sessionStorage|indexedDB|document\.cookie' src/ || true

echo -e "\n=== 23. SECURITY-SENSITIVE CODE ==="
grep -rnE 'token|accessToken|refreshToken|password|secret|apiKey|privateKey|credential|dangerouslySetInnerHTML|eval\(|innerHTML' src/ || true

echo -e "\n=== 24. ENVIRONMENT AUDIT ==="
find . -type f -not -path "*/node_modules/*" \( -name ".env*" -o -name "*firebase*" -o -name "*config*" \)

echo -e "\n=== 25. LARGE FILE AUDIT ==="
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec wc -l {} + | sort -nr | head -100

echo -e "\n=== 26. PACKAGE / DEPENDENCY AUDIT ==="
cat package.json || true

echo -e "\n=== 27. NPM DEPENDENCY TREE ==="
npm ls --depth=0 || true

echo -e "\n=== 28. TYPESCRIPT ==="
npx tsc --noEmit || true

echo -e "\n=== 29. ESLINT ==="
npm run lint || true

echo -e "\n=== 30. BUILD ==="
npm run build || true

echo -e "\n=================================================="
echo "FULL AUDIT SELESAI — TIDAK ADA FILE YANG DIUBAH"
echo "=================================================="
