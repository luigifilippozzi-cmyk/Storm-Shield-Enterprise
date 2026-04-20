# SSE — Plano de Testes de UI Fase 1 MVP

**Data:** 2026-04-20
**Autor:** PO Assistant (Cowork session)
**Solicitado por:** Luigi Filippozzi (Product Owner)
**Companheiro de:** `docs/audits/SSE_GoNoGo_Fase1_MVP_20260420.md`
**Cobertura:** 12 módulos ativos + 36 páginas frontend. Os 3 módulos diferidos (`inventory`, `rental`, `notifications`) estão listados como **N/A Fase 1**.

---

## 1. Propósito e Escopo

Este plano define **como validar a interface do SSE** com dados fictícios antes de promover Fase 1 MVP para **GO** final. Cobre 4 categorias complementares:

| # | Categoria | Executor | Quando | Dados |
|---|---|---|---|---|
| A | **Seed de demo** | DM (script) | Setup inicial do staging + toda vez que banco for resetado | Tenant fictício `Acme Auto Body` populado |
| B | **E2E automatizados (Playwright)** | CI | Todo PR + nightly em staging | Fixtures determinísticas |
| C | **Roteiro de QA manual** | PO + QA humano | Antes de cada release (Fase 1 GO final, depois a cada sprint) | Tenant de seed (A) |
| D | **Smoke test pós-deploy** | CI automático | Imediatamente após cada deploy staging/prod | Endpoints públicos + login de usuário de teste |

**Pré-condição infra:** categorias B/C/D requerem T-20260412-1 (Deploy API Fly.io) desbloqueado. Categoria A pode ser preparada em paralelo (script roda em qualquer ambiente com API viva).

**Escopo negativo:**
- **Não** cobre performance/load testing (separado, Fase 2+)
- **Não** cobre mobile native (Fase 5+, fora MVP)
- **Não** substitui testes unitários de services (cobertos por `pnpm test:cov`)
- **Não** testa módulos diferidos (`inventory`, `rental`, `notifications`)
- **Não** inclui testes de integração externa (Plaid, Stripe, QuickBooks) — Fase 2+

---

## 2. Dados Fictícios — Tenant Demo "Acme Auto Body"

### 2.1 Identidade do tenant

| Campo | Valor |
|---|---|
| Nome legal | `Acme Auto Body, LLC` |
| Tenant ID (schema) | `tenant_acme_autobody` (UUID v7 gerado em runtime) |
| Domínio | `acme.sse-demo.test` |
| Plano | `pro` (para desbloquear todos os módulos relevantes da Fase 1) |
| Timezone | `America/Chicago` (Missouri) |
| Endereço | `1234 Industrial Ave, Suite 10, Kansas City, MO 64101` |
| EIN (fictício) | `98-7654321` |
| Status | `active` |

**Justificativa de valores fictícios:** nomes, endereços, EINs, telefones, placas, VINs e SSNs usam prefixos e ranges não alocados (EIN começando em 98-, placas `ZZZ-`, VINs com dígitos de controle inválidos) para garantir que **não colidam com dados reais** mesmo se vazarem.

### 2.2 Usuários seed (7 roles)

| Role | Nome fictício | Email | Uso em testes |
|---|---|---|---|
| `owner` | John O'Connor | `owner@acme.sse-demo.test` | Persona Owner-Operator — cockpit, billing, aprovações |
| `admin` | Maria Santos | `admin@acme.sse-demo.test` | Configurações do tenant, user management |
| `manager` | David Kim | `manager@acme.sse-demo.test` | Aprovações de estimates, relatórios operacionais |
| `estimator` | Sarah Johnson | `estimator@acme.sse-demo.test` | Persona Estimator — inbox, supplements, insurance |
| `technician` | Carlos Mendez | `tech@acme.sse-demo.test` | Persona Technician — my-work, time entries, fotos |
| `accountant` | Linda Foster | `accountant@acme.sse-demo.test` | Persona Accountant — books, fechamento, 1099 |
| `viewer` | Robert Taylor | `viewer@acme.sse-demo.test` | Read-only — validar negativas de escrita |

Senha padrão para todos em staging: `DemoPass!2026` (rotacionada ao promover para produção).

### 2.3 Volumetria do seed

