# RF Backlog — Storm Shield Enterprise

> **Nota:** Neste documento, "NS" refere-se a um ERP proprietário de terceiros usado exclusivamente como referência comparativa externa, sem relação comercial, licenciamento ou endosso. O nome da marca foi substituído por precaução (ver ADR-014).

> Backlog de Requisitos Funcionais derivados dos Gaps Críticos da Bússola.
> **Status:** v0.2 — atualizado em 2026-04-21 (incorporação de RF-004..007 via ADR-012)
> **Convenção de numeração:** RF-NNN sequencial. Próximo RF a criar: **RF-008**.
> **Status permitidos:** PROPOSED | APPROVED | IN_PROGRESS | DONE | CANCELED
> **Autoridade:** Bússola §4 (gaps) + §8 (ordem de ataque). RFs aqui derivam diretamente de gaps.
> **Autoridade adicional (RF-004..007):** ADR-012 (incorporação parcial de padrões NS) + `ANALISE_NS_vs_BUSSOLA_v1.md`.

---

## RF-001 — Landing por Persona + Workspace Switcher

**Status:** PROPOSED
**Prioridade:** P0
**Fase:** 1.5 (interim release antes da Fase 2 conforme Bússola §8)
**Gap fechado:** Gap 1 (landing única, não por persona) — Bússola §4
**Persona servida:** todas as 4 (cada uma com seu workspace)
**Princípio respeitado:** P1 (landing por persona) — Bússola §6

### Descrição

Ao fazer login no SSE, cada user deve ser direcionado para um workspace específico ao seu role primário, com sidebar e KPIs relevantes àquela persona. User com múltiplos roles vê o workspace do role mais alto na hierarquia, com possibilidade de trocar via switcher no header.

### Regras de Negócio

- **RN1** — 4 workspaces canônicos: `/app/cockpit` (Owner), `/app/estimates/inbox` (Estimator), `/app/my-work` (Technician), `/app/books` (Accountant).
- **RN2** — Hierarquia para escolha de workspace inicial em users multi-role: `owner > admin > manager > estimator > technician > accountant > viewer`.
- **RN3** — Página `/app` sem workspace específico faz redirect server-side para o workspace correto baseado em role primário.
- **RN4** — Workspace switcher no header (component `<WorkspaceSwitcher />`) lista apenas workspaces compatíveis com roles do user. User com role único não vê switcher (ou vê inativo).
- **RN5** — Sidebar é dinâmica por workspace (ver Bússola §7 para conteúdo de cada).
- **RN6** — Settings (categorias, contas, users, plan) fica fora dos workspaces — sempre acessível por owner/admin via menu do avatar.
- **RN7** — Search global (Cmd/Ctrl+K) funciona em todos os workspaces sem alteração.
- **RN8** — Decisão sobre workspace ativo é determinística (sem persistência) — não lembra última escolha. User troca explicitamente quando precisa.
- **RN9** — Se role do user mudar (ex: promovido de technician para estimator), próximo login pode ir para workspace diferente. Comportamento esperado.

### Módulos impactados

**Frontend:**
- `apps/web/src/app/(dashboard)/layout.tsx` — passa a aceitar workspace dinâmico
- `apps/web/src/app/(dashboard)/page.tsx` — vira redirect inteligente
- Novos: `apps/web/src/app/(dashboard)/cockpit/`, `apps/web/src/app/(dashboard)/estimates/inbox/`, `apps/web/src/app/(dashboard)/my-work/`, `apps/web/src/app/(dashboard)/books/`
- `apps/web/src/components/layout/sidebar.tsx` — refator para receber workspace e renderizar items relevantes
- `apps/web/src/components/layout/header.tsx` — adicionar `<WorkspaceSwitcher />`
- Novo: `apps/web/src/components/layout/workspace-switcher.tsx`
- Novo helper: `apps/web/src/lib/workspace.ts` — função `getPrimaryWorkspace(roles[])` aplicando hierarquia RN2

**Backend:**
- `apps/api/src/common/decorators/current-user.decorator.ts` — confirmar que retorna roles[] (provavelmente já retorna)
- Possível novo endpoint `GET /users/me/workspace-info` retornando `{ availableWorkspaces, primaryWorkspace }` para o frontend não duplicar lógica de hierarquia

### Migrations

**Nenhuma.** Roles já existem (tabela `user_role_assignments`). Hierarquia é lógica de aplicação.

### Critérios de Aceite

- [ ] CA1 — User com role único `owner` faz login → cai em `/app/cockpit` (não `/app`)
- [ ] CA2 — User com role único `technician` faz login → cai em `/app/my-work` (mobile-first responsive)
- [ ] CA3 — User com roles `[owner, accountant]` faz login → cai em `/app/cockpit` (owner > accountant na hierarquia)
- [ ] CA4 — Workspace switcher mostra `[Cockpit, Books]` para o user CA3, mas não mostra `[My Work, Estimates]`
- [ ] CA5 — Acesso direto a `/app/cockpit` por user que NÃO tem role compatível (ex: technician puro) retorna 403 Forbidden
- [ ] CA6 — Sidebar de cada workspace contém apenas items relevantes àquela persona conforme Bússola §7
- [ ] CA7 — Settings continua acessível para owner/admin via menu do avatar, fora dos workspaces
- [ ] CA8 — Search global (Cmd/Ctrl+K) funciona em todos os 4 workspaces
- [ ] CA9 — Cobertura de testes ≥ 80% nos componentes novos (workspace-switcher, getPrimaryWorkspace helper) e na lógica de redirect
- [ ] CA10 — PR descreve a persona servida (Bússola §2) — usa o template novo de PR (T-20260417-2)

### Subagentes obrigatórios para o PR

`frontend-reviewer` (navegação, componentes novos) + `security-reviewer` (RBAC enforcement no acesso aos workspaces — CA5 é o caso crítico) + `test-runner` (coverage CA9).

### Complexidade estimada

**M (médio).** PO assessment — DM deve validar.

