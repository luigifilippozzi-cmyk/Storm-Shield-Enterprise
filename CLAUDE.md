# Storm Shield Enterprise — Claude Code Bootstrap Prompt

> **Objetivo:** Use este prompt como contexto inicial ao abrir o projeto no Claude Code.
> Cole integralmente na primeira interação ou salve como `CLAUDE.md` na raiz do repo para carregamento automático.

---

## 1. Visão Geral do Projeto

**Storm Shield Enterprise (SSE)** é um ERP SaaS completo para empresas de auto repair (PDR / body shops) nos Estados Unidos, com foco inicial em Missouri. O sistema cobre o ciclo operacional completo: captação do cliente (via seguradora ou direto) → orçamento → ordem de serviço → gestão financeira → contabilidade (GL + FAM) → compliance fiscal → relatórios.

### Domínio de Negócio
- **PDR** = Paintless Dent Repair (martelinho de ouro)
- **Body shops** = Funilaria e pintura
- Clientes pagam via **insurance claims** (maioria) ou **out-of-pocket**
- Contractors (1099-NEC) = técnicos terceirizados por serviço
- Forte integração com **seguradoras** (estimates, supplements, DRP programs)

### Modelo SaaS
- **Multi-tenant** com schema isolation no PostgreSQL (`tenant_{uuid}`)
- Cada empresa (tenant) tem schema próprio, com isolamento total de dados
- Target: 500+ tenants simultâneos na fase inicial
- Billing via Stripe (free → starter → pro → enterprise)

### SaaS Hardening — 3 Camadas de Isolamento
1. **Schema Isolation**: Cada tenant tem schema PostgreSQL próprio. O `TenantDatabaseService` seta `SET search_path TO "tenant_xxx", public` por request.
2. **Row Level Security (RLS)**: Policies em todas as tabelas com `tenant_id`. A sessão DB carrega `app.current_tenant_id` via `SET app.current_tenant_id`. Mesmo que código esqueça `WHERE tenant_id`, RLS bloqueia acesso cross-tenant.
3. **Dual DB Users**: `sse_app` (runtime, sujeito a RLS) e `sse_user` (admin, bypassa RLS para migrations/provisioning).

### Subscription Plan Enforcement
- **4 planos**: free, starter, pro, enterprise
- **Feature gating**: `PlanGuard` + `@RequirePlanFeature('module')` bloqueia acesso a módulos fora do plano
- **Resource limits**: `PlanLimitsInterceptor` verifica contagem de recursos em POST (ex: free = 50 customers)
- **Limites por plano** (conforme `plan.guard.ts`):
  | Resource | Free | Starter | Pro | Enterprise |
  |---|---|---|---|---|
  | Customers | 50 | 500 | ∞ | ∞ |
  | Vehicles | 50 | 500 | ∞ | ∞ |
  | Estimates | 25 | 250 | ∞ | ∞ |
  | Service Orders | 25 | 250 | ∞ | ∞ |
  | Users | 3 | 10 | 50 | ∞ |
  | Storage | 500MB | 5GB | 50GB | ∞ |
  | Modules | 5 básicos | +insurance,contractors,reports | +accounting,FAM,inventory | Todos (+rental,api,integrations) |

---

## 2. Stack Tecnológico (Definido)

| Camada | Tecnologia | Notas |
|---|---|---|
| **Frontend Web** | Next.js 15+ (App Router) + React 19 + Tailwind CSS + shadcn/ui | SSR, dashboards responsivos |
| **App Móvel** | React Native / Expo | Técnicos e vendedores em campo |
| **API Gateway** | Kong ou AWS API Gateway | Rate limiting, auth centralizada |
| **Backend** | NestJS (Node.js) com TypeScript | Módulos isolados por domínio |
| **Banco de Dados** | PostgreSQL 16+ | Multi-tenant (schema per tenant) |
| **Cache / Filas** | Redis 7+ | Sessions, cache, job queues (BullMQ) |
| **Storage** | AWS S3 / Cloudflare R2 | Fotos, documentos, NFs digitalizadas |
| **Automação** | n8n (self-hosted) | Workflows visuais, integrações externas |
| **IA/ML** | OpenAI API + modelos custom | OCR, classificação, previsão demanda |
| **Autenticação** | **Clerk** (@clerk/backend + @clerk/nextjs) | SSO, MFA, Organizations → Tenants |
| **Infra / IaC** | AWS (ECS/EKS + RDS + ElastiCache) + **Terraform** | Infra as Code, modules por serviço |
| **CI/CD** | GitHub Actions | Lint, test, build, deploy por ambiente |
| **Monitoramento** | Datadog ou Grafana + Prometheus | APM, logs, alertas |

