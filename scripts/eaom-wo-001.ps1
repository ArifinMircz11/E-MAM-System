$ErrorActionPreference="Stop"

Write-Host ""
Write-Host "======================================="
Write-Host " EAOM WORK ORDER 001"
Write-Host " Identity + User Boundary"
Write-Host "======================================="
Write-Host ""

$targets=@(
"src/services/authService.ts",
"src/services/userService.ts",
"src/services/studentService.ts",
"src/components/Profile.tsx"
)

$backup="backup/WO001"

New-Item -ItemType Directory -Force $backup | Out-Null

foreach($f in $targets){

    if(Test-Path $f){

        Copy-Item $f $backup -Force
        Write-Host "Backup :" $f

    }else{

        Write-Host "Missing :" $f

    }

}

$targets | Set-Content WO001-files.txt

Write-Host ""
Write-Host "Done."
