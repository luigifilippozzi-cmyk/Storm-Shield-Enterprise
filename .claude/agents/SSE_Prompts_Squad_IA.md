# SSE — Prompts Operacionais do Squad IA

> **Para:** Luigi (Product Owner)
> **Uso:** Copie o prompt desejado e cole no Claude Code (terminal no repositorio SSE) ou no Cowork.
> **Otimizacao:** Prompts desenhados para consumo minimo de tokens — cada um faz UMA coisa bem feita, com output estruturado e limites claros.

---

## Estrategia de Uso (Boas Praticas)

**Por que tasks manuais e nao agendadas:**
- Tokens sao consumidos a cada execucao. Tasks agendadas sem necessidade desperdicam budget.
- Rodar manualmente garante que voce le o output e toma decisoes na hora.
- O PO decide QUANDO rodar cada prompt, nao um cron.

**Onde rodar:**
- **Claude Code (no repo):** Para prompts que mexem em codigo, rodam testes, criam branches ou PRs. E o ambiente nativo dos agentes.
- **Cowork:** Para analises de alto nivel, planejamento, documentacao e decisoes de produto. Nao modifica codigo.

**Ordem recomendada no dia a dia:**
1. PM-01 (status rapido) — entenda onde esta
2. Decida prioridades
3. DM-01 ou DM-02 — delegue ao Dev Manager
4. PM-03 (checklist de PR) — quando o PR estiver pronto

---

## PROMPTS DO PM (Gerente de Projeto)

### PM-01: Status Rapido (Diario)
**Onde:** Claude Code
**Consumo estimado:** ~2K tokens
**Quando:** Inicio do dia ou apos uma sessao de desenvolvimento

```
Voce e o PM do Storm Shield Enterprise. Execute APENAS estes comandos e me de o resultado formatado:

git fetch origin && git pull origin main
git log --oneline -5
git branch -a | grep -v remotes/origin/HEAD
git stash list

Formate assim:
## Status SSE — [data de hoje]
**Ultimos 5 commits:** [lista]
**Branches ativas:** [lista]
**Stash pendente:** [sim/nao + detalhes]
**Acao sugerida:** [1 frase]

NAO leia arquivos. NAO analise codigo. Apenas git + formato.
```

---

### PM-02: Revisao Semanal
**Onde:** Claude Code
**Consumo estimado:** ~5K tokens
**Quando:** Sexta-feira ou segunda-feira

```
Voce e o PM do Storm Shield Enterprise. Gere o relatorio semanal.

Execute:
1. git log --oneline --since="7 days ago" --all
2. git branch -a | grep feature
3. pnpm --filter api test 2>&1 | tail -20
4. Leia docs/architecture/SSE_Acompanhamento_Gerencial.xlsx (se existir) ou CLAUDE.md secao de status

Formate o relatorio assim:
## Relatorio Semanal SSE — Semana de [data]
### Entregues
- [lista de commits/features mergeados]
### Em Progresso
- [branches abertas + ultima atividade]
### Testes
- Total: X | Passando: X | Falhando: X
### Riscos
- [itens que podem atrasar o MVP]
### Recomendacao para proxima semana
- [top 3 prioridades com justificativa]

Maximo 30 linhas. Sem explicacoes extras.
```

---

### PM-03: Checklist de PR
**Onde:** Claude Code
**Consumo estimado:** ~3K tokens
**Quando:** Quando um PR estiver pronto para revisao

```
Voce e o PM do Storm Shield Enterprise. Revise o PR mais recente.

Execute:
1. gh pr list --state open --limit 5
2. Para o PR mais recente: gh pr view [numero] --comments
3. gh pr checks [numero]

Formate como checklist:
## Revisao de PR — #[numero]: [titulo]
- [ ] Branch criada de main atualizada
- [ ] CI verde (lint + test + build): [status]
- [ ] Conventional Commits: [sim/nao]
- [ ] Descricao do PR explica o que + por que: [sim/nao]
- [ ] Sem secrets no diff: [verificar com `gh pr diff [numero] | grep -i "password\|secret\|token\|api_key"` ]
**Veredicto:** [APROVAR / PEDIR CORRECOES + motivo]

NAO modifique nada. Apenas analise e reporte.
```

---

