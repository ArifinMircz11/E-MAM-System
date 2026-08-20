$ErrorActionPreference="Stop"

Write-Host ""
Write-Host "=============================================="
Write-Host "     EAOM FIREBASE BOUNDARY AUDIT v2"
Write-Host "=============================================="
Write-Host ""

$allow=@(
    "src/services/firebase.ts",
    "src/database/firestore",
    "src/database/repositories",
    "src/core/offline",
    "src/sync",
    "src/services/auth/FirebaseUserSyncService.ts"
)

$result=@()

$files=Get-ChildItem src -Recurse -Include *.ts,*.tsx


foreach($file in $files){

    $path=$file.FullName.Replace("\","/")

    $relative=$path.Replace(
        ($PWD.Path.Replace("\","/") + "/"),
        ""
    )


    $allowed=$false

    foreach($a in $allow){

        if($relative.StartsWith($a)){
            $allowed=$true
        }

    }


    $text=Get-Content $file.FullName -Raw


    $firestoreImport = $false
    $authImport = $false


    if($text -match "firebase/firestore"){
        $firestoreImport=$true
    }

    if($text -match "firebase/auth"){
        $authImport=$true
    }


    $read = (
        [regex]::Matches(
            $text,
            "getDoc|getDocs|query|where|orderBy|limit"
        )
    ).Count


    $write = (
        [regex]::Matches(
            $text,
            "setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction"
        )
    ).Count


    $listener = (
        [regex]::Matches(
            $text,
            "onSnapshot"
        )
    ).Count



    $violation=$false


    if(
        (($firestoreImport -eq $true) -or ($authImport -eq $true)) -and
        ($allowed -eq $false)
    ){
        $violation=$true
    }


    if(
        ($listener -gt 0) -and
        ($allowed -eq $false)
    ){
        $violation=$true
    }



    $severity="LOW"

    if($write -gt 0){
        $severity="CRITICAL"
    }
    elseif($listener -gt 0){
        $severity="HIGH"
    }
    elseif($read -gt 0){
        $severity="MEDIUM"
    }



    $result += [PSCustomObject]@{
        File=$relative
        Allowed=$allowed
        Violation=$violation
        Severity=$severity
        FirestoreImport=$firestoreImport
        AuthImport=$authImport
        ReadAPI=$read
        WriteAPI=$write
        Listener=$listener
    }

}


$result |
Export-Csv `
".\eaom-v2-boundary-report.csv" `
-NoTypeInformation


$illegal =
$result |
Where-Object {
    $_.Violation -eq $true
}


$illegal |
Export-Csv `
".\eaom-v2-illegal.csv" `
-NoTypeInformation



Write-Host ""
Write-Host "=============================================="
Write-Host " RESULT"
Write-Host "=============================================="

Write-Host ""
Write-Host "Total Files :" $files.Count
Write-Host "Violations  :" $illegal.Count


$score=100-($illegal.Count*0.8)

if($score -lt 0){
    $score=0
}


Write-Host ""
Write-Host "EAOM SCORE :" ([math]::Round($score))


Write-Host ""
Write-Host "Saved:"
Write-Host " eaom-v2-boundary-report.csv"
Write-Host " eaom-v2-illegal.csv"


$illegal |
Select File,Severity,WriteAPI,Listener |
Format-Table -AutoSize