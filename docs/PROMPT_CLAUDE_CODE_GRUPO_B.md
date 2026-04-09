# Storm Shield Enterprise — Grupo B (Frontend Pages)

> **Agente 3** — escopo EXCLUSIVO: construir páginas frontend consumindo as APIs do backend.
> Prompt autocontido. Leia AGENTS.md + CLAUDE.md antes de começar.

---

## Sua Missão

Construir 4 conjuntos de páginas Next.js (App Router) que hoje não existem ou estão como placeholders: **Vehicles UI, Estimates UI, Financial UI, Dashboard KPIs**. Todas seguindo o padrão de `apps/web/src/app/(dashboard)/customers/` que já está production-ready.

**Branch:** `feature/SSE-011-frontend-pages`
**Entregáveis:** 4 PRs (um por conjunto de páginas)

---

## Escopo: O QUE você PODE tocar

```
✅ apps/web/src/app/(dashboard)/vehicles/**
✅ apps/web/src/app/(dashboard)/estimates/**
✅ apps/web/src/app/(dashboard)/financial/**
✅ apps/web/src/app/(dashboard)/page.tsx (Dashboard KPIs)
✅ apps/web/src/components/** (novos componentes reutilizáveis)
✅ apps/web/src/hooks/** (novos hooks)
✅ apps/web/src/lib/api/** (novos clients para endpoints novos)
✅ apps/web/src/stores/** (Zustand stores, se necessário)
```

## Escopo: O QUE você NÃO PODE tocar

```
❌ apps/api/** (Agente 2 está trabalhando no backend)
❌ packages/shared-types/** (só Agente 2 adiciona tipos — consuma o que ele publicar)
❌ infra/** (Agente 1)
❌ apps/api/fly.toml, apps/web/vercel.json
❌ .github/workflows/**
❌ .credentials-staging.env
❌ CLAUDE.md (só o Luigi edita)
❌ apps/web/src/app/(dashboard)/customers/** (referência, não tocar)
❌ apps/web/src/app/(auth)/** (fluxo Clerk já pronto)
```

Se precisar editar algo fora do escopo, **pare e pergunte ao Luigi**.

---

## Protocolo de Execução

```bash
# 1. Sincronizar
git fetch origin
git pull origin main
git branch -a | grep feature/SSE

# 2. Verificar tipos disponíveis
ls packages/shared-types/src/
# Se tipos que você precisa ainda não existem, aguardar Agente 2 mergear

# 3. Criar sua branch
git checkout -b feature/SSE-011-frontend-pages

# 4. Executar tarefas NA ORDEM: B1 → B2 → B3 → B4
# 5. Commit + PR após cada conjunto (não espere terminar tudo)
```

---

## Padrão de Referência (OBRIGATÓRIO seguir)

Antes de escrever qualquer código, leia COMPLETAMENTE:

- `apps/web/src/app/(dashboard)/customers/page.tsx` (list page)
- `apps/web/src/app/(dashboard)/customers/[id]/page.tsx` (detail page)
- `apps/web/src/app/(dashboard)/customers/new/page.tsx` (create form)
- `apps/web/src/app/(dashboard)/customers/[id]/edit/page.tsx` (edit form)
- `apps/web/src/lib/api/customers.ts` (API client)
- `apps/web/src/hooks/use-customers.ts` (TanStack Query hook)

Replicar EXATAMENTE esse padrão: mesma estrutura de pastas, mesmos componentes shadcn/ui (DataTable, Form, Dialog), mesmo uso de TanStack Query + Zod + react-hook-form.

---

## Dependência do Agente 2

Os tipos TypeScript de cada módulo são publicados pelo Agente 2 em `packages/shared-types`. Antes de consumir uma API, verifique:

```bash
grep -r "VehicleDto\|EstimateDto\|TransactionDto" packages/shared-types/src/
```

Se o tipo ainda não existe, **pare aquela tarefa específica** e mova para a próxima. Volte quando o PR do Agente 2 correspondente estiver merged em `main`.

**Sequência sugerida:**
- B1 (Vehicles) → depende de A2 merged
- B2 (Estimates) → depende de A3 merged
- B3 (Financial) → depende de A4 merged
- B4 (Dashboard) → depende de TODOS merged