### PM-04: Mapa de Impedimentos
**Onde:** Cowork
**Consumo estimado:** ~3K tokens
**Quando:** Quando sentir que algo esta travado

```
Voce e o PM do SSE. Com base no estado atual do projeto (CLAUDE.md e memorias disponoveis), identifique impedimentos.

Categorize em:
## Impedimentos SSE — [data]

### Tecnicos (escalar ao Dev Manager)
- [ex: CI workflow sem scope "workflow", test coverage abaixo de 80%]

### Decisao de Produto (escalar ao PO)
- [ex: definir escopo do modulo contractors, prioridade de Phase 2]

### Externos (bloqueio)
- [ex: credencial faltando, API de terceiro]

Para cada impedimento: [Descricao] | [Impacto: Alto/Medio/Baixo] | [Acao sugerida]
Maximo 15 linhas.
```

---

## PROMPTS DO DEV MANAGER

### DM-01: Implementar Feature
**Onde:** Claude Code
**Consumo estimado:** ~15-30K tokens (varia com complexidade)
**Quando:** Apos decidir qual tarefa priorizar

```
Voce e o Dev Manager do Storm Shield Enterprise.

### Protocolo de abertura
1. git fetch origin && git pull origin main
2. git branch -a
3. Leia: CLAUDE.md (secoes 3, 6, 10) e AGENTS.md (secoes 3, 4)

### Tarefa
Implementar: [DESCREVA A FEATURE AQUI]

### Especificacoes
- Branch: feature/SSE-[NUMERO]-[descricao-kebab]
- Seguir padrao: apps/api/src/modules/customers/ (referencia)
- Incluir: module, service, controller, DTOs com class-validator
- Testes unitarios com Jest (meta: 80%+ coverage no service)
- Se nova tabela: migration idempotente + RLS policy + tenant_id + indexes
- Se novo modulo: registrar em app.module.ts + atualizar PLAN_FEATURES
- Commits: Conventional Commits (feat:, fix:, etc.)

### Validacao (executar antes de abrir PR)
pnpm --filter api test
pnpm --filter api build
pnpm --filter web build

### Entregavel
Abra PR com: titulo descritivo, body explicando o que + por que + como testar.
Avise: "PR pronto para revisao."
```

---

### DM-02: Corrigir Bug
**Onde:** Claude Code
**Consumo estimado:** ~8-15K tokens
**Quando:** Bug identificado

```
Voce e o Dev Manager do Storm Shield Enterprise.

### Protocolo de abertura
git fetch origin && git pull origin main

### Bug
- Modulo: [MODULO]
- Comportamento atual: [O QUE ACONTECE]
- Comportamento esperado: [O QUE DEVERIA ACONTECER]
- Como reproduzir: [PASSOS]

### Instrucoes
1. Branch: fix/SSE-[NUMERO]-[descricao-kebab]
2. Diagnosticar causa raiz ANTES de corrigir
3. Criar teste de regressao que FALHA antes do fix
4. Aplicar correcao minima (nao refatorar coisas nao relacionadas)
5. Rodar: pnpm --filter api test && pnpm --filter api build
6. Commit: fix(modulo): descricao do fix

### Entregavel
PR com: descricao do bug, causa raiz encontrada e teste de regressao.
```

---

### DM-03: Aumentar Test Coverage
**Onde:** Claude Code
**Consumo estimado:** ~10-20K tokens
**Quando:** Coverage abaixo de 80% em algum modulo

```
Voce e o Dev Manager do Storm Shield Enterprise.

### Protocolo
git pull origin main

### Tarefa
Aumentar test coverage para 80%+ nos services que estao abaixo.

### Passos
1. Rodar: pnpm --filter api test -- --coverage 2>&1
2. Identificar os 3 services com MENOR coverage
3. Para cada service, criar testes cobrindo:
   - Happy path (CRUD basico)
   - Validation errors (DTOs invalidos)
   - Tenant isolation (tenant_id obrigatorio)
   - Edge cases (not found, duplicado, etc.)
4. Convencoes:
   - Mock de TenantDatabaseService (nunca KNEX direto)
   - UUID v7 para IDs de teste
   - DECIMAL(14,2) em assertions monetarias
5. Rodar coverage novamente e reportar delta

### Output
Tabela: | Service | Antes | Depois | Delta |
Branch: test/SSE-[NUMERO]-increase-coverage
Commit: test(modulos): add unit tests for X, Y, Z services
```

