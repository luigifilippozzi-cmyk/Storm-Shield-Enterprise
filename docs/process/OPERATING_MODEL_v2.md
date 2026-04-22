# Operating Model v2 — Storm Shield Enterprise

> Documento canônico do modelo de operação do squad SSE.
> **Status:** v2.1 — Aceito em 2026-04-21 via ADR-013 (v2.0 original via ADR-010 em 2026-04-17)
> **Natureza:** formalização do que já existe na prática, não introdução de novos rituais
> **Autoridade:** este documento + HANDOFF_PROTOCOL.md (operacional) + Bússola (estratégica)
> **v2.1 (2026-04-21):** adiciona §5.4 "Health check do squad — sinais de adoção quebrada" como ritual recorrente do PM Agent. Origem: pacote MF (anti-pattern identificado — princípios sem revisão viram decoração).

---

## 1. Propósito

Este documento responde **"como o squad SSE opera no dia-a-dia"**. Cobre quem faz o quê, com que cadência, usando quais artefatos, segundo quais métricas, e como o trabalho flui de uma decisão estratégica até um commit em `main`.

É camada complementar:
- A **Bússola** responde "o que estamos construindo e para quem"
- O **HANDOFF_PROTOCOL** responde "quem escreve o quê, quando, onde"
- O **OPERATING_MODEL_v2** responde "como o squad opera ao longo do tempo"

Os três juntos formam a governança do projeto. CLAUDE.md continua sendo a referência técnica.

---

## 2. Atores e Responsabilidades

### 2.1 — Product Owner (Luigi + PO Assistant em Cowork)

**Natureza:** humano (Luigi) + agente IA (PO Assistant em modo Cowork).

**Responsabilidade primária:** decisões estratégicas e priorização. Validação da Bússola. Aprovação de PRs. Resolução de conflitos.

**O que faz:**
- Roda sessões PO ad-hoc (ver §4 Cadência)
- Escreve em `.auto-memory/po_sessions.md` (append-top)
- Cria tarefas em `.auto-memory/dm_queue.md` com `Origin: PO`
- Aprova ou rejeita PRs do DM
- Mantém Bússola atualizada (sessões com decisões estratégicas)
- Não executa código, branches, commits

**Limites:**
- Não decide arquitetura técnica isolada (cabe ao DM)
- Não escreve em `project_sse_status.md` (é do PM)

### 2.2 — PM Agent

**Natureza:** scheduled task (Claude Code).

**Responsabilidade primária:** observabilidade do projeto. Status diário. Alertas de inconsistência. Métricas básicas.

**O que faz:**
- Atualiza `.auto-memory/project_sse_status.md` diariamente (template HANDOFF_PROTOCOL §5)
- Cria tarefas em `dm_queue.md` com `Origin: PM` quando detecta impedimentos ou prioridades emergentes
- Lê: CLAUDE.md, AGENTS.md, HANDOFF_PROTOCOL.md, Bússola §1+§2+§6
- Reporta inconsistências entre estado declarado e código real

**Limites:**
- Não decide escopo
- Não executa branches/PRs
- Não chama subagentes

### 2.3 — Dev Manager

**Natureza:** scheduled task (Claude Code) ou on-demand quando invocado.

**Responsabilidade primária:** execução técnica. Orquestração de subagentes. Branches, commits, PRs. Escalação de bloqueios.

**O que faz:**
- Consome `.auto-memory/dm_queue.md` em ordem de prioridade
- Atualiza status da tarefa (PENDING → IN_PROGRESS → COMPLETED)
- Cria branches, escreve código, abre PRs com template
- Aciona subagentes (security, test, db, frontend) conforme escopo
- Roda rotação mensal do `dm_queue` (ver §5 Rituais)
- Escreve em `.auto-memory/decisions_pending.md` quando precisa de decisão do PO