---

## 3. Arquitetura de Banco de Dados

### 3.1 Convenções Universais
- **UUID v7** como Primary Key em todas as tabelas (ordenável por tempo)
- **Soft delete** universal: `deleted_at TIMESTAMPTZ NULL`
- **Audit trail**: tabela `audit_logs` append-only com `old_values` / `new_values` em JSONB
- **Encryption**: AES-256-GCM field-level, envelope encryption (DEK por tenant, MEK em AWS KMS)
- **Timestamps**: `created_at`, `updated_at` com `TIMESTAMPTZ` e timezone UTC
- **ENUM types**: definidos no nível do schema, nunca strings livres
- **Naming**: snake_case para tabelas/colunas, singular para entidades

### 3.2 Domínios (12) — 65 Entidades

| # | Domínio | Entidades Principais |
|---|---|---|
| 1 | **Plataforma & IAM** | tenants, users, roles, role_permissions, user_role_assignments, user_sessions, tenant_settings, api_keys, encryption_keys, data_retention_policies, data_subject_requests, consent_records |
| 2 | **CRM** | customers, customer_consent_records, customer_interactions |
| 3 | **Seguradoras** | insurance_companies, insurance_contacts |
| 4 | **Veículos** | vehicles, vehicle_photos |
| 5 | **Orçamentos** | estimates, estimate_lines, estimate_supplements, estimate_documents |
| 6 | **Ordens de Serviço** | service_orders, so_tasks, so_time_entries, so_photos, so_parts_used, so_external_services, so_status_history |
| 7 | **Terceiros** | contractors, contractor_payments, contractor_1099s |
| 8 | **Financeiro** | financial_transactions, insurance_payments, commissions, transaction_attachments, transaction_reconciliations, bank_accounts, bank_transactions, tax_records |
| 9 | **Exports & Integrações** | external_exports, external_account_mappings |
| 10 | **Contabilidade (GL + FAM)** | chart_of_accounts, journal_entries, journal_entry_lines, fiscal_periods, account_balances, asset_categories, fixed_assets, depreciation_schedules, depreciation_entries, asset_disposals |
| 11 | **Rental de Veículos** | rental_vehicles, rental_contracts, rental_maintenance |
| 12 | **Audit & Compliance** | audit_logs, notifications |

### 3.3 Contabilidade — Chart of Accounts (US GAAP)
```
1000-1999  Assets          (Normal balance: Debit)
  1010 Cash/Checking, 1100 AR, 1200 Inventory
  1500 Fixed Assets (1510 Equipment, 1520 Vehicles, 1530 Furniture, 1540 Computer, 1550 Leasehold)
  1590 Accumulated Depreciation (contra-asset)
2000-2999  Liabilities     (Normal balance: Credit)
  2010 AP, 2100 Credit Card, 2300 Sales Tax, 2400 Payroll
3000-3999  Equity          (Normal balance: Credit)
  3010 Owner's Equity, 3100 Retained Earnings, 3200 Current Year Earnings
4000-4999  Revenue         (Normal balance: Credit)
  4010 PDR Revenue, 4020 Paint & Body, 4030 Insurance, 4040 Rental, 4090 Other
5000-9999  Expenses        (Normal balance: Debit)
  5010 Parts, 5020 Sublet, 5100 Payroll, 5200 Contractors, 5800 Depreciation
  9000 Other Expenses, 9100 Gain/Loss on Asset Disposal
```