**Dica:** comece por B4 (Dashboard) estruturando com mock data, e quando A1-A4 mergearem, troque por chamadas reais.

---

## B1 — Vehicles UI

**Arquivos:** `apps/web/src/app/(dashboard)/vehicles/`

**Páginas:**
- `page.tsx` — lista com DataTable (colunas: year, make, model, VIN, customer_name, actions)
  - Filtros: search (plate/VIN), customer_id, make, year
  - Paginação server-side via TanStack Query
- `new/page.tsx` — form de criar (shadcn/ui Form + Zod)
  - Campos: customer_id (select buscável), year, make, model, VIN, color, license_plate, state, mileage
- `[id]/page.tsx` — detalhe com:
  - Dados do veículo
  - Galeria de fotos (grid 3 colunas, clique abre lightbox)
  - Botão "Upload Foto" (multipart → POST /vehicles/:id/photos)
  - Lista de estimates/service orders relacionados (read-only por enquanto)
- `[id]/edit/page.tsx` — form de editar (mesmo do new com valores carregados)

**Componentes novos:**
- `components/vehicles/vehicle-form.tsx` (reutilizado em new/edit)
- `components/vehicles/photo-gallery.tsx`
- `components/vehicles/photo-upload-dialog.tsx`
- `components/ui/customer-combobox.tsx` (busca async de customers)

**API client:** `lib/api/vehicles.ts` com funções `listVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle, uploadPhoto, deletePhoto`.

**Hook:** `hooks/use-vehicles.ts` com `useVehicles, useVehicle, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, useUploadPhoto`.

**Commit + PR B1** antes de prosseguir.

---

## B2 — Estimates UI

**Arquivos:** `apps/web/src/app/(dashboard)/estimates/`

**Páginas:**
- `page.tsx` — lista com DataTable
  - Colunas: number, customer_name, vehicle, total, status (badge colorido), created_at, actions
  - Filtros: status multi-select, customer_id, date range
- `new/page.tsx` — form com tabs:
  - Tab 1: Header (customer, vehicle, insurance_claim_number, deductible, description)
  - Tab 2: Lines (tabela editável inline: add/remove rows, cálculo automático de subtotal)
  - Tab 3: Summary (totais calculados, tax, discount)
- `[id]/page.tsx` — detalhe com:
  - Header info
  - Lines table (editável se status = draft)
  - Supplements section (adicionar se status ∈ approved/in_progress)
  - Status history timeline
  - Documents section (upload + list)
  - Botões de status transition (disabled conforme workflow)
- `[id]/edit/page.tsx` — full edit (apenas se status = draft)

**Componentes novos:**
- `components/estimates/estimate-form.tsx`
- `components/estimates/estimate-lines-editor.tsx` (add/remove/edit linhas)
- `components/estimates/supplements-panel.tsx`
- `components/estimates/status-badge.tsx` (mapeia status → cor)
- `components/estimates/status-transition-buttons.tsx` (mostra ações válidas)
- `components/estimates/status-history-timeline.tsx`
- `components/estimates/documents-section.tsx`
- `components/ui/vehicle-combobox.tsx` (busca async filtrada por customer)

**Mapa de cores status:**
```
draft              → gray
pending_approval   → yellow
approved           → blue
in_progress        → purple
completed          → green
invoiced           → emerald
rejected           → red
cancelled          → zinc
```

**Commit + PR B2** antes de prosseguir.

---

## B3 — Financial UI

**Arquivos:** `apps/web/src/app/(dashboard)/financial/`

**Páginas:**
- `page.tsx` — dashboard financeiro com:
  - 4 cards KPI no topo: Income (MTD), Expense (MTD), Balance (MTD), Pending Reconciliation
  - Gráfico de tendência (últimos 12 meses) — LineChart recharts
  - Gráfico de pizza por categoria (mês atual) — PieChart recharts
  - Tabela de transações recentes (últimas 10)
- `transactions/page.tsx` — lista completa com DataTable
  - Colunas: date, type (badge), category, description, amount (colorido: verde=income, vermelho=expense), reconciled (✓), actions
  - Filtros: type, category, date range, reconciled, min/max amount
- `transactions/new/page.tsx` — form criar transação
- `transactions/[id]/page.tsx` — detalhe + botão "Reconcile"
- `transactions/[id]/edit/page.tsx` — form editar

