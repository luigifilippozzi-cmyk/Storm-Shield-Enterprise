# ADR 010 — Operating Model v2: Formalização do modo de operação do squad SSE

**Data:** 2026-04-17
**Status:** Aceito
**Decisor:** Luigi Filippozzi (PO)
**Escopo:** Governança operacional do squad SSE — atores, cadência, rituais, métricas

---

## Contexto

O squad SSE opera desde 2026-04-08 sob o modelo estabelecido no ADR-007 (Agent Squad Architecture): Product Owner humano + agentes IA (PM Agent, Dev Manager, 4 subagentes especializados). Nesse período, práticas concretas de coordenação se consolidaram **implicitamente**:

- PO abre sessão Cowork ad-hoc quando precisa decidir
- PM Agent atualiza status diariamente via scheduled task
- DM executa tarefas on-demand, orquestrando subagentes
- Subagentes são invocados pelo DM em PRs específicos
- Tarefas fluem PO → dm_queue → DM → PR → PO review → merge

Essas práticas **funcionam**, mas viviam dispersas — partes em `CLAUDE.md`, partes em `AGENTS.md`, partes em ADR-007, partes em `SSE_Templates_Sessao_Agentes.md`, partes em hábito informal do Luigi e do squad. Sintomas do gap:

1. **Scheduled tasks com comportamento variável** — o PM às vezes escrevia em `dm_task_queue.md`, às vezes só em `project_sse_status.md`, sem protocolo claro de quando usar qual.
2. **Dualidade de filas DM** — `dm_task_queue.md` (PM-owned) e `dm_tasks_pending.md` (PO-owned) coexistiam até 2026-04-17 sem regra canônica de consumo. Resolvido na sessão WS-B do mesmo dia com unificação em `dm_queue.md`.
3. **Cadência ambígua** — qual é o rhythm oficial do squad? Existe "sessão PO semanal"? "Weekly retrospective"? Ninguém sabia.
4. **Métricas não canônicas** — o PM reportava métricas diárias (testes, CI, PRs) mas sem designação formal de "estas são as métricas que importam para decisão".
5. **Rituais sem responsável** — rotação de arquivo, revisão de documentos, cadência de sessão — tudo mencionado de passagem em documentos, sem responsável designado.

Na sessão PO de 2026-04-17, Luigi conduziu 4 work-streams consecutivas:

- **WS-A** — Materializou a Bússola de Produto (estratégia) via ADR-009
- **WS-B** — Formalizou protocolos de handoff em `HANDOFF_PROTOCOL.md` v1.0
- **WS-C** — Auditou e consolidou a documentação (reorganização de `docs/`)
- **WS-D** — **Este ADR.** Formaliza o operating model v2 do squad.

A decisão explícita do PO foi "formalizar o que já existe com protocolos claros", não "redesenhar rituais". Esta ADR reflete essa escolha.

## Decisão

Adotar **Operating Model v2** como documento canônico do modo de operação do squad SSE, com estas definições oficiais:

### 1. Atores e hierarquia

4 atores operacionais: **Product Owner** (humano + agente em Cowork), **PM Agent** (scheduled task), **Dev Manager** (on-demand), **Subagentes** (security, test, db, frontend — sob orquestração do DM).

Princípio inviolável: **PO decide estratégia, DM decide técnica, PM observa e reporta.** Subagentes só atuam invocados pelo DM.

### 2. Hierarquia de documentos autoritativos

- **Decisão estratégica de produto:** Bússola > CLAUDE.md > convenções
- **Decisão operacional:** HANDOFF_PROTOCOL > OPERATING_MODEL_v2 > AGENTS.md > prática implícita
- **Decisão técnica:** ADR específica > CLAUDE.md > convenção do módulo

### 3. Cadência oficial

- **PO:** ad-hoc, iniciada por Luigi. Não há sessão regular agendada. Reavaliar em 2026-07.
- **PM Agent:** scheduled task diária (working days).
- **Dev Manager:** on-demand. Pode ser scheduled se workload justificar.
- **Subagentes:** sob invocação do DM.

