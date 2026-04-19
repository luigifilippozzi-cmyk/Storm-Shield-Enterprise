# Handoff Protocol — PO ↔ PM ↔ DM ↔ Subagentes

> Protocolo canônico de coordenação entre agentes do squad SSE.
> **Status:** v1.0 — Aceito em 2026-04-17
> **Origem:** Work-Stream B da sessão PO Cowork de 2026-04-17
> **Autoridade:** este documento + ADR-007 (Agent Squad Architecture) + ADR-009 (Bússola de Produto)

---

## 1. Propósito e Escopo

Este protocolo formaliza **quem escreve o quê, quando, onde, e para quem** no squad SSE. Cobre:

- Ownership de arquivos de coordenação em `.auto-memory/`
- Templates canônicos de artefatos (tarefas, status, sessões)
- Ciclo de vida de uma tarefa passada a outro agente
- Cadência esperada de cada ator
- Regras de resolução de conflito

Fora do escopo: protocolos de revisão de PR (já em CLAUDE.md §10 e AGENTS.md), subagentes internos do DM (já em `.claude/agents/`), e decisões arquiteturais (vão em ADRs).

---

## 2. Atores

| Ator | Natureza | Responsabilidade primária |
|---|---|---|
| **PO** (Luigi + PO Assistant em modo Cowork) | Humano + agente | Decisões estratégicas, priorização, escopo, revisão de RFs, aprovação de PRs. **Não executa código.** |
| **PM Agent** | Scheduled task | Status diário, métricas do repo, inconsistências, impedimentos. **Não decide escopo.** |
| **Dev Manager Agent** | Scheduled task ou on-demand | Execução técnica, orquestração de subagentes, branches/PRs, escalação de bloqueios. **Não decide estratégia.** |
| **Subagentes** (security, test, db, frontend) | Invocados pelo DM | Revisão especializada por domínio. **Só atuam sob ordem do DM.** |

Princípio inviolável: **PO decide estratégia, DM decide técnica, PM observa e reporta.** Conflitos se resolvem pela regra §8.

---

## 3. Ownership Matrix — arquivos em `.auto-memory/`

| Arquivo | Quem escreve | Quem lê | Frequência | Propósito |
|---|---|---|---|---|
| `MEMORY.md` | Qualquer ator que crie novo arquivo | Todos | Em cada criação | Índice de uma linha por arquivo |
| `project_sse_status.md` | **PM Agent** exclusivamente | PO, DM | Diário (scheduled) | Estado do projeto, métricas, health, inconsistências |
| `po_sessions.md` | **PO Assistant** exclusivamente | PM, DM | Por sessão PO | Log datado de decisões estratégicas |
| `dm_queue.md` | **PO + PM** (append) | DM consome | Ad-hoc | Fila única de tarefas para o DM executar |
| `dm_queue_archive.md` | **DM** (quando move COMPLETED) | PO, PM (auditoria) | Rotação mensal | Histórico de tarefas concluídas |
| `decisions_pending.md` | **DM** escreve, PO aprova | Todos | Quando DM precisa de decisão | Decisões técnicas que requerem PO |

**Arquivos deprecated (não usar — serão removidos em rotação):**
- `dm_task_queue.md` — migrado para `dm_queue.md` com origin=PM
- `dm_tasks_pending.md` — migrado para `dm_queue.md` com origin=PO

**Regra de ouro:** nenhum ator escreve em arquivo que não é seu por ownership. Se precisar afetar arquivo alheio, usa canal formal (ex: PO escreve task em `dm_queue.md` pedindo alteração ao DM, não edita direto).

---

## 4. Template canônico — Tarefa no `dm_queue.md`

Toda tarefa no `dm_queue.md` DEVE seguir exatamente este template:

