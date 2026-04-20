---
name: SSE Project Status
description: Current state of Storm Shield Enterprise project — metrics, health, priorities for Dev Manager
type: project
---

# SSE Project Status — 2026-04-20 (PM Agent, revisao diaria)

## Health: AMARELO
- **Reason:** Deploy API (Staging) workflow `Deploy API (Staging)` confirmado FAILURE 10:14Z em 2026-04-20 (T-20260412-1 BLOCKED). Secrets configurados Abr 14, Docker fixes aplicados Abr 19 — causa raiz ainda nao identificada.
- CI: VERDE (ultimo run 11:19Z, 2026-04-20)
- Deploy Staging (geral/web): VERDE (11:19Z, 2026-04-20)
- Deploy Web (Vercel): VERDE
- Deploy API (Fly.io): VERMELHO (10:14Z, 2026-04-20 — ultimo run `Deploy API (Staging)` = failure)
- PRs abertos: 0 | Total merged: 31

## Repo Metrics (live from code, 2026-04-20)
- Backend modules: 12/15 (auth, tenants, users, customers, insurance, vehicles, estimates, service-orders, financial, contractors, accounting, fixed-assets)
- Ausentes: inventory, rental, notifications
- Controllers: 15
- Endpoints: 99 (auth.controller: GET /auth/workspace-info)
- Frontend pages: 36 (inclui /app, /app/cockpit, /app/estimates/inbox, /app/my-work, /app/books, /403 — RF-001)
- Test suites (spec files): 22
- Tests: 343 passing
- Migrations: 11 SQL files (000-010)
- ADRs: 10 (009: bussola de produto, 010: operating model v2)

## Git — Commits desde ultima sessao PM (2026-04-19)
- PR #32: docs: promote _staging agent files + gitignore _staging/ (2026-04-20)
- PR #31: feat(auth,web): RF-001 — landing por persona + workspace switcher + 4 workspaces + sidebar dinamica (2026-04-20)
- PR #30: docs: GitHub issue templates com secao Bussola persona/gap (2026-04-20)
- PR #29: docs: WS-C reorganizacao (2026-04-20)
- PR #28: docs: governance patches — CLAUDE.md regras 15-18, AGENTS.md, PR template (2026-04-20)

## Verificacao Regras CLAUDE.md §10
- Regra 4 (KNEX_CONNECTION direto): OK — nenhuma violacao
- Regra 5 (FLOAT em migrations): OK — nenhuma violacao
- Regra 6 (CASCADE em financeiro/contabil): OK — nenhuma violacao
- Regra 9 (secrets hardcoded): OK — nenhuma violacao
- Regras 15-18 (alinhamento Bussola): OK
  - PR #32: N/A governance (justificado) — CONFORME
  - PR #31: Gap 1 + 4 personas identificadas — CONFORME
  - dm_queue.md: no arquivo canonico correto — CONFORME
  - Handoff template: conforme §4 HANDOFF_PROTOCOL — CONFORME

## Inconsistencias detectadas
- T-20260412-3 em dm_queue.md: status PENDING mas T-032 (Reports) ja concluida (PR #24, Abr 13). Apenas T-008 + T-009 restam dessa task. DM deve atualizar status parcial.

## Prioridades para Proxima Sessao DM

### P0 — Imediato
1. **T-20260417-11 RF-002** — Setup Wizard de Onboarding (5 passos). Gap 3 Bussola. Dep RF-001 satisfeita.
2. **T-20260417-12 RF-003** — Activation Event Tracking. Gap 8. Pode rodar paralelo a RF-002.
3. **T-20260412-1 Deploy API** — Investigar causa raiz. Checar logs Fly.io + `fly.toml` + variaveis de ambiente pos-Docker-fix.

### P1 — Proximo ciclo
4. **T-008 + T-009** — Fechar Fase 1A (8/10 → 10/10). Enum cleanup + date validation. Tasks rapidas (<1h).
5. **Atualizar T-20260412-3** — Marcar T-032 como done dentro da task, manter apenas T-008+T-009 pendentes.

### P2
6. **T-036** — Accounting frontend pages (COA + JE) — completar Fase 3 (7/8 → 8/8)

## Ultima sessao PM: 2026-04-20 (esta revisao)
## Ultima sessao DM: 2026-04-20