### 4. Rituais oficiais

- **Rotação mensal do `dm_queue`** — primeiro dia útil. Responsável: DM. Move COMPLETED para archive, reporta métricas ao PM.
- **Revisão trimestral da Bússola** — a cada 3 meses. Responsável: PO.
- **Revisão trimestral do HANDOFF_PROTOCOL** — a cada 3 meses (mesma semana da Bússola). Responsável: PO + DM.

Rituais NÃO adotados nesta versão (mantidos como possibilidade futura, não obrigação):
- Retrospectiva mensal — contradiz "formalizar o que existe"
- Revisão anual de ADRs — overhead desnecessário no estágio atual

### 5. Métricas oficiais

**De produto (Bússola):**
- # tenants ativos
- Activation rate (dependente de Gap 8)

**De operação (NOVAS neste ADR):**
- Lead time de tarefas (PENDING → COMPLETED, excluindo BLOCKED)
- # tarefas BLOCKED por semana

**De observabilidade (reportadas mas não gating):**
- CI green rate
- Test coverage
- # PRs/semana

### 6. Evolução do modelo

OPERATING_MODEL_v2 evolui sob 3 mecanismos:
- Revisão trimestral conjunta (ajustes de redação/formalização)
- ADR específico (mudanças estruturais)
- PR menor (correções sem estrutura nova)

## Alternativas Consideradas

1. **Não formalizar — manter práticas implícitas.**
   Rejeitado. Os 5 sintomas do gap (ver Contexto) são reais e crescem à medida que o squad opera por mais tempo. Formalizar é baixo custo hoje, alto retorno em consistência.

2. **Redesenhar com sprints, weekly reviews e OKRs.**
   Rejeitado explicitamente pelo PO na sessão. Overhead desproporcional para squad majoritariamente IA. Reavaliar se o squad crescer (ex: +2 desenvolvedores humanos) ou se métricas operacionais começarem a degradar.

3. **Introduzir novos agentes ou ferramentas (UX Reviewer, Data Analyst, Linear, PostHog).**
   Rejeitado explicitamente pelo PO. Formalização prima sobre expansão. Ferramentas novas entrarão com ADR dedicado quando a necessidade for clara.

4. **Documentar tudo no CLAUDE.md em vez de arquivo separado.**
   Rejeitado. CLAUDE.md já tem ~400 linhas cobrindo stack e convenções técnicas. Adicionar operating model dobrava o tamanho e misturava contextos (técnico + operacional). Arquivo separado em `docs/process/` é a organização cultivada pelo projeto.

5. **Deixar o HANDOFF_PROTOCOL cobrir também o operating model.**
   Rejeitado. HANDOFF responde "como handoffs funcionam" (templates, ownership, lifecycle). OPERATING_MODEL responde "como o squad opera no tempo" (cadência, rituais, métricas). São planos diferentes. Misturar criaria um documento de ~600 linhas sem foco claro.

## Consequências

### Positivas

- **Documentação autoritativa** — qualquer contributor (humano ou agente) consegue ler OPERATING_MODEL_v2 e entender o modo de operação em 15 minutos.
- **Métricas operacionais formalizadas** — lead time e # BLOCKED/semana passam a ser rastreadas oficialmente pelo PM, permitindo detectar degradação do squad antes de virar crise.
- **Rituais com responsável** — rotação mensal e revisões trimestrais deixam de ser "alguém devia fazer" e viram "DM faz no dia X / PO faz no mês Y".
- **Cadência explícita** — clareza de que não há sessão PO regular (é ad-hoc) libera Luigi de sentir que "devia" abrir sessão; ele abre quando precisa.
- **Proteção contra expansão não-governada** — adoção deste modelo força que qualquer novo ator/ritual/métrica passe por ADR.

### Negativas / Riscos

