# Sugestão: CLAUDE.md Regra 19 — PV/PUX da Bússola §6.2/§6.3

**Arquivo-alvo:** `CLAUDE.md` (seção 10 "Regras para o Claude Code")
**Origem:** ADR-013 (draft em `.auto-memory/proposals/adr_013_draft.md`)
**Autor:** Luigi (PO) + PO Assistant
**Data:** 2026-04-21
**Status:** **SUGESTÃO** — PO não altera CLAUDE.md diretamente. Luigi decide manualmente ou via tarefa ao DM (T-20260421-6 inclui essa sugestão como sub-item).

---

## Contexto

O PO Assistant, por convenção operacional, **não edita** `CLAUDE.md`, `CHANGELOG` nem `AGENTS.md`. Apenas sugere texto. A regra 19 abaixo é a sugestão formal que sai do ADR-013.

---

## Localização

`CLAUDE.md` seção **10. Regras para o Claude Code** atualmente tem 18 regras. Adicionar **Regra 19** imediatamente após a Regra 18 ("Sempre operar conforme `docs/process/OPERATING_MODEL_v2.md`"), preservando a sequência.

---

## Texto sugerido para Regra 19

```markdown
19. **Sempre** respeitar os princípios PV1–PV6 (§6.2) e PUX1–PUX6 (§6.3) da Bússola de Produto em todo PR que cria ou modifica UI — arquivos `.tsx` em `apps/web/src/app/**` ou `apps/web/src/components/**`. O subagente `frontend-reviewer` (DM-06 em `.claude/agents/SSE_Prompts_Squad_IA.md`) é obrigatório em PRs de UI e bloqueia merge em caso de violação. Violação justificada exige ADR próprio, não comentário no PR. Adotado via ADR-013.
```

---

## Categoria da regra

Seção 10 do CLAUDE.md tem 3 blocos semânticos (inferidos pela numeração atual):

- 1–14: Regras técnicas invioláveis (bloqueantes em PR)
- 15–18: Alinhamento estratégico (Bússola, HANDOFF, Operating Model)
- **19 (novo): alinhamento visual/UX** — extensão natural do bloco 15–18 já que ref. Bússola

Ficaria consistente com a nomenclatura "Alinhamento estratégico" expandida para "Alinhamento estratégico e de experiência".

---

## Efeito em conjunto com `frontend-reviewer` expandido

Regra 19 **amarra** o checklist expandido do `frontend-reviewer` (patch em `frontend_reviewer_patch_pv_pux.md`). Sem Regra 19, o checklist seria só documentação; com Regra 19, é gating de merge.

Esse é exatamente o padrão do MF (Regra Inviolável #14 + `ux-reviewer`): a checklist só "pega" quando há regra correspondente no prompt do agente principal.

---

## Condição de reversão (vinculada a ADR-013)

Se nos 90 dias seguintes à adoção:
- `frontend-reviewer` não bloquear merge por violação PV/PUX em nenhum PR → a regra virou decoração (reabrir ADR-013)
- Ou: bloqueios se tornarem >50% dos PRs de UI → checklist está calibrado mal (reabrir ADR-013 para ajuste)

---

*Fim da sugestão. Luigi aplica em `CLAUDE.md` manualmente ou delega ao DM via T-20260421-6.*
