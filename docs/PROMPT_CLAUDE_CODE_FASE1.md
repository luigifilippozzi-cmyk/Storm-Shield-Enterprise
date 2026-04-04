# Storm Shield Enterprise — Prompt para Claude Code
## Fase 1 MVP: Continuação dos Desenvolvimentos

> **Como usar:** Abra o terminal na raiz do repositório e execute `claude` para iniciar o Claude Code.
> Cole este prompt completo na primeira mensagem da sessão.

---

## ⚠️ ATENÇÃO — Desenvolvimento Ativo em `main`

**Há outro agente Claude Code desenvolvendo neste repositório simultaneamente.** Antes de escrever qualquer código, siga este protocolo obrigatório:

```bash
# 1. Sincronize com o estado atual de main
git fetch origin
git status

# 2. Se estiver em main, veja o que chegou de novo
git log origin/main..HEAD --oneline  # commits locais não pushados
git log HEAD..origin/main --oneline  # commits remotos ainda não puxados
git pull origin main

# 3. Verifique se há branches de feature em andamento
git branch -a

# 4. NUNCA faça commit direto em main
# Sempre crie uma feature branch para seu trabalho:
git checkout -b feature/SSE-{numero}-{descricao}
```

**Regras de coordenação:**
- Antes de iniciar qualquer grupo (A, B, C), rode `git pull origin main` para pegar o trabalho mais recente
- Se encontrar conflitos, resolva-os sem sobrescrever código do outro agente — me chame para decidir
- Não force-push em nenhuma branch compartilhada
- Ao abrir PR, verifique se não há PR aberto com mudanças sobrepostas

---

## Contexto do Projeto

Você está trabalhando no **Storm Shield Enterprise (SSE)**, um ERP SaaS multi-tenant para empresas de auto repair (PDR / body shops) nos Estados Unidos. O arquivo `CLAUDE.md` na raiz do repositório contém toda a arquitetura, stack tecnológica, convenções e roadmap. **Leia o CLAUDE.md antes de começar.**

**Repositório:** https://github.com/luigifilippozzi-cmyk/Storm-Shield-Enterprise
**Branch ativa:** `main` (trabalhe em feature branches conforme convenção)
**Eu sou o responsável por todas as tarefas.** Você é o desenvolvedor.

---

## Estado Atual do Repositório (auditado em 04/04/2026)

A análise do código revelou que a **Fase 1 está ~55% concluída**, muito além do que a planilha de acompanhamento registra. Veja o diagnóstico real:

### ✅ JÁ IMPLEMENTADO E FUNCIONAL

**Infraestrutura & Plataforma:**
- Monorepo Turborepo + pnpm com workspaces (`apps/api`, `apps/web`, `packages/shared-types`, `packages/shared-utils`)
- Docker Compose com PostgreSQL 16, Redis 7, n8n
- NestJS scaffolding completo: `main.ts`, `app.module.ts`, Swagger, Helmet, CORS, ValidationPipe
- `TenantDatabaseService` (request-scoped, dual search_path + RLS session variable)
- `TenantMiddleware` (resolve tenant por subdomain/header)
- `AuthGuard` integrado com Clerk (verifica JWT, carrega usuário + permissões)
- `RbacGuard` + `@RequirePermissions` decorator
- `PlanGuard` + `PlanLimitsInterceptor` + `PLAN_FEATURES` / `PLAN_LIMITS` configurados
- `GlobalExceptionFilter`, `AuditLogInterceptor`
- Migrations SQL: `000` (public schema), `001` (Platform IAM), `002` (CRM + Vehicles), `003` (Estimates + Service Orders), `004` (Financial), `005` (RLS policies)
- Script de tenant provisioning com seed de roles/permissions
- CI pipeline (`.github/workflows/ci.yml`)
- `packages/shared-types`: tipos TypeScript para todos os domínios
- `packages/shared-utils`: `generateId()` (UUID v7), `currency`, `date`, `validation`