| Entidade | Quantidade | Observação |
|---|---|---|
| Customers | 25 | 18 active, 5 inactive, 2 com consent record revoked (LGPD) |
| Insurance companies | 6 | Progressive, State Farm, Allstate, GEICO, USAA, Farmers — com contacts e DRP flags |
| Vehicles | 40 | Distribuídos entre customers; 30 com ≥1 foto seed |
| Estimates | 35 | Status mix: 10 draft, 8 submitted, 7 awaiting_approval, 5 approved, 3 supplement_pending, 2 paid |
| Estimate supplements | 8 | Vinculados aos estimates em status supplement_pending/paid |
| Service Orders | 22 | Status mix: 5 open, 10 in_progress, 4 awaiting_parts, 3 completed |
| SO time entries | 60 | Vinculadas a 15 SOs com técnico atribuído |
| SO photos | 45 | before/progress/after |
| Contractors | 5 | 3 ativos (1099-NEC), 2 inativos, 1 com pagamento pendente > $600 |
| Contractor payments | 30 | Distribuídos ao longo de 12 meses |
| Financial transactions | 150 | Mix de receitas (insurance + out-of-pocket) e despesas; 12 meses |
| Bank accounts | 2 | Operating + Payroll |
| Insurance payments | 20 | Vinculados a estimates aprovados |
| Commissions | 15 | Para estimator Sarah e technicians selecionados |
| Chart of Accounts | Full US GAAP | 1000-9999, seed canônico do `chart_of_accounts.seed.ts` |
| Journal Entries | 40 | Mix manual + auto-gerados (FAM, commissions, payments) |
| Fiscal periods | 13 | 12 meses + ano corrente |
| Fixed assets | 8 | 1 prédio alugado (leasehold), 2 veículos, 3 equipments, 2 computers |
| Depreciation schedules | 8 | Straight-line e MACRS (2 métodos impl.) |
| Audit logs | Naturais | Gerados pelo seed |

### 2.4 Script de seed — requisitos (handoff DM)

```
apps/api/src/database/seeds/demo-tenant/
├── index.ts                      # Orquestrador: cria tenant, aplica migrations, roda seeds na ordem
├── 001_tenant_and_users.seed.ts
├── 002_customers_and_consent.seed.ts
├── 003_insurance_companies.seed.ts
├── 004_vehicles_and_photos.seed.ts
├── 005_estimates_and_supplements.seed.ts
├── 006_service_orders.seed.ts
├── 007_contractors_and_payments.seed.ts
├── 008_financial_transactions.seed.ts
├── 009_accounting_chart_of_accounts.seed.ts  # reutiliza existente
├── 010_journal_entries_and_fiscal.seed.ts
├── 011_fixed_assets_and_depreciation.seed.ts
└── fixtures/                     # JSON determinísticos (nomes, VINs, plates, amounts)
```

Executável via: `pnpm --filter api seed:demo -- --tenant acme-autobody`

**Regras invioláveis do seed (CLAUDE.md §10):**
- Tudo via `TenantDatabaseService` (nunca `KNEX_CONNECTION` direto) — regra 4
- Toda tabela com `tenant_id` protegida por RLS — regra 3
- `DECIMAL(14,2)` para money — regra 6
- UUID v7 via `generateId()` — regra 7
- Sem `CASCADE DELETE` em transações financeiras/contábeis — regra 5
- Idempotente: reexecutar deve derrubar/reconstruir o tenant sem orfandade — regra 13

---

## 3. Categoria A — Seed de Demo para Staging

### A.1 Objetivo

Popular o staging com o tenant Acme Auto Body completo para **desbloquear demos, QA manual e E2E sem dependência de dados reais**.

### A.2 Cenários de uso

| Cenário | Comando | Resultado esperado |
|---|---|---|
| Primeiro provisionamento | `pnpm seed:demo --tenant acme-autobody --fresh` | Tenant criado, 12 migrations aplicadas, todos os seeds carregados, login do owner funcional |
| Refresh (banco suja) | `pnpm seed:demo --tenant acme-autobody --reset` | Dropa schema, recria, repopula. Demora <5min. |
| Seed só de operação | `pnpm seed:demo --tenant acme-autobody --only=customers,vehicles,estimates` | Popula só o vertical operacional — útil para testar fluxos específicos |

### A.3 Critérios de aceite

- [ ] Login de todos os 7 users seed funcional
- [ ] Owner vê `/app/cockpit` com dados populados
- [ ] Estimator vê `/app/estimates/inbox` com 35 estimates distribuídos por status
- [ ] Technician vê `/app/my-work` com ≥3 SOs atribuídas e time entries
- [ ] Accountant vê `/app/books` com journal entries + fiscal periods
- [ ] Nenhum valor `NULL` em colunas NOT NULL (validação de schema)
- [ ] RLS não permite que login de tenant diferente veja dados de Acme

