---
name: SSE Project Status
description: Current state of Storm Shield Enterprise project — metrics, health, priorities for Dev Manager
type: project
---

# SSE Project Status — 2026-04-19 (PM Agent, revisao diaria)

## Health: AMARELO
- **Reason:** Deploy API staging FAILURE persiste — secrets configurados Abr 14 + Docker fixes aplicados (runner stage + shared packages), mas Fly.io deploy ainda falha. Causa raiz nao identificada. CI verde.

## Repo Metrics (live from code, 2026-04-19)
- Backend modules: 12/15 (auth, tenants, users, customers, insurance, vehicles, estimates, service-orders, financial, contractors, accounting, fixed-assets)
- Ausentes: inventory, rental, notifications
- Controllers: 15
- Endpoints: 98
- Frontend pages: 30
- Test suites (spec files): 21
- Tests: 293 passing (branch coverage 82% para estimates + vehicles services)
- Migrations: 11 SQL files (000–010)
- ADRs: 10 (009: bussola de produto, 010: operating model v2 — novos desde Abr 12)
- PRs abertos: 0

## Git — Commits desde ultima sessao DM (Abr 13)
- `09307d9` fix(docker): copy apps/api/node_modules to runner stage
- `f8617a5` test(api): improve branch coverage to 82% — estimates and vehicles services
- `d9879d6` ci: re-run after staging secrets deploy
- `f749d7f` fix(docker): resolve shared packages runtime resolution in container
- `af5cb78` fix(db): correct trigger function name in migration 009
- `3533092` fix(db): correct trigger function name in migrations 007, 008, 010
- Total PRs merged: 25 | Open: 0

## Branches Remotas
- `origin/feature/SSE-040-accounting-reports-and-financial-trend` (stale, PR #24 merged)
- `fix/SSE-042-migration-trigger-function-name` (local, fixes merged to main)

## Excel Backlog (SSE_Development_Plan.xlsx — estado base Abr 12, nao atualizado)
- Total tasks: 36 | Concluidas (repo real): 28 | Backlog: 8
- **Fase 1A Hardening:** 8/10 (80%) — faltam T-008 (enums), T-009 (date validation)
- **Fase 1B Deploy:** 8/9 (89%) — falta T-019 (smoke test, bloqueado por deploy API)
- **Fase 2 Frontend Polish:** 3/9 (33%) — T-020, T-021, T-022 DONE (combobox, line editor, trend chart)
- **Fase 3 Accounting+FAM:** 7/8 (88%) — falta T-036 (COA+JE frontend pages)
- **Inconsistencia Excel:** T-032 (Reports) marcada Backlog no Excel mas JA CONCLUIDA no repo

## Infrastructure
- CI (main): GREEN (2026-04-14)
- Deploy Staging (general): GREEN (2026-04-14)
- Deploy API Staging (Fly.io): RED — FAILURE persiste apos secrets + Docker fix
- Deploy Web Staging (Vercel): GREEN (2026-04-14)
- PRs open: 0

## Regras 14 — Verificacao
- KNEX_CONNECTION direto em services: OK (nenhuma violacao)
- FLOAT em migrations: OK (nenhuma violacao)
- CASCADE DELETE: apenas em tabelas IAM (role_permissions, user_sessions) — aceitavel

## Prioridades para Dev Manager

### P0 — Investigar imediatamente
1. **Deploy API Staging causa raiz** — Secrets foram configurados (PO action Abr 14) e Docker foi corrigido, mas Fly.io deploy AINDA falha. DM deve checar: logs Fly.io, verificar se FLY_API_TOKEN e DATABASE_URL_UNPOOLED estao corretos, fly.toml

### P1 — Proxima sessao DM
2. **T-008 + T-009** — Cleanup rapido para fechar Fase 1A (8/10 → 10/10): remover enums duplicados + @IsISO8601 em date params
3. **Coverage global** — 82% confirmado em estimates+vehicles. Verificar se todos os outros services atingem 80%+ (pnpm --filter @sse/api test -- --coverage)

### P2
4. **T-036** — Accounting frontend pages: COA + JE pages em Next.js (completar Fase 3: 7/8 → 8/8)
5. **Atualizar Excel** — Marcar T-032 como Concluido + T-020/T-021/T-022 atualizados

## Inconsistencias Excel vs Repo
- T-032 (Reports): marcada "Backlog" no Excel mas CONCLUIDA no repo (backend ReportsService + 4 frontend pages existem)
- T-020, T-021, T-022: marcadas Backlog no Excel mas ja Done (marcadas pelo DM no dashboard)
- Insurance module: 8 files + spec no repo sem task no Excel

## Ultima sessao PM: 2026-04-19
## Ultima sessao DM: 2026-04-13
