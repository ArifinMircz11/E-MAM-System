Write-Host "============================================"
Write-Host " e-MAM EAOM Architecture Audit"
Write-Host "============================================"


Write-Host ""
Write-Host "[1] UI -> Dexie violations"

Select-String `
-Path src\components\**\*.tsx,src\features\**\*.tsx,src\hooks\**\*.ts `
-Pattern "database/dexie"


Write-Host ""
Write-Host "[2] Service -> Firestore violations"

Select-String `
-Path src\services\**\*.ts `
-Pattern "firebase/firestore"


Write-Host ""
Write-Host "[3] Repository -> Firestore violations"

Select-String `
-Path src\database\repositories\**\*.ts `
-Pattern "firebase/firestore"


Write-Host ""
Write-Host "[4] Dependency Cruiser"

npx dependency-cruiser src `
--config .dependency-cruiser.js `
--output-type err-long


Write-Host ""
Write-Host "============================================"
Write-Host " Audit Finished"
Write-Host "============================================"