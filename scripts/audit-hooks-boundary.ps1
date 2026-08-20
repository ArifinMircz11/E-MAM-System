Write-Host "============================================"
Write-Host " e-MAM Hook Boundary Audit"
Write-Host "============================================"

Write-Host ""
Write-Host "[1] Hook import Dexie"

Select-String `
-Path src\hooks\**\*.ts,src\hooks\**\*.tsx `
-Pattern "database/dexie|localDb"


Write-Host ""
Write-Host "[2] Hook import Firestore"

Select-String `
-Path src\hooks\**\*.ts,src\hooks\**\*.tsx `
-Pattern "firebase/firestore|firestoreHelpers|getDoc|getDocs|collection|doc|onSnapshot"


Write-Host ""
Write-Host "[3] Hook import realtime listener"

Select-String `
-Path src\hooks\**\*.ts,src\hooks\**\*.tsx `
-Pattern "services/realtime"


Write-Host ""
Write-Host "[4] Hook import service langsung"

Select-String `
-Path src\hooks\**\*.ts,src\hooks\**\*.tsx `
-Pattern "@/services/"


Write-Host ""
Write-Host "============================================"
Write-Host " Hook Audit Finished"
Write-Host "============================================"