**Limites:**
- Não decide priorização estratégica (cabe ao PO)
- Não cria tarefas no `dm_queue` para si mesmo (workload entra via PO ou PM)
- Não mergeia sem aprovação do PO

### 2.4 — Subagentes (security, test, db, frontend)

**Natureza:** subagentes do Claude Code, em `.claude/agents/`.

**Responsabilidade primária:** revisão especializada por domínio.

**O que fazem:**
- Atuam exclusivamente quando invocados pelo DM
- Reportam achados via comentários no PR ou em `decisions_pending.md` se bloqueante
- Não criam tarefas, não decidem escopo

**Limites:**
- Sob orquestração do DM
- Bloqueio crítico (Regra Inviolável violada) escala via DM ao PO

---

## 3. Hierarquia de Documentos Autoritativos

Em caso de ambiguidade, vale esta ordem:

```
Decisão estratégica de produto
    ↑
    Bússola (docs/strategy/) > CLAUDE.md > convenções implícitas

Decisão operacional do squad
    ↑
    HANDOFF_PROTOCOL (docs/process/) > OPERATING_MODEL_v2 (docs/process/) > AGENTS.md > prática implícita

Decisão técnica
    ↑
    ADR específica (docs/decisions/) > CLAUDE.md > convenção do módulo > prática implícita

Status atual / fila de trabalho
    ↑
    .auto-memory/* > GitHub Issues
```

Quando 2 documentos divergem, segue o de cima. Atualizar o de baixo (ou levantar conflito como ADR novo) é responsabilidade de quem detecta.

---

## 4. Cadência

### 4.1 — PO

**Cadência oficial:** ad-hoc, iniciada por Luigi.

Não há sessão PO regular agendada. Luigi abre sessão Cowork quando há decisão a tomar, escopo a revisar, ou após acumular tarefas/inconsistências reportadas. Reavaliar este modelo em 2026-07 (3 meses).

**Duração típica:** 30–60 min por sessão. Sessões "maratónicas" (>90 min) são exceção, devem ser quebradas se possível.

### 4.2 — PM Agent

**Cadência oficial:** scheduled task diária (working day).

PM atualiza `project_sse_status.md` a cada execução. Nas semanas sem mudanças significativas, pode reportar "no significant change since YYYY-MM-DD" sem reescrever o arquivo inteiro.

**Outputs esperados:** status diário (template §5 do HANDOFF_PROTOCOL); tarefas no `dm_queue` com `Origin: PM` quando aplicável.

### 4.3 — Dev Manager

**Cadência oficial:** on-demand. Pode ser scheduled (ex: 2x/semana) se workload comportar, mas não obrigatório.

DM consome `dm_queue.md` quando invocado. Em cada sessão, executa em ordem de prioridade até esgotar tempo/contexto. Escala bloqueios para PO via `decisions_pending.md`.

**Outputs esperados:** branches, commits, PRs, atualizações de status no `dm_queue`.

### 4.4 — Subagentes

**Cadência:** sob invocação do DM. Sem cadência própria.

---

## 5. Rituais Oficiais

Rituais são eventos recorrentes com responsável, frequência e entregável definidos. Os rituais oficiais do squad SSE são:

### 5.1 — Rotação mensal do `dm_queue`

**Quando:** primeiro dia útil de cada mês.
**Quem executa:** Dev Manager (em sessão dedicada ou na primeira invocação do mês).
**O que faz:**
1. Identifica todas as tarefas com status `COMPLETED` em `dm_queue.md`
2. Move blocos completos (com comments) para `dm_queue_archive.md` (append no fim)
3. Confirma que `dm_queue.md` ativo contém apenas PENDING / IN_PROGRESS / BLOCKED
4. Reporta ao PM Agent (que inclui no próximo status diário) o # de tarefas arquivadas e lead time médio do mês

**Entregável:** `dm_queue.md` enxuto + `dm_queue_archive.md` atualizado + linha no próximo `project_sse_status.md` com métricas do ciclo.