```markdown
## T-YYYYMMDD-N — Título curto e acionável

**Origin:** PO | PM | security-reviewer | test-runner | db-reviewer | frontend-reviewer
**Priority:** P0 | P1 | P2
**Status:** PENDING | IN_PROGRESS | BLOCKED | COMPLETED
**Created:** YYYY-MM-DD
**Claimed:** YYYY-MM-DD (preenchido quando status vira IN_PROGRESS)
**Branch:** feature|fix|docs|chore/SSE-NNN-slug (preenchido quando status vira IN_PROGRESS)
**PR:** #NNN (preenchido quando PR é aberto)

### Objetivo
1–2 linhas descrevendo o outcome esperado.

### Contexto
2–4 linhas com o que o DM precisa saber para decidir como executar. Referência a ADRs, Bússola, issues relevantes.

### Ação sugerida
Passos concretos. Se tiver bloco de código/texto exato (ex: patch), incluir aqui.

### Escopo negativo — NÃO fazer nesta entrega
- Item 1
- Item 2

(Lição aprendida: delimitar negativamente previne drift de escopo.)

### Done quando
Critério objetivo e verificável. Não "quando ficar bom" — "quando testes passam e CHANGELOG atualizado", por exemplo.

### Subagentes obrigatórios
Lista conforme escopo: test-runner; +security-reviewer se toca RLS/auth; +db-reviewer se toca migrations; +frontend-reviewer se toca UI.

### Persona servida (se aplicável)
Ref. Bússola §2: Owner | Estimator | Technician | Accountant | N/A (infra/meta)

### Gap fechado (se aplicável)
Ref. Bússola §4: Gap N (descrição curta) | N/A
```

**Task ID:** formato `T-YYYYMMDD-N` onde N é sequência dentro do dia. Primeira tarefa de 2026-04-17 → `T-20260417-1`. Evita colisão entre agentes sem coordenação central.

---

## 5. Template canônico — Status do PM em `project_sse_status.md`

PM Agent escreve em cada execução um bloco no topo (append-top):

```markdown
# SSE Project Status — YYYY-MM-DD (PM Agent, Nª revisão)

## Health: VERDE | AMARELO | VERMELHO
- **Reason:** 1–2 linhas

## Repo Metrics (live from code)
- Backend modules: N
- Controllers: N
- Endpoints: N
- Frontend pages: N
- Test suites: N
- Tests: N passing (all green|N failing)
- Migrations: N SQL files
- Subagentes: N

## Git History (recent)
- PR #NN (merged [date]): conventional commit message
- Total PRs merged: N | Open: N

## Branches
- lista de feature/fix branches ativas

## Infrastructure
- CI main: GREEN|RED
- Deploy Web Staging: GREEN|RED
- Deploy API Staging: GREEN|RED
- PRs open: N

## Priorities for Next Session (Dev Manager)
### P0 — Bloqueante
### P1 — Alta
### P2 — Média

## Inconsistências detectadas (opcional)
Apontar drift entre estado declarado e estado real (ex: CLAUDE.md diz X, código faz Y).
```

Revisões sucessivas no mesmo dia: incrementar "Nª revisão" e registrar no topo como bloco novo. **Não sobrescrever** revisão anterior.

---

## 6. Template canônico — Sessão PO em `po_sessions.md`

PO Assistant escreve ao final de cada sessão Cowork:

```markdown
## Sessão YYYY-MM-DD — PO Cowork

**Contexto:** 1–2 linhas com o ponto de partida.

### Decisões de produto
1. Decisão 1 (com referência a ADR/RF se aplicável)
2. Decisão 2
...

### Artefatos produzidos
| Artefato | Localização |
|---|---|
| ... | ... |

### Gaps / bugs / ENHs identificados
Lista com IDs se registrados.

### Handoffs
- **Dev Manager:** N tarefas em `dm_queue.md` (origin=PO). IDs: T-AAAAMMDD-X.
- **PM Agent:** checks solicitados (se houver).

### Bloqueios / alertas
Lista ou "nenhum".

### Próxima sessão
Foco sugerido.
```

Entradas são append-top (sessão mais nova primeiro). Sessões nunca são reescritas.

---

## 7. Ciclo de vida de uma tarefa no `dm_queue.md`

```
┌─────────┐
│ PENDING │  ← PO ou PM cria com append-top
└────┬────┘
     │ DM decide executar
     ▼
┌─────────────┐
│ IN_PROGRESS │  ← DM preenche Claimed + Branch
└──────┬──────┘
       │
       ├──────► BLOCKED (flag temporário + comment explicando)
       │         └──► volta a IN_PROGRESS quando desbloqueado
       │
       ▼
┌───────────┐
│ COMPLETED │  ← DM muda status, opcionalmente adiciona comment "done when" verificado
└─────┬─────┘
      │ fim do mês ou ao acumular >20 COMPLETED
      ▼
 [move bloco inteiro para dm_queue_archive.md]
```

**Regras do ciclo:**

- **Append-top** para PENDING novos. Nunca no meio do arquivo.
- **Não deletar** tarefas PENDING sem justificativa escrita. Se for abandonar, mudar status para COMPLETED com comment "Abandonada. Razão: X."
- **Rotação mensal** (primeiro dia útil do mês): DM move todos os COMPLETED para `dm_queue_archive.md`. Arquivo ativo mantém apenas PENDING/IN_PROGRESS/BLOCKED.
- **Um branch por tarefa.** Se uma tarefa implica múltiplas mudanças em múltiplos módulos, considerar quebrar em subtarefas ANTES de executar.

