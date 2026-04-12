# Prompt de Execucao — Agente Unico Claude Code
# Data: 06 de Abril de 2026
# Projeto: Storm Shield Enterprise (SSE)
# Autor: Dev Master Agent

---

> **Contexto:** Voce e o unico agente trabalhando neste repo hoje. Anteriormente havia 3 agentes independentes que deixaram trabalho parcial em branches separadas. Sua missao e consolidar, corrigir e avancar o MVP da Fase 1.

> **LEIA PRIMEIRO:** `CLAUDE.md` (raiz) + `AGENTS.md` (raiz) + `docs/audits/grupo-b-gaps.md`

---

## ETAPA 1: RESTAURAR GIT (BLOQUEANTE — FAZER PRIMEIRO)

O repositorio esta com `.git/config` corrompido (sem permissao de leitura) e MERGE_HEAD pendente.

```bash
# 1. Recriar .git/config
cat > .git/config << 'EOF'
[core]
	repositoryformatversion = 0
	filemode = false
	bare = false
	logallrefupdates = true
	symlinks = false
	ignorecase = true
[remote "origin"]
	url = https://github.com/luigifilippozzi-cmyk/Storm-Shield-Enterprise.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
	remote = origin
	merge = refs/heads/main
EOF

# 2. Resolver merge pendente
git merge --abort

# 3. Verificar que git funciona
git status
git log --oneline -5
git branch -a

# 4. Limpar worktrees orfaos
git worktree prune
```

**Criterio de sucesso:** `git status` retorna clean, `git log` funciona.

---

## ETAPA 2: CONSOLIDAR BRANCHES (PRIORIDADE MAXIMA)

Existem 4 branches + 1 stash para resolver:

### 2.1 Push main local
```bash
git push origin main  # commit ef4ba77 (docs: Architecture Dashboard) nao foi pushado
```

### 2.2 Merge Agente 1 (staging deploy infra)
```bash
git merge worktree-agent-a0787b41 -m "feat(deploy): merge staging deploy infrastructure"
# Este branch tem 17 arquivos: fly.toml, vercel.json, workflows, runbook
# Build verificado com zero erros TS
```

### 2.3 Merge Agente 3 (audit docs)
```bash
git merge feature/SSE-020-docs-audit-grupo-b -m "docs: merge frontend gap analysis audit"
```

### 2.4 Verificar trabalho do Agente 2 (users service)
Os seguintes arquivos foram modificados pelo Agente 2 mas NAO commitados:
- `apps/api/src/modules/users/dto/create-user.dto.ts` — adicionado `role_id` (IsUUID, required)
- `apps/api/src/modules/users/users.service.ts` — `create()` com transaction + auto-assign role
- `apps/api/src/modules/users/users.service.spec.ts` — novo test file

**Verificar:** Se os arquivos estao no working directory (pode ter sido perdido no merge abort).
- Se existirem e estiverem validos: criar branch `feature/SSE-010-users-role-assignment`, commitar, merge em main
- Se perdidos: reimplementar na Etapa 5 (testes)

### 2.5 Limpar
```bash
git stash drop  # stash 186cc8e (merge stash do Agente 2, ja incorporado)
git branch -d worktree-agent-a0787b41
git branch -d feature/SSE-000-deploy-staging-hardening  # sobreposta pelo worktree
git branch -d feature/SSE-020-docs-audit-grupo-b
git push origin main
```

**Criterio de sucesso:** `git branch` mostra apenas `main`. `git log --oneline -10` mostra historico limpo.

---

## ETAPA 3: CORRIGIR JEST CONFIG (DESBLOQUEIO DE TESTES)

O Agente 2 identificou que Jest usa `babel-jest` (padrao monorepo) ao inves de `ts-jest`.

```bash
# Criar jest.config.ts no apps/api/
cat > apps/api/jest.config.ts << 'EOF'
import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/index.ts', '!main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@sse/shared-types(.*)$': '<rootDir>/../../packages/shared-types/src$1',
    '^@sse/shared-utils(.*)$': '<rootDir>/../../packages/shared-utils/src$1',
  },
};

export default config;
EOF

# Verificar
pnpm --filter api test
```

**Criterio de sucesso:** `pnpm --filter api test` passa (mesmo que com `passWithNoTests` se ainda nao ha specs validas).

Commitar: `fix(api): configure ts-jest for TypeScript test compilation`

---

## ETAPA 4: FECHAR GAPS P0 DO FRONTEND (UX CRITICA)

Referencia: `docs/audits/grupo-b-gaps.md` — gaps B1-2, B2-2, B2-3

