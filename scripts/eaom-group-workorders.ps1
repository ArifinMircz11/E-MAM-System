$groups = @{
    "Identity"  = @()
    "Repository"= @()
    "Sync"      = @()
    "Business"  = @()
    "UI"        = @()
    "Utility"   = @()
}

Get-Content WO-FIREBASE-MIGRATION.txt | ForEach-Object {

    if($_ -notmatch "src/"){ return }

    $file = ($_ -replace "^TODO : Migrate ","") -replace " to Repository \+ SyncEngine",""

    switch -Regex ($file){

        "auth|user|Profile|Identity|useAuth" {
            $groups.Identity += $file
            break
        }

        "student|teacher|tenant|parent|class|masterData|repository" {
            $groups.Repository += $file
            break
        }

        "Sync|Realtime|Listener|offlineAutoProcess|pointSync" {
            $groups.Sync += $file
            break
        }

        "App.tsx|hook|dashboard|component" {
            $groups.UI += $file
            break
        }

        "Helper|helper|util|autoFix|migration|seed|firestoreHelper" {
            $groups.Utility += $file
            break
        }

        default {
            $groups.Business += $file
        }
    }

}

foreach($g in $groups.Keys){

    $out = "WO-$g.txt"

    $groups[$g] | Sort-Object | Set-Content $out

    Write-Host "$out  ->  $($groups[$g].Count) files"
}