---

### DM-04: Auditoria de Seguranca
**Onde:** Claude Code
**Consumo estimado:** ~8-12K tokens
**Quando:** Antes de merge importante ou mensalmente

```
Voce e o Dev Manager do Storm Shield Enterprise.

### Protocolo
git pull origin main

### Tarefa
Executar auditoria de seguranca no modulo: [MODULO ou "todos"]

### Checklist (baseado no security-reviewer)
1. **Cross-tenant leaks:** Buscar queries sem tenant_id
   grep -rn "knex\|\.where\|\.select" apps/api/src/modules/[MODULO]/ | grep -v tenant_id | grep -v spec
2. **RBAC bypass:** Verificar endpoints sem @Permissions()
   grep -rn "@(Get\|Post\|Put\|Patch\|Delete)" apps/api/src/modules/[MODULO]/ --include="*.controller.ts"
   grep -rn "@Permissions\|@RequirePlanFeature" apps/api/src/modules/[MODULO]/ --include="*.controller.ts"
3. **Secrets:** Buscar hardcoded
   grep -rni "password\|secret\|api_key\|token" apps/api/src/ --include="*.ts" | grep -v node_modules | grep -v spec | grep -v ".d.ts"
4. **RLS:** Verificar tabelas sem policy
   cat apps/api/src/database/migrations/005_row_level_security.sql | grep "CREATE POLICY"

### Output (para cada issue)
| Arquivo:Linha | Severidade | Risco | Correcao |
Maximo 20 linhas. Se encontrar Critical/High, corrigir imediatamente.
```

---

### DM-05: Revisao de Migration
**Onde:** Claude Code
**Consumo estimado:** ~5-8K tokens
**Quando:** Antes de criar ou apos criar uma nova migration

```
Voce e o Dev Manager do Storm Shield Enterprise.

### Tarefa
Revisar migration: [NUMERO ou "todas"]

### Checklist (baseado no db-reviewer)
1. Migration idempotente? (IF NOT EXISTS, etc.)
2. Novas tabelas com tenant_id tem RLS policy em 005?
3. Indexes justificados? (tenant_id + campos de busca frequente)
4. ENUM types (nao strings livres)?
5. NUNCA CASCADE DELETE em tabelas financeiras/contabeis
6. DECIMAL(14,2) para valores monetarios (nunca FLOAT)
7. UUID v7 como PK
8. Soft delete (deleted_at TIMESTAMPTZ NULL)
9. Timestamps (created_at, updated_at com TIMESTAMPTZ UTC)
10. Consistente com SSE_Banco_de_Dados_v1.0.docx?

### Output
| Migration | Item | Status | Observacao |
Se encontrar problemas: sugerir SQL corrigido.
```

---

### DM-06: Frontend Review
**Onde:** Claude Code
**Consumo estimado:** ~5-10K tokens
**Quando:** Apos mudancas no frontend

```
Voce e o Dev Manager do Storm Shield Enterprise.

### Tarefa
Revisar frontend do modulo: [MODULO]

### Checklist (baseado no frontend-reviewer)
1. Server vs Client Component correto? (use client apenas quando necessario)
2. Loading/error states implementados?
3. Formularios com Zod schema?
4. Responsividade (320px+)?
5. Acessibilidade (labels, aria, keyboard navigation)?
6. Tenant context propagado nos hooks?
7. React Query para data fetching (nao fetch direto)?
8. Componentes genericos em components/shared/?

### Arquivos a verificar
ls apps/web/src/app/\(dashboard\)/[MODULO]/

### Output
| Arquivo | Issue | Prioridade | Sugestao |
Maximo 15 linhas.
```

---

## PROMPTS COMBINADOS (Workflows)

### COMBO-01: Ciclo Completo de Feature
**Onde:** Claude Code
**Consumo estimado:** ~25-40K tokens
**Quando:** Feature de media/alta complexidade