### 3.4 Fixed Asset Management (FAM)
- 5 métodos de depreciação: Straight-Line, MACRS (IRS Pub 946), Declining Balance, Sum-of-Years, Units of Production
- Tabela `macrs_percentages` com rates oficiais IRS para classes 3, 5, 7, 10, 15 anos
- Auto-journal-entry: depreciação → D:5800/C:1590; descarte → D:1590+D:Cash/C:1500±9100
- 6 categorias seed: Machinery, Vehicles, Furniture, Computer, Leasehold, Tools

### 3.5 RBAC — 7 Roles
```
owner        → Acesso total + billing + tenant settings
admin        → Tudo exceto billing/tenant config
manager      → Operações, relatórios, aprovações
estimator    → CRM, estimates, vehicles
technician   → Service orders, time entries, photos
accountant   → Financial, accounting, reports, tax
viewer       → Read-only em tudo
```
Permissões granulares: `module:action:resource` (ex: `financial:write:transactions`)

---

## 4. Estrutura do Repositório (Monorepo)

```
storm-shield-enterprise/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint + Test + Build
│   │   ├── deploy-staging.yml        # Deploy staging on PR merge
│   │   └── deploy-production.yml     # Deploy prod on tag
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       ├── feature_request.md
│       └── task.md
├── CLAUDE.md                         # Este prompt (carregamento automático)
├── README.md
├── LICENSE
├── .env.example
├── .gitignore
├── docker-compose.yml                # Dev environment completo
├── docker-compose.prod.yml
├── turbo.json                        # Turborepo config
├── package.json                      # Root workspace
├── pnpm-workspace.yaml
│
├── docs/                             # Documentação do projeto
│   ├── architecture/
│   │   ├── SSE_Banco_de_Dados_v1.0.docx
│   │   ├── SSE_Requisitos_Funcionais_v1.2.docx
│   │   └── SSE_Diagrama_ER.mermaid
│   ├── api/                          # OpenAPI specs
│   │   └── openapi.yaml
│   ├── decisions/                    # ADRs (Architecture Decision Records)
│   │   ├── 001-multi-tenant-schema.md
│   │   ├── 002-uuid-v7-primary-keys.md
│   │   ├── 003-double-entry-bookkeeping.md
│   │   ├── 004-fixed-asset-management.md
│   │   ├── 005-saas-tenant-isolation.md
│   │   └── 006-staging-deploy-stack.md
│   ├── audits/
│   │   └── grupo-b-gaps.md          # Frontend gap analysis
│   └── runbooks/
│       ├── tenant-provisioning.md
│       ├── staging-deploy.md
│       └── depreciation-monthly.md
│
├── packages/                         # Shared packages
│   ├── shared-types/                 # TypeScript types/interfaces
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── tenant.ts
│   │       ├── customer.ts
│   │       ├── vehicle.ts
│   │       ├── estimate.ts
│   │       ├── service-order.ts
│   │       ├── financial.ts
│   │       ├── accounting.ts         # GL + FAM types
│   │       └── enums.ts
│   ├── shared-utils/                 # Funções utilitárias
│   │   ├── package.json
│   │   └── src/
│   │       ├── encryption.ts         # AES-256-GCM helpers
│   │       ├── uuid.ts               # UUID v7 generator
│   │       ├── currency.ts           # Decimal math (Dinero.js)
│   │       ├── date.ts               # Fiscal period helpers
│   │       └── validation.ts         # Zod schemas compartilhados
│   └── eslint-config/                # ESLint shared config
│       └── package.json
│
├── apps/
│   ├── api/                          # Backend NestJS
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/               # Guards, filters, interceptors, pipes, services
│   │   │   │   ├── common.module.ts  # Global module exporting StorageService
│   │   │   │   ├── guards/
│   │   │   │   │   ├── auth.guard.ts
│   │   │   │   │   ├── rbac.guard.ts
│   │   │   │   │   ├── plan.guard.ts     # PlanGuard + @RequirePlanFeature
│   │   │   │   │   └── tenant.guard.ts
│   │   │   │   ├── filters/
│   │   │   │   │   └── global-exception.filter.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── audit-log.interceptor.ts
│   │   │   │   │   ├── plan-limits.interceptor.ts
│   │   │   │   │   └── tenant-context.interceptor.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── storage.service.ts  # S3/R2 file upload, mock mode for dev
│   │   │   │   └── decorators/
│   │   │   │       ├── current-tenant.decorator.ts
│   │   │   │       ├── current-user.decorator.ts
│   │   │   │       └── permissions.decorator.ts
│   │   │   ├── config/               # Env validation, DB config
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── redis.config.ts
│   │   │   │   └── auth.config.ts
│   │   │   ├── database/
│   │   │   │   ├── migrations/       # SQL migrations (Knex)
│   │   │   │   │   ├── 000_create_public_schema.sql   # tenants, api_keys, update_updated_at trigger
│   │   │   │   │   ├── 001_platform_iam.sql           # users, roles, permissions, sessions
│   │   │   │   │   ├── 002_crm_insurance_vehicles.sql # customers, insurance, vehicles, vehicle_photos
│   │   │   │   │   ├── 003_estimates_service_orders.sql # estimates, lines, supplements, docs, SOs
│   │   │   │   │   ├── 004_financial.sql              # transactions, payments, contractors, bank_accounts
│   │   │   │   │   ├── 005_row_level_security.sql     # RLS policies, sse_app role, current_tenant_id()
│   │   │   │   │   ├── 006_customer_consent.sql       # customer_consent_records (LGPD/CCPA) + RLS
│   │   │   │   │   ├── 007_accounting_gl.sql          # chart_of_accounts + ENUM types
│   │   │   │   │   ├── 008_journal_entries_fiscal_periods.sql # journal_entries, lines, fiscal_periods
│   │   │   │   │   ├── 009_fam_tables.sql             # asset_categories, fixed_assets, depreciation_*, asset_disposals + RLS
│   │   │   │   │   └── 010_fam_not_null_and_idempotency.sql  # NOT NULL hardening + idempotent RLS/triggers
│   │   │   │   ├── seeds/
│   │   │   │   │   ├── chart_of_accounts.seed.ts
│   │   │   │   │   ├── asset_categories.seed.ts
│   │   │   │   │   ├── roles_permissions.seed.ts
│   │   │   │   │   └── macrs_percentages.seed.ts
│   │   │   │   └── tenant-provisioning.ts  # Script de criação de schema
│   │   │   │
│   │   │   └── modules/              # Um módulo NestJS por domínio
│   │   │       ├── tenants/
│   │   │       ├── auth/
│   │   │       ├── users/
│   │   │       ├── customers/
│   │   │       ├── insurance/
│   │   │       ├── vehicles/
│   │   │       ├── estimates/
│   │   │       ├── service-orders/
│   │   │       ├── contractors/
│   │   │       ├── financial/
│   │   │       ├── accounting/       # GL module
│   │   │       │   ├── accounting.module.ts
│   │   │       │   ├── accounting.controller.ts
│   │   │       │   ├── accounting.service.ts
│   │   │       │   ├── chart-of-accounts/
│   │   │       │   ├── journal-entries/
│   │   │       │   ├── fiscal-periods/
│   │   │       │   └── reports/      # P&L, Balance Sheet, Trial Balance
│   │   │       ├── fixed-assets/     # FAM module
│   │   │       │   ├── fixed-assets.module.ts
│   │   │       │   ├── fixed-assets.controller.ts
│   │   │       │   ├── fixed-assets.service.ts
│   │   │       │   ├── depreciation.service.ts
│   │   │       │   ├── disposal.service.ts
│   │   │       │   ├── dto/
│   │   │       │   │   ├── create-asset.dto.ts
│   │   │       │   │   ├── execute-depreciation.dto.ts
│   │   │       │   │   └── dispose-asset.dto.ts
│   │   │       │   └── tests/
│   │   │       │       ├── depreciation-calc.spec.ts
│   │   │       │       └── disposal-je.spec.ts
│   │   │       ├── inventory/
│   │   │       ├── rental/
│   │   │       └── notifications/
│   │   │
│   │   └── test/                     # E2E tests
│   │       ├── app.e2e-spec.ts
│   │       └── jest-e2e.json
│   │
│   ├── web/                          # Frontend Next.js
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── Dockerfile
│   │   ├── src/
│   │   │   ├── app/                  # App Router
│   │   │   │   ├── (auth)/           # Login, Register, Forgot
│   │   │   │   ├── (dashboard)/      # Layout com sidebar
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx      # Dashboard home
│   │   │   │   │   ├── customers/
│   │   │   │   │   ├── vehicles/
│   │   │   │   │   ├── estimates/
│   │   │   │   │   ├── service-orders/
│   │   │   │   │   ├── financial/
│   │   │   │   │   ├── accounting/
│   │   │   │   │   │   ├── chart-of-accounts/
│   │   │   │   │   │   ├── journal-entries/
│   │   │   │   │   │   ├── reports/
│   │   │   │   │   │   └── fixed-assets/   # FAM UI
│   │   │   │   │   │       ├── page.tsx     # Asset list
│   │   │   │   │   │       ├── [id]/
│   │   │   │   │   │       ├── categories/
│   │   │   │   │   │       ├── depreciation/
│   │   │   │   │   │       └── disposals/
│   │   │   │   │   ├── contractors/
│   │   │   │   │   ├── inventory/
│   │   │   │   │   ├── rental/
│   │   │   │   │   └── settings/
│   │   │   │   └── api/              # Next.js API routes (BFF)
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   ├── layout/           # Sidebar, Header, Breadcrumb
│   │   │   │   ├── forms/            # Form components reutilizáveis
│   │   │   │   ├── tables/           # DataTable com sorting/filter/pagination
│   │   │   │   └── charts/           # Recharts wrappers
│   │   │   ├── hooks/
│   │   │   ├── lib/                  # API client, auth helpers
│   │   │   └── stores/               # Zustand stores
│   │   └── public/
│   │
│   └── mobile/                       # React Native (Fase 5)
│       ├── package.json
│       └── ...
│
├── infra/                            # Infrastructure as Code
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── modules/
│   │   │   ├── vpc/
│   │   │   ├── rds/
│   │   │   ├── ecs/
│   │   │   ├── redis/
│   │   │   └── s3/
│   │   └── environments/
│   │       ├── staging/
│   │       └── production/
│   └── docker/
│       ├── api.Dockerfile
│       ├── web.Dockerfile
│       └── n8n.Dockerfile
│
└── n8n/                              # Workflows n8n exportados
    ├── workflows/
    │   ├── insurance-payment-reminder.json
    │   ├── monthly-depreciation.json
    │   ├── contractor-1099-generation.json
    │   ├── data-subject-request.json
    │   └── quickbooks-export.json
    └── credentials.example.json

### Workflows n8n Planejados
- **insurance-payment-reminder** — Alerta de pagamentos de seguradora pendentes (check_reminder_at)
- **monthly-depreciation** — Executa batch de depreciação mensal para todos os tenants (cron 1st day)
- **contractor-1099-generation** — Gera formulários 1099-NEC em janeiro para contractors acima de $600
- **data-subject-request** — Processa solicitações LGPD/CCPA (acesso/eliminação/portabilidade)
- **quickbooks-export** — Export mensal de journal entries para QuickBooks/Xero via API
- **estimate-status-webhook** — Notifica seguradoras sobre mudança de status de estimates
- **daily-bank-reconciliation** — Reconciliação automática via Plaid API
```