**CRM - Customers (COMPLETO e production-ready):**
- `CustomersService` com findAll (paginação, busca full-text, filtros), create, findOne, update, soft delete
- `CustomersController` com guards, decorators e Swagger docs
- DTOs completos: `CreateCustomerDto`, `UpdateCustomerDto`, `QueryCustomerDto`
- Frontend: páginas `/customers`, `/customers/new`, `/customers/[id]`, `/customers/[id]/edit`
- `CustomerForm` component, `useCustomers` hook, API client configurado

**Frontend Base:**
- Next.js 14 App Router com Clerk auth
- Layout dashboard com Sidebar e Header
- shadcn/ui: Button, Input, Label, Select, Textarea, Badge
- Zustand auth store, TanStack Query configurado
- Middleware de proteção de rotas

**Módulos stub (estrutura criada, sem DTOs nem lógica completa):**
- `VehiclesModule` — service/controller básico sem DTOs
- `EstimatesModule` — service/controller básico sem DTOs
- `FinancialModule` — service/controller básico + `getSummary()` sem DTOs
- `UsersModule` — estrutura presente
- `AuthModule`, `InsuranceModule`, `ServiceOrdersModule` — stubs

---

## Tarefas Pendentes da Fase 1 (em ordem de prioridade)

Implemente as tarefas abaixo **sequencialmente**, criando uma feature branch para cada grupo. Ao concluir cada tarefa, faça commit usando Conventional Commits e me avise para revisão.

---

### GRUPO A — Completar módulos backend com stubs (branch: `feature/SSE-010-backend-modules-completion`)

#### A1. Users Module — CRUD completo + role assignments

**Arquivo:** `apps/api/src/modules/users/`

Implemente com o mesmo padrão do `CustomersModule`:

```typescript
// DTOs necessários:
// - CreateUserDto: email*, first_name*, last_name*, role_id*, external_auth_id?
// - UpdateUserDto: Partial<CreateUserDto> + status?
// - QueryUserDto: page, limit, search, role, status

// UsersService deve ter:
// - findAll(tenantId, query): paginado, com join em roles
// - create(tenantId, dto): insert + assign role via user_role_assignments
// - findOne(tenantId, id): com roles carregadas
// - update(tenantId, id, dto): inclui troca de role
// - remove(tenantId, id): soft delete
// - assignRole(tenantId, userId, roleId): via user_role_assignments
// - removeRole(tenantId, userId, roleId)

// UsersController:
// - GET /users → @RequirePermissions('users:read:list')
// - POST /users → @RequirePermissions('users:write:create')
// - GET /users/:id → @RequirePermissions('users:read:detail')
// - PUT /users/:id → @RequirePermissions('users:write:update')
// - DELETE /users/:id → @RequirePermissions('users:write:delete')
// - POST /users/:id/roles → @RequirePermissions('users:write:roles')
// - DELETE /users/:id/roles/:roleId → @RequirePermissions('users:write:roles')
```

#### A2. Vehicles Module — CRUD completo com foto upload (S3)

**Arquivo:** `apps/api/src/modules/vehicles/`

```typescript
// DTOs:
// - CreateVehicleDto: customer_id*, year*, make*, model*, vin?, color?, license_plate?, state?, mileage?
// - UpdateVehicleDto: Partial<CreateVehicleDto>
// - QueryVehicleDto: page, limit, customer_id?, search?, make?, year?

// VehiclesService deve ter:
// - findAll(tenantId, query): com join em customers para exibir customer_name
// - create(tenantId, dto)
// - findOne(tenantId, id): inclui vehicle_photos
// - update(tenantId, id, dto)
// - remove(tenantId, id): soft delete
// - uploadPhoto(tenantId, vehicleId, file): upload para S3/R2, insert em vehicle_photos
// - deletePhoto(tenantId, photoId): soft delete + delete do S3

// Para S3, use o SDK @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner
// Chaves via ConfigService: STORAGE_PROVIDER, AWS_REGION, S3_BUCKET_NAME, etc.
// Crie um StorageService injetável em apps/api/src/common/services/storage.service.ts

// VehiclesController:
// - GET /vehicles
// - POST /vehicles
// - GET /vehicles/:id
// - PUT /vehicles/:id
// - DELETE /vehicles/:id
// - POST /vehicles/:id/photos → @UseInterceptors(FileInterceptor('file'))
// - DELETE /vehicles/:id/photos/:photoId
```