Justificativa: cria 4 páginas novas mas a maioria pode começar como wrapper sobre páginas existentes (`/app/cockpit` envolve dashboard atual; `/app/estimates/inbox` envolve `/estimates`; etc.). Refator do sidebar é o trabalho real. Lógica de hierarquia é simples. Sem migration. **Risco principal:** Clerk integration — como roles chegam no frontend (publicMetadata vs JWT claims) precisa ser validado.

### Dependências

- Nenhuma técnica direta.
- Recomendado: ter o PR template novo (T-20260417-2) merged antes, para que o PR deste RF já use o formato persona/gap.

### Notas de implementação

- Workspaces podem ser implementados incrementalmente — começar por `/app/cockpit` e `/app/my-work` (cobrem 60% do uso esperado segundo Bússola §2). Estimator e Accountant podem vir em segunda iteração.
- Decisão arquitetural pendente para o DM: route segments por workspace (`/app/[workspace]/*`) ou rotas explícitas (`/app/cockpit/*`, `/app/my-work/*`). Cada uma tem trade-offs — DM decide e registra em ADR-N se for estrutural.

---

## RF-002 — Setup Wizard de Onboarding (5 passos)

**Status:** PROPOSED
**Prioridade:** P0
**Fase:** 1.5
**Gap fechado:** Gap 3 (onboarding não instrumentado) — Bússola §4
**Persona servida:** Owner-Operator (primária), com efeito secundário em todas as personas via convite no Passo 2
**Princípio respeitado:** P3 (time-to-first-value < 30 min) — Bússola §6

### Descrição

Ao primeiro login do owner num tenant novo, exibir wizard de 5 passos guiando setup mínimo do shop. Wizard é facilitação, não gate — user pode pular a qualquer momento, mas tenant é marcado como `wizard_skipped` para análise comparativa de activation rate.

### Regras de Negócio

- **RN1** — Wizard disparado automaticamente no primeiro login de user com role `owner` em tenant novo (criado há < 7 dias e sem dados).
- **RN2** — 5 passos sequenciais:
  1. Dados do shop (nome, endereço, telefone) + escolha de plano (free/starter/pro/enterprise)
  2. Convidar team (estimator, technician, accountant) — pelo menos 1 convite obrigatório nesta etapa? **Decisão técnica DM** — sugestão PO: opcional (skip permitido)
  3. Cadastrar 1 insurance company (das top 5 mais comuns nos EUA: State Farm, Geico, Progressive, Allstate, USAA — pré-populadas; user pode editar ou adicionar)
  4. Criar 1 customer + 1 vehicle + 1 estimate de exemplo (pode marcar "use sample data" para auto-preenchimento — wizard adiciona um cliente fictício "Demo Customer" com Toyota Camry 2020 e estimate de R$ 2.500)
  5. Abrir 1 service order a partir do estimate criado
- **RN3** — Botão "Skip wizard" disponível em todos os passos. Skip não bloqueia uso do app — user vai para `/app` (workspace por persona conforme RF-001).
- **RN4** — Skip marca tenant em campo `tenants.wizard_status = 'skipped'` (com timestamp). Conclusão completa marca `'completed'`. Estado inicial: `'pending'`.
- **RN5** — Wizard NÃO persiste progresso parcial entre sessões. Se user fechar browser no passo 3, próxima abertura recomeça do passo 1 (decisão pragmática para v0.1 — pode evoluir).
- **RN6** — Sample data criado no passo 4 é marcado como `is_sample = true` em customer/vehicle/estimate. User pode deletar a qualquer momento. Filtros padrão das listagens NÃO escondem sample data (user vê o que criou).
- **RN7** — Após conclusão completa do wizard, owner cai no `/app/cockpit` com toast "Setup completo! Bem-vindo ao Storm Shield Enterprise."
- **RN8** — Activation rate (RF-003) registra evento `wizard_completed` com timestamp; user que pular registra `wizard_skipped`.

### Módulos impactados

**Frontend:**
- Novo: `apps/web/src/app/(onboarding)/wizard/` — rota fora do dashboard layout
- Novo: 5 step components em `apps/web/src/components/onboarding/`
- `apps/web/src/middleware.ts` — checar `wizard_status` no primeiro acesso pós-login do owner e redirect

**Backend:**
- Endpoint novo: `POST /tenants/me/wizard/complete` — marca status como completed
- Endpoint novo: `POST /tenants/me/wizard/skip` — marca status como skipped
- Endpoint novo: `GET /insurance/seed-list` — top 5 seguradoras pré-populadas para passo 3
- Reuso: endpoints existentes para criar customer, vehicle, estimate, SO (passos 4 e 5 chamam APIs já existentes)

### Migrations

**Sim.** Migration nova `011_tenant_wizard_status.sql`:

```sql
ALTER TABLE public.tenants
  ADD COLUMN wizard_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (wizard_status IN ('pending', 'completed', 'skipped'));
ALTER TABLE public.tenants
  ADD COLUMN wizard_completed_at TIMESTAMPTZ NULL;
```

Sample data flag em entidades chave (decisão DM — pode ser nova migration ou adicionado às migrations existentes). Sugestão PO: campo `is_sample BOOLEAN NOT NULL DEFAULT false` em `customers`, `vehicles`, `estimates`. Migration `012_sample_data_flag.sql`.

### Critérios de Aceite

- [ ] CA1 — Owner novo (tenant criado há <7 dias, sem dados) loga e é direcionado para `/onboarding/wizard` automaticamente
- [ ] CA2 — Owner que já passou pelo wizard (status != pending) loga e vai direto para `/app/cockpit` (RF-001)
- [ ] CA3 — Os 5 passos navegáveis (next/back), validação por passo, dados persistidos no DB ao fim de cada passo
- [ ] CA4 — Botão "Skip" em todos os passos marca `wizard_status = 'skipped'`
- [ ] CA5 — Conclusão completa do passo 5 marca `wizard_status = 'completed'` + `wizard_completed_at = now()`
- [ ] CA6 — Sample data (passo 4) criado com `is_sample = true` e visível nas listagens normais
- [ ] CA7 — Tempo médio de conclusão do wizard < 30 min em usuários teste (validação manual)
- [ ] CA8 — Cobertura de testes ≥ 80% no fluxo (incluindo edge cases: skip, fechar browser no meio, role não-owner tentando acessar `/onboarding/wizard`)
- [ ] CA9 — RF-003 (event tracking) registra eventos `wizard_started`, `wizard_step_N_completed`, `wizard_completed`, `wizard_skipped`
- [ ] CA10 — PR cita persona Owner + Gap 3 (template novo)