### A.4 Escopo negativo

- Script não aplica migrations globais (assume repo atualizado)
- Script não provisiona Clerk org (assume pré-configurado em staging)
- Script não envia emails de convite (flag `--skip-emails` default)

---

## 4. Categoria B — E2E Automatizados (Playwright)

### B.1 Stack sugerida (decisão DM)

| Ferramenta | Uso |
|---|---|
| Playwright | Framework E2E (multi-browser, mobile emulation) |
| Playwright Trace Viewer | Debug de falhas em CI |
| GitHub Actions | Runner — nightly em staging + on-PR contra preview Vercel |
| Acme tenant | Dados fonte |

**Alternativa considerada:** Cypress. Recomendação Playwright pela maturidade do mobile emulation (relevante para validar Gap 2 Bússola no futuro).

### B.2 Estrutura de testes

```
apps/web/e2e/
├── playwright.config.ts
├── fixtures/
│   ├── users.ts              # Credenciais dos 7 users seed
│   ├── urls.ts               # Base URLs staging/prod
│   └── data.ts               # Nomes, placas, VINs para asserções
├── helpers/
│   ├── auth.ts               # Login via Clerk API
│   └── tenant.ts             # Seleção de workspace
└── tests/
    ├── 01-auth/
    ├── 02-tenants-users/
    ├── 03-customers/
    ├── 04-insurance/
    ├── 05-vehicles/
    ├── 06-estimates/
    ├── 07-service-orders/
    ├── 08-financial/
    ├── 09-contractors/
    ├── 10-accounting/
    ├── 11-fixed-assets/
    └── 12-cross-module/       # Fluxos que atravessam domínios
```

### B.3 Cenários E2E por módulo (mínimo cada)

| # | Módulo | Cenário crítico | Persona |
|---|---|---|---|
| 1 | `auth` | Login 7 roles → landing correto por persona (RF-001) | todas |
| 2 | `tenants/users` | Owner convida novo usuário → user recebe invite → aceita → login OK | Owner |
| 3 | `customers` | Estimator cria customer → consent record gerado → busca por nome retorna | Estimator |
| 4 | `insurance` | Estimator cria insurance company com DRP → aparece em dropdown de estimate | Estimator |
| 5 | `vehicles` | Estimator cria vehicle vinculado a customer → upload de foto via StorageService mock | Estimator |
| 6 | `estimates` | Estimator cria estimate → adiciona 3 linhas → muda status draft → submitted → foto do veículo aparece | Estimator |
| 7 | `service-orders` | Manager abre SO a partir de estimate approved → Technician atribuído vê em `/app/my-work` | Manager + Tech |
| 8 | `financial` | Owner filtra transações por mês → dashboard mostra receita/despesa → trend chart renderiza | Owner |
| 9 | `contractors` | Accountant registra payment > $600 → 1099 tracking acumula corretamente | Accountant |
| 10 | `accounting` | Accountant cria JE manual → lines debit=credit → status posted → aparece em Trial Balance | Accountant |
| 11 | `fixed-assets` | Accountant cria asset straight-line → executa depreciation run → JE auto-gerado | Accountant |
| 12 | `cross-module` | **Happy path Fase 1:** Owner cria customer → vehicle → estimate → SO → registra 1 transaction. Activation event emitido (RF-003) | Owner (ou Estimator+Tech em conjunto) |

### B.4 Cenários negativos obrigatórios

| # | Cenário | Validação |
|---|---|---|
| N1 | Viewer tenta criar customer | UI esconde botão; API retorna 403 |
| N2 | User do tenant A tenta acessar URL com ID de tenant B | 404 ou 403; RLS bloqueia |
| N3 | Free tenant tenta criar 51º customer | UI mostra upgrade prompt; API retorna 402 (plan limit) |
| N4 | Free tenant tenta acessar `/app/accounting` | `@RequirePlanFeature('accounting')` bloqueia; redirect para `/403` ou upgrade |
| N5 | JE com debit ≠ credit | UI mostra erro inline; API retorna 422 |
| N6 | Logout explícito → tentativa de acesso a rota autenticada → redirect para login | Auth guard funcional |

### B.5 Critérios de aceite Playwright

