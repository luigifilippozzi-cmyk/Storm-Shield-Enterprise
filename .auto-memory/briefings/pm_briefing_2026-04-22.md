# PM Agent — Briefing do PO (2026-04-22 parte 2)

## Contexto

Sessão PO de hoje escopou uma ação de **compliance/hygiene** sobre a documentação estratégica: substituir menções nominais a uma marca registrada de ERP proprietário (usado apenas como referência comparativa) por uma sigla neutra (**NS**) acompanhada de disclaimer canônico. A decisão foi formalizada como **ADR-014** (rascunho pronto em `.auto-memory/proposals/adr_014_draft.md`).

**Justificativa:** SSE não tem relação comercial, licenciamento nem endosso com o fornecedor; uso nominativo em repo versionado gera exposição jurídica latente. Mitigação precautória, reversível via stubs de redirect + ADR suplementar.

**Escopo escopado:** 19 arquivos versionados (235 ocorrências) + 3 renames + sweep no GitHub (issues/PRs abertos e fechados, sem tocar comentários/reviews).

## Ação do PM (3 itens)

### 1. Registrar a ENH no backlog GitHub

- **Labels:** `refactor`, `documentation`, `compliance`, `prioridade: média`, `fase-1-mvp`
- **Título sugerido:** "ENH: Substituir marca de ERP externo por sigla NS (trademark hygiene)"
- **Corpo:** linkar para T-20260422-1 em `.auto-memory/dm_queue.md` e ADR-014 draft
- **Prioridade:** P2 (não bloqueia feature)

### 2. Atualizar T-20260421-1 com dependência invertida

Localizar T-20260421-1 em `.auto-memory/dm_queue.md` (sync do dashboard estratégico HTML) e **adicionar bloco de dependência invertida**:

> ⚠ **Dependência invertida com T-20260422-1:** só sincronizar o dashboard **após** os renames desta tarefa concluírem. O path `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.{md,html}` será renomeado para `ANALISE_NS_vs_BUSSOLA_v1.{md,html}`. Atualizar também a referência de path no corpo da T-20260421-1 no mesmo PR da T-20260422-1.

### 3. Atualizar `project_sse_status.md` seção Governança

Adicionar nota na seção adequada:

> **2026-04-22:** Decisão de trademark hygiene formalizada em ADR-014 (DRAFT, em publicação pelo DM via T-20260422-1). Substituição de marca registrada de ERP de referência por sigla **NS** em 19 arquivos + sweep GitHub. Sem impacto em personas, ICP, métrica-norte ou roadmap Fase 1. Executado em paralelo ao fechamento de T-20260421-10.

## Referências

- Registro da sessão: `.auto-memory/po_sessions.md` (sessão 2026-04-22 parte 2)
- Tarefa DM: `.auto-memory/dm_queue.md` → T-20260422-1 (P2, PENDING)
- Rascunho ADR: `.auto-memory/proposals/adr_014_draft.md`
- MEMORY.md: entrada do dashboard estratégico será renomeada pelo PO após merge do PR do DM

## Não fazer (escopo negativo)

- **Não publicar** o ADR em `docs/decisions/` — isso é ação do DM no PR.
- **Não editar** arquivos versionados fora do backlog e do `project_sse_status.md`.
- **Não tocar** em `.auto-memory/MEMORY.md` — atualização pós-merge é responsabilidade do PO.

## Protocolo

`docs/process/HANDOFF_PROTOCOL.md` §3 (ownership matrix) + §4 (template canônico).
