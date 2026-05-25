Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=== Provisioning acme tenant in Neon staging ===" -ForegroundColor Cyan
Write-Host ""

# Load .env
if (-not (Test-Path ".\.env")) {
    Write-Host "ERROR: .env not found" -ForegroundColor Red; exit 1
}
Get-Content ".\.env" | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -gt 0) {
        $k = $line.Substring(0, $idx).Trim()
        $v = $line.Substring($idx + 1).Trim()
        [Environment]::SetEnvironmentVariable($k, $v, "Process")
    }
}

$dbUrl = $env:DATABASE_URL_UNPOOLED
if (-not $dbUrl) {
    Write-Host "ERROR: DATABASE_URL_UNPOOLED not set in .env" -ForegroundColor Red; exit 1
}

Write-Host "Database: Neon staging (ep-shiny-moon)" -ForegroundColor Green
Write-Host ""

Push-Location "apps\api"
node provision-acme-neon.cjs
$result = $LASTEXITCODE
Pop-Location

if ($result -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Tenant acme OK - run .\run-seeds.ps1"   -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Provisioning FAILED - see error above"   -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}