**Componentes novos:**
- `components/financial/kpi-card.tsx`
- `components/financial/trend-chart.tsx`
- `components/financial/category-pie-chart.tsx`
- `components/financial/transaction-form.tsx`
- `components/financial/type-badge.tsx`
- `components/financial/reconcile-dialog.tsx`

**Formatação:** usar `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` sempre para valores. Nunca exibir raw decimals.

**Commit + PR B3** antes de prosseguir.

---

## B4 — Dashboard KPIs

**Arquivos:** `apps/web/src/app/(dashboard)/page.tsx`

Página inicial que o usuário vê após login. Layout em grid:

**Linha 1 — 4 KPI cards:**
- Total Customers (com variação vs mês anterior)
- Active Estimates (status ∈ pending_approval/approved/in_progress)
- Revenue MTD
- Open Service Orders (quando módulo existir — por ora placeholder 0)

**Linha 2 — 2 gráficos lado a lado:**
- Estimates by Status (BarChart horizontal)
- Revenue Trend (LineChart 6 meses)

**Linha 3 — 2 tabelas lado a lado:**
- Recent Estimates (últimas 5, link para detalhe)
- Recent Customers (últimos 5 cadastrados)

**Componentes novos:**
- `components/dashboard/kpi-card-with-trend.tsx`
- `components/dashboard/estimates-by-status-chart.tsx`
- `components/dashboard/revenue-trend-chart.tsx`
- `components/dashboard/recent-list-card.tsx`

**Fonte de dados:** consolida chamadas aos endpoints existentes via TanStack Query com `Promise.all` no server component, ou múltiplos `useQuery` no client.

**Commit + PR B4.**

---

## Padrões Obrigatórios

**Fetching:**
- TanStack Query com `queryKey` padronizada: `['vehicles', 'list', filters]`
- `staleTime: 30_000` para listas, `staleTime: 60_000` para detalhes
- Invalidate após mutations: `queryClient.invalidateQueries({ queryKey: ['vehicles'] })`

**Forms:**
- `react-hook-form` + `@hookform/resolvers/zod`
- Schemas Zod em arquivos separados: `lib/schemas/vehicle.schema.ts`
- Erros inline nos campos (shadcn/ui `FormMessage`)

**Feedback:**
- Toast (sonner) em success/error de todas as mutations
- Loading states: skeletons (shadcn/ui) em listas, spinners em botões
- Confirmação (AlertDialog) antes de delete

**Acessibilidade:**
- Labels em todos os inputs
- Botões com `aria-label` quando só ícone
- Keyboard navigation em DataTable e Dialogs

**Responsive:**
- Mobile-first, testar em 375px, 768px, 1440px
- DataTable com scroll horizontal em mobile
- Forms empilham em coluna única em mobile

---

## Checklist antes de cada PR

- [ ] `pnpm --filter web lint` passando
- [ ] `pnpm --filter web build` sem erros
- [ ] `pnpm --filter web typecheck` sem erros
- [ ] Páginas testadas em dev (`pnpm --filter web dev`)
- [ ] Mobile/desktop layout validado
- [ ] Empty states e loading states funcionando
- [ ] Toasts de sucesso/erro funcionando
- [ ] Nenhum arquivo fora do seu escopo modificado
- [ ] Commit Conventional: `feat(web): vehicles UI com CRUD e galeria de fotos`

---

## Coordenação com Agente 2 (Backend)

- Se endpoint que você precisa não existir ainda, **não invente mock** — aguarde merge do Agente 2 ou comente no PR dele
- Se encontrar bug no backend, abra issue separada, não conserte você mesmo
- Se precisar de campo adicional num DTO, comente no PR do Agente 2 antes de consumir
- Sempre importe tipos de `@sse/shared-types`, nunca redeclare

---

## Quando parar e pedir ajuda ao Luigi

- Tipo necessário não existe em `shared-types` e Agente 2 ainda não mergeou
- Conflito de merge com Agente 2 (raro, escopos separados)
- Dúvida sobre UX/layout (ex: "mostrar supplements expandidos ou colapsados?")
- Necessidade de biblioteca nova (chart lib alternativa, etc.) — discutir antes
- Componente shadcn/ui que ainda não foi instalado (Luigi ou você roda `pnpm dlx shadcn add <nome>`)
