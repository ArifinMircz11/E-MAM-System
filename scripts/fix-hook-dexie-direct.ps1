Write-Host "============================================"
Write-Host " FIX HOOK DIRECT DEXIE ACCESS"
Write-Host "============================================"

# ================================
# useOfflineSync
# ================================

$file = "src/hooks/useOfflineSync.ts"

if (Test-Path $file) {

    $content = Get-Content $file -Raw

    $content = $content -replace `
"import \{ localDb \} from '@/database/dexie';", `
"import { syncRepository } from '@/database/repositories/SyncRepository';"

    $content = $content -replace `
"localDb\.sync_queue\.where\('status'\)\.equals\('pending'\)\.count\(\)", `
"syncRepository.getPendingCount()"

    Set-Content $file $content

    Write-Host "Fixed useOfflineSync"
}


# ================================
# useMasterData
# ================================

$file = "src/hooks/useMasterData.ts"

if (Test-Path $file) {

    $content = Get-Content $file -Raw


    $content = $content -replace `
"import \{ localDb \} from '@/database/dexie';", `
"import { masterDataRepository } from '@/database/repositories/masterDataRepository';"


    $content = $content -replace `
"localDb\.classes\.toArray\(\)", `
"masterDataRepository.getClasses()"


    $content = $content -replace `
"localDb\.teachers\.toArray\(\)", `
"masterDataRepository.getTeachers()"


    $content = $content -replace `
"localDb\.students\.where\('tingkatRombel'\)\.equals\(cls\)\.toArray\(\)", `
"masterDataRepository.getStudentsByClass(cls)"


    $content = $content -replace `
"localDb\.students\.toArray\(\)", `
"masterDataRepository.getStudents()"


    Set-Content $file $content

    Write-Host "Fixed useMasterData"
}



# ================================
# useDashboardBK
# ================================

$file = "src/hooks/useDashboardBK.ts"

if (Test-Path $file) {

    $content = Get-Content $file -Raw


    $content = $content -replace `
"import \{ localDb \} from '@/database/dexie';", `
"import { dashboardBKRepository } from '@/database/repositories/dashboardBKRepository';"


    $content = $content -replace `
"localDb\.cache\.get\(CACHE_KEY\)", `
"dashboardBKRepository.getCache(CACHE_KEY)"


    $content = $content -replace `
"localDb\.cache\.put\(\{", `
"dashboardBKRepository.saveCache({"


    Set-Content $file $content

    Write-Host "Fixed useDashboardBK"
}


Write-Host ""
Write-Host "============================================"
Write-Host " FIX COMPLETE"
Write-Host "============================================"