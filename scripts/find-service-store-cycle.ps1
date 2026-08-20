Write-Host "============================================"
Write-Host " SERVICE STORE AUDIT"
Write-Host "============================================"

Select-String `
-Path src\services\**\*.ts `
-Pattern "@/store|from '@/store|../store" |
ForEach-Object {

Write-Host ""
Write-Host "SERVICE ACCESS STORE:"
Write-Host $_.Path
Write-Host "Line:" $_.LineNumber
Write-Host $_.Line

}

Write-Host ""
Write-Host "============================================"
Write-Host " AUDIT FINISHED"
Write-Host "============================================"