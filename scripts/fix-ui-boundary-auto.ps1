Write-Host "============================================"
Write-Host " FIX UI BOUNDARY AUTO"
Write-Host "============================================"


$files = Get-ChildItem src/components -Recurse -Include *.tsx,*.ts


foreach ($file in $files) {

    $content = Get-Content $file.FullName -Raw

    $original = $content


    # remove direct repository imports
    $content = $content -replace "import .* from '@/database/repositories/.*';\r?\n",""


    # remove direct dexie imports
    $content = $content -replace "import .* from '@/database/dexie';\r?\n",""


    # remove firebase direct imports
    $content = $content -replace "import .* from '@/services/firebase';\r?\n",""


    # remove dbGateway imports
    $content = $content -replace "import .* from '@/services/dbGateway';\r?\n",""


    if ($content -ne $original) {

        Set-Content `
        -Path $file.FullName `
        -Value $content `
        -Encoding UTF8

        Write-Host "Fixed:" $file.FullName
    }
}


Write-Host ""
Write-Host "============================================"
Write-Host " UI BOUNDARY CLEAN COMPLETE"
Write-Host "============================================"