---
name: Handoff - Continuar destrava-UAT
description: Snapshot consolidado para retomar a sequencia destrava-UAT em novo chat PO Cowork
type: project
---

# Handoff — Continuar destrava-UAT (criado 2026-05-09)

> Cole este arquivo no inicio do proximo chat PO Cowork (ou pergunte ao PO Assistant para le-lo) e ele retoma exatamente daqui.

## Onde paramos

A sequencia destrava-UAT tem 4 passos. Estado em 2026-05-09 (fim desta sessao):

| Passo | Status | Notas |
|---|---|---|
| 1. Vercel env var `NEXT_PUBLIC_API_URL` | ✅ **CONCLUIDO** | Var antiga (Sensitive) deletada, var nova (sem Sensitive) criada com valor `https://sse-api-staging.fly.dev/api/v1`, redeploy production sem cache OK, validado end-to-end via Chrome logado: `/api/health` = 200, `/api/ready` = 200 (db:up, redis:up) |
| 2. Mergear PR #77 (BUG-03b fail-fast guard) | ⏸️ **BLOQUEADO** | Playbook abortou no guard de "working tree limpo" — ha mudancas nao commitadas (ver abaixo) |
| 3. DM executa seed Acme (T-20260509-2) | ⏸️ Pendente | Handoff completo redigido em `.auto-memory/dm_queue.md` (topo). Acionar via sessao Cowork DM separada. |
| 4. UAT manual via Doc B (Luigi) ou Doc A (amigo) | ⏸️ Pendente | Roteiros em `docs/audits/SSE_Roteiro_Testes_Amigavel_v1_1.docx` e `SSE_Tour_Completo_Testes_PO_v1_1.docx` |

## Bloqueio atual (working tree sujo)

`git status --short` na ultima checagem:

```
 M .auto-memory/dm_queue.md
 M .auto-memory/po_sessions.md
 M .auto-memory/project_sse_status.md
 M .env.example
 M .github/workflows/deploy-web-staging.yml
 M apps/web/next.config.js
 M apps/web/src/app/(dashboard)/platform-admin/page.tsx
 M docs/audits/SSE_Roteiro_Testes_Amigavel_v1.docx
 M sse-squad-dashboard.html
?? .auto-memory/scripts/destrava_uat_20260509.ps1
?? docs/SSE_Guia_de_Testes_MVP_v1.2.docx
?? docs/audits/SSE_Roteiro_Testes_Amigavel_v1_1.docx
?? docs/audits/SSE_Tour_Completo_Testes_PO_v1_1.docx
```

### Origem dos arquivos

**Desta sessao PO Cowork (2026-05-09 parte 3 — destrava-UAT):**

- `.auto-memory/dm_queue.md` — handoff T-20260509-2 adicionado no topo
- `.auto-memory/po_sessions.md` — 3 sessoes registradas (parte 1, 2 e 3)
- `.auto-memory/project_sse_status.md` — Luigi atualizou para snapshot 09/mai VERDE (sessao UAT super user)
- `.auto-memory/scripts/destrava_uat_20260509.ps1` — playbook ASCII-puro
- `docs/audits/SSE_Roteiro_Testes_Amigavel_v1.docx` — sobrescrito durante atualizacao v1.1
- `docs/audits/SSE_Roteiro_Testes_Amigavel_v1_1.docx` — novo (v1.1 PT-BR amigavel)
- `docs/audits/SSE_Tour_Completo_Testes_PO_v1_1.docx` — novo (v1.1 PT-BR tour PO)

**De sessoes anteriores (BUG-03, ainda nao commitadas):**

- `.env.example`, `.github/workflows/deploy-web-staging.yml`, `apps/web/next.config.js`, `apps/web/src/app/(dashboard)/platform-admin/page.tsx`, `sse-squad-dashboard.html` — `git diff` mostra **vazio** (provavelmente apenas CRLF/LF normalization, nao mudanca real de conteudo). Estas mudancas estavam pre-existentes ao iniciar esta sessao.
- `docs/SSE_Guia_de_Testes_MVP_v1.2.docx` — arquivo novo (14KB), criado em 2026-05-09 22:44, **provavelmente do Luigi** em outro fluxo. Confirmar se faz parte do escopo MVP.

## Comandos para destravar

### Opcao A — Stash temporario (mais rapido, mas adia o problema)