### 5.2 — Revisão trimestral da Bússola

**Quando:** a cada 3 meses (próxima: 2026-07-17).
**Quem executa:** PO (Luigi + PO Assistant), opcionalmente com input escrito de PM e DM.
**O que faz:**
1. Reler `docs/strategy/BUSSOLA_PRODUTO_SSE.md` integralmente
2. Para cada seção, perguntar: "ainda é verdade?"
3. Atualizar conteúdo se algo mudou (ICP, personas, gaps, posicionamento)
4. Registrar decisão em `BUSSOLA_PRODUTO_SSE.md §9` + `po_sessions.md`
5. Se mudança estrutural (ex: nova persona, mudança de ICP), criar ADR-N novo

**Entregável:** Bússola atualizada + entrada no §9 + sessão registrada em `po_sessions.md`.

### 5.3 — Revisão trimestral do HANDOFF_PROTOCOL

**Quando:** a cada 3 meses (próxima: 2026-07-17), idealmente na mesma semana da revisão da Bússola.
**Quem executa:** PO + DM em sessão conjunta (DM pode estar como scheduled task com prompt específico ou em Cowork).
**O que faz:**
1. Reler `docs/process/HANDOFF_PROTOCOL.md` integralmente
2. Avaliar contra os últimos 3 meses de dados (`dm_queue_archive`, `po_sessions`, PRs do GitHub)
3. Identificar drifts entre protocolo escrito e prática real
4. Decidir: atualizar protocolo OU disciplinar prática?
5. Registrar decisão em `po_sessions.md` + ADR-N se mudança estrutural

**Entregável:** HANDOFF_PROTOCOL atualizado se necessário + sessão registrada.

---

### 5.4 — Health check do squad (sinais de adoção quebrada)

**Quando:** quinzenal (a cada 2 semanas). Executado na segunda-feira mais próxima.
**Quem executa:** PM Agent (como parte do status semanal ampliado de segunda).
**Origem:** ADR-013 — incorporação do pacote MF. Anti-pattern "princípios sem revisão viram decoração" reconhecido.

**O que faz:**

PM Agent percorre o checklist abaixo e reporta no status. Cada item "quebrado" vira issue/tarefa para o PO ou para o próprio DM revisitar.

#### Checklist de saúde (8 itens)

1. **Subagentes estão sendo invocados?** — Últimos 10 PRs: cada subagente obrigatório (test-runner, security-reviewer, db-reviewer, frontend-reviewer) aparece no PR body quando devia? Se 3+ PRs de UI sem `frontend-reviewer`, sinal de quebra.

2. **Princípios da Bússola são citados?** — Últimos 10 PRs de tela nova/alterada: descrição linka persona primária (§2) e gap fechado (§4)? Últimos 10 PRs de UI: `frontend-reviewer` cita PV/PUX (§6.2/§6.3)? Se <30% citam, sinal de quebra.

3. **Tarefas DM têm escopo negativo?** — Últimas 10 tarefas criadas em `dm_queue.md`: cada uma tem seção "Escopo negativo — NÃO fazer" preenchida? Ausente em 3+ → PO relembra template canônico.

4. **ADRs estão sendo criados quando deviam?** — Últimas 4 semanas: houve mudança arquitetural ou de escopo de fase sem ADR correspondente? Se sim, PO revisita.

5. **`MEMORY.md` está atualizado?** — Algum arquivo em `.auto-memory/` marcado DEPRECATED há >30 dias ainda sem decisão de arquivar/remover? Se sim, PO revisa ownership.

6. **Fila de BLOCKED está drenando?** — Tarefas em BLOCKED há >14 dias sem movimento? Se sim, PM escalar em status para PO (sessão de desbloqueio).

7. **Lead time de tarefas está estável?** — Lead time médio das tarefas fechadas nas últimas 2 semanas vs. média dos 3 meses anteriores. Se >2 desvios, investigar (§6.2).