- [ ] ≥12 test specs rodando em CI (1 por módulo)
- [ ] ≥6 cenários negativos de segurança/plan
- [ ] Run completo <10 min em GitHub Actions
- [ ] 0 flaky tests em 5 runs consecutivos
- [ ] Trace Viewer screenshots anexadas em falhas

### B.6 Escopo negativo

- Não cobre visual regression (Chromatic/Percy) — Fase 2+
- Não roda em dispositivos reais (Sauce Labs/BrowserStack) — desktop + Playwright mobile emulation bastam no MVP
- Não testa chaos engineering (timeouts, 5xx simulados)

---

## 5. Categoria C — Roteiro de QA Manual

### C.1 Objetivo

Validação humana final antes de promover **CONDITIONAL-GO → GO**. Executado pelo PO (ou QA dedicado) no staging com tenant Acme seed, seguindo checklist passo-a-passo.

### C.2 Roteiro por persona

#### C.2.1 Owner-Operator (John O'Connor)

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Login em `owner@acme.sse-demo.test` | Redireciona para `/app/cockpit` (RF-001) |
| 2 | Inspecionar cockpit | 5 KPIs visíveis: Cash, Receivable insurance, Capacidade semana, Margem mês, SOs em risco (Gap 4 Bússola) |
| 3 | Clicar em "Workspace Switcher" | 4 workspaces listados: Cockpit, Estimates Inbox, My Work, Books |
| 4 | Ir para `/app/customers` | Lista com 25 customers (18 active visíveis por padrão) |
| 5 | Filtrar por "inactive" | 5 customers listados |
| 6 | Criar customer novo: "Maria Silva" | Customer salvo; consent record gerado com flag active |
| 7 | Ir para `/app/financial` | Dashboard + trend chart renderizam; sem erros no console |
| 8 | Convidar novo user com role `technician` | Invite enviado (mock); user aparece em `/app/users` como pending |

#### C.2.2 Estimator (Sarah Johnson)

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Login | Redireciona para `/app/estimates/inbox` |
| 2 | Inspecionar inbox | Lista de 35 estimates agrupados por status |
| 3 | Abrir estimate em status `draft` | Editor carrega com linhas existentes |
| 4 | Adicionar linha: "PDR — Front fender — $450" | Linha salva; total do estimate atualiza |
| 5 | Mudar status para `submitted` | Auditoria registrada; aparece em "Aguardando seguradora" |
| 6 | Abrir estimate em `supplement_pending` | Supplement visível; botão para novo supplement ativo |
| 7 | Criar customer novo + vehicle novo + estimate novo | 3 entidades persistidas e vinculadas |
| 8 | Upload de foto do veículo | StorageService retorna URL; thumbnail aparece |

#### C.2.3 Technician (Carlos Mendez)

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Login | Redireciona para `/app/my-work` |
| 2 | Inspecionar minhas SOs | Lista das SOs atribuídas a Carlos ordenadas por prioridade |
| 3 | Abrir 1 SO | Detalhes + tasks + time entries existentes |
| 4 | Iniciar timer | Contador arranca; novo time entry com `started_at` agora |
| 5 | Parar timer após 30s | Time entry persiste com duração ≈30s |
| 6 | Upload de foto "progress" | Foto anexada à SO |
| 7 | Abrir SO em dispositivo mobile (emulação browser) | Layout responsivo; botões clicáveis com dedo (avaliação subjetiva Gap 2) |

#### C.2.4 Accountant (Linda Foster)

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Login | Redireciona para `/app/books` |
| 2 | Inspecionar books landing | Período aberto + JE pendentes + status de reconciliação |
| 3 | Ir para `/app/accounting/chart-of-accounts` | COA completo carregado (US GAAP 1000-9999) |
| 4 | Ir para `/app/accounting/journal-entries` | 40 JEs listados; filtro por status funcional |
| 5 | Criar JE manual: D 5100 Payroll $2000 / C 1010 Cash $2000 | JE salvo status `draft`; botão "Post" ativo |
| 6 | Post o JE | Status `posted`; aparece em Trial Balance |
| 7 | Ir para `/app/accounting/reports/trial-balance` | TB carrega; debits = credits |
| 8 | Ir para `/app/accounting/reports/profit-loss` | P&L de período atual renderiza |
| 9 | Ir para `/app/accounting/reports/balance-sheet` | BS renderiza; Assets = Liabilities + Equity |
| 10 | Ir para `/app/accounting/fixed-assets` | 8 assets listados; executar depreciation run mensal |
| 11 | Executar depreciation run | JE auto-gerado D:5800 Depreciation / C:1590 Accumulated Depreciation |
| 12 | Ir para contractors → gerar 1099-NEC preview | Contractor com >$600 aparece na lista; outros não |

