Set-Location $PSScriptRoot
Write-Host "Running seed script for Acme tenant - personas..."
pnpm --filter api seed:run -- --tenant=acme --type=personas
Write-Host "Personas seeded. Now seeding demo data..."
pnpm --filter api seed:run -- --tenant=acme --type=demo-data
Write-Host "Seed complete!"
