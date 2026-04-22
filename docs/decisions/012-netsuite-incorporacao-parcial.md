# ADR-012 — Incorporação parcial de padrões NetSuite à Bússola v1.1

**Status:** Accepted
**Data:** 2026-04-21
**Autor:** Luigi (PO) + PO Assistant (Cowork)
**Relacionados:** ADR-009 (adoção da Bússola v1.0), ADR-010 (Operating Model v2)
**Nota de numeração:** ADR-011 permanece **reservado** para release cadence (pendente de T-20260412-1 — Deploy API — sair de BLOCKED). Este ADR usa o slot 012.

---

## Contexto

Em 2026-04-21, em sessão PO Cowork, foi conduzida análise comparativa entre a documentação pública do NetSuite (`docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/`) e a Bússola de Produto SSE v1.0 (adotada via ADR-009). O resultado está documentado em `docs/strategy/ANALISE_NETSUITE_vs_BUSSOLA_v1.md` (relatório) + `ANALISE_NETSUITE_vs_BUSSOLA_v1.html` (dashboard interativo vivo, adotado como instrumento de acompanhamento contínuo).

A análise cobriu 12 áreas (Core ERP, Journal Entries, FAM, AP/AR + Bank Recon, Sales Tax + 1099, CRM, Work Orders/FSM, Navegação/Dashboards, Mobile, Workflow/Approvals, Classifications/Subsidiaries, SuiteBilling) com uso de WebSearch restrito a `docs.oracle.com` (fetch direto foi bloqueado pela allowlist Cowork).

**Motivação da análise:** confrontar a Bússola com as melhores práticas documentadas do NetSuite — referência de indústria em ERP — sem perder o posicionamento "simpler + cheaper + purpose-built" (Bússola §1). Identificar gaps não-vistos, reforços possíveis, e padrões adotáveis **sem violar P1–P7** (Bússola §6).

**Síntese:** a análise validou ~95% das decisões da Bússola e revelou 4 padrões concretos valiosos + 13 anti-features explicitáveis + 1 novo princípio (offline-first) + ajustes pontuais em §5/§7/§8. Não surgiu ameaça estratégica; surgiram refinamentos.

---

## Opções consideradas

| Opção | Risco | Custo | Reversão |
|---|---|---|---|
| **A. Adotar ajustes propostos via Bússola v1.1 + 4 RFs novos + P8** | Baixo — mudanças são adições, não redesenho. Bússola v1.0 continua coerente se v1.1 for revertida. | ~1 sessão PO (esta) + 4 tarefas DM geradas em `dm_queue.md` + 1 sync do dashboard | Revisitar na revisão trimestral de julho/2026 (ADR-010 §4). RFs podem ser cancelados antes de entrar em dev sem custo. |
| B. Esperar revisão trimestral natural (julho/2026) | Perda de janela de 2–3 meses para incorporar aprendizados no roadmap Fase 2 | Zero | Nenhuma (não muda) |
| C. Descartar aprendizados | Contradiz princípio de evolução da Bússola; perde valor já investido na análise | Zero | Permanece no histórico como insumo |

---

## Decisão

**Opção A — adotar ajustes propostos.**

Concretamente, esta decisão formaliza:

1. **Bússola promovida para v1.1** (arquivo `docs/strategy/BUSSOLA_PRODUTO_SSE.md` atualizado):
   - **§5 Simplificamos** — 7 linhas novas: Custom Segments/Classifications, SuiteFlow, Saved Searches, OneWorld/Subsidiaries, SuiteBilling, Dashboard Portlets configuráveis, Intelligent Transaction Matching.
   - **§5 Herdamos → Superamos** — 1099-NEC movido (NetSuite não gera nativo; depende de Yearli/Sovos/Track1099). Adicionados: MACRS nativo em FAM, Activation tracking instrumentado.
   - **§6 Princípios** — novo **P8 (Offline-first para shop floor)**. Mobile do Technician precisa funcionar offline; desktop não. Origem: gap NetSuite FSM Mobile.
   - **§7 Navegação** — Global Search (Cmd/Ctrl+K) torna-se **obrigatório**; nota de nomenclatura adotando "Workspace" (não "Center").
   - **§8 Ordem de ataque** — 5 linhas adicionadas: RF-004 P1, RF-005 P1, RF-006 P1, RF-007 P2, ajuste Cockpit (Available Balance vs Cash Balance) P1.

2. **4 RFs novos formalizados em `docs/strategy/RF_BACKLOG.md` com status APPROVED:**
   - **RF-004 Customer 360 View** — P1 Fase 2. Persona Estimator. Tela unificada com 7 abas. Fecha fricção CRM (candidato a Gap 9 na próxima revisão).
   - **RF-005 Estimate State Machine + Inbox** — P1 Fase 2. Persona Estimator. Fecha Gap 5 (Insurance workflow). Formaliza o "RF futuro" que estava em §8.
   - **RF-006 Payment Hold / Disputed Estimate** — P1 Fase 2. Persona Estimator. Complementa Gap 5. Depende de RF-005.
   - **RF-007 Case Management simplificado** — P2 Fase 2. Persona Estimator. Complementa Gap 5. Intencionalmente leve — anti-rec #13 formaliza limite de escopo.

3. **13 anti-recomendações explícitas documentadas** em `ANALISE_NETSUITE_vs_BUSSOLA_v1.md §7` — servem de referência rápida para rejeitar discovery recorrente de features NetSuite que não cabem no SSE.

