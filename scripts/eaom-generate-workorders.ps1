$critical = Import-Csv "critical-firestore.csv"

$groups = @{
    "WO-001-Identity"   = @()
    "WO-002-Realtime"   = @()
    "WO-003-Repository" = @()
    "WO-004-Service"    = @()
    "WO-005-UI"         = @()
    "WO-006-Utilities"  = @()
}

foreach($item in $critical){

    $file = $item.File.Replace("\","/")

    switch -Regex ($file){

        "/services/realtime/" {
            $groups["WO-002-Realtime"] += $file
            continue
        }

        "/database/repositories/" {
            $groups["WO-003-Repository"] += $file
            continue
        }

        "/services/" {
            $groups["WO-004-Service"] += $file
            continue
        }

        "/components/|/hooks/" {
            $groups["WO-005-UI"] += $file
            continue
        }

        default {
            $groups["WO-006-Utilities"] += $file
        }
    }
}

foreach($name in $groups.Keys){

    $lines = @(
        "================================="
        $name
        "================================="
        ""
    )

    foreach($f in ($groups[$name] | Sort-Object -Unique)){
        $lines += "TODO : $f"
    }

    $lines | Set-Content "$name.txt"
}

Write-Host ""
Write-Host "Generated Work Orders:"
Get-ChildItem "WO-*.txt"
