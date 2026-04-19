# RF Backlog — Storm Shield Enterprise

> Backlog de Requisitos Funcionais derivados dos Gaps Críticos da Bússola.
> **Status:** v0.1 — iniciado em 2026-04-17
> **Convenção de numeração:** RF-NNN sequencial. Próximo RF a criar: **RF-004**.
> **Status permitidos:** PROPOSED | APPROVED | IN_PROGRESS | DONE | CANCELED
> **Autoridade:** Bússola §4 (gaps) + §8 (ordem de ataque). RFs aqui derivam diretamente de gaps.

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

**Status:** PROPOSED
**Prioridade:** P0
**Fase:** 1.5
**Gap fechado:** Gap 8 (sem sensor de activation) — Bússola §4
**Persona servida:** N/A (instrumentação interna; serve PO + PM via dashboard)
**Princípio respeitado:** Pré-requisito para a métrica oficial activation rate (Operating Model §6.1)

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

- [ ] CA1 — Migration 013 cria tabela `activation_events` com ENUM `activation_event_type` e índices corretos
- [ ] CA2 — `ActivationEventsService.record()` emite evento sem falhar (testes unitários)
- [ ] CA3 — Hooks de emissão integrados nos 6 services principais (tenants/customers/vehicles/estimates/SO/financial) — testes verificam que `record()` é chamado nos cenários corretos
- [ ] CA4 — Lógica de `tenant_activated` correta: tenant que completa 5 marcos do happy path em < 7 dias do `tenant_created` recebe evento `tenant_activated`
- [ ] CA5 — Endpoint `GET /admin/activation/rate?period=30` retorna `{activated: N, total: M, rate: 0.X}` correto baseado em dados de teste
- [ ] CA6 — Dashboard `/admin/activation` renderiza cards e funnel com dados reais
- [ ] CA7 — Acesso ao `/admin/activation` bloqueado para users não-super_admin (403)
- [ ] CA8 — Cobertura de testes ≥ 80% no service e controller
- [ ] CA9 — Wizard (RF-002) emite eventos esperados em cada passo
- [ ] CA10 — Performance: query de activation rate em 100k eventos < 500ms (índices fazem o trabalho)

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

## Próximos RFs (a criar em sessões PO futuras)

Da Bússola §8, ainda PENDENTES de virar RF:

- **RF futuro — Cockpit do Owner (Gap 4)** — KPIs gerenciais. P1 60–90 dias.
- **RF futuro — Insurance workflow visual (Gap 5)** — state machine + inbox do Estimator. P1 60–90 dias.
- **RF futuro — Mobile PWA Technician (Gap 2)** — minhas SOs + timer + fotos. P1 90–120 dias.
- **RF futuro — Export básico Accountant (Gap 7 parcial)** — GL + TB + JE em CSV/XLSX. P2 90–120 dias.
- **RF futuro — Descope FAM 3 métodos extras (Gap 6)** — ADR de descope. P2 120–150 dias.

---

*Este backlog é vivo. Atualizar status de cada RF conforme implementação. Adicionar novos RFs ao final, mantendo numeração sequencial. Cada RF DONE deve mover para uma seção "DONE" no final OU ficar in-place com status atualizado — decisão a tomar quando primeiro RF for DONE.*
