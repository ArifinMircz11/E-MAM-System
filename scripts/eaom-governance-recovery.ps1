# ============================================================
# e-MAM EAOM GOVERNANCE RECOVERY PIPELINE
# Architecture Freeze v1.1 Compliance
# ============================================================

$ErrorActionPreference = "Continue"

$Report = ".\governance-report.txt"

Clear-Host

Write-Host "============================================"
Write-Host " e-MAM EAOM GOVERNANCE RECOVERY"
Write-Host "============================================"

"EAOM GOVERNANCE REPORT"
"DATE : $(Get-Date)"
"ROOT : $(Get-Location)"
"" | Out-File $Report


function Run-Audit($Name, $Command)
{
    Write-Host ""
    Write-Host "============================================"
    Write-Host $Name
    Write-Host "============================================"

    Add-Content $Report ""
    Add-Content $Report "===== $Name ====="

    Invoke-Expression $Command 2>&1 |
    Tee-Object -FilePath $Report -Append
}



# ------------------------------------------------------------
# 1. UI Boundary Audit
# ------------------------------------------------------------

if(Test-Path ".\scripts\fix-ui-boundary.ps1")
{
    Run-Audit `
    "UI BOUNDARY AUDIT" `
    ".\scripts\fix-ui-boundary.ps1"
}
else
{
    Write-Host "SKIP: fix-ui-boundary.ps1 missing"
}



# ------------------------------------------------------------
# 2. UI Boundary Auto Fix
# ------------------------------------------------------------

if(Test-Path ".\scripts\fix-ui-boundary-auto.ps1")
{
    Run-Audit `
    "UI BOUNDARY AUTO FIX" `
    ".\scripts\fix-ui-boundary-auto.ps1"
}



# ------------------------------------------------------------
# 3. Service Store Dependency Audit
# ------------------------------------------------------------

if(Test-Path ".\scripts\find-service-store-cycle.ps1")
{
    Run-Audit `
    "SERVICE STORE AUDIT" `
    ".\scripts\find-service-store-cycle.ps1"
}



# ------------------------------------------------------------
# 4. Service Store Auto Fix
# ------------------------------------------------------------

if(Test-Path ".\scripts\fix-service-store-auto.ps1")
{
    Run-Audit `
    "SERVICE STORE AUTO FIX" `
    ".\scripts\fix-service-store-auto.ps1"
}



# ------------------------------------------------------------
# 5. Architecture Missing Module Check
# ------------------------------------------------------------

Write-Host ""
Write-Host "============================================"
Write-Host "MISSING MODULE CHECK"
Write-Host "============================================"


$RequiredModules = @(
"src/services/AppBootstrapService.ts",
"src/database/repositories/dashboardBKRepository.ts"
)


foreach($module in $RequiredModules)
{
    if(Test-Path $module)
    {
        Write-Host "OK   $module"
    }
    else
    {
        Write-Host "MISS $module"
    }
}



# ------------------------------------------------------------
# 6. Build Verification
# ------------------------------------------------------------

Run-Audit `
"PRODUCTION BUILD" `
"npm run build"



# ------------------------------------------------------------
# 7. Dependency Cruiser
# ------------------------------------------------------------

if(Test-Path ".\node_modules\.bin\depcruise.cmd")
{

Run-Audit `
"DEPENDENCY CRUISER ARCHITECTURE CHECK" `
"npx depcruise src"

}
else
{
 Write-Host "SKIP: dependency-cruiser not installed"
}



# ------------------------------------------------------------
# 8. Circular Dependency Report
# ------------------------------------------------------------

Run-Audit `
"CIRCULAR DEPENDENCY CHECK" `
"npx depcruise src --validate .dependency-cruiser.js"



Write-Host ""
Write-Host "============================================"
Write-Host " GOVERNANCE RECOVERY FINISHED"
Write-Host "============================================"

Write-Host ""
Write-Host "REPORT:"
Write-Host $Report