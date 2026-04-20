---
name: Dev Manager Queue — Archive
description: Histórico de tarefas concluídas ou canceladas, movidas de dm_queue.md na rotação mensal
type: project
---

# Dev Manager Queue — Archive

> Tarefas COMPLETED ou CANCELED movidas de `dm_queue.md` no primeiro dia útil de cada mês.
> Mais antigas no final do arquivo. Nunca editar retroativamente.

---

## T-20260417-10 — Implementar RF-001 (Landing por Persona + Workspace Switcher)

**Origin:** PO
**Priority:** P0
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**PR:** #31 (merged)
**Branch:** `feature/SSE-044-rf-001-landing-por-persona` (deleted)

### Resumo do que foi feito
- `apps/api/src/lib/workspace.ts` — helper puro com 4 workspaces, `getPrimaryWorkspace`, `getAvailableWorkspaces`, `isWorkspaceAccessible`
- `apps/api/src/lib/workspace.spec.ts` — 21 testes cobrindo todos os casos de hierarquia de roles
- `apps/api/src/modules/auth/auth.controller.ts` — endpoint `GET /auth/workspace-info` retorna roles + primaryWorkspace + availableWorkspaces
- `apps/api/src/common/guards/auth.guard.ts` — SECURITY FIX: adicionado `roles.tenant_id` filter em ambas as queries (permissions + roleAssignments) para evitar cross-tenant leak
- `apps/web/src/lib/workspace.ts` — mirror do helper no frontend
- `apps/web/src/hooks/use-workspace.ts` — React Query hook com staleTime 5min
- `apps/web/src/components/layout/workspace-switcher.tsx` — dropdown (oculto se 1 workspace)
- `apps/web/src/components/layout/header.tsx` — WorkspaceSwitcher adicionado
- `apps/web/src/components/layout/sidebar.tsx` — WORKSPACE_NAV map + Settings sempre no rodapé
- `apps/web/src/app/(dashboard)/app/layout.tsx` — detecta workspace da pathname
- `apps/web/src/app/(dashboard)/app/page.tsx` — redirect inteligente para primaryWorkspace.path
- `apps/web/src/app/(dashboard)/app/cockpit/page.tsx` — Owner workspace: 4 KPI StatCards
- `apps/web/src/app/(dashboard)/app/estimates/inbox/page.tsx` — Estimator workspace
- `apps/web/src/app/(dashboard)/app/my-work/page.tsx` — Technician workspace
- `apps/web/src/app/(dashboard)/app/books/page.tsx` — Accountant workspace: P&L summary
- `apps/web/src/app/(dashboard)/403/page.tsx` — 403 page com back link
- `apps/web/src/app/page.tsx` — root redirect `/` → `/app`
- `.github/ISSUE_TEMPLATE/*.md` — 3 templates com secao Persona/gap

**Gap fechado:** Gap 1 (Bussola §4 — Landing por Persona)
**Persona servida:** Todas as 4 (Owner, Estimator, Technician, Accountant)

---

## T-20260417-8 — Reorganização física de `docs/` (moves + deletes conforme WS-C)

**Origin:** PO
**Priority:** P1
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**PR:** #29 (merged)

### Resumo
- 5 prompts historicos movidos para `docs/.archive/prompts-historicos/`
- 5 prompts de agentes movidos para `.claude/agents/`
- `docs/SSE_Templates_Sessao_Agentes.md` removido (consolidado em HANDOFF_PROTOCOL §13)
- `docs/SSE_Post_Migration_Readiness_Report_20260412.md` movido para `docs/audits/`
- `docs/.archive/README.md` criado
- Links verificados — nenhum quebrado

---

## T-20260417-7 — Criar/atualizar `.github/ISSUE_TEMPLATE/` com referência à Bússola

**Origin:** PO
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**PR:** #30 (merged, junto com T-6)

### Resumo
- `.github/ISSUE_TEMPLATE/bug_report.md` — secao Persona/gap adicionada
- `.github/ISSUE_TEMPLATE/feature_request.md` — secao Persona/gap + header Bussola
- `.github/ISSUE_TEMPLATE/task.md` — secao Persona/gap adicionada

---

## T-20260417-6 — Configurar labels GitHub alinhadas com a Bússola

**Origin:** PO
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**PR:** #30 (docs only — labels via `gh label create`)

### Resumo
Labels criadas: persona (owner/estimator/technician/accountant/N-A), gap (1-8), priority (P0-P3). Labels existentes preservadas.

---

## T-20260417-5 — Commit dos documentos estratégicos/processos produzidos na sessão 2026-04-17

**Origin:** PO
**Priority:** P1
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-19
**PR:** #27 (merged)

### Resumo
- `docs/strategy/BUSSOLA_PRODUTO_SSE.md` — Bussola de Produto v0.1
- `docs/strategy/RF_BACKLOG.md` — RF backlog com RF-001/002/003
- `docs/decisions/009-adocao-bussola-de-produto.md` — ADR-009
- `docs/decisions/010-operating-model-v2.md` — ADR-010
- `docs/process/HANDOFF_PROTOCOL.md` — Protocolo de Handoff v1.0
- `docs/process/OPERATING_MODEL_v2.md` — Operating Model v2
- `docs/README.md` — INDEX navegavel
- `README.md` (root) — patch secao Strategy & Governance
- `.auto-memory/po_sessions.md`, `dm_queue.md`, `dm_queue_archive.md`, `next_sessions_plan.md`, `MEMORY.md`

---

## T-20260417-3 — Atualizar AGENTS.md referenciando Bússola + Handoff Protocol

**Origin:** PO
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**PR:** #28 (merged, junto com T-1 e T-2)

### Resumo
Secao "§2 Documentos de Referencia Obrigatorios" adicionada ao AGENTS.md com hierarquia de autoridade entre documentos.

---

## T-20260417-2 — Atualizar `.github/PULL_REQUEST_TEMPLATE.md`

**Origin:** PO
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**PR:** #28 (merged)

### Resumo
Secao "## Persona e gap (ref. Bussola de Produto)" adicionada ao PR template.

---

## T-20260417-1 — Patch CLAUDE.md §10 adicionando regras 15-18

**Origin:** PO
**Priority:** P1
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**PR:** #28 (merged)

### Resumo
Regras 15 (consultar Bussola), 16 (linkar persona/gap em PRs de UI), 17 (seguir Handoff Protocol), 18 (operar conforme Operating Model v2) adicionadas ao CLAUDE.md §10.

---

*Tarefas mais antigas serao adicionadas na proxima rotacao mensal (primeiro dia util de maio 2026).*