#### A3. Estimates Module — CRUD completo com status workflow, supplements e documentos

**Arquivo:** `apps/api/src/modules/estimates/`

Este é o módulo mais complexo. O status workflow é: `draft → sent → approved → rejected` (com possibilidade de `supplement` após approved).

```typescript
// DTOs:
// - CreateEstimateDto: customer_id*, vehicle_id*, insurance_company_id?, claim_number?,
//                      adjuster_name?, adjuster_phone?, adjuster_email?,
//                      lines: CreateEstimateLineDto[]
// - CreateEstimateLineDto: description*, quantity*, unit_price*, category (labor|parts|paint|sublet|other)
// - UpdateEstimateDto: Partial<CreateEstimateDto>
// - UpdateEstimateStatusDto: status* (draft|sent|approved|rejected), notes?
// - CreateSupplementDto: description*, lines: CreateEstimateLineDto[], reason*
// - QueryEstimateDto: page, limit, status?, customer_id?, date_from?, date_to?, search?

// EstimatesService deve ter:
// - findAll(tenantId, query): com joins em customers + vehicles + insurance_companies
// - create(tenantId, dto): insert estimate + estimate_lines em transação
// - findOne(tenantId, id): com lines + supplements + documents
// - update(tenantId, id, dto): update estimate + recalcular total
// - updateStatus(tenantId, id, dto): validar transição de status, registrar histórico
// - addSupplement(tenantId, estimateId, dto): insert em estimate_supplements + lines
// - attachDocument(tenantId, estimateId, file): upload S3 + insert em estimate_documents
// - remove(tenantId, id): soft delete (apenas se draft)

// Calcular totals automaticamente: subtotal, tax_amount, total_amount
// Ao mudar status para 'approved': criar financial_transaction automática (tipo: income)

// EstimatesController:
// - GET /estimates
// - POST /estimates
// - GET /estimates/:id
// - PUT /estimates/:id
// - PATCH /estimates/:id/status
// - POST /estimates/:id/supplements
// - POST /estimates/:id/documents
// - DELETE /estimates/:id
```

#### A4. Financial Module — CRUD completo com categorização e dashboard

**Arquivo:** `apps/api/src/modules/financial/`

```typescript
// DTOs:
// - CreateTransactionDto: type* (income|expense), amount* (DECIMAL), description*,
//                         category*, date*, reference_number?, estimate_id?,
//                         bank_account_id?, notes?
// - UpdateTransactionDto: Partial<CreateTransactionDto>
// - QueryTransactionDto: page, limit, type?, category?, date_from?, date_to?,
//                        bank_account_id?, search?
// - DashboardQueryDto: period (current_month|last_month|current_year|custom),
//                       date_from?, date_to?

// FinancialService deve ter:
// - findAll(tenantId, query): paginado com filtros
// - create(tenantId, dto)
// - findOne(tenantId, id)
// - update(tenantId, id, dto)
// - remove(tenantId, id): soft delete
// - getDashboard(tenantId, query): retornar:
//   {
//     total_income, total_expense, net_balance, total_transactions,
//     income_by_category: [{category, amount}],
//     expense_by_category: [{category, amount}],
//     monthly_trend: [{month, income, expense}] (últimos 6 meses),
//     recent_transactions: últimas 10
//   }

// FinancialController:
// - GET /financial/transactions
// - POST /financial/transactions
// - GET /financial/transactions/:id
// - PUT /financial/transactions/:id
// - DELETE /financial/transactions/:id
// - GET /financial/dashboard → DashboardQueryDto

// Categorias para expenses: parts, labor, rent, utilities, insurance, payroll,
//                            contractor, equipment, marketing, other
// Categorias para income: pdr_repair, paint_body, insurance_payment, rental, other
```

---

### GRUPO B — Frontend: completar telas dos módulos (branch: `feature/SSE-011-frontend-modules`)

Após o Grupo A estar completo e nos endpoints rodando, implemente as telas seguindo o padrão estabelecido em `/customers`. Use os componentes existentes em `components/ui/` e crie novos conforme necessário.

#### B1. Vehicles — Telas completas

