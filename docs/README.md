# Documentação — Storm Shield Enterprise

> **Nota:** Neste documento, "NS" refere-se a um ERP proprietário de terceiros usado exclusivamente como referência comparativa externa, sem relação comercial, licenciamento ou endosso. O nome da marca foi substituído por precaução (ver ADR-014).

Índice navegável de toda a documentação do SSE.

> **Se você chegou aqui pela primeira vez:** leia em ordem (1) `docs/strategy/BUSSOLA_PRODUTO_SSE.md`, (2) `../CLAUDE.md`, (3) `docs/process/HANDOFF_PROTOCOL.md`.
> Essa sequência dá contexto estratégico → técnico → operacional em ~30 min.

---

## Estrutura

| Pasta | Natureza | Conteúdo |
|---|---|---|
| [`strategy/`](strategy/) | Estratégia de produto | Bússola (personas, gaps, posicionamento, roadmap) |
| [`decisions/`](decisions/) | Decisões arquiteturais (ADRs) | Registros numerados de decisões técnicas e estratégicas |
| [`process/`](process/) | Protocolos operacionais | Handoff entre agentes, templates, ciclos de vida |
| [`architecture/`](architecture/) | Arquitetura técnica | DB schema, requisitos funcionais, diagramas ER |
| [`api/`](api/) | Especificação de API | OpenAPI, contratos REST |
| [`runbooks/`](runbooks/) | Operação / produção | Deploy, rollback, rotação de secrets, troubleshooting |
| [`audits/`](audits/) | Auditorias e relatórios datados | Gap analyses, readiness reports, security audits |

---

## Strategy — Estratégia de Produto

**Ler primeiro se você vai propor um RF ou redesenho de UX.**

- [`strategy/BUSSOLA_PRODUTO_SSE.md`](strategy/BUSSOLA_PRODUTO_SSE.md) — Bússola de Produto v0.1. Define ICP (body shop médio 5–15 func nos EUA), 4 personas primárias (Owner, Estimator, Technician, Accountant), 8 gaps críticos priorizados, posicionamento vs NS/Mitchell/CCC, princípios de design, arquitetura de navegação por persona, roadmap ancorado em gaps. **Autoridade formalizada em ADR-009.**
- [`strategy/RF_BACKLOG.md`](strategy/RF_BACKLOG.md) — Backlog de Requisitos Funcionais derivados dos Gaps Críticos da Bússola. v0.1 contém RF-001 (Landing por Persona), RF-002 (Setup Wizard), RF-003 (Event Tracking de Activation). Próximo RF a criar: **RF-004**.

---

## Decisions — ADRs (Architecture Decision Records)

Decisões técnicas e estratégicas importantes com contexto, alternativas consideradas e consequências. Cada nova decisão recebe próximo número sequencial. Próximo ADR a criar: **010**.

- [`decisions/001-multi-tenant-schema.md`](decisions/001-multi-tenant-schema.md) — Schema-per-tenant no PostgreSQL
- [`decisions/002-uuid-v7-primary-keys.md`](decisions/002-uuid-v7-primary-keys.md) — UUID v7 como PK universal
- [`decisions/003-double-entry-bookkeeping.md`](decisions/003-double-entry-bookkeeping.md) — Double-entry bookkeeping como base contábil
- [`decisions/004-fixed-asset-management.md`](decisions/004-fixed-asset-management.md) — Desenho do módulo FAM
- [`decisions/005-saas-tenant-isolation.md`](decisions/005-saas-tenant-isolation.md) — 3 camadas de isolamento (schema + RLS + dual DB users)
- [`decisions/006-staging-deploy-stack.md`](decisions/006-staging-deploy-stack.md) — Stack de staging (Fly.io + Vercel + Neon)
- [`decisions/007-agent-squad-architecture.md`](decisions/007-agent-squad-architecture.md) — Arquitetura do squad IA (PO + PM + DM + 4 subagentes)
- [`decisions/008-fam-implementation-decisions.md`](decisions/008-fam-implementation-decisions.md) — Decisões de implementação do FAM
- [`decisions/009-adocao-bussola-de-produto.md`](decisions/009-adocao-bussola-de-produto.md) — Adoção da Bússola como artefato estratégico oficial
- [`decisions/010-operating-model-v2.md`](decisions/010-operating-model-v2.md) — Operating Model v2: formalização de atores, cadência, rituais e métricas operacionais

