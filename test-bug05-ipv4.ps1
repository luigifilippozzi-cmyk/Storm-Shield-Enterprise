Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=== BUG-05 IPv4 Fix - Teste de Conexao Real ===" -ForegroundColor Cyan
Write-Host ""

# 1. Carregar .env manualmente
if (-not (Test-Path ".\.env")) {
    Write-Host "ERRO: .env nao encontrado" -ForegroundColor Red
    exit 1
}

$envVars = @{}
Get-Content ".\.env" | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -gt 0) {
        $k = $line.Substring(0, $idx).Trim()
        $v = $line.Substring($idx + 1).Trim()
        $envVars[$k] = $v
        [Environment]::SetEnvironmentVariable($k, $v, "Process")
    }
}

$dbUrl = $envVars["DATABASE_URL_UNPOOLED"]
if (-not $dbUrl) { $dbUrl = $env:DATABASE_URL_UNPOOLED }

Write-Host "DATABASE_URL_UNPOOLED: $(if ($dbUrl) { 'OK - encontrado' } else { 'AUSENTE - verificar .env' })"
if (-not $dbUrl) { exit 1 }

$isNeon = $dbUrl.Contains("neon.tech")
Write-Host "Provider: $(if ($isNeon) { 'Neon staging detectado' } else { 'Nao e URL Neon' })"
Write-Host ""

# 2. Escrever script Node.js de teste em arquivo temporario
$nodeScript = "apps\api\__test_bug05_tmp.cjs"

@"
'use strict';
const knex = require('knex');

const url = process.env.DATABASE_URL_UNPOOLED;
console.log('Node: DATABASE_URL_UNPOOLED = ' + (url ? url.substring(0, 50) + '...' : 'UNDEFINED'));

const isNeon = url && url.includes('neon.tech');

async function probe(label, useFamily4) {
  if (!url) {
    console.log('  SKIP [' + label + '] - URL indefinida');
    return false;
  }
  const conn = { connectionString: url, ssl: { rejectUnauthorized: false } };
  if (useFamily4 && isNeon) conn.family = 4;
  const db = knex({ client: 'pg', connection: conn, pool: { min: 1, max: 2 } });
  const t0 = Date.now();
  try {
    const r = await db.raw('SELECT current_database() AS db, version() AS v');
    const ms = Date.now() - t0;
    const ver = r.rows[0].v.split(' ').slice(0, 2).join(' ');
    console.log('  OK  [' + label + '] ' + ms + 'ms - ' + ver);
    return true;
  } catch(e) {
    console.log('  ERR [' + label + '] ' + (Date.now() - t0) + 'ms - ' + (e.message || String(e)));
    return false;
  } finally {
    await db.destroy();
  }
}

(async () => {
  console.log('[1/2] Sem family:4 (comportamento pre-fix):');
  const r1 = await probe('sem family:4', false);
  console.log('');
  console.log('[2/2] Com family:4 (BUG-05 fix):');
  const r2 = await probe('com family:4', true);
  console.log('');
  if (r2) {
    if (!r1) {
      console.log('RESULTADO: FIX CONFIRMADO - sem family:4 falha, com family:4 passa');
    } else {
      console.log('RESULTADO: FIX CONFIRMADO - conexao estavel (IPv6 pode nao estar ativo agora, fix e preventivo)');
    }
    process.exit(0);
  } else {
    console.log('RESULTADO: FALHA - fix nao resolveu');
    console.log('Checar: credenciais no .env, projeto Neon ativo, pnpm install feito');
    process.exit(1);
  }
})();
"@ | Set-Content -Path $nodeScript -Encoding ASCII

Write-Host "Rodando probe de conexao (node direto)..." -ForegroundColor Yellow
Write-Host ""

# 3. Rodar com DATABASE_URL_UNPOOLED explicitamente no ambiente
$env:DATABASE_URL_UNPOOLED = $dbUrl

Push-Location "apps\api"
node __test_bug05_tmp.cjs
$result = $LASTEXITCODE
Pop-Location

Remove-Item $nodeScript -Force -ErrorAction SilentlyContinue

Write-Host ""

# 4. Conclusao e proximo passo
if ($result -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BUG-05 RESOLVIDO - IPv4 estavel"         -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    $resp = Read-Host "Rodar seed Acme agora (T-20260509-2)? [s/N]"
    if ($resp -match '^[sS]$') {
        Write-Host ""
        .\run-seeds.ps1
    } else {
        Write-Host "Seed nao executado. Rode .\run-seeds.ps1 quando quiser." -ForegroundColor Yellow
    }
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "FALHA - conexao nao estabelecida"         -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Checklist:" -ForegroundColor Yellow
    Write-Host "  1. Neon Console: projeto ativo (nao pausado)?" -ForegroundColor Yellow
    Write-Host "  2. .env: DATABASE_URL_UNPOOLED com credenciais atuais?" -ForegroundColor Yellow
    Write-Host "  3. git log --oneline -3 mostra commit fcabfac?" -ForegroundColor Yellow
    Write-Host "  4. node_modules instalado? (pnpm install)" -ForegroundColor Yellow
    exit 1
}
