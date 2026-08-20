Write-Host "============================================"
Write-Host " e-MAM UI BOUNDARY AUDIT"
Write-Host "============================================"

Select-String `
-Path src\components\**\*.tsx,src\features\**\*.tsx `
-Pattern "@/services/|firebase/firestore|@/database/repositories|@/database/dexie" |
ForEach-Object {

Write-Host ""
Write-Host "VIOLATION:"
Write-Host $_.Path
Write-Host "Line:" $_.LineNumber
Write-Host $_.Line

}

Write-Host ""
Write-Host "============================================"
Write-Host " UI AUDIT FINISHED"
Write-Host "============================================"