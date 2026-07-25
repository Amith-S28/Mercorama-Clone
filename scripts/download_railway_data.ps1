<#
.SYNOPSIS
    Automated Resumable Trade Data Download Pipeline (Method B)
.DESCRIPTION
    Probes the Railway production deployment for active uptime, discovers downloadable CSV and JSON datasets,
    and executes fault-tolerant, resumable byte-range downloads into the local project's Data/ directory
    using native Windows win32 curl.exe.
.NOTES
    Author: Senior Engineer Operating Rules Compliance
    Target Deployment: trade-data-downloader-production.up.railway.app
#>

# 1. Initialization & Paths
$scriptDir = $PSScriptRoot
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }

$targetDir = [System.IO.Path]::GetFullPath((Join-Path $scriptDir "..\Data"))
$baseUrl = "https://trade-data-downloader-production.up.railway.app"

Write-Host "============================================================" -ForegroundColor Cyan
[Console]::ResetColor()
Write-Host "  Resumable Railway Data Download Engine (Method B)" -ForegroundColor White
Write-Host "  Target Server : $baseUrl" -ForegroundColor Gray
Write-Host "  Output Folder : $targetDir" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

if (-not (Test-Path -Path $targetDir)) {
    Write-Host "`n[Setup] Creating local target directory: $targetDir" -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    Write-Host "✅ [Setup] Directory created successfully." -ForegroundColor Green
} else {
    Write-Host "`n✅ [Setup] Destination directory already exists: $targetDir" -ForegroundColor Green
}

# 2. Phase 1: Active Probe & Link Discovery
Write-Host "`n[Phase 1] Probing server at $baseUrl for online status and file list..." -ForegroundColor Cyan
$html = ""
$serverOnline = $false
$maxProbeAttempts = 360 # Try for up to 30 minutes before pausing

for ($attempt = 1; $attempt -le $maxProbeAttempts; $attempt++) {
    try {
        $response = Invoke-WebRequest -Uri $baseUrl -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 206) {
            $html = $response.Content
            Write-Host "`n✅ [Online] Server responded with HTTP $($response.StatusCode)! Scanning page for file assets..." -ForegroundColor Green
            $serverOnline = $true
            break
        }
    } catch {
        Write-Host -NoNewline "`r⚠️ [Probe $attempt/$maxProbeAttempts] Server offline (HTTP 502/Timeout). Please click 'Restart' on Railway! Retrying in 5s..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

if (-not $serverOnline) {
    Write-Host "`n❌ [Error] Server remained unreachable after $maxProbeAttempts attempts." -ForegroundColor Red
    Write-Host "Please ensure you have manually restarted the deployment in your Railway dashboard, then re-run this script." -ForegroundColor Yellow
    exit 1
}

# Extract downloadable asset links (CSV, JSON, ZIP, etc.) from standard anchor tag attributes
$regex = 'href=["'']([^"'']+\.(?:csv|json|zip|txt|tar|gz)(?:\?[^"'']*)?)["'']'
$matches = [regex]::Matches($html, $regex, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
$files = @()

foreach ($match in $matches) {
    $link = $match.Groups[1].Value
    if (-not ($link -like "http*")) {
        if ($link.StartsWith("/")) {
            $link = "$baseUrl$link"
        } else {
            $link = "$baseUrl/$link"
        }
    }
    if ($files -notcontains $link) {
        $files += $link
    }
}

if ($files.Count -eq 0) {
    Write-Host "`n⚠️ [Discovery] No standard file links (.csv/.json) were explicitly detected on the root URL ($baseUrl)." -ForegroundColor Yellow
    Write-Host "Here is an excerpt of what the root endpoint served:" -ForegroundColor Gray
    $excerptLength = [Math]::Min(1500, $html.Length)
    Write-Host ($html.Substring(0, $excerptLength)) -ForegroundColor DarkCyan
    
    # Allow manual URI verification if custom routing is implemented in app/index.js
    Write-Host "`nNote: If files are hosted under a specific subdirectory or API route not linked on root, please check your app routing." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "`n✅ [Discovery] Located $($files.Count) target dataset file(s) for extraction:" -ForegroundColor Green
    $files | ForEach-Object { Write-Host "   -> $_" -ForegroundColor Cyan }
}

# 3. Phase 2: Fault-Tolerant Byte-Range Resumable Download
Write-Host "`n[Phase 2] Executing self-healing download pipeline with Win32 curl.exe..." -ForegroundColor Cyan

foreach ($url in $files) {
    $filename = [System.IO.Path]::GetFileName(([System.Uri]$url).LocalPath)
    if (-not $filename) { $filename = "dataset_$(Get-Date -Format 'yyyyMMdd_HHmmss').data" }
    $destPath = Join-Path $targetDir $filename

    Write-Host "`n------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "Downloading : $filename" -ForegroundColor White
    Write-Host "Remote URL  : $url" -ForegroundColor DarkGray
    Write-Host "Local Save  : $destPath" -ForegroundColor DarkGray

    $completed = $false
    $maxDownloadRetries = 50 # Resilient across consecutive crash-reboot loops
    $downloadAttempt = 0

    while (-not $completed -and $downloadAttempt -lt $maxDownloadRetries) {
        $downloadAttempt++
        Write-Host "   [Transfer Attempt #$downloadAttempt] Requesting byte stream (resuming if partial file exists)..." -ForegroundColor Cyan
        
        # Execute Win32 curl with auto-resume (-C -) and strict HTTP error alerting (--fail)
        & curl.exe -C - -L --fail --retry 3 --retry-delay 2 -o "$destPath" "$url"
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            $fileSize = (Get-Item -Path $destPath).Length
            $sizeMB = [Math]::Round(($fileSize / 1MB), 2)
            Write-Host "   ✅ [Success] $filename is 100% complete! Size: $fileSize bytes ($sizeMB MB)" -ForegroundColor Green
            $completed = $true
        } else {
            Write-Host "   ⚠️ [Interrupt] Transfer stopped (Exit Code: $exitCode). The Railway server likely reached line 544 and restarted." -ForegroundColor Yellow
            Write-Host "   ⏳ Waiting 10 seconds for container supervisor reboot before resuming transfer..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
        }
    }

    if (-not $completed) {
        Write-Host "   ❌ [Failure] Exceeded maximum retries for $filename. Partial progress has been kept in $destPath." -ForegroundColor Red
    }
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  ✅ Download Pipeline Execution Completed" -ForegroundColor Green
Write-Host "  All available data saved to: $targetDir" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
