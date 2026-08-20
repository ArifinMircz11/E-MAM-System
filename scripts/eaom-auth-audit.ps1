$file = "src/services/authService.ts"

$text = Get-Content $file -Raw

Write-Host ""
Write-Host "======================================="
Write-Host " AUTH SERVICE AUDIT"
Write-Host "======================================="
Write-Host ""

$patterns = @(
"getDoc",
"getDocs",
"setDoc",
"addDoc",
"updateDoc",
"deleteDoc",
"writeBatch",
"runTransaction",
"onSnapshot",
"signInWithEmailAndPassword",
"createUserWithEmailAndPassword",
"sendPasswordResetEmail",
"updateProfile",
"signOut"
)

$result = foreach($p in $patterns){

    $count = ([regex]::Matches($text,$p)).Count

    if($count -gt 0){

        [PSCustomObject]@{
            API   = $p
            Count = $count
        }

    }

}

$result | Format-Table -AutoSize
$result | Export-Csv auth-api-usage.csv -NoTypeInformation

Write-Host ""
Write-Host "========== FIRESTORE IMPORT =========="
Select-String -Path $file -Pattern "firebase/firestore"

Write-Host ""
Write-Host "========== AUTH IMPORT =========="
Select-String -Path $file -Pattern "firebase/auth"

Write-Host ""
Write-Host "Saved : auth-api-usage.csv"

