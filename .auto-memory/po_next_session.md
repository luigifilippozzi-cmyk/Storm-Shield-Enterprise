# Handoff PO ? Proxima sessao (apos 2026-06-08)

> Gerado em 2026-06-08 ao final da sessao que fechou RC-1 do BUG-D.
> Leia este arquivo primeiro, depois MEMORY.md, depois rode o diagnostico padrao.

## FOCO UNICO: Smoke UAT 5/5

Este e o trabalho desta sessao. NAO comecar features. NAO mexer em RC-3/4/5 do BUG-D.
NAO redigir ADR-011 antes do UAT validar.

## Estado herdado da sessao 2026-06-08

| Item | Valor |
|---|---|
| BUG-C | CLOSED (PR #85, c3c7af1) ? validado em producao |
| PR #87 | MERGED (CI/TS fix, f032fa1) |
| BUG-D RC-1 | FECHADO (credencial Neon rotacionada 3 lugares) |
| BUG-D RC-2 | PARCIAL (workflow_dispatch funciona) |
| BUG-D RC-3/4/5 | OPEN baixa prioridade |
| T-20260412-1 | DESTRAVADO apos 46 dias |
| Image Fly.io | deployment-01KTM8RCMWAGKS4X3NK72611JT (com PR #85+#87) |
| /ready staging | 200 db:up + redis:up |
| Issue #86 BUG-D | OPEN ? fechar parcialmente apos UAT |

## Passo 1: Diagnostico de abertura (3min)

`powershell
Set-Location "C:\Dev\storm-shield-enterprise"
git fetch origin --quiet; git pull origin main
git log --oneline -3
(Invoke-WebRequest "https://sse-api-staging.fly.dev/health" -TimeoutSec 15 -UseBasicParsing).Content
(Invoke-WebRequest "https://sse-api-staging.fly.dev/ready" -TimeoutSec 15 -UseBasicParsing).Content
flyctl status --app sse-api-staging | Select-String "Image|VERSION|STATE"
`

**Esperado:**
- /ready 200 com db:up + redis:up
- Image hash 01KTM8RC... (ou mais novo)
- Maquina started ou stopped (scale-to-zero normal)

**Se /ready 503 OU image hash velho OU 28P01 nos logs:**
PARE. Regressao. Abrir BUG-E e voltar handoff DM. NAO prosseguir UAT.

## Passo 2: Roteiro smoke UAT (20min)

Acessar: https://sse-web-staging.vercel.app
Tenant: Acme (criado em 2026-05-09, ver memoria project_sse_t20260509_2_seed_acme.md)

5 passos obrigatorios:

[ ] P1: Login tenant Acme. Confirma redirecionamento ao dashboard.

[ ] P2: Navegar para /customers
     - Lista carrega sem erro "Failed to fetch"
     - Criar 1 customer novo (nome qualquer)
     - POST retorna 201
     - Customer aparece na lista apos refresh

[ ] P3: Navegar para /estimates
     - Lista carrega
     - Criar 1 estimate vinculado ao customer do P2
     - POST retorna 201
     - Estimate aparece na lista

[ ] P4: Dashboard home (/)
     - KPIs financeiros mostram totais reais (nao zero)
     - Cards de customers/estimates contam corretamente

[ ] P5: /financial
     - Trend chart renderiza com pontos de dados
     - Sem erros no console DevTools

## Passo 3: Decisao apos UAT

### Se 5/5 verde ? caminho feliz:

`powershell
# Comentar issue #86 com sucesso
 = "UAT 5/5 verde em 2026-06-08. BUG-D fecha parcialmente: RC-1 e RC-2 satisfeitos para UAT. RC-3, RC-4, RC-5 viram issues separadas P2/P3."
gh issue comment 86 --body 
gh issue close 86

# Criar 3 issues spinoff
gh issue create --title "RC-3: documentar deploy manual Windows ou substituir runbook" --body "Spinoff de BUG-D. Baixa prioridade pos-RC-1 fechado. Deploy via workflow_dispatch e funcional." --label "documentation,priority: P3,fase-1-mvp"
gh issue create --title "RC-4: consolidar nomes Deploy Staging / Deploy API (Staging)" --body "Spinoff de BUG-D. Renomear ou unir workflows para clareza." --label "refactor,priority: P3,fase-1-mvp"
gh issue create --title "RC-5: redigir ADR-011 release cadence" --body "T-20260412-1 destravado. Documentar workflow_dispatch como mecanismo manual oficial + criterio para auto-deploy completo." --label "documentation,priority: P2,fase-1-mvp"

# Cleanup memoria ? desativar entradas superseded em MEMORY.md
# (PO Cowork faz via Edit tool interna; nao via PowerShell)
`

### Se algum passo falhar:

NAO consertar ad-hoc. Capturar evidencia exata e abrir BUG-E:
- Screenshot da tela com erro
- DevTools Network tab (request + response)
- DevTools Console
- Timestamp ISO + tenant_id Acme
- flyctl logs --app sse-api-staging --no-tail | Select-Object -Last 50

Registrar handoff DM em dm_queue.md com BUG-E + escopo negativo:
- NAO refazer rotacao Neon (RC-1 esta verde, problema e outro)
- NAO mexer em workflow_dispatch (RC-2 funciona)
- Foco: identificar regressao especifica entre PR #85/#87 e UAT real

## Acoes de housekeeping (apos UAT 5/5 verde)

1. **Rotacionar credencial Neon novamente** ? expostas no chat Cowork em 2026-06-08
   Reset password neondb_owner -> sync GH + Fly secrets (mesmo fluxo de 2026-06-08)

2. **Atualizar MEMORY.md** ? desativar entradas superseded por BUG-D fechado:
   - T-20260509-2 Failed Manual UI
   - T-20260509-2 Blocked Neon Auth
   - T-20260509-2 Seed Acme
   - T-20260509-2 Neon Escalation Completed
   - Discord Escalation Posted
   - Neon Support Thread Response
   - BUG-05 Credential Caching
   - ADR release cadence pending (substituido pela RC-5 issue)

3. **Decidir destino de modulos ausentes Fase 1** (inventory/rental/notifications):
   - Fase 1 fecha sem eles? -> trasladar para Fase 2
   - Ou implementar antes de fechar Fase 1?
   Esta decisao requer alinhamento com Bussola secao 2 personas.

## Escopo negativo desta proxima sessao

NAO fazer:
- Features novas
- Mexer em RC-3/4/5 antes de UAT verde
- Redigir ADR-011 antes de UAT validar workflow_dispatch
- Tocar gaps P2 Fase 1 (B1-3, B2-2, B3-4)
- Modulos ausentes (inventory/rental/notifications)
- Migrar provider Neon
- Refatorar TenantDatabaseService
- Redesenhar release cadence
- Alterar Bussola

## Condicao de reversao

Se UAT falhar em P2 ou P3 (customers/estimates) com erro de schema ou connection:
- Pode indicar que PR #85 nao cobriu todos os services
- Reabrir review do PR #85 file-by-file (decisao reversao registrada em 2026-05-28)

Se UAT travar em login (P1):
- Problema de Clerk, nao BUG-D
- Verificar CLERK_SECRET_KEY em Fly.io secrets
