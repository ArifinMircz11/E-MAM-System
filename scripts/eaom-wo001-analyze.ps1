$files = Get-Content "WO001-files.txt"

$result = foreach($file in $files){

    if(!(Test-Path $file)){ continue }

    $text = Get-Content $file -Raw

    $importsFirestore = ($text -match "firebase/firestore")
    $importsAuth      = ($text -match "firebase/auth")
    $reads            = ([regex]::Matches($text,"getDoc|getDocs|onSnapshot")).Count
    $writes           = ([regex]::Matches($text,"setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction")).Count
    $listeners        = ([regex]::Matches($text,"onSnapshot")).Count

    [PSCustomObject]@{
        File              = $file
        FirestoreImport   = $importsFirestore
        AuthImport        = $importsAuth
        Reads             = $reads
        Writes            = $writes
        Listeners         = $listeners
    }
}

$result | Format-Table -AutoSize
$result | Export-Csv WO001-analysis.csv -NoTypeInformation

Write-Host ""
Write-Host "Saved : WO001-analysis.csv"