### Subagentes obrigatórios

`frontend-reviewer` (5 step components, fluxo) + `db-reviewer` (migrations 011/012 + RLS implications) + `test-runner` (coverage) + `security-reviewer` (only-owner enforcement no CA8 edge case).

### Complexidade estimada

**L (alto).** PO assessment — DM deve validar.

Justificativa: 2 migrations + 5 step components + middleware logic + 3 endpoints novos + integração com endpoints existentes + sample data. Não é trivial. Pode ser quebrado em sub-RFs (wizard core + sample data + analytics events). DM decide.

### Dependências

- **RF-001 (Landing por Persona)** — wizard precisa saber para onde mandar o owner ao final (`/app/cockpit`). Pode coexistir paralelamente em dev, mas merge de RF-002 deve esperar RF-001.
- **RF-003 (Event Tracking)** — wizard emite eventos. Pode ser implementado sem RF-003 (eventos no-op), mas valor da métrica activation depende de RF-003.

### Notas de implementação

- Sugestão de UX: barra de progresso "1 of 5" sempre visível; skip discreto mas presente; "Why are we doing this?" link em cada passo explicando o valor.
- Considerar internacionalização desde o começo — labels em EN, com PT-BR como fallback se houver. Decisão DM.

---

## RF-003 — Event Tracking de Activation

**Status:** DONE
**Prioridade:** P0
**Fase:** 1.5
**Gap fechado:** Gap 8 (sem sensor de activation) — Bússola §4
**Persona servida:** N/A (instrumentação interna; serve PO + PM via dashboard)
**Princípio respeitado:** Pré-requisito para a métrica oficial activation rate (Operating Model §6.1)
**PR:** #33 (feature/SSE-048-rf-003-activation-tracking)
**Completed:** 2026-04-20

### Descrição

Implementar tabela própria `activation_events` no schema público para registrar eventos do happy path operacional dos tenants. Calcular `activation rate` como métrica derivada via query agregada. Expor dashboard interno simples para PO/PM consultarem.

### Regras de Negócio

- **RN1** — Tabela `public.activation_events` com schema:
  - `id` UUID v7 PK
  - `tenant_id` UUID NOT NULL (FK → tenants.id)
  - `user_id` UUID NULL (alguns eventos não têm user — ex: tenant created)
  - `event_type` TEXT NOT NULL (ENUM ver RN3)
  - `event_data` JSONB NULL (payload contextual)
  - `occurred_at` TIMESTAMPTZ NOT NULL DEFAULT now()
  - Index em (`tenant_id`, `occurred_at`) e (`event_type`, `occurred_at`)
- **RN2** — Tabela é **schema público**, não tenant-scoped. Justificativa: queries de activation rate precisam ser cross-tenant. RLS desnecessário (apenas admins SSE leem; não há leak vertical pois `tenant_id` é só metadata).
- **RN3** — Eventos canônicos (ENUM `activation_event_type`):
  - `tenant_created`
  - `first_user_login`
  - `wizard_started` / `wizard_step_N_completed` (N=1..5) / `wizard_completed` / `wizard_skipped`
  - `first_customer_created`
  - `first_vehicle_created`
  - `first_estimate_created`
  - `first_service_order_created`
  - `first_financial_transaction_created`
  - `tenant_activated` (computed — emitido quando os 5 marcos do happy path são completados em <7 dias)
  - `subscription_started` / `subscription_upgraded` / `subscription_canceled`
- **RN4** — Eventos são **append-only**. Nenhum UPDATE/DELETE permitido após insert (constraint a nível de DB ou via service).
- **RN5** — Activation rate calculado por query SQL:
  ```sql
  -- # tenants criados nos últimos N dias com tenant_activated dentro de 7 dias
  SELECT
    COUNT(DISTINCT a.tenant_id) AS activated,
    COUNT(DISTINCT t.tenant_id) AS total
  FROM activation_events t
  LEFT JOIN activation_events a
    ON a.tenant_id = t.tenant_id
    AND a.event_type = 'tenant_activated'
    AND a.occurred_at <= t.occurred_at + INTERVAL '7 days'
  WHERE t.event_type = 'tenant_created'
    AND t.occurred_at >= now() - INTERVAL 'N days';
  ```
- **RN6** — Service `ActivationEventsService` em `apps/api/src/modules/admin/activation/`:
  - Método `record(tenantId, eventType, eventData?, userId?)` — emite evento
  - Método `getRate(periodDays)` — retorna `{ activated, total, rate }`
  - Método `getFunnel(periodDays)` — retorna contagem por etapa para análise
- **RN7** — Hooks de emissão de eventos integrados nos services existentes:
  - `TenantsService.create()` → emite `tenant_created`
  - `AuthService` ou middleware → emite `first_user_login` no primeiro login do tenant
  - `CustomersService.create()` → emite `first_customer_created` se for o primeiro
  - (idem para vehicles, estimates, service-orders, financial-transactions)
  - Lógica "se for o primeiro" usa COUNT(*) WHERE tenant_id = X (single-row check, performático)
- **RN8** — Dashboard interno em `/admin/activation` (acessível só por role `super_admin` — verificar se este role existe no SSE; se não, primeiro user do primeiro tenant ou via env flag):
  - Activation rate dos últimos 7/30/90 dias
  - Funnel: % que completa cada etapa
  - Lista de últimos 50 eventos (debugging)

