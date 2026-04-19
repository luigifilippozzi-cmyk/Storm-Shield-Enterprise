---
name: Plano das próximas 2 sessões PO (WS-C e WS-D)
description: Briefing preparatório para as sessões WS-C (audit docs) e WS-D (operating model v2), derivadas da sessão 2026-04-17 parte 2
type: project
---

# Plano — Próximas sessões PO

> Preparado em 2026-04-17 ao fim da sessão PO parte 2 (WS-B + WS-A).
> Para Luigi consultar antes de iniciar cada uma das duas próximas sessões.

---

## Sessão N+1 — WS-C: Auditoria + Consolidação da Documentação

**Duração estimada:** 45–60 min
**Pré-requisito:** nenhum (pode ser iniciada a qualquer momento após merge dos artefatos de 2026-04-17)

### Objetivo
Inventariar toda a documentação atual, classificar (manter / atualizar / descontinuar), propor estrutura `docs/` limpa e Bússola-alinhada, e redigir os 2–3 documentos de gate que faltam (README renovado, INDEX de `docs/`, talvez CONTRIBUTING).

### Inventário atual (snapshot 2026-04-17)

**Root-level (4 arquivos — em uso):**
- `README.md` — status desconhecido, precisa auditoria
- `CLAUDE.md` — autoritativo técnico, atualizado
- `AGENTS.md` — autoritativo operacional, desatualizado (pendente T-20260417-3)
- `CHANGELOG.md` — provavelmente atualizado, verificar cadência

**`docs/` flat root (12 arquivos — CANDIDATOS A REORG):**

Categoria 1 — Prompts históricos (possível archive/delete):
- `PROMPT_CLAUDE_CODE_FASE1.md`
- `PROMPT_CLAUDE_CODE_20260406.md`
- `PROMPT_CLAUDE_CODE_DEPLOY_STAGING.md`
- `PROMPT_CLAUDE_CODE_GRUPO_A.md`
- `PROMPT_CLAUDE_CODE_GRUPO_B.md`

Categoria 2 — Prompts de agentes (candidatos a `docs/agents/`):
- `SSE_Prompts_Squad_IA.md`
- `SSE_Prompt_PMAgent_ScheduledTask.md`
- `SSE_Prompt_DevManager_ScheduledTask.md`
- `SSE_Prompt_PMAgent_Squad_v2.md`
- `SSE_Prompt_DevManager_Squad_v2.md`

Categoria 3 — Templates (candidato a merge com HANDOFF_PROTOCOL §4–§6):
- `SSE_Templates_Sessao_Agentes.md`

Categoria 4 — Reports datados (candidato a `docs/audits/` ou `docs/reports/`):
- `SSE_Post_Migration_Readiness_Report_20260412.md`

**`docs/` com estrutura (7 pastas):**
- `docs/decisions/` — 9 ADRs ✓ organizados
- `docs/audits/` — 1 arquivo
- `docs/runbooks/` — 1 arquivo (staging-deploy.md)
- `docs/strategy/` — 1 arquivo (Bússola) ✓ novo
- `docs/process/` — 1 arquivo (HANDOFF_PROTOCOL) ✓ novo
- `docs/architecture/` — mencionado em CLAUDE.md §7 mas não listado no inventário .md (tem .docx, .mermaid, .html)
- `docs/api/` — mencionado em CLAUDE.md §4 mas não listado

### Perguntas de discovery (a rodar em sessão)

1. **Prompts históricos (Categoria 1)** — deletar, mover para `.archive/`, ou manter no lugar? (Recomendação PO Assistant: `.archive/` — não apagar, mas tirar da vista.)

2. **Prompts de agentes (Categoria 2)** — consolidar em `.claude/agents/` (source-of-truth) ou manter em `docs/agents/` (documentação)? (Observar que ADR-007 já menciona `.claude/agents/` como canonical.)

3. **Estrutura alvo de `docs/`** — manter atual (strategy/process/decisions/audits/runbooks/architecture/api) ou redesenhar? (Recomendação: manter, com INDEX no `docs/README.md`.)

4. **README.md root** — precisa reescrita? Foco em persona "novo contributor" ou "investidor/stakeholder"?

### Entregáveis esperados da sessão

- `docs/README.md` — índice navegável das pastas de `docs/`
- `README.md` (root) — revisado com menção à Bússola, Handoff Protocol, ADRs principais
- Decisão explícita sobre Categoria 1 e 2 do inventário
- Tasks no `dm_queue.md` para execução dos moves/deletes
- Possível ADR-011 se a reorg tiver consequências estruturais

### Escopo negativo — NÃO fazer em WS-C

