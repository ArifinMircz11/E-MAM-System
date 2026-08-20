$File = "src\hooks\useAppInitialization.ts"

Write-Host "============================================"
Write-Host " FIX HOOK DEXIE BOUNDARY"
Write-Host "============================================"


if (!(Test-Path $File)) {
    Write-Host "File tidak ditemukan: $File"
    exit 1
}


$content = Get-Content $File -Raw


# remove dexie import
$content = $content -replace `
"import \{ localDb \} from '@/database/dexie';\s*", ""


# add service import
if ($content -notmatch "AppBootstrapService") {

$content = $content -replace `
"import \{ AppInitializationService \} from '@/services/AppInitializationService';",

"import { AppInitializationService } from '@/services/AppInitializationService';
import { AppBootstrapService } from '@/services/AppBootstrapService';"

}


# replace calls
$content = $content -replace `
"localDb\.users\.get\(",
"AppBootstrapService.getLocalUser("


$content = $content -replace `
"localDb\.users\.put\(",
"AppBootstrapService.saveLocalUser("


Set-Content `
$File `
$content `
-Encoding UTF8


Write-Host ""
Write-Host "FIX COMPLETE"
Write-Host ""


Select-String `
-Path $File `
-Pattern "localDb|database/dexie"


Write-Host ""
Write-Host "============================================"