### Módulos impactados

**Backend:**
- Migration nova: `013_activation_events.sql` (tabela + ENUM + indexes)
- Novo módulo: `apps/api/src/modules/admin/activation/`
  - `activation.module.ts`
  - `activation.service.ts` (record, getRate, getFunnel)
  - `activation.controller.ts` (GET /admin/activation/rate, /funnel, /recent)
  - DTOs e tests
- Hooks de emissão: alterar `tenants.service.ts`, `customers.service.ts`, `vehicles.service.ts`, `estimates.service.ts`, `service-orders.service.ts`, `financial.service.ts` (cada um com 1 linha extra `await this.activationEvents.record(...)` no método `create()`)
- Lógica do `tenant_activated` computado: pode ser job background que verifica condição, OU verificado a cada novo evento (eficiente). DM decide.

**Frontend:**
- Nova rota `/admin/activation/page.tsx` — dashboard interno
- Componentes: `<ActivationRateCard />`, `<ActivationFunnel />`, `<RecentEventsTable />`
- Verificar role `super_admin` (ou criar se não existir) no `middleware.ts`

### Migrations

**Sim.** Migration `013_activation_events.sql` no schema público (NÃO tenant). Inclui CREATE TABLE, ENUM, indexes, e check constraint de append-only se viável.

### Critérios de Aceite

- [x] CA1 — Migration 013 cria tabela `activation_events` com ENUM `activation_event_type` e índices corretos
- [x] CA2 — `ActivationEventsService.record()` emite evento sem falhar (testes unitários)
- [x] CA3 — Hooks de emissão integrados nos 6 services principais (tenants/customers/vehicles/estimates/SO/financial) — testes verificam que `record()` é chamado nos cenários corretos
- [x] CA4 — Lógica de `tenant_activated` correta: tenant que completa 5 marcos do happy path em < 7 dias do `tenant_created` recebe evento `tenant_activated`
- [x] CA5 — Endpoint `GET /admin/activation/rate?period=30` retorna `{activated: N, total: M, rate: 0.X}` correto baseado em dados de teste
- [x] CA6 — Dashboard `/admin/activation` renderiza cards e funnel com dados reais
- [x] CA7 — Acesso ao `/admin/activation` bloqueado via `x-sse-admin-key` header (403 quando key errada; `super_admin` role não existe no SSE — env flag adotado per RN8 guidance)
- [x] CA8 — Cobertura de testes ≥ 80%: 350 tests passing (23 suites); ActivationEventsService 100% cobertura nos 4 métodos
- [ ] CA9 — Wizard (RF-002) emite eventos esperados em cada passo — **DEFERRED to RF-002**: ENUM já inclui wizard events; hooks adicionados quando RF-002 implementado
- [x] CA10 — Performance: composite indexes em (tenant_id, occurred_at DESC) e (event_type, occurred_at DESC) garantem < 500ms em 100k eventos

### Subagentes obrigatórios

`db-reviewer` (migration 013 + ENUM + indexes + performance da query agregada) + `security-reviewer` (cross-tenant integrity — verificar que tenant_id é sempre o tenant correto em cada evento; super_admin enforcement) + `test-runner` (coverage) + `frontend-reviewer` (dashboard).

### Complexidade estimada

**L (alto).** PO assessment — DM deve validar.

Justificativa: migration nova + módulo backend novo + alteração em 6 services existentes + dashboard frontend novo + role super_admin a confirmar/criar. Riscos: integrity entre tenant_id no evento e tenant_id real do recurso (se errado, métrica fica viciada); definir exato do "first_X" sem race conditions. **Pode ser quebrado** em sub-RFs (RF-003a: schema + service básico; RF-003b: hooks de emissão; RF-003c: dashboard).

### Dependências

- Nenhuma técnica direta. Pode ser implementado em paralelo com RF-001 e RF-002.
- **Valor pleno** depende de RF-002 estar implementado (wizard emite eventos que enriquecem o funnel).

### Notas de implementação

- Considerar adicionar evento `subscription_started` / `upgraded` / `canceled` desde já — não custa mais e abre porta para análise de conversão.
- Avaliar se vale persistir IP/UserAgent no `event_data` para análise de fraude/teste — decisão de privacidade. PO sugere: NÃO persistir IP de users individuais (LGPD/CCPA risk); persistir só metadata agregável.
- Se DM decidir migrar para PostHog no futuro (alternativa rejeitada nesta sessão por dependência externa), a tabela `activation_events` continua sendo source-of-truth interno e PostHog vira espelho.

---

## RF-004 — Customer 360 View

**Status:** IN_PROGRESS
**PR:** #44 (feature/SSE-053-rf-004-customer-360)
**Prioridade:** P1
**Fase:** 2
**Aprovado em:** 2026-04-21 (sessão PO, via ADR-012)
**Gap fechado:** Fricção CRM — novo gap candidato (Gap 9), não nos 8 originais da Bússola v1.0. A decisão formal de adicionar como Gap 9 fica para revisão trimestral de julho/2026.
**Persona primária:** Estimator. Secundárias: Owner-Operator, Accountant.
**Princípio respeitado:** P1 (landing por persona, estendido a detalhe de entidade).
**Origem:** `ANALISE_NS_vs_BUSSOLA_v1.md` §2.6 + §5 — adaptação de NS Customer 360 View.

### Descrição

Ao clicar em um customer, exibir página unificada com abas em vez de páginas fragmentadas. Substitui o fluxo atual "customer → voltar → filtrar estimates por customer → voltar → filtrar SOs por customer".

### Regras de Negócio