---

## 5. Roadmap Faseado de Desenvolvimento

### Fase 1 — MVP (3-4 meses) 🔴 Crítica
**Objetivo:** Sistema funcional para um body shop gerenciar operações diárias.

**Módulos:**
1. **Plataforma & IAM** — Tenant provisioning, auth (Auth0/Clerk), RBAC (7 roles), user management
2. **CRM Básico** — CRUD customers, busca, histórico de interações
3. **Gestão de Veículos** — CRUD vehicles, fotos, vinculo com customer
4. **Estimates** — Criar/editar orçamentos, linhas de itens, supplements, status workflow
5. **Financeiro Básico** — Entradas/saídas, categorização, dashboard resumo

**Entregáveis técnicos:**
- [x] Monorepo setup (Turborepo + pnpm)
- [x] NestJS API scaffolding com multi-tenant middleware
- [x] PostgreSQL migrations (000-006)
- [x] Next.js app com autenticação e dashboard
- [x] Docker Compose para dev environment
- [x] CI pipeline (lint + test + build) + staging deploy (Fly.io, Vercel, Neon)
- [x] Tenant provisioning script (cria schema + seed data)
- [x] RBAC guard + PlanGuard no backend
- [x] 272 testes unitários passando (20 test suites)
- [x] StorageService (S3/R2) para upload de fotos e documentos
- [x] Consent Records (LGPD/CCPA) com RLS
- [x] Contractors module (CRUD + payments + 1099 tracking)
- [x] Accounting GL module (Chart of Accounts + Journal Entries + Fiscal Periods)
- [x] Fixed Assets module (FAM) — 4-method depreciation, auto JE, batch execution, disposal
- [ ] 80%+ test coverage nos services (meta em progresso)

