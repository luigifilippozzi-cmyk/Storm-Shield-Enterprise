<#
.SYNOPSIS
    Diagnostico canonico de abertura de sessao do PO.

.DESCRIPTION
    Equivale ao bloco "Diagnostico completo" do project_instructions do PO Assistant.
    Checa: git status, ultimos commits, branches feature/fix, PRs abertos, ultimos CI runs,
    healthcheck do staging API, tail do dm_queue.md.

.EXAMPLE
    .\Invoke-PODiagnostic.ps1

.NOTES
    Requer: git, gh CLI autenticado, Invoke-WebRequest (nativo).
    ASCII-only para compatibilidade com Windows PowerShell 5.1 (Windows-1252).
#>

[CmdletBinding()]
param()

Set-Location "C:\Dev\storm-shield-enterprise"

Write-Host "=== SSE Diagnostico PO ===" -ForegroundColor Cyan
Write-Host "Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Host ""

# --- Git ---
Write-Host "--- Git ---" -ForegroundColor Gray
git fetch origin --quiet
git log --oneline -5
Write-Host ""

$branches = git branch -a | Select-String "feature/|fix/|chore/|docs/"
if ($branches) {
    Write-Host "Branches ativas:"
    $branches | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "Nenhuma branch feature/fix/chore/docs local ou remota"
}
Write-Host ""

$dirty = git status --porcelain
if ($dirty) {
    Write-Host "[AVISO] Working tree sujo" -ForegroundColor Yellow
    git status --short
} else {
    Write-Host "[OK] Working tree limpo" -ForegroundColor Green
}
Write-Host ""

# --- GitHub ---
Write-Host "--- PRs abertos ---" -ForegroundColor Gray
try {
    $prs = gh pr list --state open --json number,title,headRefName,createdAt 2>$null `
        | ConvertFrom-Json
    if ($prs.Count -eq 0) {
        Write-Host "[OK] Nenhum PR aberto" -ForegroundColor Green
    } else {
        $prs | Format-Table number,title,headRefName -AutoSize
    }
} catch {
    Write-Host "[AVISO] gh CLI nao disponivel ou nao autenticado" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "--- Ultimos CI runs ---" -ForegroundColor Gray
try {
    gh run list --limit 3 --json conclusion,workflowName,headBranch,createdAt 2>$null `
        | ConvertFrom-Json | Format-Table -AutoSize
} catch {
    Write-Host "[AVISO] Nao foi possivel listar runs do CI" -ForegroundColor Yellow
}
Write-Host ""

# --- Staging ---
Write-Host "--- Staging API ---" -ForegroundColor Gray
try {
    $resp = Invoke-WebRequest "https://sse-api-staging.fly.dev/health" `
        -TimeoutSec 8 -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] API staging: HTTP $($resp.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] API staging: TIMEOUT/ERROR" -ForegroundColor Red
}
Write-Host ""

# --- dm_queue tail ---
Write-Host "--- DM Queue (topo 15 linhas) ---" -ForegroundColor Gray
if (Test-Path ".auto-memory\dm_queue.md") {
    Get-Content ".auto-memory\dm_queue.md" | Select-Object -First 15
} else {
    Write-Host "[AVISO] dm_queue.md nao encontrado" -ForegroundColor Yellow
}
Write-Host ""

# --- MEMORY.md presente? ---
Write-Host "--- Auto-memory index ---" -ForegroundColor Gray
if (Test-Path ".auto-memory\MEMORY.md") {
    $linhas = (Get-Content .auto-memory\MEMORY.md | Measure-Object -Line).Lines
    Write-Host "[OK] MEMORY.md presente ($linhas linhas)" -ForegroundColor Green
} else {
    Write-Host "[ERRO] MEMORY.md ausente - protocolo de abertura diz que e leitura obrigatoria" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Fim do diagnostico ===" -ForegroundColor Cyan