### C.3 Cenários negativos manuais (Viewer Robert Taylor)

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Login | Redireciona para `/app` (landing genérica; sem edit affordances) |
| 2 | Tentar criar customer | Botão ausente ou desabilitado |
| 3 | Abrir URL direta `POST /api/customers` via DevTools | 403 Forbidden |
| 4 | Acessar todas as 36 páginas | Nenhuma mostra `Edit` / `Delete` / `Create` |

### C.4 Cenários de segurança multi-tenant

| # | Ação | Resultado esperado |
|---|---|---|
| S1 | Criar 2º tenant seed `beta-auto` com customer "Alpha Test" | Seeds aplicados |
| S2 | Login como owner de Acme | Customer "Alpha Test" **não aparece** |
| S3 | Copiar UUID de customer de Beta, acessar via URL `/app/customers/<uuid>` | 404 ou 403 (nunca exibir dado) |
| S4 | Inspecionar request no DevTools | Header `X-Tenant-Id` = Acme; cookie session amarrado |

### C.5 Critérios de aceite QA manual

- [ ] 4 personas completam roteiro sem bloqueio
- [ ] 0 erros `console.error` durante a execução
- [ ] 0 vazamentos multi-tenant nos cenários S1-S4
- [ ] Screenshots capturadas para cada passo (evidência de QA)
- [ ] Bugs encontrados registrados como `BUG` via template PO

### C.6 Escopo negativo

- Não cobre acessibilidade formal (WCAG) — separado
- Não testa i18n (produto é en-US only no MVP)
- Não valida visual pixel-perfect (heurística de "está utilizável")

---

## 6. Categoria D — Smoke Test Pós-Deploy

### D.1 Objetivo

Detectar em <2 minutos se um deploy quebrou algo crítico. Roda automático em CI após cada deploy staging ou prod.

### D.2 Checklist smoke (automated)

| # | Check | Método | Threshold |
|---|---|---|---|
| 1 | API `GET /health` | HTTP | 200 em <2s, 3x consecutivas |
| 2 | API `GET /ready` | HTTP | 200 (valida conexão DB + Redis) |
| 3 | Web home `GET /` | HTTP | 200, HTML com `<title>Storm Shield` |
| 4 | Login de usuário de teste (não Acme — separado) | Playwright curto | Token Clerk obtido |
| 5 | `GET /api/tenants/me` autenticado | HTTP | 200, JSON com tenant_id |
| 6 | `GET /app/cockpit` autenticado | Playwright | Renderiza sem erro no console |
| 7 | `GET /api/customers?limit=1` | HTTP | 200, array (mesmo vazio) |
| 8 | Métricas CI expostas (se DataDog configurado) | Plugin | Dashboard atualizou |

### D.3 Usuário de smoke isolado

**Não usar seed Acme em smoke** — criar user exclusivo `smoke@sse-internal.test` em tenant `smoke-tenant` vazio, resetado a cada run. Isola smoke de desvios causados por seed demo.

### D.4 Critério de aceite

- [ ] Smoke completa em <120s
- [ ] Falha em qualquer check → rollback automático (ou alerta para equipe)
- [ ] Integrado a GitHub Actions: job `smoke-staging` depois de `deploy-staging`

### D.5 Escopo negativo

- Não substitui testes E2E (categoria B) — é sanity-check, não cobertura
- Não testa fluxos multi-step — só "subiu vivo?"

---

## 7. Matriz de Cobertura por Módulo