---

## 8. Cadência

| Ator | Quando age | Gatilho |
|---|---|---|
| **PO** | Por sessão Cowork com Luigi | Iniciativa humana |
| **PM Agent** | Diário (scheduled) | Cron |
| **Dev Manager** | Por ciclo de trabalho (scheduled ou on-demand) | Cron ou invocação de Luigi |
| **Subagentes** | Por PR review ou tarefa específica | Invocados pelo DM |

**Ordem esperada de um ciclo ideal:**

```
1. PO (Cowork) decide escopo, cria tarefas em dm_queue.md
2. DM (próxima execução) consome dm_queue.md,
   executa na ordem de prioridade, abre PRs
3. PO (próxima Cowork) revisa e aprova PRs
4. PM (daily) atualiza project_sse_status.md refletindo mudanças
```

**Desvios toleráveis:** PM pode criar tarefas emergenciais em `dm_queue.md` (ex: "CI quebrou por regressão"). DM pode pedir decisão ao PO via `decisions_pending.md` (ex: "duas abordagens possíveis, qual?").

---

## 9. Regras de resolução de conflito

1. **PO override sobre PM.** Se PO e PM criam tarefas incompatíveis no `dm_queue.md`, DM executa a do PO primeiro e deixa a do PM em BLOCKED até PO se manifestar.

2. **DM pode objetar, não vetar.** Se DM considera tarefa malformada, cria entrada em `decisions_pending.md` explicando o problema. Não começa até PO/PM responderem.

3. **Subagente bloqueante.** Se subagente de revisão (security/test/db/frontend) identifica bloqueio crítico (ex: Regra Inviolável violada), DM pausa tarefa, marca BLOCKED, e cria entrada em `decisions_pending.md` para PO.

4. **Urgências (P0) quebram fila.** Tarefa P0 nova (ex: segurança cross-tenant) pode interromper tarefa P1/P2 em execução. DM faz stash do branch atual, executa P0, retoma depois.

5. **Deadlock PO ↔ DM.** Em caso de impasse (raro), Luigi como humano decide em sessão PO. Registra em `po_sessions.md`. Não há mecanismo automático — ergo é design.

---

## 10. Regras de escrita e encoding

Lição aprendida no projeto MF, registrada aqui para evitar recorrência:

- **Sempre ler de volta** após escrever. Read do arquivo depois do Write, ou `Get-Content -Tail N` em scripts PowerShell.
- **Nunca usar `Add-Content` ou `echo >>`** sem especificar encoding em arquivos com caracteres multi-byte (acentos, emojis). Usar explicitamente UTF-8 sem BOM.
- **Distinguir erro de disco de erro de display** antes de agir. Mojibake na leitura não implica corrupção de bytes — tentar reler com encoding correto antes de qualquer ação destrutiva.
- **Retry ≠ fix** para operações não-idempotentes. Se append/insert falhou no meio, limpar o estado parcial antes de repetir.

---

## 11. Referências cruzadas

- `docs/strategy/BUSSOLA_PRODUTO_SSE.md` — Bússola (estratégia de produto)
- `docs/decisions/007-agent-squad-architecture.md` — ADR-007 (estrutura do squad)
- `docs/decisions/009-adocao-bussola-de-produto.md` — ADR-009 (autoridade da Bússola)
- `CLAUDE.md` §10 — Regras para o Claude Code (convenções técnicas)
- `AGENTS.md` §5 — Coordenação entre agentes (alto nível)

---

## 12. Revisão e evolução

- Este protocolo é versionado. Mudanças estruturais requerem ADR próprio (ADR-010+).
- Revisão obrigatória trimestral ou ao atingir 3 ciclos de rotação de `dm_queue_archive.md`.
- Ajustes de template (campos novos, formatos) podem ser feitos sem ADR desde que retrocompatíveis — append, não breaking.

---

## 13. Templates de Abertura de Sessão

Templates para Luigi (PO humano) colar como primeira mensagem ao abrir sessão Claude Code. Cada template posiciona o agente no papel certo e especifica protocolo de abertura + tarefa.

**Convenções gerais para qualquer sessão:**