### 4.1 CustomerCombobox (resolve B1-2 + B2-2 parcial)
Criar `apps/web/src/components/shared/customer-combobox.tsx`:
- Input com debounced search
- Chama `GET /customers?search={term}` (endpoint ja existe)
- Mostra nome + telefone no dropdown
- Retorna `customer_id` selecionado
- Usar shadcn/ui Popover + Command pattern

### 4.2 VehicleCombobox (resolve B2-2 parcial)
Criar `apps/web/src/components/shared/vehicle-combobox.tsx`:
- Filtrado por `customer_id` selecionado
- Mostra year/make/model/VIN
- Retorna `vehicle_id`

### 4.3 Refatorar Forms
- `apps/web/src/components/vehicles/vehicle-form.tsx` — trocar Input UUID por CustomerCombobox
- `apps/web/src/components/estimates/estimate-form.tsx` — trocar inputs UUID por CustomerCombobox + VehicleCombobox

### 4.4 Estimate Line Items (resolve B2-3)
- Backend: `apps/api/src/modules/estimates/estimates.service.ts` — `findOne()` deve fazer JOIN com `estimate_lines` e retornar array
- Frontend: `apps/web/src/app/(dashboard)/estimates/[id]/page.tsx` — renderizar tabela de line items com description, quantity, unit_price, total

**Padrao de referencia:** CustomerCombobox seguir pattern de `apps/web/src/components/customers/customer-form.tsx`

Commitar: `feat(web): add searchable comboboxes and estimate line items display`

---

## ETAPA 5: TESTES UNITARIOS BACKEND (META 80%)

Escrever specs para os 4 services core seguindo padrao de `customers.service.spec.ts` (se existir) ou criar padrao:

### Padrao de teste:
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let tenantDb: jest.Mocked<TenantDatabaseService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServiceName,
        { provide: TenantDatabaseService, useValue: { query: jest.fn() } },
      ],
    }).compile();
    // ...
  });

  describe('findAll', () => { /* ... */ });
  describe('findOne', () => { /* ... */ });
  describe('create', () => { /* ... */ });
  describe('update', () => { /* ... */ });
  describe('remove (soft delete)', () => { /* ... */ });
});
```

### Services para testar:
1. `customers.service.spec.ts` (se nao existir)
2. `estimates.service.spec.ts`
3. `vehicles.service.spec.ts`
4. `financial.service.spec.ts`
5. `users.service.spec.ts` (incluir role assignment)

Commitar: `test(api): add unit tests for core services (customers, estimates, vehicles, financial, users)`

---

## ETAPA 6: FECHAR GAPS P1 DO FRONTEND

### 6.1 Financial Trend Chart (B3-3)
```bash
pnpm --filter web add recharts
```
Criar `apps/web/src/components/financial/trend-chart.tsx`:
- Bar chart: income vs expense ultimos 6 meses
- Se backend nao tiver endpoint `monthly_trend`, criar mock data primeiro e TODO para endpoint

### 6.2 Dashboard Fixes (B4-2, B4-3, B4-5)
Editar `apps/web/src/app/(dashboard)/dashboard/page.tsx`:
- B4-2: Corrigir filtro de `status: 'draft'` para `status: 'sent'`
- B4-3: Adicionar scope mensal no calculo de receita (filtrar por `created_at >= firstDayOfMonth`)
- B4-5: Criar `components/dashboard/recent-activity.tsx` com 5 customers + 5 transactions recentes

Commitar: `feat(web): add financial trend chart, fix dashboard KPIs, add recent activity`

---

## ETAPA 7: VALIDACAO FINAL

```bash
# Build completo
pnpm build

# Testes
pnpm --filter api test

# Verificar historico
git log --oneline -15

# Atualizar README com status
# Fase 1 MVP: ~80% complete (atualizar de ~65%)

# Push final
git push origin main
```

**Criterio de sucesso final:**
- Zero erros de build
- Testes passando
- Branches limpas (apenas main)
- README atualizado
- Origin sincronizado

---

## REGRAS INEGOCIAVEIS (RELEMBRETE)

1. **Nunca** commitar em main direto — use feature branch + merge
2. **Sempre** `tenant_id` em queries + TenantDatabaseService
3. UUID v7, DECIMAL(14,2) para money
4. Conventional Commits
5. Nunca commitar .env ou credentials
6. Minimo 80% coverage nos services novos
7. Se mudar arquitetura → atualizar CLAUDE.md + criar ADR

---

## REFERENCIA RAPIDA

| Recurso | Caminho |
|---|---|
| Padrao backend | `apps/api/src/modules/customers/` |
| Padrao frontend | `apps/web/src/app/(dashboard)/customers/` |
| Gaps pendentes | `docs/audits/grupo-b-gaps.md` |
| Arquitetura | `CLAUDE.md` |
| ADR staging | `docs/decisions/006-staging-deploy-stack.md` |
| Migrations | `apps/api/src/database/migrations/` |
