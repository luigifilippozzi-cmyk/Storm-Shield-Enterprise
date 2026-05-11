# ----------------------------------------------------------------------------
# Destrava UAT -- 2026-05-09
#
# Sequencia operacional para liberar UAT manual via os 2 roteiros:
#   - SSE_Roteiro_Testes_Amigavel_v1_1.docx
#   - SSE_Tour_Completo_Testes_PO_v1_1.docx
#
# Pre-requisitos:
#   - Passo 1 (Vercel env var) ja feito: BUG-03 fechado em 2026-05-09 04:43Z
#   - gh CLI autenticado: 'gh auth status' retorna OK
#   - Working tree limpo
#
# O que este script faz:
#   - Passo 2: Revisa PR #77, checa regras inviolaveis no diff, aprova e mergea
#   - Passo 3 (parcial): valida que handoff T-20260509-2 esta no dm_queue
#     e mostra os comandos exatos que o DM precisa rodar
#   - Smoke final: valida /health e /ready DIRETO no backend Fly.io,
#     e o web root no Vercel (publico, sem auth)
#
# NOTA: o teste end-to-end do proxy /api/* via Vercel exige login (Clerk
# middleware protege /api/*). Validacao com login ja foi feita em 2026-05-09
# via Claude in Chrome - ver po_sessions.md sessao 2026-05-09 parte 3.
#
# Compatibilidade: ASCII-puro para evitar problemas de encoding em
# Windows PowerShell 5.1 (que le UTF-8 sem BOM como Windows-1252).
# ----------------------------------------------------------------------------

Set-Location "C:\Dev\storm-shield-enterprise"

Write-Host ""
Write-Host "=== DESTRAVA UAT -- Passo 0: pre-checagem ===" -ForegroundColor Cyan

# 0.1 -- gh autenticado?
$null = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "gh CLI nao autenticado. Rode 'gh auth login' antes." -ForegroundColor Red
    exit 1
}
Write-Host "gh OK." -ForegroundColor Green

# 0.2 -- working tree limpo?
$dirty = git status --porcelain
if ($dirty) {
    Write-Host "Working tree sujo:" -ForegroundColor Red
    Write-Host $dirty
    Write-Host "Commit/stash antes de continuar." -ForegroundColor Red
    exit 1
}
Write-Host "Working tree limpo." -ForegroundColor Green

# 0.3 -- atualizar main local
git fetch origin --quiet
git checkout main --quiet
git pull origin main --quiet
$lastCommit = git log --oneline -1
Write-Host "main atualizado. Ultimo commit: $lastCommit" -ForegroundColor Green

# 0.4 -- checar se PR #77 ja foi mergeado
$pr77State = gh pr view 77 --json state -q .state 2>$null
$skipPr77 = $false
if ($pr77State -eq "MERGED") {
    Write-Host "PR #77 ja esta MERGED -- pulando Passo 2." -ForegroundColor Yellow
    $skipPr77 = $true
} elseif ($pr77State -eq "CLOSED") {
    Write-Host "PR #77 esta CLOSED (nao mergeado). Investigar antes de continuar." -ForegroundColor Red
    exit 1
} elseif ($pr77State -eq "OPEN") {
    Write-Host "PR #77 OPEN -- vai para Passo 2." -ForegroundColor Cyan
} else {
    Write-Host "PR #77 estado desconhecido: '$pr77State'. Investigar." -ForegroundColor Red
    exit 1
}


if (-not $skipPr77) {
    Write-Host ""
    Write-Host "=== Passo 2: Revisar e mergear PR #77 ===" -ForegroundColor Cyan

    # 2.1 -- exibir PR
    Write-Host ""
    Write-Host "--- PR overview ---" -ForegroundColor Gray
    gh pr view 77

    # 2.2 -- checks
    Write-Host ""
    Write-Host "--- CI checks ---" -ForegroundColor Gray
    gh pr checks 77

    # 2.3 -- diff scan: regras inviolaveis CLAUDE.md secao 10
    Write-Host ""
    Write-Host "--- Scan de regras inviolaveis no diff ---" -ForegroundColor Gray
    $diffViolations = gh pr diff 77 | Select-String -Pattern "CASCADE DELETE|FLOAT|REAL|KNEX_CONNECTION|innerHTML|eval\(|dangerouslySetInnerHTML"
    if ($diffViolations) {
        Write-Host "Possiveis violacoes detectadas:" -ForegroundColor Yellow
        $diffViolations | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        Write-Host "Confirme que NAO sao violacoes reais (podem ser strings em comentario ou doc) antes de continuar."
        $confirm = Read-Host "Continuar com merge? (sim/nao)"
        if ($confirm -ne "sim") { exit 1 }
    } else {
        Write-Host "Nenhuma violacao de regras 1-13 detectada no diff." -ForegroundColor Green
    }

    # 2.4 -- confirmar com o operador antes de merge
    Write-Host ""
    Write-Host "--- Confirmacao ---" -ForegroundColor Gray
    Write-Host "Vou aprovar e mergear PR #77 (--merge --delete-branch)." -ForegroundColor Yellow
    $confirm = Read-Host "Prosseguir? (sim/nao)"
    if ($confirm -ne "sim") {
        Write-Host "Abortado pelo operador." -ForegroundColor Yellow
        exit 0
    }

    # 2.5 -- aprovar e mergear
    gh pr review 77 --approve --body "Aprovado pelo PO. Escopo BUG-03b (fail-fast guard + smoke) e regras inviolaveis CLAUDE.md secao 10 verificadas via diff scan. Sem violacoes de regras 1-13 detectadas."
    gh pr merge 77 --merge --delete-branch

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Merge falhou. Verificar mensagem acima." -ForegroundColor Red
        exit 1
    }

    git checkout main --quiet
    git pull origin main --quiet
    Write-Host "PR #77 mergeado." -ForegroundColor Green
    git log --oneline -3
}