- **Um papel por sessão** — não misture PM e Dev Manager na mesma conversa
- **PM primeiro, DM depois** — dia começa com status do PM, delegação ao DM segue
- **Sua mensagem supraordena** — qualquer instrução de Luigi tem prioridade máxima
- **Escalonamento** — impedimentos técnicos PM → DM; decisões de produto vêm direto ao PO
- **Consulta obrigatória antes de agir** — todo agente lê Bússola (`docs/strategy/BUSSOLA_PRODUTO_SSE.md`) + este protocolo + CLAUDE.md antes de executar

### 13.1 — PM Agent: Status Diário

```
Você é o PM Agent do Storm Shield Enterprise.

### Protocolo de abertura
1. Execute: git fetch origin && git pull origin main
2. Execute: git branch -a (listar branches ativas)
3. Execute: git log --oneline -10 (últimos commits)
4. Leia: CLAUDE.md, AGENTS.md, docs/process/HANDOFF_PROTOCOL.md §5
5. Leia: .auto-memory/project_sse_status.md (sua última revisão)

### Sua tarefa agora
Atualizar .auto-memory/project_sse_status.md com status diário no template canônico (§5 do HANDOFF_PROTOCOL) incluindo:

1. **Ontem:** commits/PRs mergeados
2. **Hoje:** branches abertas, PRs pendentes
3. **Impedimentos:** bloqueios técnicos ou de decisão
4. **Pendências P2 Fase 1:** status dos gaps remanescentes
5. **Inconsistências** (se detectar): drift entre estado declarado e código real
6. **Prioridades para DM:** top 3 itens em formato de nova tarefa para .auto-memory/dm_queue.md (origin=PM)

Escrever usando o template canônico do HANDOFF_PROTOCOL §4 para tarefas novas.
Formato da saída: resumo executivo em bullets, máximo 20 linhas.
```

### 13.2 — PM Agent: Revisão Semanal

```
Você é o PM Agent do Storm Shield Enterprise.

### Protocolo de abertura
1. Execute: git fetch origin && git pull origin main
2. Execute: git log --oneline --since="7 days ago"
3. Leia: CLAUDE.md, AGENTS.md, HANDOFF_PROTOCOL.md §5
4. Leia: docs/architecture/SSE_Acompanhamento_Gerencial.xlsx (se existe)

### Sua tarefa agora
Gerar relatório semanal em .auto-memory/project_sse_status.md como nova revisão do dia incluindo:

1. **Entregues na semana:** features/fixes mergeados
2. **Cobertura de testes:** pnpm --filter api test -- --coverage
3. **PRs abertos:** status e ação necessária
4. **Fase 1 MVP:** % de conclusão atualizado
5. **Riscos:** itens que podem atrasar
6. **Próxima semana:** planejamento sugerido
7. **Check Bússola:** houve decisão esta semana que contradiz a Bússola §2 (personas) ou §6 (princípios)? Se sim, registrar como alerta.

Formato: relatório estruturado, pronto para tomada de decisão do PO.
```

### 13.3 — Dev Manager: Implementar Feature

```
Você é o Dev Manager do Storm Shield Enterprise.

### Protocolo de abertura
1. Execute: git fetch origin && git pull origin main
2. Execute: git branch -a
3. Leia: CLAUDE.md (14 regras invioláveis + §10), AGENTS.md, HANDOFF_PROTOCOL.md
4. Leia: docs/strategy/BUSSOLA_PRODUTO_SSE.md §2, §4, §6 (personas, gaps, princípios)
5. Leia: .auto-memory/dm_queue.md (tarefas PENDING na prioridade)

### Sua tarefa agora
Implementar: **[DESCREVA A FEATURE OU REFERENCIE TASK ID DO dm_queue.md]**

Se houver task ID correspondente, atualizar seu status para IN_PROGRESS conforme HANDOFF_PROTOCOL §7 (preencher Claimed + Branch).

Especificações:
- Branch: feature/SSE-[NUMERO]-[descricao-kebab]
- Seguir padrão de referência: apps/api/src/modules/customers/
- Incluir: model, service, controller, DTOs com validação
- Testes unitários 80%+ coverage
- Migration com tenant_id + RLS policy (se nova tabela)
- Registrar em PLAN_FEATURES se novo módulo
- Persona servida + gap fechado (Bússola §2/§4) na descrição do PR

### Subagentes obrigatórios (acionar após implementar)
- test-runner → testes e cobertura
- security-reviewer → tenant isolation e RBAC
- db-reviewer → migrations e queries (se aplicável)
- frontend-reviewer → componentes (se UI)

### Entregável
PR com: o quê + por quê + como testar + persona/gap (template PR).
Ao mergear: atualizar status da task para COMPLETED no dm_queue.md.
Avise Luigi quando pronto para revisão.
```

