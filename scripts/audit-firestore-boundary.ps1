$root="src"

$files = Get-ChildItem $root -Recurse -Include *.ts,*.tsx |
Where-Object {
    $_.FullName -notmatch "node_modules"
}


$result=@()


foreach($file in $files){

    $match = Select-String `
        -Path $file.FullName `
        -Pattern "firebase/firestore"

    if($match){

        $relative=$file.FullName.Replace((Get-Location).Path+"\","")

        if($relative -match "services"){
            $layer="SERVICE_BYPASS"
            $priority="HIGH"
        }
        elseif($relative -match "utils"){
            $layer="UTILS_BYPASS"
            $priority="CRITICAL"
        }
        elseif($relative -match "sync"){
            $layer="SYNC_LAYER"
            $priority="LOW"
        }
        elseif($relative -match "database"){
            $layer="REPOSITORY_LAYER"
            $priority="OK"
        }
        else{
            $layer="UNKNOWN"
            $priority="MEDIUM"
        }


        $result += [PSCustomObject]@{
            File=$relative
            Layer=$layer
            Priority=$priority
        }

    }

}


$result |
Sort-Object Priority,Layer |
Format-Table -AutoSize


$result |
ConvertTo-Json -Depth 5 |
Set-Content firestore-boundary-report.json


Write-Host ""
Write-Host "================================="
Write-Host "Firestore Boundary Audit Complete"
Write-Host "Report:"
Write-Host "firestore-boundary-report.json"
Write-Host "================================="