4. **Dashboard NetSuite↔Bússola** (`ANALISE_NETSUITE_vs_BUSSOLA_v1.html`) adotado como artefato vivo de acompanhamento estratégico, mantido via **T-20260421-1** (standing task no `dm_queue.md`) com 6 gatilhos explícitos de atualização.

5. **3 dúvidas técnicas** permanecem para o DM decidir e registrar no PR/ADR apropriado de cada RF:
   - Reversing Journal Entries já existe no SSE? (relevante para accountant)
   - Half-Year convention MACRS está implementada? (compliance IRS)
   - Global Search Cmd+K está no SSE? (ENH P1 se não)

---

## Justificativa

- **Validações reforçam decisões já tomadas** (baixo risco). NetSuite Centers = Workspaces SSE; NetSuite não tem wizard de onboarding nem activation tracking — SSE mantém diferencial; ICP body shop não usa SuiteFlow/SuiteBilling/OneWorld.
- **4 novos RFs complementam gaps existentes** sem abrir frentes novas. RF-004/005/006 amplificam Gap 5. RF-007 fecha fricção marginal. Ajuste no Cockpit refina Gap 4 antes do RF ser escrito.
- **Janela de incorporação está aberta** — Fase 2 ainda não congelou escopo (T-20260412-1 BLOCKED, Fase 1 em fechamento). Aplicar os aprendizados agora evita retrabalho quando Fase 2 iniciar.
- **P8 (offline-first) é gap concreto** identificado via NetSuite FSM Mobile. Sem P8, o RF futuro de Mobile PWA Technician (Gap 2) pode ser entregue sem offline e quebrar P2 (mobile-first real, não responsive tardio).
- **13 anti-features explicitadas reduzem debate recorrente** — próxima vez que surgir "mas e se fizermos X do NetSuite?", este ADR + `ANALISE §7` respondem.

---

## Condição de reversão

Este ADR deve ser **reaberto e reavaliado** se qualquer das condições abaixo se materializar:

1. **≥ 2 dos 4 novos RFs (004/005/006/007) forem cancelados** antes de entrarem em dev por reavaliação como overhead. Sinaliza que a incorporação foi prematura.
2. **P8 (offline-first) entrar em conflito com complexidade do PWA** na Fase 2 ao ponto de atrasar Gap 2 em > 30 dias. Revisitar se P8 é requisito ou "nice-to-have".
3. **Mudança material na Bússola** (ICP, personas, posicionamento) na revisão trimestral de julho/2026 — pode invalidar a pertinência dos RFs.
4. **Descoberta de que algum dos RFs (especialmente 007) não é usado** após 90 dias em produção (≤ 5% dos tenants abrem case em 3 meses) — cancelar RF e documentar em novo ADR.

---

## Consequências

**Positivas (+):**
- Bússola v1.1 passa a enumerar **13 anti-recomendações explícitas** (antes implícitas), reduzindo debate recorrente com agentes e colaboradores humanos.
- 4 RFs adicionados ao backlog com escopo claro, complexidade mapeada, dependências identificadas. DM pode sequenciar sem ambiguidade.
- Princípio **P8 alinha Gap 2** (Mobile Technician) com padrão de indústria (FSM Mobile) antes do RF ser escrito — evita retrabalho.
- **§5 (Simplificamos) fica mais robusta** — SuiteFlow, Saved Searches, Custom Segments, OneWorld, SuiteBilling agora são descope formal, não implícito.
- **1099-NEC promovido a diferencial** narrativo (era herança; agora é superação clara sobre NetSuite).
- **Dashboard NetSuite↔Bússola** vira instrumento de acompanhamento contínuo — Luigi tem um painel visual do alinhamento estratégico.

**Negativas (−):**
- **Custo de sessão PO** para formalizar v1.1 (esta sessão) + 4 RFs + ADR.
- **Pressão no Fase 2** para incluir RF-004 e RF-006 (P1) **além** dos itens já previstos (Cockpit, Insurance workflow, Mobile PWA). DM precisa validar capacidade do time.
- **Bússola cresce** de 378 para ~460 linhas — risco marginal de a leitura de abertura ficar mais custosa. Mitigado pela seção §10 "Como usar" que prioriza §1, §2, §6.
- **Dependência entre RFs** (RF-006 precisa de RF-005; RF-004 complementa mas não bloqueia) exige sequenciamento — não é paralelizável 1:1.

---

## Handoff e rastreabilidade

- Tarefas DM abertas em `.auto-memory/dm_queue.md` (T-20260421-2, T-20260421-3, T-20260421-4, T-20260421-5 — uma por RF, com escopo negativo conforme HANDOFF_PROTOCOL §4).
- Dashboard sincronizado via T-20260421-1 (gatilhos #1 e #5 disparados nesta sessão).
- `project_sse_status.md` atualizado (ADR count 10 → 11 com ADR-012; ADR-011 continua reservado).
- Sessão registrada em `po_sessions.md` com decisões + condições de reversão.

**Arquivo:** `docs/decisions/012-netsuite-incorporacao-parcial.md`
**Relacionados:** `docs/decisions/009-adocao-bussola-de-produto.md`, `docs/decisions/010-operating-model-v2.md`, `docs/strategy/BUSSOLA_PRODUTO_SSE.md` (v1.1), `docs/strategy/RF_BACKLOG.md` (v0.2), `docs/strategy/ANALISE_NETSUITE_vs_BUSSOLA_v1.md`.
