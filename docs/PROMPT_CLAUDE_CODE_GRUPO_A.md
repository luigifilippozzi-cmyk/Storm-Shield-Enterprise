# Storm Shield Enterprise — Grupo A (Backend Modules Completion)

> **Agente 2** — escopo EXCLUSIVO: completar módulos backend com stubs.
> Prompt autocontido. Leia AGENTS.md + CLAUDE.md antes de começar.

---

## Sua Missão

Completar 4 módulos NestJS que hoje têm apenas stubs (service/controller vazios): **Users, Vehicles, Estimates, Financial**. Todos seguindo o padrão do `CustomersModule` que já está production-ready.

**Branch:** `feature/SSE-010-backend-modules-completion`
**Entregáveis:** 4 PRs (um por módulo) + testes ≥80% coverage

---

## Escopo: O QUE você PODE tocar

```
✅ apps/api/src/modules/users/**
✅ apps/api/src/modules/vehicles/**
✅ apps/api/src/modules/estimates/**
✅ apps/api/src/modules/financial/**
✅ apps/api/src/app.module.ts (registrar módulos se necessário)
✅ apps/api/src/common/plan-features.ts (adicionar resources aos limites)
✅ packages/shared-types/src/*.ts (adicionar tipos de request/response)
✅ Novas migrations SQL em apps/api/src/database/migrations/ (se precisar colunas)
```

## Escopo: O QUE você NÃO PODE tocar

```
❌ apps/web/** (Agente 3 está trabalhando no frontend)
❌ infra/** (Agente 1 está trabalhando na infra)
❌ apps/api/fly.toml, apps/web/vercel.json
❌ .github/workflows/deploy-*.yml
❌ .credentials-staging.env
❌ CLAUDE.md (só o Luigi edita)
❌ apps/api/src/modules/customers/** (referência, não tocar)
❌ apps/api/src/modules/tenants/** (core platform)
```

Se precisar editar algo fora do seu escopo, **pare e pergunte ao Luigi**.

---

## Protocolo de Execução

```bash
# 1. Sincronizar
git fetch origin
git pull origin main
git branch -a | grep feature/SSE     # ver branches dos outros agentes

# 2. Criar sua branch
git checkout -b feature/SSE-010-backend-modules-completion

# 3. Executar tarefas NA ORDEM: A1 → A2 → A3 → A4
# 4. Commit + PR após cada módulo (não espere terminar tudo)
```

---

## Padrão de Referência (OBRIGATÓRIO seguir)

Antes de escrever qualquer código, leia COMPLETAMENTE:

- `apps/api/src/modules/customers/customers.service.ts`
- `apps/api/src/modules/customers/customers.controller.ts`
- `apps/api/src/modules/customers/dto/*.ts`
- `apps/api/src/modules/customers/customers.module.ts`

Replicar EXATAMENTE esse padrão: mesma estrutura de pastas, mesmos decorators, mesma abordagem de paginação/filtros/soft-delete.

---

## A1 — Users Module

**Arquivos:** `apps/api/src/modules/users/`

**DTOs:**
- `CreateUserDto`: `email*, first_name*, last_name*, role_id*, external_auth_id?`
- `UpdateUserDto`: `Partial<CreateUserDto> + status?`
- `QueryUserDto`: `page, limit, search, role, status`

**Service methods:**
- `findAll(tenantId, query)`: paginado, join com roles
- `create(tenantId, dto)`: insert + assign role via `user_role_assignments`
- `findOne(tenantId, id)`: retorna com roles carregadas
- `update(tenantId, id, dto)`: inclui troca de role
- `remove(tenantId, id)`: soft delete
- `assignRole(tenantId, userId, roleId)`
- `removeRole(tenantId, userId, roleId)`

**Endpoints:**
- `GET /users` — `@RequirePermissions('users:read:list')`
- `POST /users` — `@RequirePermissions('users:write:create')`
- `GET /users/:id` — `@RequirePermissions('users:read:detail')`
- `PUT /users/:id` — `@RequirePermissions('users:write:update')`
- `DELETE /users/:id` — `@RequirePermissions('users:write:delete')`
- `POST /users/:id/roles` — `@RequirePermissions('users:write:roles')`
- `DELETE /users/:id/roles/:roleId` — `@RequirePermissions('users:write:roles')`

**Plan Limits:** adicionar `users` a `PLAN_LIMITS` (free=3, starter=10, pro=50, enterprise=∞) e `PlanLimitsInterceptor` no POST.

**Commit + PR A1** antes de prosseguir.

---

## A2 — Vehicles Module

**Arquivos:** `apps/api/src/modules/vehicles/`

**DTOs:**
- `CreateVehicleDto`: `customer_id*, year*, make*, model*, vin?, color?, license_plate?, state?, mileage?`
- `UpdateVehicleDto`: `Partial<CreateVehicleDto>`
- `QueryVehicleDto`: `page, limit, customer_id?, search?, make?, year?`

**Service methods:**
- `findAll(tenantId, query)`: join com customers para exibir `customer_name`
- `create / findOne / update / remove (soft delete)`
- `findOne` inclui `vehicle_photos`
- `uploadPhoto(tenantId, vehicleId, file)`: upload para R2 via S3 SDK, insert em `vehicle_photos`
- `deletePhoto(tenantId, vehicleId, photoId)`: soft delete + remover do R2