**Critérios de aceite:**
- Criar tenant, adicionar usuários com roles diferentes
- CRUD completo de customer → vehicle → estimate
- Dashboard com totais financeiros básicos
- Multi-tenant isolado (tenant A não vê dados de tenant B)

---

### Fase 2 — IA + Integrações (2-3 meses) 🟠 Alta
**Módulos:**
1. **OCR + Classificador IA** — Upload de documentos, extração automática
2. **Integração bancária** — Plaid API, reconciliação automática
3. **Automações n8n** — Workflows de notificação, follow-up

---

### Fase 3 — Contabilidade + FAM (3-4 meses) 🟠 Alta
**Módulos:**
1. **General Ledger** — Chart of Accounts, Journal Entries, Fiscal Periods
2. **Fixed Asset Management** — 5 métodos de depreciação, auto-JE, disposal
3. **Relatórios** — P&L, Balance Sheet, Trial Balance, Depreciation Schedule
4. **Comissões** — Cálculo automático por técnico/vendedor
5. **Gestão de Terceiros** — Contractors, 1099 tracking

---

### Fase 4 — Compliance Fiscal (2-3 meses) 🟠 Alta
- Sales Tax (Missouri), 1099-NEC generation, LGPD/CCPA
- Portal do Contador (read-only com export)
- Integração QuickBooks/Xero (external_exports)

