# =============================================
# SafedRang Auto-Pull Script
# Yeh script GitHub se latest code pull karta hai
# Isko background mein chadao ya schedule karo
# =============================================

param(
    [int]$IntervalSeconds = 60,  # Har kitne seconds baad check kare (default: 60s)
    [switch]$Once               # Sirf ek baar pull karo
)

$repoPath = "d:\safed rang"
$logFile  = "$repoPath\scripts\auto-pull.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] $Message"
    Write-Host $line
    Add-Content -Path $logFile -Value $line
}

Write-Log "=== SafedRang Auto-Pull Started ==="
Write-Log "Repo: $repoPath"
if ($Once) {
    Write-Log "Mode: Single pull"
} else {
    Write-Log "Mode: Watch every $IntervalSeconds seconds"
}

function Pull-Latest {
    Set-Location $repoPath

    # Current commit se pehle
    $before = git rev-parse HEAD 2>&1

    # GitHub se fetch karo
    $fetchResult = git fetch origin main 2>&1

    # Check karo koi naya commit hai kya
    $behind = git rev-list HEAD..origin/main --count 2>&1

    if ($behind -gt 0) {
        Write-Log "Naye commits mile: $behind — Pull kar raha hoon..."
        $pullResult = git pull origin main 2>&1
        $after = git rev-parse HEAD 2>&1
        Write-Log "Pull ho gaya! $before -> $after"
        Write-Log "Output: $pullResult"
        return $true
    } else {
        Write-Log "Koi naya commit nahi. Already up to date."
        return $false
    }
}

if ($Once) {
    Pull-Latest
    Write-Log "=== Done ==="
    exit 0
}

# Continuous watch loop
Write-Log "Watching for changes... (Ctrl+C se band karo)"
while ($true) {
    try {
        Pull-Latest
    } catch {
        Write-Log "ERROR: $_"
    }
    Start-Sleep -Seconds $IntervalSeconds
}