```
apps/web/src/app/(dashboard)/vehicles/
  ├── page.tsx              # Lista com DataTable: make, model, year, VIN, customer, actions
  ├── new/page.tsx          # Form: customer_id (select com busca), year, make, model, vin, color, license_plate
  ├── [id]/page.tsx         # Detalhe: info veículo + galeria de fotos + estimates vinculados
  └── [id]/edit/page.tsx    # Form de edição

apps/web/src/components/vehicles/
  ├── vehicle-form.tsx      # Formulário reutilizável (new + edit)
  └── vehicle-photos.tsx    # Galeria com upload drag-and-drop

apps/web/src/hooks/use-vehicles.ts   # useVehicles, useVehicle, useCreateVehicle, etc.
```

#### B2. Estimates — Telas completas

```
apps/web/src/app/(dashboard)/estimates/
  ├── page.tsx              # Lista com status badge, valor total, customer, data
  ├── new/page.tsx          # Form multi-step: cliente → veículo → itens → revisão
  ├── [id]/page.tsx         # Detalhe: header, line items, supplements, docs, timeline de status
  └── [id]/edit/page.tsx    # Edição (apenas draft)

apps/web/src/components/estimates/
  ├── estimate-form.tsx
  ├── estimate-lines.tsx    # Tabela editável de itens com cálculo automático
  ├── estimate-status.tsx   # Badge + botão de mudança de status
  └── supplement-form.tsx

apps/web/src/hooks/use-estimates.ts
```

#### B3. Financial — Dashboard e transações

```
apps/web/src/app/(dashboard)/financial/
  ├── page.tsx              # Dashboard: KPI cards + gráfico trend + tabela recentes
  └── transactions/
      ├── page.tsx          # Lista de transações com filtros
      └── new/page.tsx      # Form nova transação

apps/web/src/components/financial/
  ├── kpi-cards.tsx         # Cards: receita, despesa, saldo líquido
  ├── trend-chart.tsx       # Recharts: income vs expense (últimos 6 meses)
  └── transaction-form.tsx

apps/web/src/hooks/use-financial.ts
```

#### B4. Dashboard Home — KPIs reais

```
apps/web/src/app/(dashboard)/dashboard/page.tsx

// Buscar dados reais via API:
// - Total de customers ativos
// - Estimates pendentes (status: sent)
// - Receita do mês atual
// - Service orders abertas
// KPI cards + atividade recente (últimos 5 customers, últimas 5 transactions)
```

---

### GRUPO C — Qualidade e testes (branch: `feature/SSE-012-tests-and-quality`)

#### C1. Testes unitários — backend

Crie testes para os serviços implementados nos Grupos A e B. Meta: **80%+ de cobertura** nos services.

```
apps/api/src/modules/customers/customers.service.spec.ts  (já deve existir ou criar)
apps/api/src/modules/vehicles/vehicles.service.spec.ts
apps/api/src/modules/estimates/estimates.service.spec.ts
apps/api/src/modules/financial/financial.service.spec.ts
apps/api/src/modules/users/users.service.spec.ts
```

Use Jest + mocks da `TenantDatabaseService`:
```typescript
const mockDb = { where: jest.fn().mockReturnThis(), first: jest.fn(), ... };
```

#### C2. Customer Consent Records (LGPD)

Implemente conforme tabela `customer_consent_records` na migration `002`:

```typescript
// apps/api/src/modules/customers/consent/
// - ConsentService: create, findByCustomer, revoke
// - ConsentController: POST /customers/:id/consent, GET /customers/:id/consent
// - CreateConsentDto: consent_type*, granted_at*, consent_text, version
```

#### C3. Verificar e corrigir CI pipeline

Verifique `.github/workflows/ci.yml` e garanta que:
- Lint (`pnpm lint`) passa em todos os workspaces
- Build (`pnpm build`) compila `api` e `web` sem erros
- Testes (`pnpm test`) executam com coverage
- O pipeline roda em PRs para `main` e `develop`

---

## Convenções Obrigatórias

Siga **sempre** estas convenções do projeto:

### Git
- **Branch:** `feature/SSE-{numero}-{descricao-curta}` (ex: `feature/SSE-011-vehicles-module`)
- **Commits:** Conventional Commits — `feat:`, `fix:`, `chore:`, `test:`, `refactor:`
- **PR:** Use o template em `.github/PULL_REQUEST_TEMPLATE.md`