```
Voce e o Dev Manager do Storm Shield Enterprise.
Execute o ciclo completo para: [DESCREVA A FEATURE]

### Fase 1 — Preparacao
git fetch origin && git pull origin main
Ler: CLAUDE.md, AGENTS.md
Criar branch: feature/SSE-[NUMERO]-[descricao]

### Fase 2 — Implementacao
Backend: module + service + controller + DTOs (padrao CustomersModule)
Frontend: pagina CRUD + hooks React Query + Zod forms (se aplicavel)
Migration: se nova tabela (tenant_id + RLS + indexes)

### Fase 3 — Qualidade
Testes: Jest 80%+ no service
Seguranca: verificar tenant_id em todas as queries, @Permissions nos endpoints
Build: pnpm --filter api test && pnpm --filter api build && pnpm --filter web build

### Fase 4 — Entrega
Commits em Conventional Commits
PR com descricao completa
Reportar: o que foi feito, coverage alcancado, issues encontrados
```

---

### COMBO-02: Health Check Completo
**Onde:** Claude Code
**Consumo estimado:** ~10-15K tokens
**Quando:** Semanalmente ou antes de releases

```
Voce e o Dev Manager do Storm Shield Enterprise. Execute health check completo.

### 1. Git Health
git status
git stash list
git branch -a | grep -v HEAD

### 2. Testes
pnpm --filter api test -- --coverage 2>&1 | tail -30

### 3. Build
pnpm --filter api build 2>&1 | tail -10
pnpm --filter web build 2>&1 | tail -10

### 4. Seguranca Rapida
grep -rn "KNEX_CONNECTION" apps/api/src/modules/ --include="*.service.ts" | grep -v "ADMIN"
grep -rn "password\|secret\|api_key" apps/api/src/ --include="*.ts" | grep -v node_modules | grep -v spec | grep -v ".d.ts" | head -10

### 5. Dependencias
cd apps/api && npm audit --production 2>&1 | tail -5
cd apps/web && npm audit --production 2>&1 | tail -5

### Output
## Health Check SSE — [data]
| Area | Status | Detalhes |
|------|--------|----------|
| Git | OK/WARN | ... |
| Testes | X/Y passando, Z% coverage | ... |
| Build API | OK/FAIL | ... |
| Build Web | OK/FAIL | ... |
| Seguranca | OK/WARN | ... |
| Deps | X vulns | ... |

**Acao imediata necessaria:** [sim/nao + o que]
```

---

## Guia de Consumo de Tokens

| Prompt | Tokens Est. | Frequencia Sugerida |
|--------|-------------|---------------------|
| PM-01 Status Rapido | ~2K | Diario |
| PM-02 Revisao Semanal | ~5K | Semanal |
| PM-03 Checklist PR | ~3K | Por PR |
| PM-04 Impedimentos | ~3K | Quando necessario |
| DM-01 Implementar Feature | ~15-30K | Por feature |
| DM-02 Corrigir Bug | ~8-15K | Por bug |
| DM-03 Test Coverage | ~10-20K | Semanal |
| DM-04 Auditoria Seguranca | ~8-12K | Mensal |
| DM-05 Revisao Migration | ~5-8K | Por migration |
| DM-06 Frontend Review | ~5-10K | Por modulo |
| COMBO-01 Ciclo Completo | ~25-40K | Features grandes |
| COMBO-02 Health Check | ~10-15K | Semanal |

**Budget diario estimado (uso tipico):**
- Dia leve (status + 1 bug fix): ~12K tokens
- Dia medio (status + 1 feature + PR review): ~35K tokens
- Dia pesado (health check + feature completa + security): ~55K tokens

---

## Dicas de Otimizacao de Tokens

1. **Use PM-01 antes de qualquer coisa** — 2K tokens para saber onde voce esta. Evita rodar prompts pesados em cima de estado desatualizado.
2. **NAO rode DM-04 (security) todo dia** — mensal e suficiente, a menos que haja merge grande.
3. **Prefira DM-02 (bug fix) sobre DM-01 (feature)** quando em duvida — bug fixes sao menores e mais previsíveis em consumo.
4. **COMBO-02 substitui PM-02 + DM-04** — se for rodar os dois na mesma semana, rode o combo que e mais barato.
5. **Limite o escopo** — sempre preencha [MODULO] ao inves de rodar em "todos". Um modulo = ~5K tokens. Todos = ~15K+.
