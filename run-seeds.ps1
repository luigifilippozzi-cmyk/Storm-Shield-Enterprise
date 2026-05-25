
# T-20260509-2 - Run Acme seed personas and demo data
Set-Location $PSScriptRoot

# Load .env file
$envContent = Get-Content .\.env
foreach ($line in $envContent) {
    if ($line -match '^\s*#' -or $line -match '^\s*$') { continue }
    $parts = $line -split '=', 2
    if ($parts.Count -eq 2) {
        $name = $parts[0].Trim()
        $value = $parts[1].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "T-20260509-2 - Seed Acme tenant" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: $($env:NODE_ENV)" -ForegroundColor Green
Write-Host ""

# Seed 1: Personas
Write-Host "Step 1/2: Seeding 7 Acme personas..." -ForegroundColor Yellow
pnpm --filter api seed:run -- --tenant=acme --type=personas
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Personas seed failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Personas seed completed" -ForegroundColor Green
Write-Host ""

# Seed 2: Demo data
Write-Host "Step 2/2: Seeding Acme demo data..." -ForegroundColor Yellow
pnpm --filter api seed:run -- --tenant=acme --type=demo-data
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Demo-data seed failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Demo-data seed completed" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "[OK] T-20260509-2 COMPLETED" -ForegroundColor Green
Write-Host "UAT manual is now deblocked!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