| # | Módulo | Seed (A) | E2E (B) | QA manual (C) | Smoke (D) |
|---|---|---|---|---|---|
| 1 | auth | ✅ 7 users | ✅ 1 spec (login por role) | ✅ 4 personas | ✅ login smoke user |
| 2 | tenants | ✅ Acme | ✅ 1 spec (invite) | ✅ Owner convida | ✅ `GET /tenants/me` |
| 3 | users | ✅ 7 users | ✅ (em tenants spec) | ✅ Owner convida | — |
| 4 | customers | ✅ 25 | ✅ 1 spec (CRUD + consent) | ✅ Owner e Estimator | ✅ `GET /customers?limit=1` |
| 5 | insurance | ✅ 6 | ✅ 1 spec (create + DRP) | ✅ Estimator | — |
| 6 | vehicles | ✅ 40 + fotos | ✅ 1 spec (CRUD + foto) | ✅ Estimator upload | — |
| 7 | estimates | ✅ 35 + 8 supplements | ✅ 1 spec (state machine) | ✅ Estimator inbox | — |
| 8 | service-orders | ✅ 22 + time + photos | ✅ 1 spec (atribuir + timer) | ✅ Technician | — |
| 9 | financial | ✅ 150 transactions + 2 bank + 20 ins.payments | ✅ 1 spec (dashboard + chart) | ✅ Owner | — |
| 10 | contractors | ✅ 5 + 30 payments | ✅ 1 spec (1099 tracking) | ✅ Accountant | — |
| 11 | accounting | ✅ COA + 40 JEs + 13 fiscal periods + 3 reports | ✅ 1 spec (JE manual + reports) | ✅ Accountant completo | — |
| 12 | fixed-assets | ✅ 8 assets + schedules | ✅ 1 spec (create + depreciation run) | ✅ Accountant | — |
| — | inventory | N/A (Fase 2+) | N/A | N/A | N/A |
| — | rental | N/A (Fase 6+) | N/A | N/A | N/A |
| — | notifications | N/A (Fase 2+) | N/A | N/A | N/A |

**Totais MVP:** 12 módulos ativos — todos cobertos em 4 camadas onde aplicável. 3 módulos marcados como N/A Fase 1 (justificativa: decisão explícita de escopo, não regressão).

---

## 8. Cronograma de Execução

| Etapa | Dependência | Estimativa | Owner |
|---|---|---|---|
| 1. Script seed Acme (categoria A) | Nenhuma — pode paralelizar com C1 Go/No-Go | 3 dias DM | DM |
| 2. Playwright scaffolding + 2 specs piloto (auth, customers) | Deploy API OK (C1) | 2 dias DM | DM |
| 3. Playwright specs restantes (10 módulos) | Pilotos OK | 5 dias DM | DM |
| 4. QA manual execução full | Seed + deploy API OK | 1 dia PO | PO |
| 5. Smoke test wiring | Deploy API OK | 1 dia DM | DM |
| 6. Correções de bugs encontrados | Execução C | 2-5 dias DM | DM |
| **Total** | | **~2 semanas úteis** | |

**Checkpoint alinhado com Go/No-Go:** se 2026-05-05 chegar sem C1/C2/C3 fechadas, plano de testes fica parcial (só categoria A executável). Reavaliar.

---

## 9. Handoff para Dev Manager

Este plano **não** executa testes — escreve as especificações. A execução é handoff DM (via `.auto-memory/dm_queue.md`, template canônico §4 HANDOFF_PROTOCOL).

**Tarefas DM derivadas deste plano** (a registrar em dm_queue.md em sessão subsequente com aprovação do PO):

| ID sugerido | Subject | Prioridade |
|---|---|---|
| T-20260420-A | Criar script seed Acme Auto Body (categoria A) | P1 |
| T-20260420-B | Scaffolding Playwright + 2 specs piloto | P1 (depende T-20260412-1) |
| T-20260420-C | Specs Playwright módulos 3-12 | P2 |
| T-20260420-D | Smoke test CI wiring | P2 |
| T-20260420-QA | Execução roteiro QA manual com PO | P1 (depende A + T-20260412-1) |

**Escopo negativo global (regra PO):**
- DM não altera estrutura deste plano sem ADR
- DM não adiciona módulos diferidos (inventory/rental/notifications) — mesmo que "rápido"
- DM não substitui Playwright por outro framework sem ADR

---

## 10. Referências

- `docs/audits/SSE_GoNoGo_Fase1_MVP_20260420.md` — relatório de prontidão companheiro
- `docs/strategy/BUSSOLA_PRODUTO_SSE.md` §2 personas, §4 gaps
- `docs/SSE_Guia_de_Testes_MVP_v1.1.docx` — guia técnico existente (complementar, cobre unit tests)
- `CLAUDE.md` §5 critérios de aceite Fase 1, §10 regras invioláveis
- `docs/process/HANDOFF_PROTOCOL.md` §4 template canônico
- `apps/api/src/database/seeds/` — localização alvo do script seed
- `.auto-memory/project_sse_status.md` — baseline atual

---

*Plano gerado em sessão PO Cowork. Revisitar pré-execução se houver desvio no Go/No-Go de 2026-05-05.*