### Fase 5 — Mobile + Comunicação (2-3 meses) 🟡 Média
- App React Native completo
- WhatsApp Business API
- Chatbot IA para atendimento

### Fase 6 — Rental + Analytics (2-3 meses) 🟡 Média
- Aluguel de veículos durante reparo
- Previsão de demanda (ML)
- Dashboards analíticos avançados

### Fase 7 — Marketplace (2-3 meses) 🟢 Baixa
- Integração CCC ONE / Mitchell (estimate import)
- Marketplace de terceiros/fornecedores

---

## 6. Convenções de Código

### Git
- **Branching:** `main` → `develop` → `feature/SSE-xxx-description`
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- **PRs:** Sempre com template, revisão obrigatória, CI green
- **Tags:** Semantic versioning `v1.0.0`

### Backend (NestJS)
- Um módulo por domínio de negócio
- DTOs com class-validator + class-transformer
- Repository pattern (Knex ou TypeORM)
- Todos os endpoints autenticados + tenant-scoped
- Error handling centralizado (GlobalExceptionFilter)
- Logging estruturado (Winston + correlation ID)
- Testes unitários com Jest (80%+ coverage)

### Frontend (Next.js)
- App Router com layouts aninhados
- Server Components por padrão, Client Components quando necessário
- shadcn/ui como base de componentes
- Zustand para state management
- React Query (TanStack Query) para data fetching
- Zod para validação de formulários

