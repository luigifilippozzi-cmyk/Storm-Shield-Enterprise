# Auto Memory Index

> Atualizado em 2026-04-17. Referência canônica: `docs/process/HANDOFF_PROTOCOL.md` §3 (ownership matrix).

## Ativos — em uso

- [SSE Project Status](project_sse_status.md) — Estado do projeto, métricas, health, inconsistências. **Owner:** PM Agent. (última atualização: 2026-04-12)
- [PO Sessions Log](po_sessions.md) — Registro datado de sessões do PO. **Owner:** PO Assistant. Append-top. (última: 2026-04-17)
- [Dev Manager Queue (unified)](dm_queue.md) — Fila única de tarefas para o DM. **Writers:** PO, PM (append). **Consumer:** DM. (criado em 2026-04-17)
- [DM Queue Archive](dm_queue_archive.md) — Histórico de tarefas concluídas. **Owner:** DM (move mensalmente). (criado em 2026-04-17)
- [Plano das próximas 2 sessões PO](next_sessions_plan.md) — Briefing WS-C (audit docs) e WS-D (operating model v2). **Owner:** PO Assistant. (criado em 2026-04-17)

## Deprecated — não escrever

- [~~DM Task Queue~~](dm_task_queue.md) — **DEPRECATED 2026-04-17.** Conteúdo migrado para `dm_queue.md`. Stub mantido temporariamente; será removido em maio/2026.
- [~~PO → DM Tasks Pending~~](dm_tasks_pending.md) — **DEPRECATED 2026-04-17.** Conteúdo migrado para `dm_queue.md`. Stub mantido temporariamente; será removido em maio/2026.

## Referências cruzadas

- Protocolo operacional: `docs/process/HANDOFF_PROTOCOL.md`
- Bússola estratégica: `docs/strategy/BUSSOLA_PRODUTO_SSE.md`
- Adoção formal: `docs/decisions/009-adocao-bussola-de-produto.md`
- Squad architecture: `docs/decisions/007-agent-squad-architecture.md`

## Dashboards estratégicos (leitura contínua)

- **NetSuite↔Bússola v1** (HTML interativo): `docs/strategy/ANALISE_NETSUITE_vs_BUSSOLA_v1.html` — adotado pelo Luigi em 2026-04-21 como artefato canônico de acompanhamento estratégico. Fonte textual: `ANALISE_NETSUITE_vs_BUSSOLA_v1.md`. Manutenção governada por **T-20260421-1** em `dm_queue.md` (gatilhos: mudança de status RF-004..007, ajuste da Bússola, novas anti-recs/áreas NetSuite, ADR-012). **Owner (conteúdo):** PO. **Owner (sync):** DM via gatilho.