8. **Condições de reversão de ADRs recentes estão sendo checadas?** — Cada ADR com "Condição de reversão" explícita (a partir de ADR-009) tem verificação registrada na retrospectiva trimestral? Se não, PO agenda.

**Entregável:** linha "Squad health" no status semanal do PM Agent com formato:

```
Squad health (check YYYY-MM-DD):
- Itens OK: [N de 8]
- Itens em alerta: [lista com referência ao # do checklist]
- Ação proposta: [1 linha por item em alerta OU "nenhuma — todos OK"]
```

**Não-entregáveis (escopo negativo):**
- Este ritual **não** substitui revisão trimestral da Bússola (§5.2) nem do HANDOFF_PROTOCOL (§5.3).
- Este ritual **não** é canal de abertura de novos RFs — se um item quebrado requer RF, PM escala para PO.
- Este ritual **não** mede qualidade de código (isso é papel do `frontend-reviewer` e `security-reviewer` no PR).

**Racional de ter sido incluído:** aprendizado direto do pacote MF — "subagente sem Regra Inviolável vira artefato morto; princípio sem revisão vira decoração; tarefa sem escopo negativo vira overreach do DM". Quinzenal é cadência alta o bastante para pegar drift cedo, baixa o bastante para não virar ritual vazio.

---

## 6. Métricas Oficiais

Métricas que o squad rastreia formalmente. PM Agent reporta em cada status diário/semanal. Outras métricas podem existir mas não são oficiais (não impactam decisões).

### 6.1 — Métricas de produto (já na Bússola §1)

| Métrica | Definição | Origem | Frequência |
|---|---|---|---|
| **# tenants ativos** | Tenants com pelo menos 1 user logado nos últimos 30 dias | DB query (futura instrumentação) | Mensal |
| **Activation rate** | % de tenants novos que executam o happy path mínimo (≥1 customer + ≥1 vehicle + ≥1 estimate + ≥1 SO + ≥1 financial transaction) nos primeiros 7 dias | Event tracking (Gap 8 da Bússola — pendente RF) | Mensal |

> **Nota:** Activation rate depende de instrumentação que ainda não existe (Gap 8 da Bússola). Até implementação, métrica reportada como "N/A — pendente Gap 8".

### 6.2 — Métricas de operação (NOVAS — oficializadas em ADR-010)

| Métrica | Definição | Origem | Frequência |
|---|---|---|---|
| **Lead time de tarefas** | Tempo médio entre `Created` e `COMPLETED` de tarefas no `dm_queue` (excluindo tempo BLOCKED) | Timestamps no `dm_queue.md` + `dm_queue_archive.md` | Semanal (PM no status) + Mensal (rollup na rotação) |
| **# tarefas BLOCKED por semana** | Contagem de tarefas que entraram em BLOCKED (mesmo que tenham saído depois) | Timestamps no `dm_queue.md` | Semanal (PM no status) |

**Ações com base nas métricas:**
- Lead time crescente >2 desvios sobre baseline → investigar gargalo (PO + DM)
- # BLOCKED >3/semana por 2 semanas seguidas → escalar para sessão PO dedicada a desbloqueio

### 6.3 — Métricas técnicas (já reportadas pelo PM, não oficializadas como gating)

CI green rate, test coverage, # PRs/semana — reportadas no status diário, mas não disparam ação automática. Servem como observabilidade.

---