- **RN1** — 7 abas canônicas renderizadas via shadcn Tabs: `Overview | Vehicles | Estimates | Service Orders | Payments & Receivables | Activity | Documents`. Default: Overview.
- **RN2** — Header da página tem quick actions: "Novo Estimate", "Nova SO", "Add Note". Ações partem do customer pré-preenchido.
- **RN3** — Aba Overview mostra: foto/avatar, contatos (phone/email/address), balance total em aberto, última atividade, badge do tipo de customer (insurance vs out-of-pocket).
- **RN4** — Aba Payments & Receivables split entre "Insurance payments" e "Out-of-pocket", com totais.
- **RN5** — Activity timeline faz merge cronológico de: `estimate_status_changes` + `so_status_history` + `customer_interactions` + `notifications` enviadas + `consent_records`.
- **RN6** — Balance e receivables calculados via query agregada **real-time** (não cacheada). Justificativa: dados de receita não toleram stale.
- **RN7** — Aba Documents lista todos os uploads via StorageService vinculados ao customer (estimate docs, SO photos, supplements, NFs).
- **RN8** — URL estrutura: `/app/customers/:id?tab=overview` — tab via query param para deep-link.

### Módulos impactados

**Frontend:**
- `apps/web/src/app/(dashboard)/customers/[id]/page.tsx` — refator para abas
- Novos componentes em `apps/web/src/components/customers/`: `customer360-tabs.tsx`, `customer360-overview.tsx`, `customer360-vehicles.tsx`, `customer360-estimates.tsx`, `customer360-service-orders.tsx`, `customer360-receivables.tsx`, `customer360-activity.tsx`, `customer360-documents.tsx`

**Backend:**
- Reuso majoritário de endpoints existentes.
- 1–2 endpoints agregadores novos:
  - `GET /customers/:id/summary` — retorna `{ balance, last_activity_at, open_estimates_count, open_so_count, ytd_revenue }`
  - `GET /customers/:id/activity-timeline?limit=N` — retorna eventos mesclados ordenados por `occurred_at DESC`

### Migrations

**Nenhuma.** Todos os dados já existem; é agregação/visualização.

### Critérios de Aceite

- [ ] CA1 — Clique em customer abre a página com 7 abas; Overview renderizada por default
- [ ] CA2 — Quick actions (Novo Estimate / Nova SO) abrem modal ou navegam com customer pré-preenchido
- [ ] CA3 — Balance mostrado em Overview bate com query agregada de financial_transactions pendentes
- [ ] CA4 — Activity timeline ordena correto por data e mostra ≥4 tipos de evento (estimate/SO status, interactions, consent)
- [ ] CA5 — Deep-link `/app/customers/:id?tab=estimates` abre diretamente na aba Estimates
- [ ] CA6 — Cobertura de testes ≥ 80% nos componentes novos + endpoints agregadores
- [ ] CA7 — PR descreve persona Estimator + gap (fricção CRM / Gap 9 candidato) — Regra 16 CLAUDE.md

### Subagentes obrigatórios

`frontend-reviewer` (7 componentes + navegação por tabs) + `test-runner` (coverage) + `security-reviewer` (endpoints agregadores precisam respeitar RLS — não leak cross-tenant via aggregation).

### Complexidade estimada

**L (alto).** PO assessment — DM deve validar.

Justificativa: 7 abas no frontend (L), backend é principalmente reuso (S), endpoints agregadores têm performance como risco (indexes em `customer_id` já existem mas query cross-tabela precisa profiling). Pode ser quebrado em sub-RFs: 004a (Overview + Vehicles + Documents — tabs simples); 004b (Estimates + SOs — filtros); 004c (Receivables + Activity — agregações complexas).

### Dependências

- Nenhuma técnica direta. Pode ir em paralelo com RF-005/RF-006.
- **Valor pleno** emerge quando RF-005 estiver DONE (Activity timeline fica mais rica com estimate state machine formalizada).

### Notas de implementação

- Considerar caching seletivo das queries agregadas (Redis) para customers com >100 transactions — DM decide se necessário após profiling inicial.
- Timeline pode virar o componente mais pesado — usar virtualized list se customer tem >200 eventos históricos.

---

## RF-005 — Estimate State Machine + Inbox do Estimator

**Status:** APPROVED — **SPLIT RATIFICADO (Split A) em 2026-04-22**
**Prioridade:** P1
**Fase:** 2
**Aprovado em:** 2026-04-21 (sessão PO, via ADR-012)
**Split ratificado em:** 2026-04-22 (sessão PO Cowork — ver `.auto-memory/po_sessions.md`)
**Gap fechado:** Gap 5 (Insurance workflow subdesenvolvido) — Bússola §4. Formaliza o "RF futuro — Insurance workflow visual" que estava mencionado em Bússola §8.
**Persona primária:** Estimator. Secundárias: Owner-Operator (visibilidade), Accountant (receivables).
**Princípio respeitado:** P5 (insurance-first).
**Origem:** `ANALISE_NS_vs_BUSSOLA_v1.md` §5 + Bússola §4 Gap 5.

### Split de implementação (Split A — ratificado 2026-04-22)

| Sub-RF | Task DM | Escopo | Complex. | CA cobertos |
|---|---|---|---|---|
| **RF-005a** | T-20260421-3a | Backend: ENUM expandido, validator de transitions, migration 014, `estimate_status_changes` append-only. Zero UI. | M | CA1, CA2, CA3, CA8 parcial |
| **RF-005b** | T-20260421-3b | Frontend: `/app/estimates/inbox` **tabela** + filtros (status/adjuster/data) + ownership RN5 + `estimate-status-badge.tsx`. | M | CA5, CA6, CA9 |
| **RF-005c** | T-20260421-3c | Frontend avançado: **kanban + drag-drop** respeitando transitions + SLA jobs (RN8). | S-M | CA4, CA7 |

**Desbloqueio explícito:** RF-006 (T-20260421-4) fica BLOCKED apenas por RF-005a — pode rodar em paralelo com 3b e 3c. RF-005 só é marcado DONE quando o último dos três (3c) fechar.

**Rejeitado:** Split B (tabela+kanban num PR só + notifications separadas) foi considerado e descartado — bundle excessivo em UI e perda de ship incremental do tabela antes do kanban.