---

## Process — Protocolos Operacionais

**Ler se você é um agente (PM, DM, subagente) do squad, ou se vai operar um handoff entre agentes.**

- [`process/HANDOFF_PROTOCOL.md`](process/HANDOFF_PROTOCOL.md) — Handoff Protocol v1.0. Define ownership matrix de `.auto-memory/`, templates canônicos (task, status, session), ciclo de vida de tarefas, cadência, regras de conflito, templates de abertura de sessão (§13). **Autoridade operacional do squad.**
- [`process/OPERATING_MODEL_v2.md`](process/OPERATING_MODEL_v2.md) — Operating Model v2. Define atores, hierarquia de documentos, cadência oficial (PO ad-hoc, PM diário, DM on-demand), rituais oficiais (rotação mensal `dm_queue`, revisão trimestral Bússola, revisão trimestral HANDOFF), métricas oficiais (lead time, # BLOCKED/semana, activation rate). **Formalizado em ADR-010.**

---

## Architecture — Arquitetura Técnica

Documentação de referência da arquitetura de dados e requisitos funcionais. Formatos mistos (Markdown, Word, Mermaid).

- `architecture/SSE_Banco_de_Dados_v1.0.docx` — Arquitetura completa do BD (65 entidades, 12 domínios)
- `architecture/SSE_Requisitos_Funcionais_v1.2.docx` — Requisitos funcionais (10 seções)
- `architecture/SSE_Diagrama_ER.mermaid` / `.html` — Diagrama ER
- `architecture/SSE_Quadro_Comparativo_FAM.xlsx` — Comparação Oracle/NS vs SSE (FAM)

> **Nota:** arquivos `.docx` e `.xlsx` são abertos fora do editor. Para convenções de schema e migrations, consultar `../CLAUDE.md` §3 (mais atualizado).

---

## API — Especificação

- `api/openapi.yaml` — especificação OpenAPI. Swagger interativo disponível em `/docs` quando a API está rodando.

---

## Runbooks — Operação

Procedimentos operacionais para deploy, rollback, incidentes.

- [`runbooks/staging-deploy.md`](runbooks/staging-deploy.md) — Deploy de staging (Fly.io + Vercel + Neon), troubleshooting, rotação de secrets

---

## Audits — Auditorias e Relatórios

Documentos datados e de escopo específico.

- [`audits/grupo-b-gaps.md`](audits/grupo-b-gaps.md) — Análise de gaps de frontend (Grupo B)

---

## .archive — Documentos históricos

Documentos que foram autoritativos no passado mas não refletem o estado atual. Mantidos para contexto histórico; não seguir como guia atual.

Conteúdo movido para `docs/.archive/` durante auditorias periódicas (ver sessões PO em `.auto-memory/po_sessions.md`).

---

## Localização de outros docs fora de `docs/`

Nem toda documentação do SSE vive em `docs/`. Ponteiros para os demais:

- [`../README.md`](../README.md) — README do projeto (stack, getting started, endpoints, status)
- [`../CLAUDE.md`](../CLAUDE.md) — Bootstrap técnico completo para Claude Code / contributors
- [`../AGENTS.md`](../AGENTS.md) — Coordenação alto-nível entre agentes
- [`../CHANGELOG.md`](../CHANGELOG.md) — Changelog do projeto
- [`../.auto-memory/`](../.auto-memory/) — Memória operacional do squad (status PM, queue DM, sessões PO)
- [`../.claude/agents/`](../.claude/agents/) — Prompts dos subagentes e de PM/DM scheduled tasks

---

## Cadência de manutenção

Este índice é atualizado pelo PO Assistant em cada sessão que adiciona/remove documento em `docs/`. Última atualização: 2026-04-17 (sessão PO parte 4, WS-D).
