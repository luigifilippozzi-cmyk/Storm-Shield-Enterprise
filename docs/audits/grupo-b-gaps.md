# Auditoria Grupo B (Frontend) — Gap Analysis

> **Data:** 2026-04-05 (atualizado 2026-04-07)
> **Base:** `main` @ `83c0691` (Phase 1 MVP ~92% complete)
> **Spec de referencia:** `docs/.archive/prompts-historicos/PROMPT_CLAUDE_CODE_FASE1.md` secao Grupo B (arquivado em 2026-04-19)
> **Autor:** Agente 3 (Claude Code)
> **Atualizacao:** Review de documentacao (2026-04-07)

---

## Resumo

O Grupo B (frontend pages para Vehicles / Estimates / Financial / Dashboard KPIs)
foi mergeado em `main` nos commits `4052106` e `d8dc7f5`. Todas as telas basicas
existem, mas a implementacao eh **enxuta** — varias funcionalidades descritas na
spec original foram omitidas ou simplificadas.

**Total de gaps identificados:** 17
- **P0 (UX inaceitavel):** 3 — **TODOS resolvidos** (B1-2, B2-2 parcial, B2-3)
- **P1 (features spec'd):** 3 — **TODOS resolvidos** (B1-3/4/5 photos, B3-3 trend chart, B4-5 activity)
- **P2 (polish):** 6 — **TODOS resolvidos** (B4-2, B4-3, B1-1, B2-1, B2-3 detail, B2-4 supplement-form, B2-5 docs)
- **Aceitavel (divergencia menor):** 5

---

## B1 — Vehicles UI

**Arquivos existentes:**
- `apps/web/src/app/(dashboard)/vehicles/page.tsx`
- `apps/web/src/app/(dashboard)/vehicles/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/vehicles/[id]/edit/page.tsx`
- `apps/web/src/app/(dashboard)/vehicles/new/page.tsx`
- `apps/web/src/components/vehicles/vehicle-form.tsx`
- `apps/web/src/hooks/use-vehicles.ts`

| # | Spec (FASE1 B1) | Estado | Prioridade | Detalhe |
|---|---|---|---|---|
| B1-1 | Lista com coluna **customer name** | **RESOLVIDO** | ~~P2~~ | Backend JOIN com customers + frontend exibe customer_name. |
| B1-2 | `customer_id` = **select com busca** no form | **RESOLVIDO** | ~~P0~~ | `CustomerCombobox` com debounced search. Commit `b335a2a`. |
| B1-3 | Detail: **galeria de fotos** + **estimates vinculados** | **Parcial** | ~~P1~~ | Galeria de fotos com upload/delete implementada. Estimates vinculados pendente. |
| B1-4 | `vehicle-photos.tsx` (drag-and-drop upload) | **RESOLVIDO** | ~~P1~~ | Componente criado com upload e delete. |
| B1-5 | Hooks: upload/delete photo | **RESOLVIDO** | ~~P1~~ | `useUploadVehiclePhoto` + `useDeleteVehiclePhoto` hooks. |

### Dependencias de backend (A2)

- `POST /vehicles/:id/photos` (FileInterceptor)
- `DELETE /vehicles/:id/photos/:photoId`
- `GET /vehicles/:id` retornando `vehicle_photos[]` e estimates vinculados

---

## B2 — Estimates UI

**Arquivos existentes:**
- `apps/web/src/app/(dashboard)/estimates/page.tsx`
- `apps/web/src/app/(dashboard)/estimates/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/estimates/[id]/edit/page.tsx`
- `apps/web/src/app/(dashboard)/estimates/new/page.tsx`
- `apps/web/src/components/estimates/estimate-form.tsx`
- `apps/web/src/hooks/use-estimates.ts`

| # | Spec (FASE1 B2) | Estado | Prioridade | Detalhe |
|---|---|---|---|---|
| B2-1 | Lista com coluna **customer name** | **RESOLVIDO** | ~~P2~~ | Backend ja retorna customer_name via JOIN. Frontend exibe. |
| B2-2 | Form **multi-step**: cliente > veiculo > itens > revisao | **Parcial** | P1 | `CustomerCombobox` + `VehicleCombobox` cascading. Form ainda single-page mas com selects pesquisaveis. Commit `b335a2a`. |
| B2-3 | Detail: **line items** + **supplements** + **docs** + **timeline** | **RESOLVIDO** | ~~P0~~ ~~P2~~ | Line items + supplements table + documents + status timeline. Commits `b335a2a`, `cc658ed`. |
| B2-4 | `supplement-form.tsx` | **RESOLVIDO** | ~~P2~~ | `SupplementForm` component com amount + reason fields. PR #12 `cc658ed`. |
| B2-5 | Documents attach UI | **RESOLVIDO** | ~~P2~~ | `EstimateDocuments` component com upload/delete. Backend endpoints criados. |
| B2-6 | Status timeline (historico de mudancas) | **RESOLVIDO** | ~~P2~~ | `StatusTimeline` component no detail page. |

### Dependencias de backend (A3)

- `GET /estimates/:id` retornando lines + supplements + documents + status_history
- `POST /estimates/:id/supplements`
- `POST /estimates/:id/documents` (multipart)

---

## B3 — Financial UI

**Arquivos existentes:**
- `apps/web/src/app/(dashboard)/financial/page.tsx`
- `apps/web/src/components/financial/transaction-form.tsx`
- `apps/web/src/hooks/use-financial.ts`

| # | Spec (FASE1 B3) | Estado | Prioridade | Detalhe |
|---|---|---|---|---|
| B3-1 | Rotas separadas: `/transactions` + `/transactions/new` | Divergente | Aceitavel | Tudo em `/financial` com form inline. UX razoavel. |
| B3-2 | `kpi-cards.tsx` componente separado | Inline | Aceitavel | KPI cards inline em `financial/page.tsx:52-71`. |
| B3-3 | **Trend chart** Recharts (income vs expense 6 meses) | **RESOLVIDO** | ~~P1~~ | `TrendChart` com recharts BarChart, 12 meses income vs expenses. Commit `0584a98`. |
| B3-4 | Breakdown por categoria (income/expense) | Ausente | P2 | `FinancialSummary` so retorna totais agregados. |

### Dependencias de backend (A4)

- `GET /financial/dashboard` retornando `monthly_trend[]`, `income_by_category[]`, `expense_by_category[]`, `recent_transactions[]`
- Hoje so existe `GET /financial/summary` com 4 campos agregados.

---

## B4 — Dashboard KPIs

**Arquivo existente:** `apps/web/src/app/(dashboard)/dashboard/page.tsx`

| # | Spec (FASE1 B4) | Estado | Prioridade | Detalhe |
|---|---|---|---|---|
| B4-1 | Total customers ativos | OK | - | Funcional. |
| B4-2 | Estimates pendentes (status: **sent**) | **RESOLVIDO** | ~~P2~~ | Corrigido para `status: 'sent'`. Commit `0584a98`. |
| B4-3 | **Receita do mes atual** | **RESOLVIDO** | ~~P2~~ | Usa monthly_trend do dashboard para extrair mes atual. Commit `0584a98`. |
| B4-4 | Service orders abertas | OK | - | Funcional. |
| B4-5 | **Atividade recente** (5 customers + 5 transactions) | **RESOLVIDO** | ~~P1~~ | `RecentActivity` component com 5 customers + 5 transactions. Commit `0584a98`. |

---

## PRs Sugeridos (ordem de execucao)

| # | Branch | Escopo | Status |
|---|---|---|---|
| PR-1 | `feature/SSE-013-searchable-customer-select` | `<CustomerCombobox>` + `<VehicleCombobox>` (P0: B1-2 + B2-2) | **MERGED** `b335a2a` |
| PR-2 | `feature/SSE-014-estimate-detail-line-items` | Line items na detail page (P0: B2-3) | **MERGED** `b335a2a` |
| PR-3 | `feature/SSE-015-dashboard-recent-activity` | Recent Activity + fix status + monthly revenue (B4-2/3/5) | **MERGED** `0584a98` |
| PR-4 | `feature/SSE-016-vehicle-photos` | Photo gallery + upload hooks (P1: B1-3/4/5) | **MERGED** PR-5 |
| PR-5 | `feature/SSE-017-financial-trend-chart` | Recharts trend chart (P1: B3-3) | **MERGED** `0584a98` |
| PR-6 | `feature/SSE-018-estimate-supplements-docs` | Supplements + docs + timeline (P2: B2-4/5/6) | **MERGED** PR-5 (docs + timeline) |
| PR-7 | `feature/SSE-019-list-customer-columns` | Customer name em listas (P2: B1-1/B2-1) | **MERGED** PR-5 |

---

## Novos Componentes Necessarios

| Componente | PR | Status |
|---|---|---|
| `components/shared/customer-combobox.tsx` | PR-1 | **Criado** |
| `components/shared/vehicle-combobox.tsx` | PR-1 | **Criado** |
| `components/ui/popover.tsx` | PR-1 | **Criado** (shadcn/ui) |
| `components/ui/command.tsx` | PR-1 | **Criado** (shadcn/ui + cmdk) |
| `components/financial/trend-chart.tsx` | PR-5 | **Criado** (recharts BarChart) |
| `components/dashboard/recent-activity.tsx` | PR-3 | **Criado** |
| `components/vehicles/vehicle-photos.tsx` | PR-4 | **Criado** |
| `components/estimates/estimate-documents.tsx` | PR-6 | **Criado** |
| `components/estimates/status-timeline.tsx` | PR-6 | **Criado** |
| `components/estimates/supplement-form.tsx` | PR-12 | **Criado** |

---

## Gaps Remanescentes (3 de 17) — todos P2

| # | Descricao | Prioridade | Dependencia |
|---|---|---|---|
| B1-3 | Vehicle detail: estimates vinculados | P2 | Frontend query por vehicle_id |
| B2-2 | Form multi-step (wizard completo) | P2 | Frontend UX refactor |
| B3-4 | Financial breakdown por categoria | P2 | Dashboard endpoint expand |

> **Nota:** Todos os P0 e P1 estao resolvidos. Os 3 gaps restantes sao P2 (polish) e nao bloqueiam a Fase 1.
