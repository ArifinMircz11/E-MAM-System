New-Item reports -ItemType Directory -Force | Out-Null

$patterns = @(
"db",
"auth",
"doc",
"collection",
"query",
"where",
"getDoc",
"getDocs",
"setDoc",
"addDoc",
"updateDoc",
"deleteDoc",
"writeBatch",
"runTransaction",
"arrayUnion",
"serverTimestamp"
)

$result = @()

Get-ChildItem src -Recurse -Include *.ts,*.tsx | ForEach-Object {

    $file = $_.FullName
    $text = Get-Content $file -Raw

    foreach($p in $patterns){

        if($text -match "\b$p\b"){

            if($text -notmatch "import .*?\b$p\b"){

                $result += "$p : $file"

            }

        }

    }

}

$result | Sort-Object | Set-Content reports\firebase-missing-imports.txt

Write-Host ""
Write-Host "Done"
Write-Host ""
Write-Host "reports\firebase-missing-imports.txt"