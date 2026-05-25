Set-Location "C:\Dev\storm-shield-enterprise"

$envFile = ".\.env"
if (-not (Test-Path $envFile)) { Write-Host "ERROR: .env not found" -ForegroundColor Red; exit 1 }

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -gt 0) {
        $k = $line.Substring(0, $idx).Trim()
        $v = $line.Substring($idx + 1).Trim()
        [Environment]::SetEnvironmentVariable($k, $v, "Process")
    }
}

if (-not $env:DATABASE_URL_UNPOOLED) {
    Write-Host "ERROR: DATABASE_URL_UNPOOLED not set" -ForegroundColor Red; exit 1
}

Write-Host "Resetting Acme demo data (partial seed cleanup)..." -ForegroundColor Yellow
Push-Location "apps\api"
node reset-acme-demo.cjs
$result = $LASTEXITCODE
Pop-Location

if ($result -eq 0) {
    Write-Host "[OK] Reset complete" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Reset failed - check output above" -ForegroundColor Red
    exit 1
}