### Banco de Dados
- Todas as queries scoped por `tenant_id` (Row Level Security habilitado)
- **3 camadas de isolamento**: schema per tenant + RLS policies + dual DB users
- **TenantDatabaseService**: injetar em services (NÃO usar KNEX_CONNECTION direto para dados de tenant)
- **KNEX_ADMIN_CONNECTION**: apenas para migrations, provisioning, operações cross-tenant
- Migrations versionadas e idempotentes
- Sem `CASCADE DELETE` em tabelas financeiras/contábeis
- Indexes documentados com justificativa
- DECIMAL(14,2) para valores monetários (nunca FLOAT)

### Segurança
- **Tenant Isolation**: Schema isolation + RLS + session variable `app.current_tenant_id`
- **Dual DB Users**: `sse_app` (RLS enforced) para runtime, `sse_user` (admin) para migrations
- **Plan Enforcement**: `PlanGuard` para feature gating, `PlanLimitsInterceptor` para resource limits
- **Tenant Status Check**: Middleware bloqueia requests de tenants suspended/cancelled
- AES-256-GCM para campos sensíveis (SSN, EIN, bank accounts)
- Envelope encryption: DEK por tenant, MEK em AWS KMS
- Rate limiting por tenant (Kong/API Gateway)
- CORS restrito por domínio
- Helmet.js + CSRF protection
- Audit log em toda operação de escrita

---

## 7. Documentação Existente

Os seguintes arquivos de referência estão na pasta `docs/architecture/`:

| Arquivo | Conteúdo |
|---|---|
| `SSE_Banco_de_Dados_v1.0.docx` | Arquitetura completa do BD — 65 entidades em 12 domínios, incluindo FAM |
| `SSE_Requisitos_Funcionais_v1.2.docx` | Requisitos funcionais completos com 10 seções |
| `SSE_Diagrama_ER.mermaid` | ER diagram completo (Mermaid syntax) |
| `SSE_Diagrama_ER.html` | Diagrama interativo com filtros por domínio |
| `SSE_Quadro_Comparativo_FAM.xlsx` | Comparação Leading Practices Oracle vs SSE (26 funcionalidades) |
| `sql/001_fam_tables.sql` | DDL das tabelas FAM com constraints |
| `sql/002_fam_seed_data.sql` | Seed data: contas GL + 6 categorias de ativos |
| `sql/003_fam_depreciation_functions.sql` | Funções PL/pgSQL: cálculo depreciação, auto-JE, batch, disposal |

**IMPORTANTE:** O arquivo `Leading Practices_Brazil_Financials First_PRM_PT-BR.docx` é documento de REFERÊNCIA Oracle/NetSuite e NÃO deve ser modificado. Este arquivo é confidencial e está no `.gitignore` — nunca commitá-lo.

### Migrations Ativas (apps/api/src/database/migrations/)

| Migration | Descrição |
|---|---|
| `000_create_public_schema.sql` | Tabela `tenants`, `api_keys`, trigger `update_updated_at` |
| `001_platform_iam.sql` | Users, roles, permissions, sessions, tenant_settings |
| `002_crm_insurance_vehicles.sql` | Customers, insurance_companies, vehicles, vehicle_photos |
| `003_estimates_service_orders.sql` | Estimates, estimate_lines, supplements, documents, service_orders, tasks, time_entries, parts |
| `004_financial.sql` | Transactions, insurance_payments, contractors, contractor_payments, bank_accounts, commissions, audit_logs, notifications |
| `005_row_level_security.sql` | RLS policies em todas as tabelas, role `sse_app`, função `current_tenant_id()` |
| `006_customer_consent.sql` | Customer consent records (LGPD/CCPA) + RLS policy |
| `007_accounting_gl.sql` | Chart of accounts table, ENUMs (`account_type`, `normal_balance`), indexes, RLS |
| `008_journal_entries_fiscal_periods.sql` | Journal entries + lines, fiscal periods, ENUMs (`journal_entry_status`, `fiscal_period_status`) |
| `009_fam_tables.sql` | Fixed Asset Management: `asset_categories`, `fixed_assets`, `depreciation_schedules`, `depreciation_entries`, `asset_disposals` + RLS + ENUMs |
| `010_fam_not_null_and_idempotency.sql` | NOT NULL hardening on FAM tables + idempotent RLS policies and triggers |