### 13.4 — Dev Manager: Corrigir Bug

```
Você é o Dev Manager do Storm Shield Enterprise.

### Protocolo de abertura
1. Execute: git fetch origin && git pull origin main
2. Leia: CLAUDE.md, AGENTS.md, HANDOFF_PROTOCOL.md

### Sua tarefa agora
Corrigir bug: **[DESCREVA O BUG]**

Detalhes:
- Módulo afetado: [módulo]
- Comportamento atual: [o que acontece]
- Comportamento esperado: [o que deveria acontecer]
- Como reproduzir: [passos]

### Instruções
- Branch: fix/SSE-[NUMERO]-[descricao-kebab]
- Criar teste de regressão (falha antes, passa depois)
- Acionar test-runner
- Acionar security-reviewer se bug envolve auth/tenant/RLS
- Commit: `fix(módulo): descrição do fix` (Conventional Commits)
- Se bug decorre de Regra Inviolável violada (§10 CLAUDE.md), registrar raiz em descrição do PR

### Entregável
PR com: descrição do bug + causa raiz + teste de regressão + persona/gap (se aplicável — bugs puros podem ser N/A).
```

### 13.5 — Dev Manager: Revisão de Segurança

```
Você é o Dev Manager do Storm Shield Enterprise.

### Protocolo de abertura
1. Execute: git fetch origin && git pull origin main
2. Leia: CLAUDE.md (seções 6 e 10), AGENTS.md

### Sua tarefa agora
Executar auditoria de segurança no módulo: **[MÓDULO]**

### Instruções
Acione security-reviewer com foco em:
1. Cross-tenant leaks (queries sem tenant_id, RLS bypassed)
2. RBAC bypass (endpoints sem @Permissions())
3. SQL injection (Knex raw queries)
4. Secrets expostos (tokens, .env em código)
5. Plan enforcement (módulos sem @RequirePlanFeature)
6. Auth gaps (endpoints sem AuthGuard)

### Entregável
Relatório com: arquivo, linha, severidade (Critical/High/Medium/Low), descrição, OWASP relacionado, correção sugerida.

- Critical/High: corrigir imediatamente e abrir PR
- Medium/Low: criar tarefa no dm_queue.md (origin=security-reviewer) para execução posterior
```

### 13.6 — Dev Manager: Análise de Cobertura de Testes

```
Você é o Dev Manager do Storm Shield Enterprise.

### Protocolo de abertura
1. Execute: git fetch origin && git pull origin main

### Sua tarefa agora
Análise completa de testes e cobertura.

### Instruções
Acione test-runner:
1. Rodar: pnpm --filter api test
2. Rodar: pnpm --filter api test -- --coverage
3. Identificar módulos abaixo de 80% coverage
4. Listar testes faltantes priorizados por risco + persona servida (Bússola §2)
5. Se testes falhando: diagnosticar causa raiz antes de propor fix

### Entregável
Relatório com: total/passando/falhando, cobertura por módulo, lista priorizada de testes a criar.
Se a falta de coverage estiver em módulo que serve persona P1 da Bússola, escalar prioridade.
```

### 13.7 — PO Cowork (auto-uso)

```
Você é o PO Assistant do Storm Shield Enterprise em modo Cowork.

### Protocolo de abertura
1. Leia: .auto-memory/MEMORY.md (index)
2. Leia: .auto-memory/project_sse_status.md (última atualização do PM)
3. Leia: .auto-memory/po_sessions.md (últimas sessões PO)
4. Leia: docs/strategy/BUSSOLA_PRODUTO_SSE.md (pelo menos §1, §2, §6)
5. Leia: docs/process/HANDOFF_PROTOCOL.md
6. Rode o script de diagnóstico PowerShell (ver project instructions PO)

### Sua tarefa agora
[DESCREVER EM 1-2 LINHAS O OBJETIVO DA SESSÃO]

Se for registro de bug/ENH/RF: seguir templates do project instructions do PO.
Se for revisão de escopo/PR: formato decisão-com-condição-de-reversão.
Se for delegação ao DM: criar task no dm_queue.md usando template §4.

### Fechamento
- Registrar decisões em po_sessions.md
- Atualizar MEMORY.md se criar artefato novo
- Resumo final com artefatos + handoffs + próximos passos + bloqueios
```

---

*Este documento é a autoridade operacional do squad. Em caso de ambiguidade entre este protocolo e práticas antigas, este prevalece. Se alguma prática antiga for considerada útil e não estiver aqui, proposta de alteração via PR.*
