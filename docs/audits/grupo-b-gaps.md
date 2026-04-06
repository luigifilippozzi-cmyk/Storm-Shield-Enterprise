# Auditoria Grupo B (Frontend) — Gap Analysis

> **Data:** 2026-04-05
> **Base:** `main` @ `af7a30a` (Phase 1 MVP complete)
> **Spec de referencia:** `docs/PROMPT_CLAUDE_CODE_FASE1.md` secao Grupo B
> **Autor:** Agente 3 (Claude Code)

---

## Resumo

O Grupo B (frontend pages para Vehicles / Estimates / Financial / Dashboard KPIs)
foi mergeado em `main` nos commits `4052106` e `d8dc7f5`. Todas as telas basicas
existem, mas a implementacao eh **enxuta** — varias funcionalidades descritas na
spec original foram omitidas ou simplificadas.

**Total de gaps identificados:** 17
- **P0 (UX inaceitavel):** 3
- **P1 (features spec'd):** 3
- **P2 (polish):** 6
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
| B1-1 | Lista com coluna **customer name** | Parcial | P2 | Lista mostra year/make/model/VIN/color/condition/plate. Sem customer name. |
| B1-2 | `customer_id` = **select com busca** no form | Ausente | **P0** | `vehicle-form.tsx:296-306` usa `<Input>` texto livre pedindo UUID. |
| B1-3 | Detail: **galeria de fotos** + **estimates vinculados** | Ausente | P1 | `[id]/page.tsx` mostra so info basica. Sem galeria, sem estimates. |
| B1-4 | `vehicle-photos.tsx` (drag-and-drop upload) | Ausente | P1 | Componente inexistente. |
| B1-5 | Hooks: upload/delete photo | Ausente | P1 | `use-vehicles.ts` so tem CRUD basico. |

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
| B2-1 | Lista com coluna **customer name** | Parcial | P2 | Lista mostra estimate#/status/total/claim#/created. Sem customer. |
| B2-2 | Form **multi-step**: cliente > veiculo > itens > revisao | Ausente | **P0** | `estimate-form.tsx` eh single-page com UUIDs texto livre para customer_id e vehicle_id. |
| B2-3 | Detail: **line items** + **supplements** + **docs** + **timeline** | Ausente | **P0** | `[id]/page.tsx` mostra so totais + notes + meta. Sem line items. |
| B2-4 | `supplement-form.tsx` | Ausente | P2 | Componente inexistente. |
| B2-5 | Documents attach UI | Ausente | P2 | Sem upload de documentos. |
| B2-6 | Status timeline (historico de mudancas) | Ausente | P2 | Sem timeline de status. |

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
| B3-3 | **Trend chart** Recharts (income vs expense 6 meses) | Ausente | **P1** | Recharts nao instalado. Componente inexistente. |
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
| B4-2 | Estimates pendentes (status: **sent**) | Bug | P2 | Linha 20 usa `status: 'draft'`. Spec diz `sent`. |
| B4-3 | **Receita do mes atual** | Bug | P2 | Linha 27 usa `total_income` all-time. Precisa scope mensal. |
| B4-4 | Service orders abertas | OK | - | Funcional. |
| B4-5 | **Atividade recente** (5 customers + 5 transactions) | Ausente | P1 | Secao inexistente no dashboard. |

---

## PRs Sugeridos (ordem de execucao)

| # | Branch | Escopo | Pre-requisito backend |
|---|---|---|---|
| PR-1 | `feature/SSE-013-searchable-customer-select` | `<CustomerCombobox>` reusavel em vehicle-form + estimate-form (P0: B1-2 + B2-2) | Nenhum — `/customers?search=` ja existe |
| PR-2 | `feature/SSE-014-estimate-detail-line-items` | Renderizar lines/totais no detail page (P0: B2-3) | `GET /estimates/:id` retornar lines |
| PR-3 | `feature/SSE-015-dashboard-recent-activity` | Recent Activity + fix status='sent' + monthly revenue (P1+P2: B4-2/3/5) | Opcionalmente `/financial/summary?period=` |
| PR-4 | `feature/SSE-016-vehicle-photos` | Photo gallery + upload hooks (P1: B1-3/4/5) | `POST/DELETE /vehicles/:id/photos` |
| PR-5 | `feature/SSE-017-financial-trend-chart` | Instalar recharts + trend chart (P1: B3-3) | `GET /financial/dashboard` |
| PR-6 | `feature/SSE-018-estimate-supplements-docs` | Supplements + docs + timeline (P2: B2-4/5/6) | Endpoints A3 |
| PR-7 | `feature/SSE-019-list-customer-columns` | Customer name em listas vehicles + estimates (P2: B1-1/B2-1) | Backend JOIN ou extra fetch |

---

## Novos Componentes Necessarios

| Componente | PR | Descricao |
|---|---|---|
| `components/shared/customer-combobox.tsx` | PR-1 | Select com busca de customers via API |
| `components/shared/vehicle-combobox.tsx` | PR-1 | Select com busca de vehicles filtrado por customer |
| `components/vehicles/vehicle-photos.tsx` | PR-4 | Galeria de fotos com drag-and-drop upload |
| `components/financial/trend-chart.tsx` | PR-5 | Bar/line chart Recharts income vs expense |
| `components/estimates/supplement-form.tsx` | PR-6 | Form para adicionar supplements |
| `components/estimates/status-timeline.tsx` | PR-6 | Timeline visual de mudancas de status |
| `components/dashboard/recent-activity.tsx` | PR-3 | Lista de atividade recente (customers + transactions) |

---

## Decisao Pendente

Quais PRs abrir e em qual ordem — requer confirmacao do Luigi.
Recomendacao: comecar por PR-1 (searchable select) — alto impacto, zero dependencia backend.
