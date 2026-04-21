
---
name: Dev Manager Queue (unified)
description: Fila única de tarefas para o Dev Manager — consolidada do PO e PM conforme HANDOFF_PROTOCOL.md §3
type: project
---

# Dev Manager Queue — SSE

> Fila única. Tarefas novas no topo. Template canônico em `docs/process/HANDOFF_PROTOCOL.md` §4.
> Status permitidos: PENDING | IN_PROGRESS | BLOCKED | COMPLETED
> Rotação: COMPLETED movidas para `dm_queue_archive.md` no primeiro dia útil de cada mês.

---

## T-20260420-1 — Hardening dos prompts do Dev Manager (pós-Bash(*))

**Origin:** PO
**Priority:** P1
**Status:** COMPLETED
**Created:** 2026-04-20
**Claimed:** 2026-04-21
**Completed:** 2026-04-21
**Branch:** chore/SSE-049-dm-prompt-hardening (deleted)
**PR:** #35 (merged)

### Objetivo
Fechar gap de segurança criado quando `.claude/settings.local.json` foi trocado para `Bash(*)` (2026-04-20). Com o shell 100% liberado, os prompts dos agentes viraram o único gate de safety. Reforçar `DevManager_Squad_v2.md` com proibições explícitas de comandos destrutivos e cheque em branco de exclusão de arquivos.

### Contexto
O allow list em `.claude/settings.local.json` foi enxugado de 80 entradas para `Bash(*)` + 1 Read em 2026-04-20 a pedido do PO (zero interrupção durante sessões de subagentes). Backup em `.claude/settings.local.json.bak-20260420`. Regra 1 do CLAUDE.md ("NUNCA push direto em main") agora depende 100% da disciplina do agente, não de gate de aprovação. Revisão crítica do PO identificou 3 gaps de alta severidade no prompt do DM:
- Sem proibição explícita de `rm -rf`, `git reset --hard` main, `force-push`, `DROP/TRUNCATE`
- Sem proibição de `curl | sh` / `wget | bash` / instalação fora de lockfile
- Pré-autorização cheque em branco: "excluir qualquer arquivo do projeto" sem escopo negativo protegendo CLAUDE.md / AGENTS.md / docs/decisions / docs/strategy / .auto-memory/MEMORY.md

### Ação sugerida

**Arquivo:** `.claude/agents/DevManager_Squad_v2.md`

**Patch 1 — bloco "O QUE NAO FAZER" (após linha 354, antes do final):**

```
- NUNCA `rm -rf` sem path explícito verificável no diff; nunca em /, ~/, $HOME, C:\, C:\Users\*, C:\Dev
- NUNCA `git reset --hard` em main/develop; NUNCA `git push --force` em branch compartilhada
- NUNCA `DROP TABLE`, `TRUNCATE`, `DELETE FROM` sem WHERE em ambiente staging/prod
- NUNCA `curl | sh`, `wget | bash`, ou execução de script baixado sem inspecionar
- NUNCA instalar dependência fora de `pnpm add` (respeitar lockfile) ou de registry não-oficial
- NUNCA editar/deletar sem aprovação explícita do PO na sessão atual:
  CLAUDE.md, AGENTS.md, .auto-memory/MEMORY.md, docs/decisions/*.md,
  docs/strategy/*.md, docs/process/OPERATING_MODEL_v2.md, docs/process/HANDOFF_PROTOCOL.md
- A Regra 1 (feature branch SEMPRE, NUNCA push direto em main) é reforçada por disciplina do agente,
  NAO por gate de permissao do Claude Code. Se tentar commitar em main, abortar e escalar ao PO.
```

**Patch 2 — substituir linha 7 (PRE-AUTORIZACAO TOTAL):**

De: `"criar/editar/excluir qualquer arquivo do projeto"`
Para: `"criar/editar/excluir arquivos de codigo, testes, migrations, seeds, configs e docs tecnicas; ESCOPO NEGATIVO: nao apagar CLAUDE.md, AGENTS.md, .auto-memory/MEMORY.md, docs/decisions/*, docs/strategy/*, docs/process/OPERATING_MODEL_v2.md, docs/process/HANDOFF_PROTOCOL.md sem aprovacao explicita do PO na sessao atual"`

### Escopo negativo — NÃO fazer nesta entrega
- Não mexer em `PMAgent_Squad_v2.md` nem nos subagentes (cobertos pela T-20260420-2)
- Não alterar `CLAUDE.md` §10 (regras 1–18) — estão corretas; o gap é espelhamento no prompt DM
- Não redigir ADR — é housekeeping de prompt, não decisão arquitetural
- Não aplicar as proibições como lint automático — é guidance textual, não hook

### Done quando
- `.claude/agents/DevManager_Squad_v2.md` contém os 2 patches exatos acima
- Diff do PR mostra apenas adições/alterações nas linhas 7 e pós-354
- Merge em main com CI verde
- `dm_queue.md`: mover T-20260420-1 para status COMPLETED e preencher Claimed/Branch/PR

### Subagentes obrigatórios
Nenhum (é edição de doc textual, não código). Opcional: rodar `test-runner` no final para confirmar que nada quebrou no build do monorepo.

### Persona servida (se aplicável)
N/A (infra/meta — segurança do processo de delivery)

### Gap fechado (se aplicável)
N/A (meta)

---

## T-20260420-2 — Housekeeping dos prompts dos 4 subagentes + alinhamento com regras 15–18

**Origin:** PO
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-20
**Claimed:** 2026-04-21
**Completed:** 2026-04-21
**Branch:** chore/SSE-050-subagentes-housekeeping (deleted)
**PR:** #36 (merged)

### Objetivo
Fechar 6 gaps médios/baixos identificados na revisão de prompts de 2026-04-20: subagentes não leem CLAUDE.md antes de revisar, `db-reviewer` lista migrations defasadas (008 vs 010 reais), `security-reviewer` não cobre regras 15–18, `frontend-reviewer` não checa Regra 16 (persona/gap), `test-runner` sem guidance sobre falhas. Fazer apenas depois que T-20260420-1 estiver mergeada.

