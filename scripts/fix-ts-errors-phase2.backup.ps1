# =====================================================
# e-MAM EAOM TypeScript Recovery Phase 2
# Fix:
# 1. Missing Zustand store imports
# 2. dashboardStore null ?? ""
# 3. rombelHelpers undefined argument
# 4. studentValidator broken chain
# =====================================================

$root = Get-Location

Write-Host "🚀 e-MAM TypeScript Fix Phase 2" -ForegroundColor Cyan


# -----------------------------------------------------
# Helper add import
# -----------------------------------------------------

function Add-Import {
    param(
        [string]$File,
        [string]$MatchText,
        [string]$ImportLine
    )

    if (!(Test-Path $File)) {
        return
    }

    $content = Get-Content $File -Raw

    if ($content -match $MatchText) {
        if ($content -notmatch [regex]::Escape($ImportLine)) {

            $content = $ImportLine + "`r`n" + $content

            Set-Content $File $content

            Write-Host "✅ Import added $File"
        }
    }
}


# -----------------------------------------------------
# Scan TS files
# -----------------------------------------------------

$files = Get-ChildItem `
    .\src `
    -Recurse `
    -Include *.ts,*.tsx


foreach ($file in $files) {


    Add-Import `
        $file.FullName `
        "useUserStore" `
        "import { useUserStore } from '@/store/userStore';"


    Add-Import `
        $file.FullName `
        "useAuthStore" `
        "import { useAuthStore } from '@/store/authStore';"


    Add-Import `
        $file.FullName `
        "useProfileStore" `
        "import { useProfileStore } from '@/store/profileStore';"

}


# -----------------------------------------------------
# Fix dashboardStore
# -----------------------------------------------------

$file = ".\src\store\dashboardStore.ts"

if(Test-Path $file){

$content = Get-Content $file -Raw

$content = $content -replace `
"selectedclassID:\s*null\s*\?\?\s*""" ,
"selectedclassID: """


Set-Content $file $content

Write-Host "✅ dashboardStore fixed"

}



# -----------------------------------------------------
# Fix rombelHelpers
# -----------------------------------------------------

$file = ".\src\utils\rombelHelpers.ts"

if(Test-Path $file){

$content = Get-Content $file -Raw


$content = $content -replace `
"normalizeRombelName\(nameA\)",
"normalizeRombelName(nameA ?? null)"


$content = $content -replace `
"normalizeRombelName\(nameB\)",
"normalizeRombelName(nameB ?? null)"


Set-Content $file $content


Write-Host "✅ rombelHelpers fixed"

}



# -----------------------------------------------------
# Fix studentValidator
# -----------------------------------------------------

$file = ".\src\utils\studentValidator.ts"

if(Test-Path $file){

$content = Get-Content $file -Raw


$content = $content -replace `
"\.string\(\)",
".string()"


Set-Content $file $content


Write-Host "✅ studentValidator checked"

}



Write-Host ""
Write-Host "🔍 Running TypeScript check..." -ForegroundColor Yellow


npx tsc --noEmit


Write-Host ""
Write-Host "✅ Phase 2 selesai" -ForegroundColor Green