```powershell
Set-Location "C:\Dev\storm-shield-enterprise"
git add -A
git stash push -m "wip: pre-merge PR #77 — sessao 2026-05-09"
powershell -ExecutionPolicy Bypass -File C:\Dev\storm-shield-enterprise\.auto-memory\scripts\destrava_uat_20260509.ps1
# Apos merge bem-sucedido:
git stash pop
# E entao commit em outra rodada (ver Opcao B)
```

### Opcao B — Commits separados (recomendado — Conventional Commits, regra 11)

```powershell
Set-Location "C:\Dev\storm-shield-enterprise"

# Commit 1: governance/memory desta sessao
git add .auto-memory/dm_queue.md .auto-memory/po_sessions.md .auto-memory/project_sse_status.md .auto-memory/scripts/destrava_uat_20260509.ps1 .auto-memory/handoff_continuar_uat_20260509.md
git commit -m "chore(memory): session 2026-05-09 — destrava-UAT (handoff T-20260509-2 + playbook + 3 sessoes registradas)"

# Commit 2: roteiros de teste UAT v1.1
git add docs/audits/SSE_Roteiro_Testes_Amigavel_v1.docx docs/audits/SSE_Roteiro_Testes_Amigavel_v1_1.docx docs/audits/SSE_Tour_Completo_Testes_PO_v1_1.docx
git commit -m "docs(audits): roteiros UAT v1.1 PT-BR — amigavel (4 personas, ~3h) + tour completo PO (15 modulos, ~6-8h)"

# Opcional: checar se SSE_Guia_de_Testes_MVP_v1.2.docx eh do Luigi (commit se sim, ou ignorar)
# git add docs/SSE_Guia_de_Testes_MVP_v1.2.docx
# git commit -m "docs: SSE Guia de Testes MVP v1.2"

# Limpar CRLF/LF normalization dos arquivos pre-existentes (se diff continuar vazio)
git checkout .env.example .github/workflows/deploy-web-staging.yml apps/web/next.config.js apps/web/src/app/(dashboard)/platform-admin/page.tsx sse-squad-dashboard.html

# Rodar playbook
powershell -ExecutionPolicy Bypass -File C:\Dev\storm-shield-enterprise\.auto-memory\scripts\destrava_uat_20260509.ps1
```

### Opcao C — Bypass do guard (NAO recomendado)

Editar o playbook para remover o check `if ($dirty)`. Quebra a auditabilidade — usa so se Opcoes A/B forem inviaveis por tempo.

## Validacoes ja feitas (nao refazer)

- `/api/health` via Vercel proxy autenticado → 200 OK, JSON do backend (timestamp 2026-05-10T04:43:23Z)
- `/api/ready` via Vercel proxy autenticado → 200 OK, db:up + redis:up
- `x-vercel-cache: MISS` confirma request real, nao cache
- BUG-03 efetivamente fechado em 2026-05-09 04:43Z

## Proximos passos apos merge PR #77

1. Acionar sessao Cowork **DM** (nao PO) com:
   > "Consumir T-20260509-2 do dm_queue.md. Rodar `pnpm --filter api seed:run -- --tenant=acme --type=personas` e depois `--type=demo-data` contra Neon staging. Validar 6 criterios de aceite e mover task para COMPLETED."
2. Apos DM completar T-20260509-2, voltar ao PO para iniciar UAT manual.

## Referencias

- Sessao registrada: `.auto-memory/po_sessions.md` — buscar "Sessao 2026-05-09 (parte 3)"
- Handoff DM: `.auto-memory/dm_queue.md` — topo, T-20260509-2 PENDING P1
- Playbook: `.auto-memory/scripts/destrava_uat_20260509.ps1` — ASCII-puro, compativel Windows PowerShell 5.1
- Roteiros de teste: `docs/audits/SSE_Roteiro_Testes_Amigavel_v1_1.docx` e `SSE_Tour_Completo_Testes_PO_v1_1.docx`
- Go/No-Go Fase 1: `docs/audits/SSE_GoNoGo_Fase1_MVP_20260420.md` v2

---

*Para retomar: abrir novo chat PO Cowork, pedir leitura deste arquivo + `.auto-memory/MEMORY.md` + `project_sse_status.md`. Continuar com Passo 2 conforme Opcao A ou B acima.*
