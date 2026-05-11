@echo off
cd /d "%~dp0"
echo Running seed script for Acme tenant - personas...
call pnpm --filter api seed:run -- --tenant=acme --type=personas
echo Personas seeded. Now seeding demo data...
call pnpm --filter api seed:run -- --tenant=acme --type=demo-data
echo Seed complete!
pause