- **Custo de manutenção** — documento vivo requer atualização. Se virar letra morta, contradiz a decisão e perde valor. Mitigação: revisão trimestral obrigatória (§5.3 do HANDOFF).
- **Risco de engessamento** — formalização pode inibir experimentação local. Exemplo: se DM quiser testar uma variação de cadência para 2 semanas, precisa passar por ADR? Mitigação: §9 do OPERATING_MODEL permite "PR menor para correções" — experimentação curta não precisa de ADR.
- **Dependência de instrumentação futura** — activation rate (métrica central) depende de Gap 8 da Bússola, ainda não implementado. OPERATING_MODEL reconhece com "N/A — pendente" mas métrica de produto efetivamente não tem leitura até Gap 8 ser fechado.
- **Drift entre prática e protocolo** — após alguns meses, prática pode divergir do OPERATING_MODEL. Mitigação: revisão trimestral §5.3 identifica drifts e decide atualizar protocolo OU disciplinar prática.

### Mitigações

- Revisão trimestral é **obrigatória** (§5.2 e §5.3 do OPERATING_MODEL), não opcional
- Lead time de tarefas como métrica oficial cria feedback loop: se métrica degradar, squad sabe primeiro
- `CLAUDE.md` e `AGENTS.md` serão patched pelo DM em PR separado para referenciar OPERATING_MODEL_v2 como autoridade
- PO Assistant tem este ADR + Operating Model na memória persistente, assegurando continuidade entre sessões

## Implementação

### Arquivos criados nesta sessão (WS-D)

| Arquivo | Ação | Observação |
|---|---|---|
| `docs/process/OPERATING_MODEL_v2.md` | Criado | Documento canônico — 10 seções |
| `docs/decisions/010-operating-model-v2.md` | Criado | Este ADR |

### Arquivos a atualizar (sugestões — não executadas pelo PO nesta sessão)

| Arquivo | Ação sugerida | Responsável |
|---|---|---|
| `CLAUDE.md` §10 | Adicionar regra 18 referenciando OPERATING_MODEL_v2 | DM via PR separado (bundled em T-20260417-1) |
| `AGENTS.md` | Adicionar OPERATING_MODEL_v2 à lista de documentos de referência obrigatórios | DM via PR (bundled em T-20260417-3) |
| `docs/README.md` | Adicionar OPERATING_MODEL_v2 à seção `process/` | PO Assistant (nesta sessão) |
| Scheduled task do PM (prompt) | Adicionar produção de métricas oficiais (lead time + # BLOCKED) | DM revisa após ADR mergear |

### Dependências técnicas

- **Métrica "lead time":** requer timestamps fiáveis em `dm_queue.md` (Created, Claimed, Completed). Já contemplado no template canônico §4 do HANDOFF_PROTOCOL. Nenhum código novo necessário — PM calcula a partir do texto do arquivo.
- **Métrica "# BLOCKED":** requer PM varrer `dm_queue.md` no daily. Sem novo código. Estimativa de implementação: 15 min de prompt-tuning no scheduled task do PM.
- **Activation rate:** dependente de Gap 8 da Bússola (event tracking). Não instrumentada nesta fase. Reportada como "N/A" até Gap 8 ser fechado.

## Referências

- `docs/process/OPERATING_MODEL_v2.md` — documento formalizado por este ADR
- `docs/process/HANDOFF_PROTOCOL.md` — protocolo operacional complementar
- `docs/strategy/BUSSOLA_PRODUTO_SSE.md` — estratégia de produto
- `docs/decisions/007-agent-squad-architecture.md` — ADR-007 que estabeleceu o squad IA
- `docs/decisions/009-adocao-bussola-de-produto.md` — ADR-009 que oficializou a Bússola
- `.auto-memory/po_sessions.md` — log da sessão 2026-04-17 (partes 1–4)
- `.auto-memory/dm_queue.md` — fila unificada com as tarefas derivadas desta sessão
