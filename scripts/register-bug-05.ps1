# Script para registrar BUG-05 na fila do Dev Manager e criar issue no GitHub
# Convenção: Todos scripts começam com Set-Location absoluto (conforme CLAUDE.md)

Set-Location "C:\Dev\storm-shield-enterprise"

Write-Host "=== Registrando BUG-05 - Credential Caching IPv6 ===" -ForegroundColor Cyan

# ============================================================================
# PARTE 1: Adicionar à fila dm_queue.md
# ============================================================================

Write-Host "`n[1/2] Adicionando BUG-05 à fila dm_queue.md..." -ForegroundColor Yellow

$data = Get-Date -Format "yyyy-MM-dd HH:mm"
$titulo = "BUG-05 - Credential Caching IPv6: Credenciais erradas cacheadas"

$corpo = @"
## [$data] $titulo

**Prioridade:** P1 BLOCKER
**Módulo:** TenantDatabaseService, Connection Pool
**Root Cause:** Credenciais erradas sendo cacheadas para conexões IPv6
**Descoberto por:** Neon Support (Sam) - 2026-05-12

### Síntese
Mix de conexões bem-sucedidas + rejeições contra MESMO IPv6. Sam diagnosticou: "credenciais erradas estão sendo cacheadas em algum lugar do código".

### Impacto
- 🚫 T-20260509-2 BLOQUEADO (Seed Acme)
- 🚫 UAT testing inoperante
- 🚫 Feature delivery adiada

### Investigação Obrigatória (Priority Order)
1. TenantDatabaseService.ts - como credenciais são gerenciadas?
2. Connection Pool - há cache de credentials?
3. Environment variables - credenciais hardcodeadas?
4. Redis cache - credenciais em cache?
5. IPv6 vs IPv4 - há lógica diferente?

### Critério de Aceite
- [ ] CA1: Localizar EXATAMENTE onde credenciais erradas estão
- [ ] CA2: Seed script roda sem erros
- [ ] CA3: psql CLI conecta sem erro
- [ ] CA4: NestJS API conecta sem erro
- [ ] CA5: Nenhuma rejeição SQLSTATE 28P01
- [ ] CA6: IPv6 = IPv4 (funciona identicamente)

### Arquivo Completo
`BUG_CREDENTIAL_CACHING_IPV6.md` - contém detalhamento 100% necessário

### Subagentes
- test-runner (connection tests)
- security-reviewer (credential handling)

### Tempo Estimado
2-4 horas

---
"@

$f = ".auto-memory\dm_queue.md"

# Verificar se arquivo existe
if (-not (Test-Path $f)) {
    Write-Host "  AVISO: Arquivo não existe: $f" -ForegroundColor Red
    Write-Host "  Criando arquivo..." -ForegroundColor Yellow
    New-Item $f -Force | Out-Null
}

# Adicionar à fila
Add-Content $f "`n$corpo"

Write-Host "  SUCESSO: Adicionado a dm_queue.md" -ForegroundColor Green

# Verificação embutida: mostrar o que foi adicionado
Write-Host "`n[Verificação] Últimas linhas do dm_queue.md:" -ForegroundColor Cyan
Get-Content $f -Tail 15 | Write-Host

# ============================================================================
# PARTE 2: Criar issue no GitHub
# ============================================================================

Write-Host "`n[2/2] Criando issue no GitHub..." -ForegroundColor Yellow

$gh_titulo = "BUG-05: Credential Caching IPv6 - Incorrect Credentials in Cache"
$gh_corpo = @"
## Problem

Neon Support (Sam) diagnosed: Incorrect credentials are being cached for IPv6 connections.

Mix of successful connections and rejections - all rejections against the SAME IPv6 address indicates credential caching issue in SSE code, not Neon platform.

### Current Behavior
- SQLSTATE 28P01 (password authentication failed) for IPv6
- Correct credentials work in Neon Console SQL Editor
- Node.js pg driver fails with same credentials
- psql CLI fails with same credentials
- NestJS API fails with same credentials

### Root Cause
Credentials are being stored/reused incorrectly somewhere in the application code.

## Impact
- BLOCKER: T-20260509-2 (Seed Acme in staging)
- UAT testing inoperant 40+ hours
- Feature delivery indefinitely deferred

## Investigation Required
1. TenantDatabaseService.ts - credential management
2. Connection Pool - credential caching?
3. Environment variables - hardcoded credentials?
4. Redis cache - credentials in cache?
5. IPv6 vs IPv4 - different handling?

## Reproduction Steps
1. Run seed script: pnpm --filter api seed:run
2. Error: SQLSTATE 28P01

## Acceptance Criteria
- CA1: Locate EXACTLY where wrong credentials are cached
- CA2: Seed script runs without errors
- CA3: psql CLI connects without error
- CA4: NestJS API connects without error
- CA5: No SQLSTATE 28P01 rejections
- CA6: IPv6 works identically to IPv4

## Related
- Neon Project: fragrant-sea-98082526
- Discord Thread: https://discord.com/channels/1176467419317940276/1503583811001385010
- Blocking: T-20260509-2

## Notes
Full technical details in: BUG_CREDENTIAL_CACHING_IPV6.md
"@

$labels = "bug,prioridade: alta,fase-1-mvp,modulo: database,credenciais"

try {
    gh issue create `
        --title $gh_titulo `
        --body $gh_corpo `
        --label $labels `
        --assignee "@me"

    Write-Host "  SUCESSO: Issue criada no GitHub" -ForegroundColor Green
} catch {
    Write-Host "  AVISO: Erro ao criar issue GitHub: $_" -ForegroundColor Red
    Write-Host "     (Crie manualmente ou verifique credenciais GitHub)" -ForegroundColor Yellow
}

# ============================================================================
# RESUMO FINAL
# ============================================================================

Write-Host "`n=== RESUMO ===" -ForegroundColor Cyan
Write-Host "SUCESSO: BUG-05 adicionado a dm_queue.md"
Write-Host "Status: Pronto para Dev Manager iniciar investigação"
Write-Host "Tempo estimado: 2-4 horas"
Write-Host "Bloqueando: T-20260509-2 (Seed Acme em staging)"

Write-Host "`n=== FIM ===" -ForegroundColor Cyan