**Endpoints (padrão RESTful + uploads):**
- CRUD padrão + `POST /vehicles/:id/photos` (multipart) e `DELETE /vehicles/:id/photos/:photoId`

**S3 Client config:** usar env vars `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`. Criar `apps/api/src/common/storage/r2.service.ts` (Injectable) com método `uploadFile(key, buffer, mimetype)` e `deleteFile(key)`.

**Commit + PR A2** antes de prosseguir.

---

## A3 — Estimates Module

**Arquivos:** `apps/api/src/modules/estimates/`

Esse é o módulo mais complexo. Envolve: estimates, estimate_lines, estimate_supplements, estimate_documents, status workflow.

**DTOs:**
- `CreateEstimateDto`: `customer_id*, vehicle_id*, insurance_claim_number?, deductible?, description?, lines: EstimateLineDto[]`
- `EstimateLineDto`: `description*, quantity*, unit_price*, labor_hours?, labor_rate?, parts_cost?, category`
- `UpdateEstimateDto`: `Partial<CreateEstimateDto> + status?`
- `AddSupplementDto`: `description*, amount*, reason?`
- `QueryEstimateDto`: `page, limit, status?, customer_id?, vehicle_id?, date_from?, date_to?`

**Status workflow** (valida transições):
```
draft → pending_approval → approved → in_progress → completed → invoiced
                        ↘ rejected
                        ↘ cancelled (de qualquer estado)
```

**Service methods:**
- CRUD padrão + `addLine / updateLine / removeLine`
- `addSupplement(tenantId, estimateId, dto)`: só se status ∈ [approved, in_progress]
- `changeStatus(tenantId, estimateId, newStatus, reason?)`: valida transição + grava em `estimate_status_history`
- `calculateTotals(estimateId)`: soma lines + supplements, calcula tax
- `uploadDocument(tenantId, estimateId, file, type)`: upload R2 + insert em `estimate_documents`

**Endpoints:** CRUD + `POST /estimates/:id/lines`, `POST /estimates/:id/supplements`, `PATCH /estimates/:id/status`, `POST /estimates/:id/documents`

**Regras de negócio:**
- `total = sum(lines) + sum(supplements) + tax - discount`
- Recalcular totals a cada insert/update de line ou supplement
- Status history é append-only (nunca update/delete)

**Commit + PR A3** antes de prosseguir.

---

## A4 — Financial Module

**Arquivos:** `apps/api/src/modules/financial/`

**DTOs:**
- `CreateTransactionDto`: `type* (income|expense), category*, amount*, date*, description?, vendor?, payment_method?, reference_id?, reference_type? (estimate|service_order|other)`
- `UpdateTransactionDto`: `Partial<CreateTransactionDto> + reconciled?`
- `QueryTransactionDto`: `page, limit, type?, category?, date_from?, date_to?, reconciled?, min_amount?, max_amount?`

**Service methods:**
- CRUD padrão sobre `financial_transactions`
- `getSummary(tenantId, dateFrom, dateTo)`: retorna `{ income, expense, balance, by_category, trend }`
- `getMonthlyTrend(tenantId, months)`: retorna série temporal últimos N meses
- `reconcile(tenantId, transactionId, bankTransactionId?)`: marca reconciled=true

**Endpoints:**
- CRUD + `GET /financial/summary?from=&to=`, `GET /financial/trend?months=12`, `POST /financial/:id/reconcile`

**Regras:**
- `amount` sempre positivo (tipo determina direção)
- `DECIMAL(14,2)` — nunca FLOAT
- Categorias: PDR Revenue, Paint & Body, Insurance, Parts, Payroll, Rent, Utilities, Other Income, Other Expense, etc. (conferir enum em shared-types)

**Commit + PR A4.**

---

## Testes (obrigatório — ≥80% coverage)

Para cada service, criar `*.service.spec.ts` testando:
- Happy path (create/read/update/delete)
- Tenant isolation (tenant A não vê dados de tenant B)
- Validações de negócio (ex: status transitions inválidas em Estimates)
- Soft delete (registro marcado, não removido)

Rodar: `pnpm --filter api test --coverage`

---

## Checklist antes de cada PR

- [ ] `pnpm --filter api test` passando
- [ ] `pnpm --filter api build` sem erros
- [ ] Coverage ≥80% no service novo
- [ ] Módulo registrado em `app.module.ts`
- [ ] Swagger docs funcionando (`/docs` local)
- [ ] Nenhum secret no diff
- [ ] Nenhum arquivo fora do seu escopo modificado
- [ ] Commit Conventional: `feat(users): CRUD completo com role assignments`

---

## Coordenação com Agente 3 (Frontend)

- Agente 3 aguarda seu merge do A1 para começar B1 (Users UI — se existir) ou começar pelos que já existem
- Ao mergear tipos novos em `packages/shared-types/`, avise via comentário no PR: "Types novos disponíveis: UserDto, VehicleDto, etc."
- Se Agente 3 pedir campo adicional num DTO, discuta via PR review antes de alterar

---

## Quando parar e pedir ajuda ao Luigi

- Migration precisa alterar tabela existente com dados
- DTO do Customer precisaria de campo novo (Customer está fora do seu escopo)
- Conflito de merge com Agente 1 ou Agente 3
- Dúvida sobre regra de negócio de estimates (status workflow, cálculo de tax)
- Necessidade de nova permissão RBAC não listada em `roles_permissions` seed