- Não escrever documentação de módulos de código (ex: "como funciona estimates") — isso é trabalho do DM/subagentes em PR separado
- Não regenerar conteúdo de ADRs existentes
- Não alterar a Bússola ou HANDOFF_PROTOCOL (recém-criados)
- Não tocar .auto-memory/

---

## Sessão N+2 — WS-D: Operating Model v2 (formalização)

**Duração estimada:** 45–60 min
**Pré-requisito recomendado:** WS-C concluído (docs organizadas ajudam a referenciar no operating model).

### Objetivo
Consolidar o operating model do squad SSE num documento canônico + ADR-010, formalizando o que já existe com protocolos claros. **Não é redesenho** — é cristalização.

### Elementos a consolidar (o que já existe)

**Atores (de ADR-007):**
- PO (Luigi + PO Assistant)
- PM Agent (scheduled task)
- Dev Manager (scheduled task)
- 4 subagentes (security, test, db, frontend)

**Artefatos já em uso:**
- CLAUDE.md (técnico)
- AGENTS.md (operacional alto nível)
- ADRs em `docs/decisions/`
- Bússola em `docs/strategy/`
- HANDOFF_PROTOCOL em `docs/process/`
- `.auto-memory/` ecosystem (unified queue + PO sessions + PM status)

**Rituais implícitos a formalizar:**
- Sessão PO — quando começa/termina, como registra, quais decisões saem
- Scheduled task do PM — diária, atualiza status, alerta inconsistências
- Scheduled task do DM — consome fila, abre PRs, escala
- Invocação de subagente — por DM em PR específico
- Merge/approve — por PO após review
- Rotação mensal — arquivar dm_queue COMPLETED

**Métricas de operação a declarar:**
- # PRs por semana/mês
- Lead time (PENDING → COMPLETED)
- Coverage
- CI health (% green em main)
- Activation rate (métrica de produto, derivada da Bússola)

### Perguntas de discovery (a rodar em sessão)

1. **Cadência da sessão PO** — ad-hoc (como hoje) ou semanal fixa? (Recomendação: ad-hoc por enquanto, reavaliar após 3 meses.)

2. **Métricas de operação** — quais adicionar além de produto? (Sugestão: lead time de tarefas no dm_queue, # de BLOCKED por semana, % de tarefas que passam no escopo negativo sem drift.)

3. **Retrospectiva** — ritual de retrospectiva mensal (PO + PM + DM apontam o que ficou bom/ruim) ou só revisão do HANDOFF_PROTOCOL trimestral?

4. **Escalation path humano→IA** — quando Luigi pode invocar subagente direto (sem passar pelo DM)? (Sugestão: nunca para execução — subagente executa sob orquestração do DM. Para consulta pontual sim.)

### Entregáveis esperados da sessão

- `docs/process/OPERATING_MODEL_v2.md` — documento canônico (todos atores + artefatos + rituais + métricas + fluxo)
- `docs/decisions/010-operating-model-v2.md` — ADR-010 formalizando
- Possível atualização do PM/DM scheduled task prompts (sugerido ao DM, não executado aqui)
- Task no `dm_queue.md` para revisão dos scheduled tasks conforme OPERATING_MODEL_v2

### Escopo negativo — NÃO fazer em WS-D

- Não introduzir novos agentes (ex: UX Reviewer) nesta sessão — formalização, não expansão
- Não introduzir novas ferramentas (Linear, PostHog, etc.) — decisão separada se surgir
- Não redesenhar HANDOFF_PROTOCOL — ele é referenciado, não reaberto
- Não alterar ADRs anteriores

---

## Ordem sugerida

1. **WS-C primeiro** (docs audit) — baixa complexidade estratégica, resultado tangível rápido
2. **WS-D depois** (operating model v2) — consolida tudo. WS-C produz INDEX que o WS-D referencia.

Alternativa aceitável: inverter a ordem se Luigi achar que operating model v2 vai informar decisões de docs reorg. Nesse caso WS-D primeiro, WS-C depois (condição de reversão).

---

## Condição de reversão do plano

Se durante WS-C descobrirmos que o estado da documentação é pior que o inventário sugere (ex: 40% dos docs de prompts estão completamente obsoletos, CLAUDE.md tem referências quebradas a arquivos que não existem), **cortar escopo da sessão em duas**: WS-C.1 (triagem + archive) + WS-C.2 (redação nova). Se melhor que esperado, consolidar num único pass.

Se durante WS-D descobrirmos que "formalizar o que existe" é mais ambicioso do que parece (ex: o fluxo PO→DM tem gaps grandes na prática que só vêm à tona ao escrever), cortar escopo para v2.0-draft e agendar v2.0-final em sessão seguinte.
