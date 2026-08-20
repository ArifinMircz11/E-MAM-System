$ErrorActionPreference="Stop"

Write-Host ""
Write-Host "===================================="
Write-Host " EAOM WORK ORDER VERIFY"
Write-Host "===================================="
Write-Host ""

$WorkOrder = Read-Host "Masukkan Work Order (contoh: WO-Identity.txt)"

if(!(Test-Path $WorkOrder)){
    Write-Host "File tidak ditemukan :" $WorkOrder
    exit
}

$files = Get-Content $WorkOrder

$result = foreach($file in $files){

    if(!(Test-Path $file)){
        Write-Host "Skip missing :" $file
        continue
    }

    $text = Get-Content $file -Raw


    [PSCustomObject]@{

        File = $file

        FirestoreImport =
        ([regex]::Matches($text,"firebase/firestore")).Count


        AuthImport =
        ([regex]::Matches($text,"firebase/auth")).Count


        FirestoreRead =
        ([regex]::Matches($text,
        "getDoc|getDocs|query|where|orderBy|limit")).Count


        FirestoreWrite =
        ([regex]::Matches($text,
        "setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction")).Count


        Listener =
        ([regex]::Matches($text,
        "onSnapshot")).Count


        Repository =
        ([regex]::Matches($text,
        "Repository")).Count


        SyncEngine =
        ([regex]::Matches($text,
        "SyncEngine")).Count
    }
}


$result | Format-Table -AutoSize


$out = $WorkOrder.Replace(
".txt",
"-analysis.csv"
)


$result |
Export-Csv $out -NoTypeInformation


Write-Host ""
Write-Host "Saved :" $out
