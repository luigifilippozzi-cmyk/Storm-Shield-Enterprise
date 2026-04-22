# ADR-013 — Incorporação parcial do framework PV/PUX e saúde do squad do pacote MF

**Status:** Accepted
**Data:** 2026-04-21
**Autor:** Luigi (PO) + PO Assistant (Cowork)
**Relacionados:** ADR-009 (adoção da Bússola v1.0), ADR-010 (Operating Model v2), ADR-012 (Incorporação parcial NetSuite)
**Nota de numeração:** ADR-011 permanece **reservado** para release cadence (pendente de T-20260412-1 — Deploy API — sair de BLOCKED). Este ADR usa o slot 013.

---

## Contexto

Em 2026-04-21 (sessão noturna parte 2), Luigi disponibilizou um **pacote de conhecimento exportado do projeto Minhas Finanças (MF)** — um produto paralelo maduro em governança de squad assistido por IA. O pacote contém 10 documentos destilando ~18 meses de aprendizados: princípios de UX (PUX1–PUX6), princípios visuais (PV1–PV6), padrões de subagente (ux-reviewer), estrutura da Bússola de Produto, regras invioláveis, workflow Git/PowerShell, anti-patterns e checklist de adoção.

**Motivação:** incorporar lições aprendidas do MF no SSE **respeitando o roadmap vigente** (Fase 1 ~95%, 4 RFs recém-aprovados via ADR-012) e **sem custo de retrabalho**. A sessão de triagem com o PO (via AskUserQuestion) delimitou o escopo: Opção A — Cirúrgica — PV/PUX no documento Bússola + checklist de saúde do squad no Operating Model. Sem redesign de UI, sem subagente novo, sem refactor de código.

**Análise de reconciliação (PV/PUX × P1–P8 SSE):** zero conflito. PV3 e PUX1 **reforçam** P1 (landing por persona tem hero por persona). PUX2 (`tabular-nums`) **reforça** P6 (contabilidade nos bastidores — quando números aparecem, precisam ser legíveis). PUX6 (skeletons) **reforça** P3 (time-to-first-value). PV6 (densidade) **complementa** P6 (accountant vê GL denso, owner vê KPIs folgados). Os 6 restantes (PV1, PV2, PV4, PV5, PUX3, PUX4, PUX5) são **adições novas** que não tocam nos guardrails operacionais existentes.

**Stack gap e tradução:** MF é vanilla HTML + CSS custom properties em `variables.css` + Lucide + Inter/Fraunces. SSE é Next.js 15 + Tailwind + shadcn/ui + next-themes + Lucide (herdado por shadcn/ui). Os princípios são stack-agnósticos; as checklists do MF que citam `--space-*`, `[data-theme="dark"]` e `variables.css` são traduzidas para Tailwind utilities, shadcn/ui CSS variables e next-themes na redação dos patches (não importamos literalmente).

---

## Opções consideradas

| Opção | Risco | Custo | Reversão |
|---|---|---|---|
| **A. Cirúrgica — absorver PV/PUX na Bússola + saúde do squad no Operating Model; expandir frontend-reviewer existente** | **Baixo.** Mudanças são adições doc-only. P1–P8 permanecem intactos. Nenhum código tocado. Nenhum subagente novo. | ~1 sessão PO (esta) + 4 tarefas DM doc-only em `dm_queue.md` + 1 sync do dashboard | Se em 3 PRs consecutivos de UI o `frontend-reviewer` não citar PV/PUX como critério, ADR-013 é reaberto — sinal de que absorção não pegou. Reversão zera custo (só reverte docs). |
| B. Ampla — adotar todos os 10 arquivos do pacote MF (inclui criar subagente `ux-reviewer` independente, RF-UI-SSE de paleta/tipografia, patches em CLAUDE.md com múltiplas regras novas, workflow Git/PowerShell refatorado) | **Médio-alto.** Concorre com RF-004..007 (recém-aprovados, P1) por banda do squad. Risco de "big-bang" diluir foco na métrica de activation. | ~3–5 sessões PO + retrabalho em squad v2 + discovery de paleta concreta + testes de regressão em UI já merged | Maior — requer reverter múltiplos artefatos. |
| C. Descartar / esperar v2.0 da Bússola | Perda de janela — pacote MF é estado-da-arte e a Fase 2 começa em breve com RFs de UI (RF-004 Customer 360). Entrar em Fase 2 sem PV/PUX cria dívida visual que depois custa refactor. | Zero imediato | Permanece no histórico como insumo |

---

## Decisão

**Opção A — Cirúrgica.**

Concretamente, esta decisão formaliza:

1. **Bússola promovida para v1.2** (arquivo `docs/strategy/BUSSOLA_PRODUTO_SSE.md`):
   - **§6 reorganizada** em três subseções, sem renumerar nem alterar o texto de P1–P8:
     - **§6.1 Princípios de Produto (P1–P8)** — conteúdo atual integral, apenas renumerado como subseção
     - **§6.2 Princípios Visuais (PV1–PV6)** — nova, adotada integralmente com redação SSE-specific (Tailwind + shadcn/ui + next-themes + next/font)
     - **§6.3 Princípios de UX (PUX1–PUX6)** — nova, adotada integralmente com checklists verificáveis traduzidos para o stack
   - **§9 Registro** — linha ADR-013 + decisões derivadas
   - **Header v1.2** com resumo da mudança

2. **Operating Model v2.1** (`docs/process/OPERATING_MODEL_v2.md`):
   - Nova subseção **"Sinais de adoção quebrada"** (checklist de saúde do squad) como ritual recorrente do PM Agent. Origem: pacote MF (observação de que subagentes sem amarração viram artefatos mortos).