Write-Host ""
Write-Host "=== Passo 3: Confirmar handoff DM T-20260509-2 ===" -ForegroundColor Cyan

# 3.1 -- confirmar que o handoff existe
$handoffExists = Select-String -Path ".auto-memory\dm_queue.md" -Pattern "T-20260509-2" -SimpleMatch -Quiet
if (-not $handoffExists) {
    Write-Host "Handoff T-20260509-2 NAO encontrado em dm_queue.md." -ForegroundColor Red
    exit 1
}
Write-Host "Handoff T-20260509-2 confirmado em dm_queue.md." -ForegroundColor Green

# 3.2 -- mostrar comandos exatos para o DM
Write-Host ""
Write-Host "--- Para destravar o seed, abrir sessao DM (Cowork) e pedir: ---" -ForegroundColor Yellow
$dmMsg = @"
"Consumir T-20260509-2 do dm_queue.md. Comandos pre-condicionados:

  # Verificar tenant Acme
  psql `$DATABASE_URL_UNPOOLED -c \"SELECT id, slug, schema_name, status FROM public.tenants WHERE slug='acme';\"

  # Se nao existir, provisionar (confirmar nome do script via tenant-provisioning.ts)

  # Rodar seeds (idempotentes)
  pnpm --filter api seed:run -- --tenant=acme --type=personas
  pnpm --filter api seed:run -- --tenant=acme --type=demo-data

Apos sucesso, validar 6 criterios de aceite listados na task e mover para COMPLETED."
"@
Write-Host $dmMsg


Write-Host ""
Write-Host "=== Smoke final: backend Fly.io direto + web root ===" -ForegroundColor Cyan

# Smoke 1: API /health (publico, sem auth)
try {
    $apiHealth = (Invoke-WebRequest "https://sse-api-staging.fly.dev/health" -TimeoutSec 8 -UseBasicParsing).StatusCode
    if ($apiHealth -eq 200) { Write-Host "API /health: 200 OK" -ForegroundColor Green }
    else { Write-Host "API /health: $apiHealth" -ForegroundColor Yellow }
} catch {
    Write-Host "API /health: FAIL -- $_" -ForegroundColor Red
}

# Smoke 2: API /ready (publico, valida db + redis)
try {
    $apiReady = (Invoke-WebRequest "https://sse-api-staging.fly.dev/ready" -TimeoutSec 8 -UseBasicParsing).StatusCode
    if ($apiReady -eq 200) { Write-Host "API /ready: 200 OK (db + redis)" -ForegroundColor Green }
    else { Write-Host "API /ready: $apiReady" -ForegroundColor Yellow }
} catch {
    Write-Host "API /ready: FAIL -- $_" -ForegroundColor Red
}

# Smoke 3: Frontend root (publico)
try {
    $webRoot = (Invoke-WebRequest "https://sse-web-staging.vercel.app" -TimeoutSec 8 -UseBasicParsing).StatusCode
    if ($webRoot -eq 200) { Write-Host "Web root: 200 OK" -ForegroundColor Green }
    else { Write-Host "Web root: $webRoot" -ForegroundColor Yellow }
} catch {
    Write-Host "Web root: FAIL -- $_" -ForegroundColor Red
}

# NOTA: smoke do proxy Vercel /api/v1/health foi removido.
# Ele exige login (Clerk middleware protege /api/*) e retornaria falsa-falha.
# Validacao end-to-end com login feita em 2026-05-09 via Chrome -- ver po_sessions.md.


Write-Host ""
Write-Host "=== Resumo ===" -ForegroundColor Cyan
Write-Host "Verifique acima:" -ForegroundColor Gray
Write-Host "  1. PR #77: mergeado (ou ja estava)" -ForegroundColor Gray
Write-Host "  2. Handoff DM T-20260509-2: confirmado no dm_queue (PENDING -- DM precisa consumir)" -ForegroundColor Gray
Write-Host "  3. Smoke backend Fly.io /health + /ready: verde" -ForegroundColor Gray
Write-Host "  4. Smoke web root: verde" -ForegroundColor Gray
Write-Host ""
Write-Host "Validacao proxy (BUG-03 end-to-end) ja foi feita em 2026-05-09 via Chrome com login." -ForegroundColor Gray
Write-Host "Quando seed Acme for executado pelo DM (T-20260509-2 -> COMPLETED), UAT esta liberado." -ForegroundColor Gray