**Condição de reversão do Split A:** se após 3a + 3b em staging o Estimator (via ritual Operating Model §5.4) não vir valor no kanban, canibalizar 3c — entregar só o SLA job como ENH isolado e rebater kanban como ENH P2 futuro.

### Descrição

Formalizar state machine explícita em `estimates.status` cobrindo o ciclo completo de claim de seguradora, e expor como inbox (kanban/tabela) ao Estimator em `/app/estimates/inbox` (workspace do RF-001).

### Regras de Negócio

- **RN1** — Estados canônicos:
  ```
  draft → submitted_to_adjuster → awaiting_approval → approved → supplement_pending → approved_with_supplement → paid → closed
                                          ↓                              ↓
                                        rejected                       disputed (hand-off ao RF-006)
  ```
- **RN2** — Transitions válidas documentadas em ENUM + validator no service (não strings livres). Estado final: `closed` ou `rejected`.
- **RN3** — Cada transition gera evento em `estimate_status_changes` (tabela já existe) com: `from_status`, `to_status`, `changed_by_user_id`, `changed_at`, `notes`.
- **RN4** — Inbox em `/app/estimates/inbox` com 2 visualizações: **Kanban** (colunas por estado, drag-and-drop entre estados permitidos) e **Tabela** (filtros por status + adjuster + data).
- **RN5** — Estimator vê apenas os estimates dos quais é responsável ou órfãos (sem owner). Admin/Owner vê todos.
- **RN6** — Status `disputed` é transição especial que dispara fluxo do RF-006 (Payment Hold / Disputed Estimate).
- **RN7** — Badges coloridos consistentes: draft (cinza), submitted_to_adjuster (azul), awaiting_approval (amarelo), approved (verde), supplement_pending (laranja), approved_with_supplement (verde), rejected (vermelho), disputed (vermelho-pulsante), paid (verde-escuro), closed (preto).
- **RN8** — SLA interno: estimate em `awaiting_approval` > 14 dias dispara notification ao owner (via notifications table). SLA em `supplement_pending` > 7 dias mesma coisa.

### Módulos impactados

**Backend:**
- `apps/api/src/modules/estimates/estimates.service.ts` — validator de transitions
- Migration 014 ou alter nos ENUMs existentes — expandir `estimate_status` ENUM com os novos estados (DM decide se é migration nova ou patch no ENUM existente).
- `estimate_status_changes` table — confirmar que já existe e é append-only; se não, criar.

**Frontend:**
- Novo: `apps/web/src/app/(dashboard)/estimates/inbox/page.tsx` (alinhado com RF-001)
- Componentes: `estimates-kanban.tsx`, `estimates-inbox-table.tsx`, `estimate-status-badge.tsx` (reutilizável)
- Integração com RF-004 (aba Estimates do Customer 360 usa `estimate-status-badge`)

### Migrations

**Sim.** Migration `014_estimate_state_machine.sql` — expandir ENUM `estimate_status`, garantir tabela `estimate_status_changes` com constraint append-only.

### Critérios de Aceite

- [ ] CA1 — Todos os 10 estados (draft..closed + disputed + rejected) representáveis e transitions válidas documentadas no código
- [ ] CA2 — Service rejeita transition inválida (ex: draft → paid) com 400
- [ ] CA3 — Cada transition grava registro em `estimate_status_changes`
- [ ] CA4 — Inbox kanban com drag-and-drop respeita transitions válidas (não permite drop ilegal)
- [ ] CA5 — Inbox tabela filtra por status + adjuster + data corretamente
- [ ] CA6 — Estimator vê só seus estimates; Owner vê todos
- [ ] CA7 — SLA alerts geram notifications após 14 dias em `awaiting_approval` (job batch diário — DM decide cron)
- [ ] CA8 — Cobertura ≥ 80%; testes unitários do validator de transitions cobrem todos os pares from→to
- [ ] CA9 — PR descreve persona Estimator + Gap 5 — Regra 16

### Subagentes obrigatórios

`db-reviewer` (migration 014 + ENUM expansion) + `frontend-reviewer` (kanban/drag-drop) + `test-runner` (validator coverage é core) + `security-reviewer` (ownership enforcement RN5).

### Complexidade estimada

**XL (muito alto).** PO assessment — DM deve validar e decidir split.

Justificativa: state machine + kanban + inbox + SLA jobs + migrations. Sugestão de split em 3 sub-RFs: 005a (state machine + validator + migration — backend); 005b (inbox tabela + filtros — frontend básico); 005c (kanban + drag-drop + SLA alerts — frontend avançado + jobs).

### Dependências

- **RF-001 (Landing por Persona)** — `/app/estimates/inbox` pressupõe workspace do Estimator.
- Bloqueio parcial de **RF-006** — RF-006 usa o estado `disputed` introduzido aqui.

### Notas de implementação

- SLA timers podem começar como alertas simples; "SLA dashboard" pode virar ENH P2 futura.
- Avaliar se permitir "custom statuses" por tenant — **decisão já tomada: NÃO** (Bússola §1, anti-custom-fields). Documentar como violação explícita.

---

## RF-006 — Payment Hold / Disputed Estimate

**Status:** APPROVED
**Prioridade:** P1
**Fase:** 2
**Aprovado em:** 2026-04-21 (sessão PO, via ADR-012)
**Gap fechado:** complementa Gap 5 (Insurance workflow). Inspiração: NS Payment Hold.
**Persona primária:** Estimator. Secundárias: Owner-Operator (aprovação), Technician (impacto na SO pausada).
**Princípio respeitado:** P5 (insurance-first).
**Origem:** `ANALISE_NS_vs_BUSSOLA_v1.md` §2.4 + §5 — adaptação de NS Payment Hold.

### Descrição

Implementar estado `disputed` em estimates com campos específicos de dispute, bloqueio de progressão da SO vinculada, e notificação automática ao Owner. Evita que o shop continue trabalho (e custos) enquanto claim está travado com adjuster.

### Regras de Negócio

