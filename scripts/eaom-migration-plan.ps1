$ErrorActionPreference="Stop"

if(!(Test-Path ".\critical-firestore.csv")){
    Write-Host ""
    Write-Host "ERROR : critical-firestore.csv tidak ditemukan."
    exit
}

$critical = Import-Csv ".\critical-firestore.csv"

$result = foreach($row in $critical){

    $migration = @()

    if($row.Read -eq "True"){
        $migration += "Repository(Read)"
    }

    if($row.Write -eq "True"){
        $migration += "SyncEngine(Write)"
    }

    if($row.Listener -eq "True"){
        $migration += "RealtimeHub"
    }

    if($row.Auth -eq "True"){
        $migration += "IdentityService"
    }

    [PSCustomObject]@{
        File       = $row.File
        Priority   = [int]$row.Score
        Migration  = ($migration -join " + ")
    }
}

$result |
Sort-Object Priority -Descending |
Format-Table -AutoSize

$result |
Export-Csv ".\migration-plan.csv" -NoTypeInformation

Write-Host ""
Write-Host "Saved : migration-plan.csv"