### Backend (NestJS)
- **SEMPRE** use `TenantDatabaseService.getConnection()` para queries tenant-scoped (nunca `KNEX_CONNECTION` diretamente)
- Use `KNEX_ADMIN_CONNECTION` apenas em seeds/migrations/provisioning
- DTOs com `class-validator` decorators em todos os campos
- Todos os endpoints com `@UseGuards(AuthGuard, TenantGuard, RbacGuard)` e `@RequirePermissions(...)`
- Valores monetários: `DECIMAL(14,2)`, nunca `FLOAT`
- IDs: sempre `generateId()` de `@sse/shared-utils` (UUID v7)
- Soft delete: `deleted_at` nunca hard delete em dados financeiros
- Swagger: `@ApiTags`, `@ApiOperation`, `@ApiResponse` em todos os endpoints

### Frontend (Next.js)
- Server Components por padrão; `"use client"` apenas quando necessário (formulários, estado)
- Hooks customizados em `src/hooks/use-{module}.ts` usando TanStack Query
- Formulários com React Hook Form + Zod validation
- Componentes reutilizáveis em `src/components/{module}/`
- Nunca hardcode URLs de API — use `NEXT_PUBLIC_API_URL` via `src/lib/api.ts`

### Isolamento Multi-tenant
- Toda query deve incluir `WHERE tenant_id = ?`
- A RLS é a segunda camada — não substituição do filtro explícito
- Nunca expor `schema_name` ou `tenant_id` em respostas de API para o cliente final

---

## Ordem de Execução Recomendada

```
0. git pull origin main → checar branches abertas → verificar o que o outro agente já fez
1. Identificar quais tarefas dos Grupos A/B/C já foram implementadas pelo outro agente
2. Só então iniciar pelo que estiver faltando — não reimplementar o que já existe
3. Grupo A1 (Users) → git pull → commit → PR
4. Grupo A2 (Vehicles backend) → git pull → commit
5. Grupo A3 (Estimates backend — o mais complexo) → git pull → commit
6. Grupo A4 (Financial backend) → git pull → commit
7. PR do Grupo A para review
8. git pull origin main → Grupo B1 (Vehicles frontend) → commit
9. Grupo B2 (Estimates frontend) → commit
10. Grupo B3 (Financial frontend) → commit
11. Grupo B4 (Dashboard KPIs) → commit
12. PR do Grupo B para review
13. git pull origin main → Grupo C1 (Tests) → commit
14. Grupo C2 (Consent LGPD) → commit
15. Grupo C3 (CI fix) → commit
16. PR final do Grupo C
```

---

## Critério de Aceite da Fase 1

A Fase 1 estará **concluída** quando:

- [ ] Criar tenant → adicionar usuários com roles diferentes → login funcional
- [ ] CRUD completo: Customer → Vehicle → Estimate (com status workflow)
- [ ] Financial dashboard com dados reais (receita, despesa, saldo, trend)
- [ ] Upload de fotos de veículos funcionando (S3)
- [ ] Upload de documentos em estimates funcionando (S3)
- [ ] Tenant A não vê dados de Tenant B (RLS validado)
- [ ] CI pipeline verde no GitHub Actions
- [ ] Cobertura de testes ≥ 80% nos services
- [ ] Zero erros TypeScript (`pnpm typecheck`)
- [ ] Swagger docs acessível em `/docs`

---

## Referências Importantes

- **Arquitetura completa:** `CLAUDE.md` (raiz do repo)
- **Migrations SQL:** `apps/api/src/database/migrations/`
- **Tipos compartilhados:** `packages/shared-types/src/`
- **Padrão de referência (Customer):** `apps/api/src/modules/customers/` + `apps/web/src/app/(dashboard)/customers/`
- **Docs arquitetura:** `docs/architecture/SSE_Banco_de_Dados_v1.0.docx`, `SSE_Requisitos_Funcionais_v1.2.docx`

**Qualquer dúvida sobre regra de negócio, arquitetura ou decisão de design: me consulte antes de implementar.**