---

## 8. Primeiros Passos no Claude Code

Ao iniciar a sessão, execute as seguintes tarefas na ordem:

```
1. Inicializar monorepo:
   - pnpm init + turbo init
   - Criar workspaces: packages/shared-types, packages/shared-utils, apps/api, apps/web
   - Configurar TypeScript, ESLint, Prettier

2. Setup Docker Compose (dev):
   - PostgreSQL 16 + Redis 7 + n8n
   - Healthchecks, volumes persistentes
   - .env.example com todas as variáveis

3. Scaffolding NestJS (apps/api):
   - nest new api --package-manager pnpm
   - Instalar: @nestjs/config, @nestjs/swagger, knex, pg
   - Criar: TenantMiddleware, AuthGuard, RbacGuard
   - Criar módulos vazios para os 12 domínios

4. Scaffolding Next.js (apps/web):
   - npx create-next-app@latest web --app --tailwind --typescript
   - Instalar shadcn/ui, zustand, @tanstack/react-query
   - Layout base com sidebar e auth wrapper

5. Database Migrations (Fase 1):
   - Migration 000: public schema (tenants, roles, permissions)
   - Migration 001-004: schemas per-tenant (CRM, vehicles, estimates, financial)
   - Tenant provisioning script

6. CI Pipeline:
   - GitHub Actions: lint → test → build
   - Branch protection rules para main e develop
```

---

## 9. Comandos Úteis

```bash
# Dev environment
docker compose up -d                    # Start services
pnpm install                            # Install all dependencies
pnpm dev                                # Start all apps in dev mode
pnpm --filter api dev                   # Start only API
pnpm --filter web dev                   # Start only frontend

# Database
pnpm --filter api migration:run         # Run migrations
pnpm --filter api migration:create NAME # Create new migration
pnpm --filter api seed:run              # Run seed data
pnpm --filter api tenant:create NAME    # Provision new tenant

# Testing
pnpm test                               # Run all tests
pnpm --filter api test:cov              # Coverage report
pnpm --filter api test:e2e              # E2E tests

# Build & Deploy
pnpm build                              # Build all
pnpm --filter api build                 # Build API only
docker build -f infra/docker/api.Dockerfile -t sse-api .
```

---

## 10. Regras para o Claude Code

1. **Sempre** seguir as convenções definidas neste documento
2. **Nunca** usar `CASCADE DELETE` em tabelas financeiras ou contábeis
3. **Sempre** adicionar `tenant_id` em queries (RLS)
4. **Sempre** usar UUID v7 como PK
5. **Sempre** usar DECIMAL(14,2) para money (nunca FLOAT)
6. **Sempre** escrever testes para novos services (mínimo 80% coverage)
7. **Sempre** documentar decisions em ADRs quando alterar arquitetura
8. **Nunca** commitar secrets (.env, chaves, tokens)
9. **Sempre** usar Conventional Commits
10. **Nunca** modificar o documento Leading Practices de referência
11. **Sempre** usar `TenantDatabaseService` para acesso a dados de tenant (NUNCA injetar `KNEX_CONNECTION` direto em services tenant-scoped)
12. **Sempre** usar `KNEX_ADMIN_CONNECTION` apenas para migrations, provisioning e operações cross-tenant
13. **Sempre** adicionar RLS policy ao criar novas tabelas com `tenant_id`
14. **Sempre** considerar plan enforcement ao adicionar novos módulos (`@RequirePlanFeature` + atualizar `PLAN_FEATURES`)