## 7. Fluxo Padrão de Trabalho (visualização)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Sessão PO (ad-hoc, Luigi)                                            │
│  - Decide escopo / prioridade / RF novo                              │
│  - Cria task no dm_queue.md (Origin: PO, template HANDOFF §4)        │
│  - Append em po_sessions.md                                          │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Scheduled task PM (diário)                                           │
│  - Lê estado do repo                                                 │
│  - Atualiza project_sse_status.md (template HANDOFF §5)              │
│  - Cria tasks emergenciais no dm_queue (Origin: PM) se necessário    │
│  - Reporta inconsistências                                           │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ DM (on-demand)                                                       │
│  - Consome dm_queue.md em ordem P0 → P1 → P2                         │
│  - Status PENDING → IN_PROGRESS (preenche Claimed + Branch)          │
│  - Cria branch, código, testes                                       │
│  - Aciona subagentes (security/test/db/frontend) conforme escopo     │
│  - Abre PR com template (incluindo persona/gap da Bússola)           │
│  - Status IN_PROGRESS → COMPLETED após merge                         │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ PO Review (sessão Cowork ou ad-hoc)                                  │
│  - Revisa PR (escopo + 14 regras + persona/gap)                      │
│  - Aprova → DM mergeia                                               │
│  - Reprova → comment no PR + task atualizada para BLOCKED            │
└──────────────────────────────────────────────────────────────────────┘
```

**Saídas paralelas:**
- Bloqueio durante execução: DM marca BLOCKED + escreve em `decisions_pending.md` → PO decide
- Subagente identifica violação de Regra Inviolável: DM pausa + escala
- PM detecta inconsistência crítica entre status e código: cria task P0 no `dm_queue`

---

## 8. Pontos de Decisão e Escalation

| Situação | Quem decide | Como |
|---|---|---|
| Escopo de RF novo | PO | Sessão PO + Bússola §filtros + ADR se estrutural |
| Priorização entre tarefas P1 | PO | Sessão PO ou comment no `dm_queue` |
| Como implementar técnicamente | DM | Decisão técnica, ADR se afetar arquitetura |
| Subagente flagra Regra Inviolável | DM pausa, PO arbitra | DM cria entrada em `decisions_pending.md` |
| PM detecta inconsistência | PM reporta no status, PO/DM agem | Status + task P0 no `dm_queue` se urgente |
| Conflito PO ↔ DM (raro) | Luigi como humano | Sessão PO dedicada, registra em `po_sessions.md` |
| Mudança da Bússola | PO | Revisão trimestral §5.2 ou sessão PO ad-hoc + ADR se estrutural |
| Mudança do HANDOFF_PROTOCOL | PO + DM | Revisão trimestral §5.3 ou ADR novo |
| Pre-merge: Regra Inviolável violada | DM ou PO bloqueia | Não mergeia. Devolve ao autor. |

---

## 9. Como o Operating Model evolui

Este documento é **vivo**. Evolui sob 3 mecanismos:

1. **Revisão trimestral conjunta** (§5.3 do próprio HANDOFF) — ajustes de redação, novos campos em template, formalização de prática que virou padrão
2. **ADR específico** — mudanças estruturais (novo ator, mudança de cadência oficial, mudança de hierarquia de documentos) requerem ADR-N
3. **Append em PR** — pequenas correções pode ir num PR `docs/SSE-XXX-operating-model-fix-Y` sem ADR

Mudanças sem nenhum desses mecanismos são proibidas — o documento perde autoridade se atualizado sem governança.

---

## 10. Referências cruzadas

- `docs/strategy/BUSSOLA_PRODUTO_SSE.md` — Bússola (estratégia)
- `docs/process/HANDOFF_PROTOCOL.md` — Handoff (operacional, templates)
- `docs/decisions/007-agent-squad-architecture.md` — ADR-007 (squad architecture)
- `docs/decisions/009-adocao-bussola-de-produto.md` — ADR-009 (Bússola)
- `docs/decisions/010-operating-model-v2.md` — ADR-010 (este documento)
- `CLAUDE.md` — convenções técnicas
- `AGENTS.md` — coordenação alto-nível
- `.auto-memory/MEMORY.md` — index de memória operacional

---

*Operating Model v2 não é Operating Model v1 estendido. É a primeira versão escrita do que sempre operou implicitamente. v1 nunca foi documentado oficialmente; vivia em prática + ADR-007 + AGENTS.md fragmentados.*
