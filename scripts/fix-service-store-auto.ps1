Write-Host "============================================"
Write-Host " FIX SERVICE STORE DEPENDENCY"
Write-Host "============================================"


$files = Get-ChildItem src/services -Recurse -Include *.ts,*.tsx


foreach($file in $files){

$content = Get-Content $file.FullName -Raw


if($content -match "@/store"){

Write-Host "FOUND STORE ACCESS:"
Write-Host $file.FullName


$content = $content -replace "import .* from '@/store.*';\r?\n",""


Set-Content `
$file.FullName `
$content `
-Encoding UTF8

}

}


Write-Host ""
Write-Host "SERVICE STORE CLEAN COMPLETE"