- **RN1** — Campos adicionais em `estimates` (via migration):
  - `dispute_reason` TEXT NULL (ENUM: `adjuster_underpayment | supplement_rejected | claim_denied | total_loss_dispute | other`)
  - `dispute_notes` TEXT NULL
  - `dispute_opened_at` TIMESTAMPTZ NULL
  - `dispute_resolved_at` TIMESTAMPTZ NULL
  - `blocks_so_progression` BOOLEAN NOT NULL DEFAULT true
- **RN2** — Quando estimate vai para status `disputed` (transição do RF-005):
  1. Service Orders vinculadas ficam com flag `is_paused_by_dispute = true` no record
  2. Transitions de SO status são bloqueadas se `is_paused_by_dispute = true`, exceto com override explícito do Owner (endpoint `POST /service-orders/:id/force-progress` com reason obrigatório)
  3. Notification criada para Owner (via `notifications` existente) com severity `high`
- **RN3** — SLA de dispute: > 14 dias em aberto = alerta ao Owner; > 30 dias = alerta P1 (escalação visual no Cockpit).
- **RN4** — Quando estimate sai de `disputed` (transição válida: `approved` | `approved_with_supplement` | `rejected` | `closed`):
  1. `dispute_resolved_at = now()`
  2. SOs vinculadas voltam a `is_paused_by_dispute = false`
- **RN5** — Histórico completo de disputes vira parte do Customer 360 Activity timeline (RF-004).
- **RN6** — Dashboard do Owner (futuro Cockpit, Gap 4) exibe contador "Disputes abertos" — RF de Cockpit quando for escrito usa esta fonte.

### Módulos impactados

**Backend:**
- Migration 015: ALTER estimates + ALTER service_orders (add `is_paused_by_dispute`)
- `estimates.service.ts` — método `openDispute(id, reason, notes)`, `resolveDispute(id, resolution_status)`
- `service-orders.service.ts` — guard de progression baseado em `is_paused_by_dispute`
- Novo endpoint: `POST /service-orders/:id/force-progress` (owner-only, require reason)

**Frontend:**
- Modal "Abrir Dispute" no detail de estimate (quando status permite)
- Badge "🔒 Paused by Dispute" em SO quando aplicável
- Botão "Force Progress" visível só para Owner com confirmação em 2 passos

### Migrations

**Sim.** Migration `015_estimate_dispute.sql` — adiciona 5 campos a estimates + 1 campo a service_orders + ENUM `dispute_reason`. Não usar CASCADE DELETE (Regra 6 CLAUDE.md — tabela financeira).

### Critérios de Aceite

- [ ] CA1 — Abrir dispute em estimate transiciona status para `disputed` e preenche os 4 campos obrigatórios
- [ ] CA2 — SO vinculada a estimate em dispute não avança de status (retorna 409 Conflict com mensagem clara)
- [ ] CA3 — Owner consegue forçar progression via endpoint dedicado; operação é logada em audit_logs
- [ ] CA4 — Resolve dispute limpa flags nas SOs e permite avanço novamente
- [ ] CA5 — Notification criada para Owner no momento do open dispute
- [ ] CA6 — SLA alert disparado em > 14 dias de dispute aberto (teste com time mock)
- [ ] CA7 — RF-004 Activity timeline inclui entries de dispute_opened / dispute_resolved
- [ ] CA8 — Cobertura ≥ 80%; testes de guard de progression + edge cases (estimate sem SO, múltiplas SOs)
- [ ] CA9 — PR descreve persona Estimator + Gap 5 — Regra 16

### Subagentes obrigatórios

`db-reviewer` (migration 015 + ENUM) + `security-reviewer` (force-progress endpoint precisa ser owner-only e audit-logged — risco alto se ficar disponível a outros roles) + `test-runner` (core é o guard; muitos edge cases) + `frontend-reviewer` (modal + badge).

### Complexidade estimada

**M (médio).** PO assessment — DM deve validar.

Justificativa: migration contida, lógica de guard é clara, UI relativamente simples. Não é trivial porque envolve 2 módulos (estimates + service-orders) e tem impacto em cascata.

### Dependências

- **RF-005** — precisa do estado `disputed` introduzido na state machine. RF-006 não pode entrar antes de RF-005.
- **RF-004** (fraca) — Activity timeline fica mais rica com RF-006, mas RF-006 pode ir sem RF-004.

### Notas de implementação

- Considerar campo `resolution_outcome` ao fechar dispute (accepted | rejected | settled | escalated_to_legal) — decisão DM se entra agora ou em refinamento posterior.
- **Risco:** tenants podem começar a abrir disputes para "pausar" SOs por motivo não-insurance (abuso de fluxo). Monitor via evento activation: `dispute_opened` count vs dispute_resolved com resolution outcome.

---

## RF-007 — Case Management simplificado

**Status:** APPROVED
**Prioridade:** P2
**Fase:** 2
**Aprovado em:** 2026-04-21 (sessão PO, via ADR-012)
**Gap fechado:** complementa Gap 5 e serve customer complaints em geral — estrutura leve, não é CRM ticket full. NS Case Management é a inspiração, mas com 13ª anti-recomendação explícita (`ANALISE §7.13`): sem tipos/origens/regras/territórios/auto-assignment.
**Persona primária:** Estimator (abre casos). Secundárias: Owner-Operator (revisa), Customer (subject).
**Princípio respeitado:** P7 (complexidade proporcional ao ICP).
**Origem:** `ANALISE_NS_vs_BUSSOLA_v1.md` §2.6 + §5.

### Descrição

Entidade `cases` leve para rastrear complaints de customers e disputes não-estimate (ex: qualidade de reparo anterior, pedido de refund). Intencionalmente simples — manual assignment, sem regras automáticas.

### Regras de Negócio