3. **`frontend-reviewer`** (localizado em `.claude/agents/SSE_Prompts_Squad_IA.md` DM-06, linhas 308–335):
   - Checklist expandido de 8 para ~26 itens (8 atuais + 6 PV + 6 PUX + itens derivados).
   - **Sem criar subagente novo** — a absorção é no existente, conforme decisão PO.

4. **CLAUDE.md regra 19** (sugestão de texto gerada; aplicação pelo DM):
   > *"Todo PR que cria ou modifica tela (arquivos `.tsx` em `apps/web/src/app/**` ou componentes em `apps/web/src/components/**`) deve respeitar os princípios PV1–PV6 e PUX1–PUX6 da Bússola §6.2 e §6.3. O `frontend-reviewer` bloqueia merge em caso de violação. Violação justificada exige ADR próprio."*

5. **Decisões intencionalmente adiadas (escopo negativo desta decisão):**
   - **Paleta concreta** (cor primária, familias tipográficas): fica para RF-UI-SSE futuro, análogo ao NRF-UI-WARM do MF. Adotamos o princípio PV1/PV2; não a implementação.
   - **Subagente `ux-reviewer` independente:** não criar; absorver em `frontend-reviewer`.
   - **Workflow Git/PowerShell do MF:** não adotar agora; SSE já tem seu próprio em `docs/process/` e isso é mudança maior.
   - **Anti-patterns adicionais:** catalogar depois; não bloquear este ADR.

---

## Condição de reversão

Reabrimos este ADR se **qualquer** das condições abaixo for observada:

1. **3 PRs consecutivos de UI mergeados sem que o relatório do `frontend-reviewer` mencione PV ou PUX como critério aplicado.** Sinal: absorção virou decoração, não regra.
2. **Uma RF da Fase 2 (RF-004..007) entrega UI que contradiz 2+ princípios PV/PUX sem ADR de exceção.** Sinal: princípios não pegaram no fluxo de dev.
3. **PO ou Dev Manager levantam em retrospectiva trimestral que os princípios criam atrito maior que valor entregue.** Sinal: tradução para stack SSE ficou errada.

Observação do PO em sessão: a condição #1 é mensurável imediatamente após mergear 3 PRs; #2 é checada na retrospectiva de Fase 2 (julho/2026 provável); #3 é revisão trimestral de rotina (ADR-010 §4).

---

## Consequências

**Positivas:**
- Ganha vocabulário comum para crítica de UI (`frontend-reviewer` passa a dizer "viola PUX4 — cor hardcoded" em vez de "revisar escolhas de cor").
- RF-004 (Customer 360 — P1) e futuro Cockpit do Owner entram com PV/PUX desde o dia 1 — evita dívida visual.
- Alinha o projeto com o que o MF já validou em produção ao longo de ~18 meses — sinal de confiança nos princípios.
- Custo marginal (doc-only) vs. alto retorno em coerência estratégica.

**Negativas / riscos:**
- Checklist maior no `frontend-reviewer` aumenta custo cognitivo por PR (mitigado: itens são verificáveis, não subjetivos).
- Risco de "poesia" — princípios sem consequência viram decoração. Mitigado: regra 19 do CLAUDE.md + condição de reversão #1.
- Se a paleta concreta demorar a ser decidida, PV1/PV2 ficam como promessa vazia. Mitigado: adotamos **o princípio**, não a implementação; frontend-reviewer avalia "zero hardcoded" e "uso de tokens", não exige paleta específica.

**Neutro:**
- ADR-011 continua reservado para release cadence (pendente de T-20260412-1).

---

## Arquivos produzidos por esta decisão (quando aplicada)

1. `docs/decisions/013-incorporacao-parcial-pv-pux.md` (este arquivo, promovido de draft para Accepted pelo DM)
2. `docs/strategy/BUSSOLA_PRODUTO_SSE.md` v1.2 (patch aplicado)
3. `docs/process/OPERATING_MODEL_v2.md` v2.1 (patch aplicado)
4. `.claude/agents/SSE_Prompts_Squad_IA.md` (seção DM-06 expandida)
5. `CLAUDE.md` (regra 19 adicionada — sugestão de texto fornecida pelo PO)
6. `AGENTS.md` (nota de atualização da regra 19 e referência PV/PUX)
7. `.auto-memory/MEMORY.md` (entry de incorporação MF adicionada)

Artefatos de rastreabilidade em `.auto-memory/proposals/`:
- `adr_013_draft.md` (este arquivo)
- `bussola_v1_2_patch_pv_pux.md`
- `operating_model_v2_1_patch_squad_health.md`
- `frontend_reviewer_patch_pv_pux.md`

---

## Referências

- Pacote de conhecimento MF — `C:\Users\luigi\...\uploads\02-subagente-ux-reviewer.md`, `03-principios-ux-pv-pux.md`, `05-bussola-produto-template.md`, `09-checklist-adocao-sse.md` (lidos na sessão de 2026-04-21 noite)
- Bússola SSE v1.1 atual — `docs/strategy/BUSSOLA_PRODUTO_SSE.md` §6 (P1–P8)
- ADR-009 (adoção da Bússola)
- ADR-010 (Operating Model v2)
- ADR-012 (incorporação parcial NetSuite — precedente imediato de incorporação externa)

---

*Fim do ADR-013 draft. Ao ser promovido para Accepted pelo DM, este arquivo é copiado para `docs/decisions/013-incorporacao-parcial-pv-pux.md` com status "Accepted" e datado 2026-04-21.*
