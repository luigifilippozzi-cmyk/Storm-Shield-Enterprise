# DM Agent — Handoff T-20260422-1 (P2, PENDING)

## Origem

PO Assistant (Cowork) — sessão 2026-04-22 parte 2. Aprovado por Luigi.

## Resumo executável

Substituir **marca registrada de um ERP externo** (usado como referência comparativa) por sigla **NS** em 19 arquivos versionados do repo SSE, acompanhada de disclaimer canônico. Renomear 3 arquivos cujos nomes contêm a marca, com stubs de redirect de 60 dias. Executar sweep análogo em issues/PRs do GitHub (abertos + fechados/mergeados). Publicar ADR-014 no mesmo PR.

## O que já está pronto (não refaça)

1. **T-20260422-1** em `.auto-memory/dm_queue.md` — template canônico com 19 arquivos listados, critérios de aceite, escopo negativo, subagentes, labels. Leia antes de começar.
2. **ADR-014 draft** em `.auto-memory/proposals/adr_014_draft.md` — copiar integralmente para `docs/decisions/014-remocao-mencao-marca-erp-referencia.md` no PR. Atualizar **Status** de DRAFT → Accepted e **Changelog** com data de merge.
3. **Disclaimer canônico** — texto completo dentro do ADR-014 draft. Aplicar no topo de cada doc impactado (adaptar sintaxe para .html com `<!-- -->` e .sql com `-- `).
4. **Snippets do sweep GitHub** — preservados em `.auto-memory/po_sessions.md` na sessão 2026-04-22 parte 2. Três etapas: Discovery → Execution → Verify.

## Workflow recomendado (ordem)

1. `git checkout -b chore/SSE-trademark-hygiene-NS`
2. Copiar ADR-014 draft → `docs/decisions/014-remocao-mencao-marca-erp-referencia.md`
3. Aplicar disclaimer no topo dos 19 arquivos impactados
4. Executar substituição textual (ordem importa — mais longa primeiro):
   - `NS` → `NS`
   - `NS` → `NS`
   - `NS` → `NS`
   - `NS` → `NS`
   - `NS` → `NS`
5. Renames com stubs (1 linha: `Moved to <novo_caminho> (ADR-014). Stub será removido em 2026-06-22.`):
   - `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.md` → `ANALISE_NS_vs_BUSSOLA_v1.md`
   - `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.html` → `ANALISE_NS_vs_BUSSOLA_v1.html`
   - `docs/decisions/012-ns-incorporacao-parcial.md` → `012-ns-incorporacao-parcial.md`
6. Atualizar links cruzados:
   - `.auto-memory/MEMORY.md` (entrada "NS↔Bússola v1" — trocar path + nome)
   - `.auto-memory/dm_queue.md` (T-20260421-1 referência de path)
   - `docs/decisions/008`, `009`, `013` (referências cruzadas a 012)
   - `CLAUDE.md`, `README.md`, `docs/README.md`, `sse-squad-dashboard.html`
7. Executar **Etapa 1 — Discovery** do sweep GitHub. Revisar CSV manualmente.
8. Executar **Etapa 2 — Execution**. Verificar log.
9. Executar **Etapa 3 — Verify**. Confirmar zero residual no GitHub.
10. Rodar grep local final (ver critério de aceite da T-20260422-1).
11. `git add -A && git commit` com mensagem Conventional Commits:
    `chore(docs): substituir marca de ERP externo por sigla NS (ADR-014)`
12. Abrir PR com descrição linkando ADR-014 e T-20260422-1. Atribuir subagente **test-runner**; adicionar **frontend-reviewer** se `sse-squad-dashboard.html` tiver JS relevante.
13. Aguardar CI verde e aprovação do PO antes de mergear.

## Subagentes

- **test-runner** (obrigatório, CI básico)
- **frontend-reviewer** (condicional — só se `.tsx` for tocado ou `sse-squad-dashboard.html` afetar JS/UI)
- **security-reviewer**: **não aplicável** (sem auth/RLS)
- **db-reviewer**: **não aplicável** (sem migration)

## Escopo negativo (NÃO fazer)

- NÃO rodar `git filter-branch` nem reescrever commits
- NÃO usar `--force-push` (viola regra 1 do CLAUDE.md)
- NÃO alterar documentos Oracle em `.gitignore` (referência externa, nunca commitados)
- NÃO reescrever conteúdo analítico/comparativo — só a string + disclaimer
- NÃO renomear ADRs 008 ou 013 (não contêm a marca no filename)
- NÃO editar comentários nem reviews no GitHub — só título e corpo de issues/PRs
- NÃO tocar em `apps/api/src` ou `apps/web/src` sem evidência de match (grep inicial não encontrou)

## Critérios de aceite (Done)

Checklist em `.auto-memory/dm_queue.md` → T-20260422-1. Resumo:

- [ ] ADR-014 publicado
- [ ] Disclaimer em todos os docs impactados
- [ ] 3 renames com stubs
- [ ] Links cruzados atualizados
- [ ] `grep -ri "NS" C:\Dev\storm-shield-enterprise` → só stubs + menção explicativa única no ADR-014 + logs em `.auto-memory/sweeps/`
- [ ] Sweep GitHub Verify: zero residual
- [ ] CI verde
- [ ] PR aprovado pelo PO

## Após merge — ação do PO (informar)

O PO (via Cowork) vai:
- Atualizar `.auto-memory/MEMORY.md` (entrada do dashboard estratégico)
- Mover T-20260422-1 para `.auto-memory/dm_queue_archive.md`
- Fechar task list do acompanhamento

## Protocolo

`docs/process/HANDOFF_PROTOCOL.md` §4 (template canônico) + §7 (ciclo de vida: PENDING → IN_PROGRESS → COMPLETED → archive).

## Reversão

ADR-014 seção "Condição de reversão" define os 4 gatilhos. Stubs de 60 dias (até 2026-06-22) facilitam rollback parcial.