- **RN1** — Tabela `cases`:
  - `id` UUID v7 PK
  - `tenant_id` UUID NOT NULL (RLS obrigatório — Regra 3 CLAUDE.md)
  - `case_type` TEXT NOT NULL (ENUM: `complaint | quality_issue | refund_request | general_inquiry | other`)
  - `opened_by_user_id` UUID NOT NULL
  - `customer_id` UUID NULL (FK)
  - `vehicle_id` UUID NULL (FK)
  - `related_estimate_id` UUID NULL (FK)
  - `related_so_id` UUID NULL (FK)
  - `title` TEXT NOT NULL
  - `body` TEXT NOT NULL
  - `status` TEXT NOT NULL DEFAULT 'open' (ENUM: `open | in_progress | resolved | closed`)
  - `priority` TEXT NOT NULL DEFAULT 'medium' (ENUM: `low | medium | high`)
  - `assigned_to_user_id` UUID NULL (manual assignment)
  - `opened_at` TIMESTAMPTZ NOT NULL DEFAULT now()
  - `resolved_at` TIMESTAMPTZ NULL
  - `resolution_notes` TEXT NULL
  - `created_at`, `updated_at` padrão

- **RN2** — Escopo deliberado: **sem** case types customizáveis, **sem** origins, **sem** routing rules, **sem** territórios, **sem** auto-assignment, **sem** SLA por tipo. Anti-recomendação #13 do `ANALISE_NS_vs_BUSSOLA_v1.md`.
- **RN3** — Relação com RF-006: `dispute` não é um case type aqui — disputes de estimate têm fluxo próprio (RF-006). **Decisão DM**: avaliar se faz sentido unificar via campo discriminator futuramente, mas v0.1 fica separado.
- **RN4** — Lista em `/app/cases` (rota secundária, não workspace próprio).
- **RN5** — Filtros: status, priority, assigned_to, customer.
- **RN6** — Case não tem comments/notes thread em v0.1 — apenas `body` + `resolution_notes`. Thread vira ENH P3 futura se demanda emergir.
- **RN7** — Audit log em todas as mudanças de status/assigned_to.

### Módulos impactados

**Backend:**
- Migration 016: `cases.sql` + ENUMs + RLS policies (Regra 3 CLAUDE.md)
- Novo módulo `apps/api/src/modules/cases/`: module, service, controller, DTOs
- Endpoints: `GET /cases`, `GET /cases/:id`, `POST /cases`, `PATCH /cases/:id`, `POST /cases/:id/resolve`

**Frontend:**
- Nova rota `/app/cases/page.tsx` (lista) + `/app/cases/[id]/page.tsx` (detail)
- Componentes: `cases-table.tsx`, `case-detail.tsx`, `case-form-modal.tsx`

### Migrations

**Sim.** Migration `016_cases.sql` — tabela + ENUMs + RLS policies + indexes em (`tenant_id`, `status`), (`tenant_id`, `customer_id`), (`tenant_id`, `assigned_to_user_id`).

### Critérios de Aceite

- [ ] CA1 — CRUD de cases funciona; criação respeita tenant_id + RLS
- [ ] CA2 — Filtros na listagem (status, priority, customer) funcionam
- [ ] CA3 — Transition open → in_progress → resolved → closed validada no service
- [ ] CA4 — Resolve gera audit_log entry
- [ ] CA5 — Case linkado a customer aparece no Customer 360 Activity (RF-004 dependency — pode ficar atrás de feature flag se RF-004 não estiver DONE)
- [ ] CA6 — Cobertura ≥ 80%
- [ ] CA7 — PR descreve persona Estimator + Gap 5 parcial — Regra 16

### Subagentes obrigatórios

`db-reviewer` (migration 016 + RLS) + `security-reviewer` (RLS é crítico; novo módulo precisa PlanGuard) + `test-runner` + `frontend-reviewer`.

### Complexidade estimada

**M (médio).** PO assessment — DM deve validar.

Justificativa: módulo novo + migration + CRUD frontend + integração leve com Customer 360. Não é trivial mas é padrão (parecido com estrutura de `contractors` ou `notifications`).

### Dependências

- **RF-004** (fraca) — CA5 depende; pode ir com feature flag.
- **PlanGuard update**: adicionar `cases` em `PLAN_FEATURES` conforme Regra 8 CLAUDE.md. Plano mínimo: starter (ou free? **decisão DM**).

### Notas de implementação

- **Anti-recomendação explícita (do `ANALISE §7.13`):** não permitir que o DM introduza features de Case Management full do NS. Se demanda real emergir (>10 tenants pedindo tipos customizáveis), reabrir decisão.
- Comments/notes thread em v0.1 está fora. Não adicionar mesmo se parecer "fácil".

---

## Próximos RFs (a criar em sessões PO futuras)

Da Bússola §8, ainda PENDENTES de virar RF:

- **RF futuro — Cockpit do Owner (Gap 4)** — KPIs gerenciais. P1 60–90 dias. **Ajuste obrigatório via ADR-012:** incluir Available Balance distinto de Cash Balance.
- **RF futuro — Mobile PWA Technician (Gap 2)** — minhas SOs + timer + fotos. P1 90–120 dias. **Ajuste obrigatório via P8:** offline-first com sync queue.
- **RF futuro — Export básico Accountant (Gap 7 parcial)** — GL + TB + JE em CSV/XLSX. P2 90–120 dias.
- **RF futuro — Descope FAM 3 métodos extras (Gap 6)** — ADR de descope. P2 120–150 dias.
- **RF futuro — Global Search (Cmd/Ctrl+K)** — validar com DM se já existe; se não, ENH P1 independente. Originado do `ANALISE §2.8`.
- **RF futuro — Half-Year convention MACRS** — validar com DM se já implementado em FAM. Se não, compliance IRS P1. Originado do `ANALISE §2.3`.
- **RF futuro — Reversing Journal Entries** — validar com DM. Se ausente, ENH P2 fase-3-accounting. Originado do `ANALISE §2.2`.

---

*Este backlog é vivo. Atualizar status de cada RF conforme implementação. Adicionar novos RFs ao final, mantendo numeração sequencial. Cada RF DONE deve mover para uma seção "DONE" no final OU ficar in-place com status atualizado — decisão a tomar quando primeiro RF for DONE.*