### Contexto
Revisão crítica do PO pós-`Bash(*)` identificou que os 4 subagentes (security, test, db, frontend) têm prompts curtos (800–1400 bytes) focados no domínio técnico mas sem referência explícita às regras 15–18 (alinhamento Bússola/Operating Model/Handoff Protocol), criando risco de PRs aprovados por subagente mas violando alinhamento estratégico. `db-reviewer` cita migrations 000-008 mas baseline atual é 011 migrations ativas. Gaps são independentes e podem ser aplicados em um único PR de housekeeping.

### Ação sugerida

**Arquivo 1:** `.claude/agents/security-reviewer.md` — adicionar após item 6 (linha 28):
```
7. **Regras de alinhamento (15–18)**: PR que altera UX cita persona/gap? Handoff no arquivo canônico?
8. **Comandos destrutivos no diff**: rm -rf, force-push, drop, truncate, reset --hard — reportar como Critical
```

**Arquivo 2:** `.claude/agents/db-reviewer.md` — substituir linhas 21–26 (bloco "Migrations ativas (000-008)"):
```
## Migrations ativas (dinâmico)
Rodar `ls apps/api/src/database/migrations/*.sql` para lista atual.
Baseline 2026-04-20: 000-010 (11 migrations). Próxima livre: 011.
```

**Arquivo 3:** `.claude/agents/frontend-reviewer.md` — adicionar após item 8 (linha 28):
```
9. Se PR cria tela nova ou altera navegação: body do PR cita persona primária (Bússola §2) e gap fechado (§4)? (Regra 16)
```

**Arquivo 4:** `.claude/agents/test-runner.md` — adicionar após item 4 (linha 19):
```
5. Se testes falharem: NUNCA usar `--testPathIgnorePatterns` ou `.skip()` para mascarar — reportar falha real
6. Se cobertura cair abaixo de 80% em service alterado: bloquear PR (severidade High)
```

**Arquivo 5:** adicionar em TODOS os 4 subagentes no início do corpo (antes de "## Contexto" / "## Stack" / "## Responsabilidades"):
```
## Leitura obrigatória ANTES de revisar
- `CLAUDE.md` §10 (regras 1–18, incluindo alinhamento estratégico 15–18)
- `docs/strategy/BUSSOLA_PRODUTO_SSE.md` §2 (personas) e §4 (gaps) se o PR toca UX ou navegação
```

### Escopo negativo — NÃO fazer nesta entrega
- Não refatorar o conteúdo técnico dos prompts (checklists de SQL/React/testes permanecem)
- Não mudar `model:` frontmatter (sonnet/haiku atuais ficam)
- Não tocar `DevManager_Squad_v2.md` nem `PMAgent_Squad_v2.md` (escopo da T-20260420-1 e próxima)
- Não criar novo subagente
- Não aguardar T-20260412-1 (Deploy API) — é housekeeping independente

### Done quando
- Os 4 arquivos de subagente em `.claude/agents/` contêm os patches exatos acima
- Diff do PR toca apenas esses 4 arquivos
- Merge em main com CI verde
- `dm_queue.md`: mover T-20260420-2 para COMPLETED

### Subagentes obrigatórios
Nenhum (edição de doc textual). Opcional: acionar `security-reviewer` (versão já atualizada pós-merge) no próprio PR para dogfood das regras novas.

### Persona servida (se aplicável)
N/A (infra/meta)

### Gap fechado (se aplicável)
N/A (meta)

---

## T-20260417-12 — Implementar RF-003 (Event Tracking de Activation)

**Origin:** PO
**Priority:** P0
**Status:** COMPLETED
**Created:** 2026-04-17
**Claimed:** 2026-04-20
**Completed:** 2026-04-20
**Branch:** `feature/SSE-048-rf-003-activation-tracking`
**PR:** #33 (pending merge)

### Objetivo
Implementar RF-003 conforme spec em `docs/strategy/RF_BACKLOG.md` — tabela `activation_events`, service de emissão, hooks nos 6 services principais, dashboard interno em `/admin/activation`.

### Contexto
Bússola §4 Gap 8 + Operating Model v2 §6.1 declaram activation rate como métrica oficial mas reportada como "N/A — pendente". Este RF fecha a pendência.

### Ação sugerida
1. Ler RF-003 completo em `docs/strategy/RF_BACKLOG.md`
2. **Validar complexidade L (PO assessment)** — se DM achar S/M, ajustar e comunicar PO antes de quebrar em sub-RFs
3. Se quebrar: criar RF-003a/b/c em RF_BACKLOG.md (PO aprova) e tasks separadas no dm_queue
4. Migration 013 primeiro (PR isolado)
5. Service + hooks (PR ou commits separados na mesma branch)
6. Dashboard frontend por último (mais isolado)
7. Subagentes obrigatórios: db-reviewer + security-reviewer + test-runner + frontend-reviewer

### Escopo negativo — NÃO fazer
- Não implementar PostHog ou outra integração externa (alternativa rejeitada na sessão de origem)
- Não persistir IP/UserAgent individual no event_data (LGPD/CCPA risk explicitado no RF)
- Não criar role super_admin se já existe — verificar primeiro
- Não tocar em CRUD existente além dos hooks de emissão (1 linha por service)

### Done quando
- Critérios de aceite CA1–CA10 do RF-003 todos checados
- Migration 013 mergeada
- Endpoint `/admin/activation/rate` retorna dados reais para tenant de teste
- Dashboard renderiza
- RF-003 marcado como DONE em RF_BACKLOG.md

### Subagentes obrigatórios
db-reviewer (migration + ENUM + performance) + security-reviewer (cross-tenant + super_admin) + test-runner (coverage 80%) + frontend-reviewer (dashboard).

### Persona servida
N/A (instrumentação interna serve PO + PM).

### Gap fechado
Gap 8 (Bússola §4).

---

## T-20260417-11 — Implementar RF-002 (Setup Wizard de Onboarding)

**Origin:** PO
**Priority:** P0
**Status:** COMPLETED
**Created:** 2026-04-17
**Claimed:** 2026-04-21
**Completed:** 2026-04-21
**Branch:** feature/SSE-051-rf-002-setup-wizard (deleted)
**PR:** #37 (merged)

### Objetivo
Implementar RF-002 conforme spec em `docs/strategy/RF_BACKLOG.md` — wizard de 5 passos disparado no primeiro login do owner, com skip permitido marcando tenant como `wizard_skipped`.

### Contexto
Bússola §4 Gap 3 + métrica activation rate da Bússola/Operating Model. RF-002 depende de RF-001 (sabe pra onde mandar o owner ao final) e enriquece RF-003 (eventos de wizard).

### Ação sugerida
1. Ler RF-002 completo em `docs/strategy/RF_BACKLOG.md`
2. **Validar complexidade L** — RF-002 é a mais complexa dos 3. DM pode propor quebra (wizard core + sample data + integrações como sub-RFs)
3. Migrations 011 + 012 primeiro
4. Endpoints de wizard status (complete/skip)
5. 5 step components frontend
6. Middleware de redirect
7. Integração com RF-003 (eventos de wizard)
8. Validação manual de "tempo de conclusão < 30 min" com 2-3 testers (CA7)

### Escopo negativo — NÃO fazer
- Não persistir progresso parcial entre sessões na v0.1 (RN5 explicitada)
- Não esconder sample data dos filtros padrão (RN6)
- Não bloquear acesso ao app por wizard (skip permitido — RN3)
- Não invocar Clerk para gerenciar passo 2 (convite) — usar fluxo interno do SSE

### Done quando
- Critérios de aceite CA1–CA10 do RF-002 todos checados
- Migrations 011 + 012 mergeadas
- Wizard funcional end-to-end com sample data
- Validação manual de tempo < 30 min
- RF-002 marcado como DONE em RF_BACKLOG.md

### Subagentes obrigatórios
frontend-reviewer (5 steps + UX) + db-reviewer (migrations + RLS) + test-runner (coverage 80%) + security-reviewer (only-owner enforcement no edge case CA8).

### Persona servida
Owner-Operator (primária); Estimator/Technician/Accountant via convite no Passo 2.

### Gap fechado
Gap 3 (Bússola §4).

### Dependências
- **RF-001** (T-20260417-10) — wizard precisa saber para onde mandar o owner ao final.
- **RF-003** (T-20260417-12) — wizard emite eventos. Pode ser implementado paralelo (eventos no-op se RF-003 ainda não merged).

---

## T-20260417-10 — Implementar RF-001 (Landing por Persona + Workspace Switcher)

**Origin:** PO
**Priority:** P0
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**Branch:** `feature/SSE-044-rf-001-landing-por-persona` (deleted)
**PR:** #31 (merged)

### Objetivo
Implementar RF-001 conforme spec em `docs/strategy/RF_BACKLOG.md` — 4 workspaces (`/app/cockpit`, `/app/estimates/inbox`, `/app/my-work`, `/app/books`), redirect inteligente no `/app`, workspace switcher, sidebar dinâmica.

### Contexto
Bússola §4 Gap 1 + §7 (arquitetura de navegação por persona). Pré-requisito do RF-002 (wizard manda owner para `/app/cockpit` ao final).

### Ação sugerida
1. Ler RF-001 completo em `docs/strategy/RF_BACKLOG.md`
2. **Validar complexidade M (PO assessment)** — risco principal: integração com Clerk para roles. DM valida com `frontend-reviewer` antes de começar
3. Decidir: route segments dinâmicos vs rotas explícitas (registrar em ADR-N se for estrutural)
4. Implementar lógica `getPrimaryWorkspace(roles[])` em helper testado
5. Refator do sidebar para receber workspace prop
6. Endpoint backend `GET /users/me/workspace-info` (opcional mas reduz duplicação)
7. Workspace switcher component
8. Implementar 4 workspaces — pode ser incremental (Owner + Technician primeiro = 60% do uso)

### Escopo negativo — NÃO fazer
- Não persistir última escolha de workspace (RN8 explicitada — comportamento determinístico)
- Não criar nova lógica de roles — usar a que já existe (`user_role_assignments`)
- Não alterar a hierarquia de roles do RBAC backend (esta hierarquia é só para UI)
- Não tocar em settings (fica fora dos workspaces)

### Done quando
- Critérios de aceite CA1–CA10 do RF-001 todos checados
- Os 4 workspaces acessíveis e bloqueados conforme role
- Workspace switcher funcional para users multi-role
- RF-001 marcado como DONE em RF_BACKLOG.md

### Subagentes obrigatórios
frontend-reviewer (navegação + componentes) + security-reviewer (RBAC enforcement no acesso aos workspaces, especialmente CA5) + test-runner (coverage 80%).

### Persona servida
Todas as 4 personas (cada uma ganha seu workspace).

### Gap fechado
Gap 1 (Bússola §4).

### Dependências
- Recomendado: T-20260417-2 (PR template novo) merged antes — para que este PR já use o formato persona/gap.

---

## T-20260417-9 — (reservado — não usar)

Slot reservado caso surja tarefa entre T-20260417-8 e T-20260417-10. Pode ser usado em sessão futura ou descartado na próxima rotação.

---

## T-20260417-8 — Reorganização física de `docs/` (moves + deletes conforme WS-C)

**Origin:** PO
**Priority:** P1
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**Branch:** deleted
**PR:** #29 (merged)

### Objetivo
Executar os moves/deletes físicos decididos pelo PO na sessão WS-C (2026-04-17), limpando a "flat" de `docs/` e consolidando prompts de agentes em `.claude/agents/`. Doc-only PR — nenhum código alterado.

### Contexto
Sessão PO 2026-04-17 WS-C decidiu (aprovação explícita do Luigi em 4 perguntas de discovery):
1. 5 prompts históricos obsoletos → `docs/.archive/prompts-historicos/`
2. 5 prompts de agentes LIVE → `.claude/agents/`
3. Templates de abertura de sessão → já consolidados no HANDOFF_PROTOCOL.md §13 nesta sessão (só deletar o arquivo original)
4. Report datado → `docs/audits/`

PO já produziu `docs/README.md` (INDEX) e patch em `README.md` root. Esses arquivos já estão no filesystem — esta tarefa só cuida dos moves físicos.

### Ação sugerida

#### Passo 1 — Arquivar 5 prompts históricos
```bash
mkdir -p docs/.archive/prompts-historicos
git mv docs/PROMPT_CLAUDE_CODE_FASE1.md          docs/.archive/prompts-historicos/
git mv docs/PROMPT_CLAUDE_CODE_20260406.md       docs/.archive/prompts-historicos/
git mv docs/PROMPT_CLAUDE_CODE_DEPLOY_STAGING.md docs/.archive/prompts-historicos/
git mv docs/PROMPT_CLAUDE_CODE_GRUPO_A.md        docs/.archive/prompts-historicos/
git mv docs/PROMPT_CLAUDE_CODE_GRUPO_B.md        docs/.archive/prompts-historicos/
```

Criar `docs/.archive/README.md` com nota:
```markdown
# Documentos arquivados

Este diretório contém documentos que foram autoritativos no passado mas não refletem o estado atual.
Não seguir como guia — referência histórica apenas.
Conteúdo pode ser restaurado para `docs/` via `git mv` se relevante.
```

#### Passo 2 — Mover 5 prompts de agentes para `.claude/agents/`
```bash
git mv docs/SSE_Prompts_Squad_IA.md              .claude/agents/SSE_Prompts_Squad_IA.md
git mv docs/SSE_Prompt_PMAgent_ScheduledTask.md  .claude/agents/PMAgent_ScheduledTask.md
git mv docs/SSE_Prompt_DevManager_ScheduledTask.md .claude/agents/DevManager_ScheduledTask.md
git mv docs/SSE_Prompt_PMAgent_Squad_v2.md       .claude/agents/PMAgent_Squad_v2.md
git mv docs/SSE_Prompt_DevManager_Squad_v2.md    .claude/agents/DevManager_Squad_v2.md
```

**Atenção:** verificar se `.claude/agents/` já existe. Se não, criar. Conferir se há arquivos com nomes colidentes antes do mv (os subagentes `security-reviewer.md`, `test-runner.md` etc. provavelmente já estão lá — nomes novos não devem conflitar).

#### Passo 3 — Deletar templates consolidados
Os 6 templates de abertura de sessão de `SSE_Templates_Sessao_Agentes.md` foram consolidados no HANDOFF_PROTOCOL.md §13 com atualizações (referência à Bússola, dm_queue.md, nova estrutura). O arquivo original pode ser removido.

```bash
git rm docs/SSE_Templates_Sessao_Agentes.md
```

#### Passo 4 — Mover report datado
```bash
git mv docs/SSE_Post_Migration_Readiness_Report_20260412.md docs/audits/
```

#### Passo 5 — Verificar links quebrados
```bash
# Buscar referências aos arquivos movidos em todo o repo
grep -r "PROMPT_CLAUDE_CODE_" --include="*.md" -l
grep -r "SSE_Prompt_" --include="*.md" -l
grep -r "SSE_Templates_Sessao_Agentes" --include="*.md" -l
grep -r "SSE_Post_Migration_Readiness_Report" --include="*.md" -l
```

Se encontrar referências, atualizar os paths nos arquivos que apontam. Principais suspeitos: CLAUDE.md, AGENTS.md, ADRs antigos (001-008), READMEs.

#### Passo 6 — Commit + PR
```bash
git commit -m "docs: reorganize docs/ flat files — archive historical prompts, move agent prompts to .claude/agents/, consolidate session templates into HANDOFF_PROTOCOL §13"
git push -u origin docs/SSE-XXX-reorg-docs-ws-c
gh pr create --title "docs: WS-C reorganization (archive + move + consolidate)" \
  --body "Executa decisões da sessão PO 2026-04-17 WS-C. Ver .auto-memory/po_sessions.md."
```

### Escopo negativo — NÃO fazer
- Não tocar em arquivos fora dos 11 listados (5+5+1)
- Não renomear arquivos além do prefix-strip feito no Passo 2 (remover `SSE_Prompt_` em `.claude/agents/`)
- Não deletar os arquivos históricos definitivamente — apenas arquivar
- Não consolidar conteúdo dos 5 prompts de agentes num único arquivo — manter 5 arquivos separados, só mudar pasta
- Não atualizar `docs/README.md` nem `README.md` root (já foram produzidos pelo PO nesta sessão)

### Done quando
- `ls docs/*.md` mostra apenas `README.md` (mais pastas; nenhum prompt ou report órfão na raiz de `docs/`)
- `ls docs/.archive/prompts-historicos/` tem 5 arquivos
- `ls .claude/agents/` contém os 5 prompts migrados + subagentes originais
- `ls docs/audits/` contém `SSE_Post_Migration_Readiness_Report_20260412.md`
- `grep -r` nos arquivos relevantes não encontra links quebrados
- CI verde (embora doc-only, confirmar)
- PR mergeado

### Subagentes obrigatórios
Nenhum (doc-only). Opcional: subagente de lint se existir.

### Persona servida
N/A (governança/manutenção).

### Gap fechado
N/A.

---

## T-20260417-7 — Criar/atualizar `.github/ISSUE_TEMPLATE/` com referência à Bússola

**Origin:** PO
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**Branch:** —
**PR:** #30 (merged)

### Objetivo
Atualizar os 3 issue templates do GitHub (`bug_report.md`, `feature_request.md`, `task.md`) com seção "Persona servida + gap fechado" alinhada com a Bússola.

### Contexto
`CLAUDE.md` §4 menciona existência de `.github/ISSUE_TEMPLATE/` com 3 templates. Após ADR-009, toda issue nova deveria forçar reflexão sobre persona/gap, análogo ao que o PR template vai fazer (T-20260417-2).

### Ação sugerida
Para cada template, adicionar ao final da estrutura:

```markdown
## Persona e gap (ref. Bússola de Produto)

- **Persona primária servida:** <!-- Owner / Estimator / Technician / Accountant / N/A -->
- **Gap fechado:** <!-- Gap N da Bússola §4 ou N/A -->
- **Horizonte da persona:** <!-- H0 / H1 / H2 / H3 / Ciclo fiscal / N/A -->
```

Em `feature_request.md`, adicionar também link-referência no header: `> Ver Bússola §2 (personas) e §4 (gaps) antes de abrir`.

### Escopo negativo — NÃO fazer
- Não alterar estrutura existente dos templates além da adição da seção
- Não criar novos templates (ex: "rf_request.md") nesta tarefa — proposta separada se necessário
- Não tocar workflows do `.github/workflows/`

### Done quando
- Os 3 templates contêm a nova seção Persona/gap
- Próxima issue aberta usa o formato atualizado
- MEMORY.md se precisar atualizar, atualizado

### Subagentes obrigatórios
Nenhum (alteração puramente documental).

### Persona servida
N/A (meta — infra de governança).

### Gap fechado
N/A (governança).

---

## T-20260417-6 — Configurar labels GitHub alinhadas com a Bússola

**Origin:** PO
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**Branch:** —
**PR:** #30 (labels via gh label create)

### Objetivo
Criar e padronizar labels GitHub para suportar priorização e análise alinhadas com a Bússola.

### Contexto
Hoje o projeto usa labels informais (bug, enhancement, etc). Para operar com a Bússola, precisamos labels que permitam filtrar por persona, gap e prioridade estratégica.

### Ação sugerida
Executar via `gh label create` para cada label abaixo. Labels já existentes preservar; só criar faltantes.

**Persona (cor verde):**
- `persona: owner`
- `persona: estimator`
- `persona: technician`
- `persona: accountant`
- `persona: N/A`

**Gap (cor azul):**
- `gap: landing-per-persona` (Gap 1)
- `gap: mobile-technician` (Gap 2)
- `gap: onboarding-wizard` (Gap 3)
- `gap: owner-cockpit` (Gap 4)
- `gap: insurance-workflow` (Gap 5)
- `gap: fam-over-engineering` (Gap 6)
- `gap: accountant-export` (Gap 7)
- `gap: activation-tracking` (Gap 8)

**Prioridade estratégica (cor vermelha/laranja/amarela):**
- `priority: P0` (bloqueante)
- `priority: P1` (alta)
- `priority: P2` (média)
- `priority: P3` (baixa)

**Manter existentes:** `bug`, `enhancement`, `feature`, `security`, `refactor`, `fase-1-mvp`, `fase-2-ai`, `fase-3-accounting`, `fase-4-tax`, `fase-5-mobile` (já referenciados em CLAUDE.md + project instructions do PO).

### Escopo negativo — NÃO fazer
- Não deletar labels existentes sem aprovação do PO por label
- Não renomear labels existentes (quebra histórico de issues antigas)
- Não criar labels que não estejam na lista acima

### Done quando
- `gh label list` mostra todas as labels da lista acima
- Labels aplicáveis são usadas nas próximas 3 issues abertas

### Subagentes obrigatórios
Nenhum.

### Persona servida
N/A (meta — governança).

### Gap fechado
N/A.

---

## T-20260417-5 — Commit dos documentos estratégicos/processos produzidos na sessão 2026-04-17 (partes 1+2+3)

**Origin:** PO
**Priority:** P1
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-19
**Branch:** deleted
**PR:** #27 (merged)

### Objetivo
Levar ao repositório remoto (via PR único) todos os documentos novos/alterados criados nas 3 partes da sessão PO de 2026-04-17 (WS-A: Bússola; WS-B: Handoff Protocol; WS-C: docs index + README patch).

### Contexto
Na sessão foram criados/alterados localmente em `C:\Dev\storm-shield-enterprise\`:

| Arquivo | Tipo | Status | Propósito |
|---|---|---|---|
| `docs/strategy/BUSSOLA_PRODUTO_SSE.md` | Estratégia | NOVO | Bússola de Produto v0.1 |
| `docs/strategy/RF_BACKLOG.md` | Estratégia | NOVO (parte 5) | RF backlog com RF-001/002/003 derivados dos Gaps P0 |
| `docs/decisions/009-adocao-bussola-de-produto.md` | ADR | NOVO | ADR-009 oficializando adoção |
| `docs/decisions/010-operating-model-v2.md` | ADR | NOVO | ADR-010 oficializando operating model |
| `docs/process/HANDOFF_PROTOCOL.md` | Processo | NOVO + estendido em WS-C com §13 | Protocolo de handoff PO↔PM↔DM v1.0 + 7 templates de abertura de sessão |
| `docs/process/OPERATING_MODEL_v2.md` | Processo | NOVO (WS-D) | Operating Model v2 — atores, cadência, rituais, métricas oficiais |
| `docs/README.md` | Índice | NOVO | INDEX navegável de toda a pasta docs/ |
| `README.md` (root) | Doc | ALTERADO | Patch adicionando seção "Strategy & Governance" |
| `.auto-memory/po_sessions.md` | Memória | NOVO | Log datado das sessões PO (4 partes da sessão 2026-04-17) |
| `.auto-memory/dm_queue.md` | Memória | NOVO | Fila unificada (este arquivo) |
| `.auto-memory/dm_queue_archive.md` | Memória | NOVO | Arquivo de histórico (vazio inicial) |
| `.auto-memory/next_sessions_plan.md` | Memória | NOVO | Briefing das próximas sessões (a aplicar pós merge) |
| `.auto-memory/MEMORY.md` | Memória | Índice atualizado |

Arquivos deprecated (migração de conteúdo feita — manter como stubs por 1 ciclo):
- `.auto-memory/dm_task_queue.md` (já transformado em stub redirect)
- `.auto-memory/dm_tasks_pending.md` (já transformado em stub redirect)

`.auto-memory/MEMORY.md` já foi atualizado para refletir o novo estado.

### Ação sugerida
1. `git checkout -b docs/SSE-XXX-bussola-handoff-and-docs-reorg`
2. `git add` dos 9 arquivos novos + 1 root README + 2 stubs deprecated + 1 MEMORY.md
3. Commit:
   ```
   docs: adopt Bussola de Produto, handoff protocol, and docs reorganization

   - Bussola de Produto v0.1 (docs/strategy/) — ICP, 4 personas, 8 gaps, positioning
   - ADR-009 formalizing Bussola adoption authority
   - Handoff Protocol v1.0 (docs/process/) — agent ownership matrix, templates,
     lifecycle, cadence, conflict resolution, session-opening templates
   - docs/README.md INDEX
   - root README.md patch with Strategy & Governance section
   - .auto-memory restructure: dm_queue.md unified (replaces dm_task_queue +
     dm_tasks_pending which are now redirect stubs)
   - po_sessions.md (new), dm_queue_archive.md (new), next_sessions_plan.md (new)

   Refs: ADR-009
   ```
4. PR com descrição referenciando ADR-009, persona servida = N/A (meta/governança), gap fechado = N/A
5. Skip subagentes (puramente documental, nenhum código alterado)
6. Após merge, rodar diagnóstico completo para confirmar que o squad continua saudável
7. **Notificar Luigi** que o repo está atualizado e pronto para próxima sessão PO

### Escopo negativo — NÃO fazer
- Não mergear sem PR mesmo sendo doc-only (regra inviolável #1)
- Não tocar nenhum arquivo fora da lista
- Não aplicar os patches descritos em T-20260417-1/2/3 aqui — cada um tem PR próprio
- Não executar os moves físicos da T-20260417-8 aqui — PR separado
- Não implementar os Gaps P0 aqui — são RFs separados a criar em sessão PO futura

### Done quando
- PR aberto, CI verde
- PO revisa e aprova
- PR mergeado
- `git log --oneline -3` mostra commit com a referência ADR-009
- `gh pr view` mostra os 12 arquivos no diff (9 novos + 1 root README alterado + 2 stubs deprecated + 1 MEMORY.md atualizado)

### Subagentes obrigatórios
Nenhum (documental). Opcional: subagente de docs/linting se existir.

### Persona servida
N/A (governança do squad).

### Gap fechado
N/A.

---

## T-20260417-4 — Preparar discovery técnico dos Gaps P0 da Bússola

**Origin:** PO
**Priority:** P1
**Status:** PENDING
**Created:** 2026-04-17
**Claimed:** —
**Branch:** —
**PR:** —

### Objetivo
Produzir material técnico para a próxima sessão PO converter os 3 gaps P0 da Bússola §8 em RFs formais com critério de aceite.

### Contexto
Bússola §8 identifica como P0 em 30–60 dias:
1. **Gap 1** — Landing por persona + sidebar por workspace
2. **Gap 3** — Setup wizard de onboarding (5 passos)
3. **Gap 8** — Event tracking de activation (instrumentação)

O PO precisa entender implicação técnica de cada um antes de redigir RF.

### Ação sugerida
Para cada gap, produzir briefing técnico em até 250 palavras contendo:

1. **Componentes/módulos impactados** — lista de pastas/arquivos em `apps/web/` e `apps/api/` que mudam
2. **Mudanças de schema/banco** — se há migration nova, descrever; se não, dizer "nenhuma"
3. **Dependências técnicas** — ex: Gap 1 depende de como Clerk expõe role no middleware?
4. **Complexidade estimada** — S (≤1 sprint) / M (1–2 sprints) / L (2+ sprints)
5. **Preocupações de segurança/RLS/plan enforcement** — antecipáveis
6. **Integração com subagentes** — quais subagentes serão acionados obrigatoriamente

Entregar como comentário neste card (status BLOCKED temporário ao criar comentário) ou em novo card `T-AAAAMMDD-N — briefing técnico dos Gaps P0` com status COMPLETED.

### Escopo negativo — NÃO fazer
- Não começar implementação de nenhum gap
- Não criar branches nem PRs
- Não redigir RF — essa é função do PO
- Não decidir prioridade entre os 3 — só explicar complexidade técnica

### Done quando
Material dos 3 gaps entregue antes da próxima sessão PO (próxima sessão com Luigi em modo Cowork).

### Subagentes obrigatórios
- Para Gap 1 e Gap 3: frontend-reviewer (navegação/wizard)
- Para Gap 8: db-reviewer (schema de events) + security-reviewer (event tracking cross-tenant)

### Persona servida
N/A (meta — preparação de discovery).

### Gap fechado
Nenhum diretamente — prepara o fechamento de Gap 1, 3 e 8.

---

## T-20260417-3 — Atualizar AGENTS.md referenciando Bússola + Handoff Protocol

**Origin:** PO
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**Branch:** deleted
**PR:** #28 (merged)

### Objetivo
Garantir que DM e subagentes tenham visibilidade de dois novos artefatos: a Bússola (estratégica) e o Handoff Protocol (operacional).

### Contexto
ADR-009 e HANDOFF_PROTOCOL.md foram criados nesta sessão. AGENTS.md atual cobre ADR-007 (squad architecture) mas não tem ponteiros para os novos documentos.

### Ação sugerida
Em `AGENTS.md`, localizar seção de introdução ou §5 (coordenação entre agentes). Adicionar bloco:

```markdown
### Documentos de referência obrigatórios

Todo agente do squad deve consultar estes artefatos antes de iniciar trabalho:

1. **`docs/strategy/BUSSOLA_PRODUTO_SSE.md`** — Bússola de Produto. Camada estratégica. Informa priorização, personas, princípios de design. Ver ADR-009 para autoridade.
2. **`docs/process/HANDOFF_PROTOCOL.md`** — Protocolo de Handoff. Camada operacional. Informa ownership de arquivos em `.auto-memory/`, templates, ciclo de vida de tarefas, cadência.
3. **`docs/process/OPERATING_MODEL_v2.md`** — Operating Model. Informa atores, cadência oficial, rituais (rotação mensal, revisões trimestrais), métricas oficiais (lead time, # BLOCKED/semana). Ver ADR-010 para autoridade.
4. **`CLAUDE.md`** — Convenções técnicas. Stack, migrations, regras invioláveis.
5. **ADRs em `docs/decisions/`** — decisões arquiteturais históricas.

Em caso de ambiguidade entre documentos, a hierarquia é:
- Decisão estratégica: Bússola > CLAUDE.md
- Decisão operacional: Handoff Protocol > Operating Model v2 > convenções implícitas
- Decisão técnica: ADRs específicas > CLAUDE.md > convenções do módulo
```

### Escopo negativo — NÃO fazer
- Não reescrever AGENTS.md em outras seções
- Não alterar descrições dos subagentes (`.claude/agents/`)
- Não duplicar conteúdo de CLAUDE.md ou da Bússola

### Done quando
- AGENTS.md contém o bloco novo
- Próximo scheduled task do PM ou DM lê o arquivo e segue a hierarquia

### Subagentes obrigatórios
Nenhum.

### Persona servida
N/A.

### Gap fechado
N/A.

---

## T-20260417-2 — Atualizar `.github/PULL_REQUEST_TEMPLATE.md`

**Origin:** PO
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**Branch:** deleted
**PR:** #28 (merged)

### Objetivo
Forçar que todo PR referencie persona servida e gap fechado, conforme ADR-009.

### Contexto
Sem isso, a adoção da Bússola fica no papel. O PR template é o ponto de maior alavancagem: todo PR passa por ele.

### Ação sugerida
Verificar se `.github/PULL_REQUEST_TEMPLATE.md` existe. Se sim, adicionar abaixo de "Descrição" ou ao final. Se não, criar arquivo novo.

Bloco a adicionar (exato):

```markdown
## Persona e gap (ref. Bússola de Produto)

- **Persona primária servida:** <!-- Owner | Estimator | Technician | Accountant | N/A (infra/meta/refactor) -->
- **Gap fechado:** <!-- ex: Gap 1 (landing por persona) | N/A -->
- **Princípio de design respeitado:** <!-- ex: P2 (mobile-first para Technician) | N/A -->

<!-- Se N/A em todos, justificar em 1 linha por que este PR não serve persona (ex: refactor interno, infra, bugfix genérico). Ver ADR-009. -->
```

### Escopo negativo — NÃO fazer
- Não alterar outras seções do PR template
- Não adicionar checklist de review de código (fora de escopo desta tarefa)

### Done quando
- PR template contém o bloco novo
- O PR desta própria tarefa (T-20260417-2) preenche a nova seção como N/A meta

### Subagentes obrigatórios
Nenhum.

### Persona servida
N/A (meta).

### Gap fechado
N/A (governança).

---

## T-20260417-1 — Patch CLAUDE.md §10 adicionando regras 15-18

**Origin:** PO
**Priority:** P1
**Status:** COMPLETED
**Created:** 2026-04-17
**Completed:** 2026-04-20
**Branch:** deleted
**PR:** #28 (merged)

### Objetivo
Adicionar 2 novas regras ao CLAUDE.md §10 para referenciar a Bússola e o Handoff Protocol.

### Contexto
ADR-009 §Implementação prescreve esta alteração. Sem isso, o próximo agente/contributor a ler o CLAUDE.md não sabe da Bússola.

### Ação sugerida
No arquivo `CLAUDE.md`, na seção "## 10. Regras para o Claude Code", após a regra 14 (`Sempre considerar plan enforcement ao adicionar novos módulos`), adicionar exatamente:

```markdown
15. **Sempre** consultar `docs/strategy/BUSSOLA_PRODUTO_SSE.md` antes de decisões de priorização, escopo de RF ou redesenho de UX — a Bússola é a camada estratégica acima deste CLAUDE.md (ver ADR-009)
16. **Sempre** linkar a persona primária servida (ref. Bússola §2) e o gap fechado (ref. Bússola §4) na descrição de PRs que criam tela nova ou alteram navegação
17. **Sempre** seguir o protocolo de handoff `docs/process/HANDOFF_PROTOCOL.md` ao passar tarefas entre agentes — escrever no arquivo correto, usar template canônico (§4 do protocolo), respeitar ciclo de vida (§7)
18. **Sempre** operar conforme `docs/process/OPERATING_MODEL_v2.md` — atores, cadência, rituais e métricas oficiais (ver ADR-010)
```

### Escopo negativo — NÃO fazer
- Não alterar regras 1–14 existentes
- Não reordenar regras existentes
- Não alterar outras seções do CLAUDE.md (reservado para tarefas específicas)

### Done quando
- CLAUDE.md §10 exibe as 4 novas regras (15, 16, 17, 18) no final da seção
- PR mergeado
- Próximo scheduled task do DM lê e respeita

### Subagentes obrigatórios
Nenhum (documental).

### Persona servida
N/A (meta).

### Gap fechado
N/A (governança).

---

## T-20260412-3 — Fechar Fases 1A e 3 (tasks rápidas: T-008, T-009)

**Origin:** PM
**Priority:** P1
**Status:** COMPLETED
**Note:** T-032 (Reports) já concluída em PR #24 (2026-04-13). T-008 + T-009 verificados 2026-04-21 — já implementados em sessões anteriores (imports @sse/shared-types OK + @IsISO8601 OK). Fase 1A 10/10.
**Created:** 2026-04-12
**Claimed:** 2026-04-21
**Completed:** 2026-04-21
**Branch:** — (verificação, sem código novo)
**PR:** — (já implementado)

### Objetivo
Executar 3 tasks rápidas que fecham Fase 1A e avançam Fase 3 para 7/8.

### Contexto
Migrado de `dm_task_queue.md` criado pelo PM Agent em 2026-04-12.

T-008, T-009 são cleanup da Fase 1A. T-032 é implementação de ReportsService (Trial Balance, P&L, Balance Sheet) para Fase 3.

### Ação sugerida

**T-008 — Remover enums duplicados dos DTOs (Fase 1A)**
- Problema: enums (`CustomerType`, `EstimateStatus`, etc.) definidos localmente nos DTOs E em `@sse/shared-types`
- Ação: substituir definições locais por imports de `@sse/shared-types/src/enums`
- Buscar: `grep -r "enum Customer\|enum Estimate\|enum Vehicle" apps/api/src/modules --include="*.dto.ts"`
- Validar: `pnpm test` continua verde

**T-009 — @IsISO8601 em query params de data**
- Problema: filtros de data em `financial` e `estimates` não validam formato
- Ação: adicionar `@IsISO8601()` em DTOs com `startDate`, `endDate`, `dateFrom`, `dateTo`
- Arquivos: `apps/api/src/modules/financial/dto/`, `apps/api/src/modules/estimates/dto/`

**T-032 — Reports: Trial Balance, P&L, Balance Sheet**
- Módulo: `apps/api/src/modules/accounting/reports/`
- `ReportsService` com 3 métodos: `getTrialBalance(tenantId, fiscalPeriodId)`, `getProfitAndLoss(tenantId, periodId)`, `getBalanceSheet(tenantId, asOfDate)`
- `ReportsController` com endpoints `GET /accounting/reports/trial-balance`, `/profit-loss`, `/balance-sheet`
- Agregar `journal_entry_lines` por `account_id`, usar `account_balances` como cache
- Cobertura mínima 80%

### Escopo negativo — NÃO fazer
- Não refatorar estrutura de DTOs além do necessário para T-008
- Não implementar relatórios além dos 3 pedidos em T-032
- Não tocar frontend nesta branch (Frontend polish é T-20260412-2)

### Done quando
- Branch `feature/SSE-040-cleanup-and-reports` tem 3 commits conventional
- PR mergeado em main, CI verde
- Excel SSE_Development_Plan.xlsx marcado com T-008, T-009, T-032 como Concluído
- Fase 1A 10/10, Fase 3 7/8

### Subagentes obrigatórios
test-runner (cobertura 80% em T-032) + db-reviewer (queries complexas em T-032)

### Persona servida
Accountant (T-032 — Trial Balance, P&L, Balance Sheet são JTBD #2 do Accountant).

### Gap fechado
Parcialmente Gap 7 (accountant export) — reports via API é pré-requisito para export.

---

## T-20260412-2 — Fase 2 Frontend Polish (T-020, T-021, T-022)

**Origin:** PM
**Priority:** P1
**Status:** PENDING
**Created:** 2026-04-12
**Claimed:** —
**Branch:** `feature/SSE-015-frontend-polish`
**PR:** —

### Objetivo
Implementar 3 melhorias de UX em vehicles, estimates e financial pages.

### Contexto
Migrado de `dm_task_queue.md`. Três gaps de frontend apontados pelo PM em revisão de 2026-04-12.

**ALERTA (adicionado pelo PO 2026-04-17):** esta tarefa foi criada ANTES da adoção da Bússola. Antes de executar, reler a Bússola §8 — a nova ordem de ataque sugere priorizar Gaps P0 (landing por persona + onboarding wizard + activation tracking) acima destes 3 itens. **Decisão pendente:** Luigi ratifica executar T-20260412-2 primeiro OU sobrepõe com os Gaps P0 da Bússola?

### Ação sugerida

**T-020 — Vehicles: substituir text input por customer combobox**
- Arquivo: `apps/web/src/app/(dashboard)/vehicles/new/page.tsx`
- Gap identificado pelo PM: campo `customer_id` como UUID text input é UX inaceitável
- Combobox shadcn/ui com busca (`GET /customers?search=`), debounce 300ms

**T-021 — Estimates: inline line editor**
- Arquivo: `apps/web/src/app/(dashboard)/estimates/[id]/edit/page.tsx`
- Tabela editável: `description`, `quantity`, `unit_price`, `total` calculado
- API: `POST /estimates/:id/lines` + `DELETE /estimates/:id/lines/:lineId`

**T-022 — Financial: KPI cards + trend chart**
- Arquivo: `apps/web/src/app/(dashboard)/financial/page.tsx`
- 4 KPI cards + gráfico mensal com Recharts
- API: `GET /financial/summary` (já existente)

### Escopo negativo — NÃO fazer
- Não criar novos módulos ou migrations
- Não alterar backend APIs que já existem para esses endpoints
- Não antecipar implementação de cockpit do Owner (Gap 4 — é RF separado)

### Done quando
- PR aberto, frontend-reviewer acionado para os 3 componentes, CI verde
- 3 páginas com UX corrigido funcionando em staging

### Subagentes obrigatórios
frontend-reviewer.

### Persona servida
Estimator (T-020, T-021) + Owner parcial (T-022).

### Gap fechado
Parcialmente Gap 4 (owner cockpit) via T-022. Operacional em T-020/T-021.

---

## T-20260412-1 — P0 Configurar GitHub Secrets para deploy API staging

**Origin:** PM (escala para PO — requer ação humana)
**Priority:** P0
**Status:** BLOCKED
**Created:** 2026-04-12
**Claimed:** —
**Branch:** —
**PR:** —

### Objetivo
Desbloquear deploy API staging (Fly.io) que falha com exit code 1 por ausência de secrets.

### Contexto
Deploy API falha em todos os runs com `exit code 1`. Secrets ausentes: `FLY_API_TOKEN` e `DATABASE_URL_UNPOOLED`. Bloqueia T-019 (smoke test) e valida end-to-end staging.

**Status BLOCKED:** esta tarefa requer ação HUMANA do PO (Luigi) — nenhum agente pode configurar secrets do GitHub. Ao iniciar próxima sessão PO, DM deve relembrar Luigi desta pendência.

### Ação sugerida
1. DM, ao iniciar sessão com Luigi, notifica: *"Para desbloquear T-019 e deploy API, preciso que você configure `FLY_API_TOKEN` e `DATABASE_URL_UNPOOLED` em Settings → Secrets → Actions do repo GitHub."*
2. Após secrets configurados: re-run do workflow `Deploy API (Staging)` via `gh workflow run deploy-api-staging.yml`
3. Marcar T-019 como Concluído no Excel quando smoke test passar

### Escopo negativo — NÃO fazer
- Não tentar configurar secrets programaticamente (fora de escopo de DM/agent)
- Não fazer deploy manual com token temporário — secrets são o caminho correto

### Done quando
- Secrets configurados por Luigi
- Workflow `Deploy API (Staging)` rodado e GREEN
- T-019 (smoke test) passa

### Subagentes obrigatórios
Nenhum.

### Persona servida
N/A (infra).

### Gap fechado
N/A (infra).

--