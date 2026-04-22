# Patch: Operating Model v2.0 → v2.1 — Sinais de adoção quebrada (saúde do squad)

**Arquivo-alvo:** `docs/process/OPERATING_MODEL_v2.md`
**Origem:** ADR-013 (draft em `.auto-memory/proposals/adr_013_draft.md`)
**Autor:** Luigi (PO) + PO Assistant
**Data:** 2026-04-21
**Aplicação:** pelo DM no PR correspondente (tarefa T-20260421-6 em `dm_queue.md`)

---

## Instruções ao DM

Patch **puramente aditivo** — adiciona um novo ritual (§5.4) e uma nota em §4 Cadência. Não altera atores, métricas, cadência existente, nem fluxo §7. Não renumera nada.

**Ordem das edições:**

1. Atualizar **header** (linhas 1–7) — bump v2.0 → v2.1
2. Adicionar **§5.4** após §5.3 (antes do separador `---` que precede `## 6. Métricas Oficiais`)
3. Adicionar 1 linha em **§4 Cadência** (tabela de rituais)

---

## EDIÇÃO 1 — Header

**Antes (v2.0):**

```markdown
# Operating Model v2 — Storm Shield Enterprise

> Documento canônico do modelo de operação do squad SSE.
> **Status:** v2.0 — Aceito em 2026-04-17 via ADR-010
> **Natureza:** formalização do que já existe na prática, não introdução de novos rituais
> **Autoridade:** este documento + HANDOFF_PROTOCOL.md (operacional) + Bússola (estratégica)
```

**Depois (v2.1):**

```markdown
# Operating Model v2 — Storm Shield Enterprise

> Documento canônico do modelo de operação do squad SSE.
> **Status:** v2.1 — Aceito em 2026-04-21 via ADR-013 (v2.0 original via ADR-010 em 2026-04-17)
> **Natureza:** formalização do que já existe na prática, não introdução de novos rituais
> **Autoridade:** este documento + HANDOFF_PROTOCOL.md (operacional) + Bússola (estratégica)
> **v2.1 (2026-04-21):** adiciona §5.4 "Health check do squad — sinais de adoção quebrada" como ritual recorrente do PM Agent. Origem: pacote MF (anti-pattern identificado — princípios sem revisão viram decoração).
```

---

## EDIÇÃO 2 — Nova §5.4 (adicionar após §5.3, antes do separador `---` que precede §6)

**Inserir exatamente este bloco:**

```markdown
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
```

---

## EDIÇÃO 3 — §4 Cadência (adicionar 1 linha na tabela de rituais)

**Localizar a tabela em §4 que lista os rituais com frequência. Adicionar linha:**

```markdown
| Health check do squad (§5.4) | Quinzenal (segunda) | PM Agent | Linha "Squad health" no status semanal + issues para itens quebrados |
```

> Se a tabela atual de §4 não existir com essa estrutura, pular esta edição — o ritual já é autoexplicativo em §5.4 com frequência declarada.

---

## Verificação pós-patch (DM deve rodar)

1. `grep -c "^### 5\." docs/process/OPERATING_MODEL_v2.md` — deve retornar 4 (§5.1, §5.2, §5.3, §5.4)
2. `grep "Health check do squad" docs/process/OPERATING_MODEL_v2.md` — deve ser encontrado
3. `grep "v2.1 — Aceito" docs/process/OPERATING_MODEL_v2.md` — deve ser encontrado no header
4. Validar que §6 Métricas Oficiais não foi tocada (métricas continuam as mesmas)
5. Validar que §7 Fluxo Padrão não foi alterada

---

*Fim do patch Operating Model v2.1. Aplicar em commit único: `docs(process): promote Operating Model to v2.1 with squad health ritual (ADR-013)`.*
