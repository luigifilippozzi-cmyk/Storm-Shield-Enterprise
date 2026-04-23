
---
name: Dev Manager Queue (unified)
description: Fila única de tarefas para o Dev Manager — consolidada do PO e PM conforme HANDOFF_PROTOCOL.md §3
type: project
---

# Dev Manager Queue — SSE

> **Nota:** "NS" = ERP de referência externo. Nome substituído por precaução (ADR-014).

> Fila única. Tarefas novas no topo. Template canônico em `docs/process/HANDOFF_PROTOCOL.md` §4.
> Status permitidos: PENDING | IN_PROGRESS | BLOCKED | COMPLETED
> Rotação: COMPLETED movidas para `dm_queue_archive.md` no primeiro dia útil de cada mês.

---

## T-20260422-1 — P2 Substituição de marca registrada de ERP externo por sigla NS (trademark hygiene)

**Origin:** PO (sessão 2026-04-22)
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-22
**Claimed:** DM Agent (sessão 2026-04-22)
**Closed:** 2026-04-22
**Branch:** `chore/SSE-trademark-hygiene-netsuite`
**PR:** #47
**Dependência invertida:** T-20260421-1 (sync dashboard) deve ser executada **após** conclusão desta; o path `ANALISE_NS_vs_BUSSOLA_v1.*` será renomeado e sua referência no corpo do T-20260421-1 precisa ser atualizada no mesmo PR.

### Objetivo
Reduzir exposição jurídica removendo menção direta à marca registrada de ERP de terceiro usado como referência comparativa. Substituir "NS" por "NS" em 235 ocorrências (19 arquivos versionados) + acompanhamento em issues/PRs do GitHub. Decisão formalizada em **ADR-014**.

### Escopo

1. **ADR-014** publicado em `docs/decisions/014-remocao-mencao-marca-erp-referencia.md` (rascunho canônico em `.auto-memory/proposals/adr_014_draft.md`).
2. **Disclaimer canônico** no topo de cada doc impactado:
   > **Nota:** Neste documento, "NS" refere-se a um ERP proprietário de terceiros usado exclusivamente como referência comparativa externa, sem relação comercial, licenciamento ou endosso. O nome da marca foi substituído por precaução (ver ADR-014).
3. **Substituição textual** em 19 arquivos (ver lista completa abaixo): "NS" → "NS"; "NS" / "NS" / "NS" / "NS" → "NS".
4. **Renames com stubs de redirect (60 dias)**:
   - `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.md` → `ANALISE_NS_vs_BUSSOLA_v1.md`
   - `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.html` → `ANALISE_NS_vs_BUSSOLA_v1.html`
   - `docs/decisions/012-ns-incorporacao-parcial.md` → `012-ns-incorporacao-parcial.md`
   - Conteúdo do stub (1 linha): `Moved to <novo_caminho> (ADR-014). Stub será removido em 2026-06-22.`
5. **Atualizar links cruzados**:
   - `.auto-memory/MEMORY.md` (entrada "NS↔Bússola v1" → "NS↔Bússola v1")
   - `.auto-memory/dm_queue.md` (T-20260421-1 referência de path)
   - `docs/decisions/008`, `009`, `013` (referências a 012)
   - `CLAUDE.md` seção "Dashboards estratégicos" (se presente) e regra 19 menciona frontend-reviewer — validar se há ref direta ao ADR 012 pelo slug antigo
   - `README.md`, `docs/README.md`, `sse-squad-dashboard.html`
6. **Sweep GitHub** (3 etapas: Discovery → Execution → Verify, snippets canônicos em `po_sessions.md` sessão 2026-04-22):
   - Issues abertas e fechadas (título + corpo)
   - PRs abertos e mergeados (título + corpo)
   - **NÃO editar** comentários nem reviews

### Arquivos impactados (19 + 3 renames)

```
docs/strategy/BUSSOLA_PRODUTO_SSE.md                  (27 ocorrências)
docs/strategy/RF_BACKLOG.md                           (9)
docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.md       (78) + RENAME
docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.html     (47) + RENAME
docs/decisions/008-fam-implementation-decisions.md    (1)
docs/decisions/009-adocao-bussola-de-produto.md       (4)
docs/decisions/012-ns-incorporacao-parcial.md   (14) + RENAME
docs/decisions/013-incorporacao-parcial-pv-pux.md     (2)
docs/sql/001_fam_tables.sql                           (1)
CLAUDE.md                                             (1)
README.md                                             (2)
docs/README.md                                        (2)
sse-squad-dashboard.html                              (3)
.auto-memory/MEMORY.md                                (1)
.auto-memory/dm_queue.md                              (19 — este próprio arquivo)
.auto-memory/po_sessions.md                           (10)
.auto-memory/project_sse_status.md                    (7)
.auto-memory/proposals/bussola_v1_2_patch_pv_pux.md   (5)
.auto-memory/proposals/adr_013_draft.md               (2)
```

### Escopo negativo (NÃO fazer)

- Não executar `git filter-branch` nem reescrever commits históricos
- Não usar `--force-push` sob nenhuma circunstância (viola regra 1 do CLAUDE.md)
- Não alterar os documentos Oracle em `.gitignore` (referência externa)
- Não reescrever o conteúdo analítico/comparativo — apenas a string da marca + disclaimer
- Não renomear ADRs 008/013 (não contêm a marca no filename)
- Não editar comentários de PR nem reviews no GitHub
- Não tocar em `apps/api/src` ou `apps/web/src` sem evidência de match (grep inicial não encontrou — confirmar no re-scan)

### Subagentes

- **test-runner** (obrigatório, CI green)
- **frontend-reviewer** (condicional — aplicar se alteração no `sse-squad-dashboard.html` afetar JS/UI ou se qualquer `.tsx` for tocado inesperadamente)

### Critérios de aceite (Done)

- [ ] ADR-014 publicado e linkado
- [ ] Disclaimer canônico no topo de todos os docs impactados
- [ ] 3 renames aplicados com stubs de 60 dias (remoção agendada 2026-06-22)
- [ ] Todos os links cruzados atualizados (MEMORY.md, dm_queue.md T-20260421-1, ADRs 008/009/013, READMEs, dashboard)
- [ ] `grep -ri "NS" C:\Dev\storm-shield-enterprise` retorna apenas: (a) os 3 stubs de redirect, (b) menção explicativa única no ADR-014, (c) eventuais matches em `.auto-memory/sweeps/` (logs de discovery — aceitáveis)
- [ ] Sweep GitHub concluído: Verify da Etapa 3 retorna zero
- [ ] CI verde
- [ ] PR aprovado pelo PO

### Condição de reversão

Revisitar em ADR suplementar se: (a) parecer jurídico posterior indicar risco residual da sigla, (b) a sigla "NS" gerar confusão com outro termo/marca em uso, ou (c) a relação com o fornecedor mudar (licenciamento, parceria formal). Stubs de redirect facilitam rollback parcial.

### Protocolo

`docs/process/HANDOFF_PROTOCOL.md` §4 (template canônico) + §7 (ciclo de vida).

### Labels GitHub

`refactor`, `documentation`, `compliance`, `prioridade: média`, `fase-1-mvp`

---

## T-20260421-10 — P0 Fix ESM module resolution em shared-utils / shared-types (destrava deploy API)

**Origin:** PO (sessão debug assistido 2026-04-21 noite, parte 3)
**Priority:** P0
**Status:** COMPLETED
**Created:** 2026-04-21
**Closed:** 2026-04-22
**Claimed:** DM Agent (sessão 2026-04-22)
**Branch:** direto em `main` (série de hotfixes)
**PRs:** #39 (ESM fix), #40 (redis error handler), #41-43 (workflow iterations), commits diretos (Dockerfile + DI fixes)
**Supersedes:** T-20260412-1 (diagnóstico anterior estava errado — ver Contexto)

### Objetivo
Destravar o deploy API staging (Fly.io) corrigindo a causa real do crash loop: imports ESM sem extensão `.js` em `packages/shared-utils` e `packages/shared-types`. Após fix, staging volta a responder `/ready` 200 e T-20260412-1 fecha como superseded.

### Contexto (ground truth via logs Fly.io — 2026-04-21 noite)

Diagnóstico anterior (2026-04-21 dia) assumiu "DATABASE_URL_UNPOOLED inválida ou port mismatch". **Errado.** Logs frescos da máquina `6837ee3c513728` mostram o processo Node nunca chega a escutar na porta 3001:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/packages/shared-utils/dist/uuid'
imported from /app/packages/shared-utils/dist/index.js
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///app/packages/shared-utils/dist/uuid'
```

Verificado no código:
- `packages/shared-utils/src/index.ts` → `export * from './uuid';` (sem `.js`)
- `packages/shared-utils/dist/index.js` → idêntico (TSC não adiciona extensão)
- `dist/uuid.js` existe como arquivo
- `tsconfig.base.json` usa `module: "ESNext"` + `moduleResolution: "bundler"` — config pensada para bundler (webpack/vite), **inadequada para Node ESM runtime**

Por que CI/dev passam: ts-jest transpila on-the-fly (não toca `dist/`). Só o Docker runtime (que roda `node apps/api/dist/main`) força esse caminho — e quebra há 9 dias.

O mesmo bug provavelmente afeta `packages/shared-types` (não verificado — DM confirma).

Decisão PO (ADR? provavelmente dispensável se for só config fix): Opção A — adicionar extensões `.js` aos imports dos barrels + trocar `moduleResolution` para `"NodeNext"` (idiomático ESM moderno). Ver `ADR candidato` ao final.

### Ação sugerida

**Escopo mínimo (Opção A — surgical):**

1. Em `packages/shared-utils/src/index.ts` trocar:
   ```ts
   export * from './uuid';
   export * from './currency';
   export * from './date';
   export * from './validation';
   ```
   Por:
   ```ts
   export * from './uuid.js';
   export * from './currency.js';
   export * from './date.js';
   export * from './validation.js';
   ```

2. Em `packages/shared-types/src/index.ts` — aplicar a mesma correção em todos os `export * from './xxx'` sem extensão. Listar todos antes de editar.

3. Em `tsconfig.base.json`:
   ```json
   "module": "NodeNext",
   "moduleResolution": "NodeNext",
   ```
   (de `ESNext` / `bundler`)

4. Se o `apps/api/tsconfig.json` precisar ajuste em consequência (ex: imports internos sem extensão), aplicar mínimo necessário.

5. Rebuild local + verificar dist com `grep "from './.*'" packages/shared-utils/dist/index.js` — todos devem terminar em `.js`.

6. Rodar `pnpm test` — todos os testes devem continuar verdes (293+).

7. Abrir PR `fix(build): ESM module resolution — NodeNext + explicit .js extensions`.

8. Após merge, workflow `Deploy API (Staging)` roda automático. Smoke test `/ready` via `gh run watch`.

9. Validar em staging: `curl https://sse-api-staging.fly.dev/ready` → `200` com `{"db":"up","redis":"up"}`.

10. Marcar T-20260412-1 como COMPLETED (status superseded), atualizar `project_sse_status.md` Health AMARELO → VERDE.

**Se Opção A romper mais de 3 módulos** (testes locais do DM falham cascateando): reverter e aplicar Opção B — override `module: "CommonJS"` só em `packages/shared-utils/tsconfig.json` e `packages/shared-types/tsconfig.json`, sem tocar no root. Essa é a condição de reversão declarada.

### Escopo negativo — NÃO fazer

- Não tocar em secrets do Fly.io nem do GitHub — o problema nunca foi de secret
- Não alterar `fly.toml`, `infra/docker/api.Dockerfile`, nem `.github/workflows/deploy-api-staging.yml` (ficam tal como estão)
- Não refatorar source dos arquivos individuais `uuid.ts`, `currency.ts`, `date.ts`, `validation.ts` (eles não têm import relativo sem extensão — só o barrel precisa de fix)
- Não mexer em imports dentro das apps que consomem `@sse/shared-utils` (esses resolvem via `main` do package.json — não quebram)
- Não redigir ADR-011 (Release Cadence) nesta tarefa — só fica liberado quando `/ready` estiver verde e DM/PO decidirem o gatilho
- Não bundlear (esbuild/tsup) — overkill para o escopo
- Não introduzir `package.json` com `"type": "module"` nos shared packages sem avaliar cascata (se o Nest consumer não estiver preparado, quebra)

### Critérios de aceite

- [ ] `pnpm --filter @sse/shared-utils build` gera `dist/index.js` com todos os `export * from './XXX.js'` (com extensão)
- [ ] `pnpm --filter @sse/shared-types build` idem
- [ ] `pnpm test` verde em todas as suites (mínimo 293 testes)
- [ ] `pnpm --filter @sse/api build` verde
- [ ] PR CI verde (lint + test + build)
- [ ] Após merge: workflow `Deploy API (Staging)` conclui GREEN
- [ ] `curl https://sse-api-staging.fly.dev/ready` → HTTP 200 com `{"status":"ok","checks":{"db":"up","redis":"up"}}`
- [ ] `curl https://sse-api-staging.fly.dev/health` → HTTP 200

### Subagentes obrigatórios

- `test-runner` — validar 100% verde após mudança de module resolution (risco de regressão em imports)
- `db-reviewer` — **não necessário** (sem migration, sem query)
- `security-reviewer` — **não necessário** (sem auth, sem RLS)
- `frontend-reviewer` — **não necessário** (sem UI)

### Persona servida

N/A (infra / build).

### Gap fechado

N/A — destrava pipeline para entrega de gaps.

### ADR candidato

DM avalia: se a mudança `ESNext/bundler → NodeNext` tiver impacto material além do fix (ex: altera comportamento de algum import indireto no Nest ou frontend), abrir **ADR-014 — Module resolution strategy (NodeNext)**. Se for só o fix cirúrgico, dispensa ADR (comentário no PR basta).

---

## T-20260421-1 — Manutenção do dashboard NS↔Bússola (standing task)

**Origin:** PO
**Priority:** P2
**Status:** PENDING
**Created:** 2026-04-21
**Tipo:** Standing task (acionada por gatilho, não por data)

### Objetivo
Manter `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.html` sincronizado com o estado real do projeto. O Luigi adotou este dashboard como artefato canônico de acompanhamento estratégico (NS↔Bússola) em 2026-04-21. Fonte textual pareada: `ANALISE_NS_vs_BUSSOLA_v1.md`.

### Contexto
Sessão PO Cowork 2026-04-21 gerou análise comparativa NS vs Bússola cobrindo 12 áreas (Core ERP, CRM/Service, UX/Dashboards), 4 novos RFs propostos (RF-004 Customer 360, RF-005 Estimate State Machine + Inbox, RF-006 Payment Hold, RF-007 Case Management), 13 anti-recomendações explícitas, novo princípio P8 (offline-first), reclassificação 1099-NEC, ajuste cockpit "Cash disponível vs Cash Balance", e rascunho ADR-012. Dashboard HTML (1050 linhas, 62KB, 7 abas, Tailwind CDN) é o canal visual. Luigi quer acompanhar esta comparação daqui para frente como referência contínua — não é relatório de sessão, é instrumento vivo.

### Gatilhos de atualização (quando agir)
1. **RF 004/005/006/007 muda de status** (PROPOSTO → APPROVED → IN_PROGRESS → DONE) → atualizar aba "Novos RFs" + "Roadmap"
2. **Bússola é ajustada** (revisão trimestral ou evento-gatilho) → atualizar aba "Ajustes Bússola" + "Comparação" (diagnósticos aligned/adjust/reject/superior podem mudar)
3. **Nova anti-recomendação identificada** ou anti-rec existente revisitada → aba "Anti-Recomendações"
4. **Nova área NS explorada** (ex: SuiteTax, SuiteBilling) → adicionar card na aba "Comparação"
5. **ADR-012 adotado ou refinado** → aba "ADR-012" + footer status
6. **Release da Fase muda de fase** (ex: Fase 1 → Fase 2) → aba "Roadmap"

### Ação sugerida (quando gatilho dispara)
1. Editar primeiro o `.md` (fonte de verdade textual).
2. Sincronizar o `.html` (os arrays JS `AREAS` e `ANTIRECS` + seção correspondente).
3. Validar abrindo o `.html` em browser local (visual smoke test).
4. Commit único com escopo claro: `docs(strategy): sync NS dashboard — [motivo do gatilho]`.

### Escopo negativo — NÃO fazer
- Não transformar em app/dashboard dinâmico (Next.js/React) — HTML estático é intencional.
- Não remover as 26 fontes NS do `.md`.
- Não renumerar ADR-012 sem nova decisão do PO.
- Não mesclar com `BUSSOLA_PRODUTO_SSE.md` — artefatos separados por design.
- Não incluir atualização do dashboard no mesmo PR de RF de feature — sempre PR separado de doc.
- Não atualizar sem gatilho explícito (evitar churn).

### ⚠ Dependência invertida com T-20260422-1 (adicionada 2026-04-22 — PM Agent)

**Não executar esta task antes de T-20260422-1 estar COMPLETED.**

T-20260422-1 (trademark hygiene) renomeia os arquivos:
- `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.md` → `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.md`
- `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.html` → `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.html`

Ao sincronizar este dashboard (quando gatilho disparar), usar os **novos paths** `ANALISE_NS_vs_BUSSOLA_v1.*`. O PR da T-20260421-1 que sincronizar o dashboard deve também atualizar a referência de path nesta tarefa (linha "Objetivo" acima) para o novo slug `NS`.

Referência cruzada: T-20260422-1 em `dm_queue.md`, GitHub Issue #46.

### Done quando
- HTML reflete estado atual do gatilho que disparou a atualização.
- `.md` e `.html` permanecem em paridade de conteúdo.
- PR mergeado com escopo de doc isolado.

### Subagentes obrigatórios
Nenhum. Opcional `frontend-reviewer` se a estrutura HTML (tabs, arrays, CSS) mudar materialmente.

### Persona servida (se aplicável)
N/A (meta — instrumento de governança estratégica do PO).

### Gap fechado (se aplicável)
N/A (meta).

---

## T-20260421-2 — Implementar RF-004 (Customer 360 View)

**Origin:** PO
**Priority:** P1
**Status:** COMPLETED
**Created:** 2026-04-21
**Claimed:** 2026-04-22
**Closed:** 2026-04-22
**Branch:** `feature/SSE-053-rf-004-customer-360`
**PR:** #44

### Objetivo
Implementar RF-004 conforme spec em `docs/strategy/RF_BACKLOG.md` (v0.2) — tela unificada Customer 360 com 7 abas (Overview, Vehicles, Estimates, Service Orders, Insurance Claims, Payments, Interactions) para servir a persona Estimator antes/durante/após o atendimento.

### Contexto
Origem: análise comparativa NS vs Bússola (sessão PO 2026-04-21), formalizada em ADR-012. NS tem Customer 360 como padrão de indústria e o SSE hoje força o Estimator a saltar entre 4–5 telas para montar contexto do cliente — fricção direta com P4 (uma tela = uma decisão). Complexidade estimada L. Alta probabilidade de candidatar-se a Gap 9 na próxima revisão da Bússola se fricção Estimator continuar apontada.

### Ação sugerida
1. Ler RF-004 completo em `docs/strategy/RF_BACKLOG.md` (status APPROVED, aprovado em 2026-04-21 via ADR-012).
2. **Validar complexidade L (PO assessment)** — se parecer XL, propor split (ex: 4 abas primeiras como RF-004a, 3 restantes como RF-004b) ao PO antes de abrir branch.
3. Decidir tecnologia de abas (shadcn/ui Tabs + lazy loading por aba vs full page load) — registrar em ADR se estrutural.
4. Endpoint backend `GET /customers/:id/360` (agregador) + endpoints `/vehicles`, `/estimates`, `/service-orders` já existem — reutilizar.
5. Frontend: página `/app/customers/[id]` com abas dinâmicas por role (Estimator vê tudo; Technician vê Vehicles+SOs; Accountant vê Payments+Interactions).
6. **Decisão técnica do DM registrada no PR:** Global Search (Cmd/Ctrl+K) está implementado no SSE? Se não, abrir ENH separado (P1) referenciando §7 da Bússola v1.1. Não confundir com Customer 360 — é dependência de UX macro, não deste RF.
7. Subagentes obrigatórios: frontend-reviewer + test-runner + security-reviewer (RBAC granular por aba).

### Escopo negativo — NÃO fazer
- Não implementar Customer 360 como modal ou drawer — é tela dedicada (P4)
- Não criar novos endpoints de domínio — agregar os que já existem
- Não implementar Insurance Claims aba completamente se módulo de insurance não estiver pronto — deixar placeholder com CTA "módulo em breve"
- Não antecipar Cmd+K Global Search nesta tarefa (ENH separado)
- Não alterar modelo de dados de `customers` para armazenar agregações — sempre agregar em runtime com cache Redis
- Não mesclar com RF-005 (Estimate State Machine) — este RF complementa mas não bloqueia

### Done quando
- Critérios de aceite CA1–CA10 do RF-004 todos checados
- `/app/customers/:id` renderiza 7 abas acessíveis com dados reais em staging
- Performance: < 500ms para carregar aba Overview (agregação cacheada)
- RBAC: Estimator vê tudo; Technician vê subset; Accountant vê subset — auditoria em security-reviewer
- RF-004 marcado como IN_PROGRESS em `RF_BACKLOG.md` quando DM começar; DONE ao mergear
- PR referencia ADR-012 na descrição

### Subagentes obrigatórios
frontend-reviewer (7 abas + UX unified) + test-runner (coverage 80%) + security-reviewer (RBAC por aba).

### Persona servida
Estimator (primária) — Bússola §2.

### Gap fechado
Complemento a Gap 5 (Insurance workflow) — candidato a novo Gap 9 na próxima revisão da Bússola. Ver ADR-012.

### Dependências
- Recomendado: RF-002 (T-20260417-11) merged — para Estimator ter wizard completo antes
- Independente: RF-005/006 (complementam mas não bloqueiam)

---

## T-20260421-3 — SUPERSEDED por split (3a/3b/3c)

**Origin:** PO
**Priority:** P1
**Status:** SUPERSEDED
**Created:** 2026-04-21
**Closed:** 2026-04-22 (Split A ratificado por Luigi em sessão PO Cowork)
**Supersedes:** —
**Superseded by:** T-20260421-3a, T-20260421-3b, T-20260421-3c

### Nota histórica
RF-005 (XL) foi avaliado como split obrigatório. Em 2026-04-22 o PO ratificou **Split A** (originalmente sugerido no próprio spec do RF-005 em `docs/strategy/RF_BACKLOG.md`): 3a = backend state machine, 3b = inbox tabela, 3c = kanban drag-drop + SLA. Split B (tabela + kanban num PR só) foi rejeitado por bundle excessivo na UI. Ver `po_sessions.md` 2026-04-22 para justificativa + condição de reversão. RF-006 (T-20260421-4) passa a ficar BLOCKED por **apenas** 3a — permite paralelismo de 3b/3c com RF-006.

---

## T-20260421-3a — RF-005a: Backend state machine + validator + migration 014

**Origin:** PO (split ratificado 2026-04-22)
**Priority:** P1
**Status:** COMPLETED
**Created:** 2026-04-22
**Claimed:** DM Agent (sessão 2026-04-23)
**Closed:** 2026-04-23
**Branch:** `feature/SSE-054-rf-005a-state-machine-backend`
**PR:** #48 (feat) + #49 (fix migration PG 55P04)

### Objetivo
Implementar a máquina de estados de Estimates em nível de backend: expandir ENUM `estimate_status` para 10 valores canônicos, criar `EstimateStateMachineService` com validator de transitions, garantir tabela append-only `estimate_status_changes`. Zero mudança de UI.

### Contexto
Split A ratificado em 2026-04-22 (ver `po_sessions.md`). Esta é a fundação — entrega CA1, CA2, CA3 e parte de CA8 do RF-005 em `docs/strategy/RF_BACKLOG.md`. Seu merge **desbloqueia RF-006** (T-20260421-4) e também 3b e 3c. Origem conceitual: ADR-012 + Bússola §4 Gap 5.

### Ação sugerida
1. Ler RF-005 em `docs/strategy/RF_BACKLOG.md`, seções RN1–RN3 e CA1–CA3.
2. Migration `014_estimate_state_machine.sql`:
   - Expandir ENUM `estimate_status` para os 10 valores canônicos: `draft | submitted_to_adjuster | awaiting_approval | approved | supplement_pending | approved_with_supplement | rejected | disputed | paid | closed`.
   - Garantir `estimate_status_changes` (FK `estimate_id` + `from_status` + `to_status` + `changed_by_user_id` + `changed_at TIMESTAMPTZ` + `notes TEXT NULL`) com constraint append-only + RLS conforme CLAUDE.md §10 regras 3 e 13.
   - Idempotente: script de mapping para estimates pré-existentes (só aplica se mapping explícito existir; NÃO força default).
3. Backend `EstimateStateMachineService`:
   - Mapa estático `ALLOWED_TRANSITIONS: Map<from, Set<to>>` — nunca strings livres.
   - `transition(estimateId, toStatus, userId, notes?)`: valida, persiste change log, atualiza `estimates.status` dentro da mesma transaction.
   - Transition inválida → `400 BadRequest` com mensagem específica (ex: "transition draft→paid not allowed").
4. **Não expor endpoint `PATCH /estimates/:id/status`** nesta entrega — UI vem em 3b. Se precisar testar internamente, usar só service em testes/fixtures.

### Escopo negativo — NÃO fazer nesta entrega
- **Zero mudança em `apps/web`** — UI é 3b.
- Não implementar kanban nem drag-drop — é 3c.
- Não implementar SLA jobs nem notifications — é 3c.
- Não implementar Payment Hold — é RF-006 (T-20260421-4).
- Não permitir custom statuses por tenant (Bússola §1 anti-custom-fields).
- Não acoplar com state machine de service_orders — domínios separados.
- Não forçar migração de estimates pré-existentes sem mapping explícito — idempotente.
- Não implementar Reversing Journal Entries aqui. DM avalia se transição para `rejected`/`closed` precisa de reverso de GL; se sim, abrir ENH paralelo (P2, Fase 3/Accountant). Documentar decisão no PR.

### Done quando
- Migration 014 aplicada em CI, idempotente (rodar 2x não falha).
- ENUM `estimate_status` contém exatamente os 10 valores canônicos.
- `EstimateStateMachineService.transition()` com cobertura ≥ 80% cobrindo TODOS os pares from→to (válidos e inválidos) em testes dedicados.
- Cada transition válida grava registro em `estimate_status_changes`.
- Nenhum arquivo em `apps/web/**` modificado (confirma-se escopo negativo).
- PR referencia ADR-012 + Split A (ratificado 2026-04-22) + dependência de RF-006.
- **RF-005 NÃO marcado DONE no backlog** — só quando 3b e 3c fecharem.

### Subagentes obrigatórios
`db-reviewer` (migration 014 + ENUM expansion + RLS + idempotência) + `test-runner` (cada par from→to testado, zero `.skip()`) + `security-reviewer` (ownership backend RN5: quem pode invocar o service por role).

### Persona servida
Estimator (primária) — Bússola §2. Owner-Operator secundária.

### Gap fechado
Gap 5 (Insurance workflow) — Bússola §4.

### Dependências
- **Desbloqueia:** RF-006 (T-20260421-4) — gatilho `disputed`.
- **Desbloqueia:** T-20260421-3b e T-20260421-3c.

---

## T-20260421-3b — RF-005b: Inbox tabela + filtros + ownership

**Origin:** PO (split ratificado 2026-04-22)
**Priority:** P1
**Status:** COMPLETED
**Created:** 2026-04-22
**Unblocked:** 2026-04-23 (T-20260421-3a COMPLETED — PR #48+#49 merged)
**Claimed:** DM Agent (sessão 2026-04-25)
**Closed:** 2026-04-25
**Branch:** `feature/SSE-055-rf-005b-inbox-tabela`
**PR:** #50

### Objetivo
Criar `/app/estimates/inbox` com visualização em **tabela** + filtros (status multi-select / adjuster / data range) + ownership enforcement (Estimator só vê os seus; Owner/Admin vê todos). Entregar `estimate-status-badge.tsx` reutilizável cobrindo os 10 estados.

### Contexto
Split A ratificado 2026-04-22. Entrega CA5, CA6, CA9 do RF-005. Primeira entrega de UX visível do RF — prioridade alta de ship antes do kanban (que é 3c, de maior incerteza técnica).

### Ação sugerida
1. Página: `apps/web/src/app/(dashboard)/estimates/inbox/page.tsx` (App Router, Server Component + Client Component para filtros).
2. Componente `estimates-inbox-table.tsx` usando DataTable padrão (shadcn/ui + TanStack Table).
3. Filtros controlados (sincronizados com query string):
   - Status — multi-select com o ENUM completo (10 valores)
   - Adjuster — select de `insurance_contacts`
   - Data — range picker (`created_at` ou `updated_at` — DM decide, justificar no PR)
4. Componente `estimate-status-badge.tsx` reutilizável com cores RN7:
   - draft → cinza | submitted_to_adjuster → azul | awaiting_approval → amarelo | approved → verde | supplement_pending → laranja | approved_with_supplement → verde | rejected → vermelho | disputed → vermelho | paid → verde-escuro | closed → preto.
   - Será reaproveitado em Customer 360 (RF-004) e no kanban de 3c.
5. Backend endpoint `GET /estimates?scope=mine&status=&adjuster_id=&from=&to=` com ownership (RN5) enforced no service: se `request.user.role === 'estimator'`, filtrar automaticamente por `owner_user_id = current user`; Owner/Admin/Manager veem todos.
6. Customer 360 (RF-004) aba Estimates: substituir badge atual pelo novo `estimate-status-badge`.

### Escopo negativo — NÃO fazer nesta entrega
- Não implementar kanban nem drag-and-drop — é 3c.
- Não implementar SLA alerts nem notifications — é 3c.
- Não adicionar filtros/colunas além dos 3 especificados (status + adjuster + data) — ENH futuro.
- Não modificar `EstimateStateMachineService` nem o ENUM — já veio de 3a.
- Não expor `PATCH /estimates/:id/status` — transição via UI vem em 3c (via drag-drop) ou ENH se algum botão for necessário antes; não antecipar.
- CLAUDE.md §10 Regra 19 obrigatória (PV1–PV6 / PUX1–PUX6 via frontend-reviewer).

### Done quando
- `/app/estimates/inbox` renderiza tabela com dados reais em staging.
- Cada filtro funciona isolado e combinado (testes de integração).
- `estimate-status-badge.tsx` cobre os 10 estados (teste visual via story/snapshot ou unit).
- Estimator vê só seus estimates; Owner vê todos (E2E com 2 usuários de roles distintos).
- Customer 360 (RF-004) aba Estimates usa o novo badge (sem regressão visual).
- Cobertura ≥ 80% dos novos componentes + endpoint.
- PR referencia ADR-012 + ADR-013 (PV/PUX) + Split A.
- **RF-005 NÃO marcado DONE** — só quando 3c fechar.

### Subagentes obrigatórios
`frontend-reviewer` (ADR-013 obrigatório: PV1–PV6, PUX1–PUX6, 20 itens) + `test-runner` + `security-reviewer` (ownership RN5 no backend do endpoint).

### Persona servida
Estimator (primária) — Bússola §2.

### Gap fechado
Gap 5 (Insurance workflow) — Bússola §4.

### Dependências
- **BLOCKED BY:** T-20260421-3a (ENUM + service no backend).
- Independente de 3c — pode mergear antes.
- Recomendado: RF-004 merged (já está — PR #44).

---

## T-20260421-3c — RF-005c: Kanban drag-drop + SLA alerts

**Origin:** PO (split ratificado 2026-04-22)
**Priority:** P1
**Status:** COMPLETED
**Created:** 2026-04-22
**Unblocked (hard):** 2026-04-23 (T-3a COMPLETED). Hard-dep satisfeita.
**Unblocked (soft):** 2026-04-25 (T-3b COMPLETED — PR #50 merged). estimate-status-badge disponivel para reuso.
**Claimed:** DM Agent (sessão 2026-04-25)
**Closed:** 2026-04-25
**Branch:** `feature/SSE-057-rf-005c-kanban-sla`
**PR:** #52 (merged)

### Objetivo
Adicionar visualização em **kanban** a `/app/estimates/inbox` (toggle tabela↔kanban), drag-and-drop respeitando transitions válidas (consumindo mapa do 3a), e SLA jobs que notificam Owner quando estimate fica > 14 dias em `awaiting_approval` ou > 7 dias em `supplement_pending` (RN8).

### Contexto
Split A ratificado 2026-04-22. Entrega CA4 + CA7 do RF-005. Esta é a parte de **maior incerteza técnica** — drag-drop com validação de transitions + feedback visual + a11y. Isolado neste sub-RF para que tabela (3b) não fique bloqueada pela maturação dessa UX. **Condição de reversão explícita** logo abaixo.

### Ação sugerida
1. Componente `estimates-kanban.tsx` — 10 colunas, scroll horizontal em mobile (PUX6 a11y obrigatória).
2. Biblioteca drag-drop: usar `@dnd-kit` (idiomático React moderno). Se o projeto não tiver, DM confirma com frontend-reviewer antes de adicionar dependência.
3. Drag-drop consome `ALLOWED_TRANSITIONS` do backend (endpoint leve `GET /estimates/state-machine/transitions` retorna o mapa, ou bundle estático se DM preferir — documentar escolha no PR).
4. Drop inválido: toast de erro + revert visual do card à coluna original. Nenhuma chamada PATCH é feita se transition inválida.
5. Drop válido → `PATCH /estimates/:id/status` (endpoint a expor aqui, delegando ao service já construído em 3a) + refresh da view.
6. Toggle tabela↔kanban persiste preferência em `user_settings` (se a tabela existir — senão localStorage, DM decide).
7. SLA batch job (cron diário em `apps/api` usando BullMQ):
   - Query: estimates em `awaiting_approval` há > 14 dias OU em `supplement_pending` há > 7 dias.
   - Ação: criar notification para Owner do tenant (`notifications` table) com severity `warning`.
   - Idempotente: não cria duplicata se já notificado nas últimas 24h (constraint ou check em código).

### Escopo negativo — NÃO fazer nesta entrega
- Não modificar o validator de transitions — reusar do 3a.
- Não criar estados "customizados" (Bússola §1).
- Não adicionar filtros/colunas à tabela — 3b já entregou.
- Não implementar SLA dashboard agregado — ENH P2 futuro.
- Não enviar notificações por email/SMS — só via `notifications` table (bell UI). Email/SMS é ENH futuro.
- Não modificar UI de Estimate detail fora do kanban/toggle.
- Não mexer em ENUM nem em migration 014 — se precisar, abrir sub-ENH.
- CLAUDE.md §10 Regra 19 obrigatória (PV/PUX + drag-drop a11y = PUX6 risco alto).

### Done quando
- Kanban renderiza 10 colunas em staging com cards arrastáveis.
- Drop inválido bloqueado com feedback claro (toast + revert); zero PATCH disparado em inválido.
- Drop válido persiste status (verificável via `estimate_status_changes`).
- Toggle tabela↔kanban persiste preferência entre sessões.
- SLA job criou notifications corretas em teste com time mock; idempotência verificada (rodar 2x não duplica).
- Cobertura ≥ 80% dos novos componentes + job.
- PR referencia ADR-012 + ADR-013 (PV/PUX) + Split A + dependências (3a hard, 3b soft).
- **RF-005 marcado DONE em `RF_BACKLOG.md`** ao mergear este (último sub-RF do split).

### Subagentes obrigatórios
`frontend-reviewer` (ADR-013: drag-drop a11y = PUX6 risco alto — expandir 20 itens) + `test-runner` (testes cobrindo transitions inválidas drag + SLA job idempotente) + `security-reviewer` (job não pode vazar cross-tenant; endpoint PATCH com ownership).

### Persona servida
Estimator (primária). Owner-Operator (SLA alerts).

### Gap fechado
Gap 5 (Insurance workflow) — Bússola §4.

### Dependências
- **BLOCKED BY:** T-20260421-3a (hard — precisa do service).
- **Soft-dep:** T-20260421-3b (recomendado merged antes — para reusar `estimate-status-badge`). Se 3b não estiver, implementar badge inline e refatorar depois.

### Condição de reversão (explícita)
Se após 3a + 3b em staging o Estimator (entrevista rápida via ritual Operating Model §5.4) indicar que kanban não agrega valor percebido frente ao esforço, canibalizar 3c: entregar APENAS o SLA job como ENH isolado e rebater o kanban como ENH P2 futuro. Reverter exige nota em `po_sessions.md` + atualização do RF_BACKLOG §RF-005 para DONE parcial documentado.

---

## T-20260421-4 — Implementar RF-006 (Payment Hold / Disputed Estimate)

**Origin:** PO
**Priority:** P1
**Status:** COMPLETED
**Created:** 2026-04-21
**Updated:** 2026-04-25 (COMPLETED — PR #51 aberto)
**Claimed:** DM Agent (sessão 2026-04-25)
**Branch:** `feature/SSE-056-rf-006-payment-hold`
**PR:** #51

### Objetivo
Implementar RF-006 conforme spec em `docs/strategy/RF_BACKLOG.md` (v0.2) — bloqueio automático de pagamentos (insurance + out-of-pocket) quando estimate transiciona para `disputed` na state machine (RF-005a), com workflow de resolução e auditoria.

### Contexto
Origem: ADR-012 + Bússola §4 Gap 5. NS tem "Hold Payments on Sales Orders" como padrão para disputas; hoje o SSE não tem mecanismo de bloqueio — Estimator precisa avisar Accountant manualmente e há risco de pagamento liberado por engano. Complexidade estimada M. Depende de **T-20260421-3a** (state machine backend) estar em produção — sem o estado `disputed` no ENUM, não há gatilho. Após Split A ratificado em 2026-04-22, 3b (tabela) e 3c (kanban/SLA) **não bloqueiam** este RF — pode rodar em paralelo.

### Ação sugerida
1. Ler RF-006 completo em `docs/strategy/RF_BACKLOG.md` (status APPROVED, aprovado 2026-04-21 via ADR-012).
2. **Não iniciar antes de T-20260421-3a mergeada em staging** — este RF escuta eventos da state machine (só 3a basta; 3b/3c independentes).
3. Backend: listener para webhook `estimate.status.changed` (from=*, to=Disputed) → cria `payment_hold` record vinculado ao estimate + customer + insurance_claim; bloqueia approvals de `financial_transactions` associados.
4. Workflow de resolução: Accountant/Owner pode "resolver" o hold (resolution: paid_out / refunded / cancelled / released) com audit trail obrigatório.
5. Frontend: notification bell + painel `/app/financial/payment-holds` listando holds ativos, filtros por customer/estimate/status.
6. **Decisão técnica do DM registrada no PR:** impacto em GL (Journal Entries) de hold criado/resolvido? Se criar JE de contra-partida (ex: Suspense account 1490), documentar padrão contábil e consultar ADR se necessário.
7. Subagentes obrigatórios: db-reviewer (tabela `payment_holds` + RLS + indexes) + security-reviewer (quem pode criar/resolver) + test-runner.

### Escopo negativo — NÃO fazer
- Não implementar antes de T-20260421-3a estar mergeada — dependência hard (apenas 3a; 3b/3c não bloqueiam RF-006)
- Não criar nova máquina de estados para holds — usar enum simples (active, resolved, cancelled)
- Não bloquear pagamentos retroativos (já processados antes do Disputed) — só futuros
- Não enviar notificação automática para seguradora nesta entrega — ENH futuro
- Não acoplar lógica de hold com banco (Plaid/reconciliation) — é camada de aplicação, não bancária
- Não implementar liberação automática após tempo — sempre manual com audit trail

### Done quando
- Critérios de aceite CA1–CA8 do RF-006 todos checados
- Tabela `payment_holds` criada com RLS; listener funcional em staging
- Hold criado automaticamente ao transicionar estimate para `disputed`; bloqueio de approval verificável
- Resolução manual com audit log completo; notificação visível no bell
- RF-006 marcado DONE em `RF_BACKLOG.md` ao mergear
- PR referencia ADR-012 + dependência de T-20260421-3a (Split A)

### Subagentes obrigatórios
db-reviewer + security-reviewer + test-runner. Opcional frontend-reviewer se UI tem complexidade.

### Persona servida
Estimator (primária — aciona hold) + Accountant (secundária — resolve hold). Bússola §2.

### Gap fechado
Complemento a Gap 5 (Insurance workflow) — Bússola §4.

### Dependências
- **BLOCKED BY** T-20260421-3a (state machine backend) — desbloquear assim que 3a for DONE. **3b e 3c NÃO bloqueiam** este RF.
- Independente: RF-004/007

---

## T-20260421-5 — Implementar RF-007 (Case Management simplificado)

**Origin:** PO
**Priority:** P2
**Status:** IN_REVIEW
**Created:** 2026-04-21
**Claimed:** 2026-04-23
**Branch:** `feature/SSE-060-rf-007-case-management`
**PR:** #56 (open — CI pending)

### Objetivo
Implementar RF-007 conforme spec em `docs/strategy/RF_BACKLOG.md` (v0.2) — módulo leve de Case Management (não ticketing full) para registrar follow-ups, dúvidas de cliente, supplements de insurance que não são disputa. Intencionalmente enxuto: 3 status (Open, In Progress, Closed), vinculação a customer+optional vehicle/estimate, notas + anexos.

### Contexto
Origem: ADR-012 + Bússola §4 Gap 5 (Insurance workflow). NS tem CRM Case Management robusto; o SSE rejeita essa complexidade (anti-rec #13 formaliza limite). Complexidade estimada M. Intencionalmente P2 e leve — se crescer em escopo, violamos P1 (simplificar > completar).

### Ação sugerida
1. Ler RF-007 completo em `docs/strategy/RF_BACKLOG.md` (status APPROVED, aprovado 2026-04-21 via ADR-012, com anti-rec #13 explícita).
2. Migration: tabela `cases` (id, tenant_id, customer_id, vehicle_id?, estimate_id?, title, description, status enum, created_by, assigned_to?, created_at, updated_at, closed_at?) + `case_notes` (case_id, user_id, body, attachments jsonb, created_at).
3. Backend: CRUD `/cases` com RLS + RBAC (Estimator/Manager/Owner criam; qualquer role vê cases dos customers que ele acessa).
4. Frontend: `/app/cases` lista + filtros por status/assigned_to; `/app/customers/:id/cases` embedded na aba Interactions do RF-004.
5. **Decisão técnica do DM registrada no PR:** anexos via StorageService (S3/R2) — reaproveitar módulo existente, não criar novo. Limit 10MB por arquivo, 5 por case na v0.1.
6. Subagentes obrigatórios: db-reviewer + test-runner + frontend-reviewer.

### Escopo negativo — NÃO fazer (especialmente importante — anti-rec #13)
- **Não transformar em ticketing full estilo Zendesk/Freshdesk** — se a pressão vier, reforçar anti-rec #13 e escalar ao PO
- Não adicionar SLA tracking, priority matrix, escalation rules, auto-assignment — P1 (simplificar > completar)
- Não integrar com email externo (reply-via-email) — ENH muito futuro se volume justificar
- Não adicionar chatbot ou IA para sugestões de resolução — fora de escopo Fase 2
- Não criar dashboards de métricas de cases (time-to-close, SLA breach) — se aparecer pressão, escalar ao PO para decidir se promove RF ou rejeita
- Não permitir que Technician crie cases sem supervisão (RBAC: Technician vê, não cria)
- Se após 90 dias em produção ≤ 5% dos tenants usarem cases, cancelar RF conforme condição de reversão #4 do ADR-012

### Done quando
- Critérios de aceite CA1–CA8 do RF-007 todos checados
- Tabela `cases` + `case_notes` criadas com RLS; CRUD funcional
- `/app/cases` e aba em `/app/customers/:id/cases` renderizam em staging
- Anexos via StorageService funcionando (upload + download + delete)
- RF-007 marcado DONE em `RF_BACKLOG.md` ao mergear
- PR referencia ADR-012 + anti-rec #13 explicitamente na descrição

### Subagentes obrigatórios
db-reviewer + test-runner + frontend-reviewer.

### Persona servida
Estimator (primária) — Bússola §2.

### Gap fechado
Complemento a Gap 5 (Insurance workflow) — Bússola §4.

### Dependências
- Recomendado: RF-004 (T-20260421-2) merged — para que aba Interactions do Customer 360 já embeda cases
- Independente: RF-005/006

### Monitoramento pós-release (condição de reversão ADR-012 #4)
- PM Agent monitora uso em 90 dias: % tenants com ≥ 1 case, mediana de cases/tenant/mês
- Se ≤ 5% tenants, escalar ao PO para decidir cancelamento + novo ADR de retirada

---

## T-20260421-6 — Aplicar patches da Bússola v1.2 + Operating Model v2.1 + sugestão CLAUDE.md Regra 19 (ADR-013)

**Origin:** PO
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-21
**Claimed:** DM Agent (sessão 2026-04-22)
**Closed:** 2026-04-22
**Branch:** `docs/SSE-054-adr-013-patches`
**PR:** #45
**Tipo:** Doc-only (sem código de produção)

### Objetivo
Aplicar 3 patches derivados do ADR-013 (incorporação parcial do pacote MF):
1. `docs/strategy/BUSSOLA_PRODUTO_SSE.md` → v1.2 (§6 reorganizada em §6.1/§6.2/§6.3, PV/PUX adotados)
2. `docs/process/OPERATING_MODEL_v2.md` → v2.1 (§5.4 novo — health check do squad)
3. `CLAUDE.md` seção 10 → nova Regra 19 (respeitar PV/PUX; frontend-reviewer bloqueia violação)

### Contexto
ADR-013 (draft em `.auto-memory/proposals/adr_013_draft.md`) formaliza absorção cirúrgica de PV1–PV6 + PUX1–PUX6 do pacote MF na Bússola SSE, sem conflito com P1–P8. Escopo aprovado pelo PO em sessão 2026-04-21 (noite, parte 2) via AskUserQuestion: Opção A — Cirúrgica, absorver em `frontend-reviewer` existente, sem subagente novo.

### Instruções detalhadas
Todas as instruções passo-a-passo estão nos 3 arquivos de patch em `.auto-memory/proposals/`:
- `bussola_v1_2_patch_pv_pux.md` — 3 edições (header, §6, §9)
- `operating_model_v2_1_patch_squad_health.md` — 3 edições (header, §5.4 novo, §4 cadência)
- `claude_md_rule_19_suggestion.md` — sugestão de texto para Regra 19

Também promover o ADR-013:
- Copiar `.auto-memory/proposals/adr_013_draft.md` → `docs/decisions/013-incorporacao-parcial-pv-pux.md`
- Alterar status "DRAFT" → "Accepted" no header
- Manter "Data: 2026-04-21"

### Escopo negativo — NÃO fazer
- Não alterar texto de P1–P8 na Bússola — apenas mover para subseção §6.1
- Não criar subagente `ux-reviewer` independente (decisão PO)
- Não redigir RF-UI-SSE de paleta agora (fica para sessão futura)
- Não tocar §1–§5, §7–§8 da Bússola
- Não tocar §6 Métricas nem §7 Fluxo do Operating Model
- Não alterar CLAUDE.md Regras 1–18
- Não adicionar outros princípios PV/PUX que não sejam PV1–PV6 + PUX1–PUX6 conforme patch
- Não fazer grep/replace cego — patches são descritivos, aplicar com cuidado de âncoras markdown

### Verificação embutida (rodar após patches)
Comandos no próprio patch — executar todos os `grep` listados no final de cada patch. Reportar no PR o resultado de cada verificação.

### Done quando
- Bússola v1.2 com §6.1/§6.2/§6.3 e v1.2 no header
- Operating Model v2.1 com §5.4 "Health check do squad"
- CLAUDE.md §10 com Regra 19
- ADR-013 promovido a Accepted em `docs/decisions/`
- Todos os grep de verificação passam
- PR com escopo doc-only, sem tocar código de produção
- Commit: `docs: adopt ADR-013 — PV/PUX framework + squad health ritual`

### Subagentes obrigatórios
Nenhum (doc-only). Opcional `frontend-reviewer` se quiser usar o próprio patch como teste inicial do novo checklist.

### Persona servida
N/A (governança interna).

### Gap fechado
N/A (governança — habilita coerência visual/UX para RF-004 e futuras RFs de UI).

### Referências
- `.auto-memory/proposals/adr_013_draft.md`
- `.auto-memory/proposals/bussola_v1_2_patch_pv_pux.md`
- `.auto-memory/proposals/operating_model_v2_1_patch_squad_health.md`
- `.auto-memory/proposals/claude_md_rule_19_suggestion.md`

---

## T-20260421-7 — Expandir frontend-reviewer com checklist PV/PUX (ADR-013)

**Origin:** PO
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-21
**Claimed:** DM Agent (sessão 2026-04-22)
**Closed:** 2026-04-22
**Branch:** `docs/SSE-054-adr-013-patches`
**PR:** #45
**Tipo:** Doc-only
**Blocked by:** T-20260421-6 (precisa Bússola v1.2 publicada para referenciar §6.2/§6.3)

### Objetivo
Expandir o prompt do `frontend-reviewer` em `.claude/agents/SSE_Prompts_Squad_IA.md` (seção DM-06, linhas ~308–335) de 8 para 20 itens de checklist — 8 atuais + 6 PV + 6 PUX — com output format expandido.

### Instruções detalhadas
Conteúdo completo do novo bloco DM-06 em `.auto-memory/proposals/frontend_reviewer_patch_pv_pux.md`. Substituir integralmente a seção DM-06 pelo conteúdo novo. Itens 1–8 preservados; 9–14 são PV1–PV6; 15–20 são PUX1–PUX6.

### Escopo negativo — NÃO fazer
- Não criar subagente novo (decisão PO: absorver no existente)
- Não alterar seções DM-01..DM-05 nem DM-07+
- Não alterar COMBO-01 (ciclo completo de feature) — pode mencionar PV/PUX mas não expandir aqui
- Não adicionar item para paleta concreta (cor/fonte) — adotamos princípio, não valores
- Não remover nenhum dos 8 itens atuais

### Done quando
- Seção DM-06 contém 20 itens (8 base + 6 PV + 6 PUX)
- Output format expandido com 3 bloqueantes/opcionais/positivos
- Seções DM-01..DM-05 e COMBO-01+ intactas
- Todos os grep de verificação passam (ver patch)
- Commit: `docs(squad): expand frontend-reviewer with PV/PUX checklist (ADR-013)`

### Subagentes obrigatórios
Nenhum.

### Referências
- `.auto-memory/proposals/frontend_reviewer_patch_pv_pux.md`
- Bússola v1.2 §6.2 e §6.3 (após T-20260421-6)

---

## T-20260421-8 — Atualizar AGENTS.md e `.auto-memory/MEMORY.md` com referência ao ADR-013

**Origin:** PO
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-21
**Claimed:** DM Agent (sessão 2026-04-22)
**Closed:** 2026-04-22
**Branch:** `docs/SSE-054-adr-013-patches`
**PR:** #45
**Tipo:** Doc-only
**Blocked by:** T-20260421-6 (ADR-013 precisa estar Accepted)

### Objetivo
Propagar existência da Regra 19 + PV/PUX em 2 arquivos de índice:
1. `AGENTS.md` — adicionar linha sobre frontend-reviewer com checklist expandido + Regra 19
2. `.auto-memory/MEMORY.md` — adicionar linha linkando `sse_mf_incorporation.md` (criado em sessão)

### Instruções
- `AGENTS.md`: após seção que descreve os 4 subagentes, adicionar nota: *"Desde ADR-013 (2026-04-21), `frontend-reviewer` carrega checklist de 20 itens cobrindo PV1–PV6 + PUX1–PUX6 da Bússola §6.2/§6.3. Regra 19 do CLAUDE.md torna violação bloqueante."*
- `MEMORY.md` (do projeto em `.auto-memory/`): se houver index de artefatos, adicionar linha referenciando ADR-013 e a Bússola v1.2.

### Escopo negativo — NÃO fazer
- Não duplicar conteúdo dos patches em AGENTS.md — apenas referência
- Não alterar estrutura dos arquivos, só inserir nota

### Done quando
- AGENTS.md menciona Regra 19 e checklist expandido
- `.auto-memory/MEMORY.md` (do projeto) tem referência ao ADR-013
- Commit: `docs: cross-reference ADR-013 in AGENTS.md and MEMORY.md`

### Subagentes obrigatórios
Nenhum.

---

## T-20260421-9 — Sincronizar dashboard NS↔Bússola com v1.2 (gatilho #2)

**Origin:** PO
**Priority:** P2
**Status:** COMPLETED
**Created:** 2026-04-21
**Closed:** 2026-04-25
**Claimed:** DM Agent (sessão 2026-04-25)
**Branch:** `docs/SSE-t9-sync-ns-dashboard-bussola-v12` (deleted)
**PR:** #54
**Tipo:** Doc-only
**Blocked by:** T-20260421-6 (Bússola v1.2 publicada)

### Objetivo
Acionar o gatilho #2 do T-20260421-1 (standing task) — "Bússola é ajustada" → atualizar aba "Ajustes Bússola" + "Comparação" do dashboard `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.html` com a promoção v1.1 → v1.2 e a reorganização de §6.

### Contexto
O dashboard é artefato vivo (adotado por ADR-012). Qualquer mudança na Bússola dispara atualização. Gatilho #2 documentado em T-20260421-1 do `dm_queue.md`.

### Instruções
1. Ler `docs/strategy/BUSSOLA_PRODUTO_SSE.md` v1.2 (após T-20260421-6 mergear)
2. Atualizar `ANALISE_NS_vs_BUSSOLA_v1.md`:
   - Header: adicionar linha "v1.2 (2026-04-21): Bússola promovida a v1.2 via ADR-013 — §6 reorganizada em §6.1/§6.2/§6.3, PV/PUX adotados"
   - Aba/seção "Ajustes Bússola": adicionar card ou linha referenciando ADR-013
3. Sincronizar `ANALISE_NS_vs_BUSSOLA_v1.html` — mesmas edições no array JS equivalente
4. Commit: `docs(strategy): sync NS dashboard with Bussola v1.2 (ADR-013 trigger)`

### Escopo negativo — NÃO fazer
- Não transformar em dashboard dinâmico
- Não alterar as 26 fontes NS do `.md`
- Não incluir mais do que a referência ao ADR-013 — PV/PUX já vivem na Bússola, não duplicar aqui

### Done quando
- `.md` e `.html` referenciam ADR-013 e Bússola v1.2
- Visual smoke test do `.html` passa
- Commit mergeado

### Subagentes obrigatórios
Opcional `frontend-reviewer` (este seria o primeiro teste do novo checklist aplicado — meta-teste útil).

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
**Status:** SUPERSEDED por T-20260421-10 (2026-04-21 noite — diagnóstico anterior estava errado)
**Created:** 2026-04-12
**Closed:** 2026-04-21 (sem merge — substituída)
**Claimed:** —
**Branch:** —
**PR:** —

### Atualização 2026-04-21 (sessão PO debug assistido)

Diagnóstico desta tarefa ("secrets ausentes" / "DATABASE_URL_UNPOOLED inválida") foi **refutado** por logs frescos da máquina Fly.io:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/packages/shared-utils/dist/uuid'
imported from /app/packages/shared-utils/dist/index.js
```

Causa real: bug de build ESM nos barrels de `packages/shared-utils` (e provavelmente `shared-types`). Imports sem extensão `.js` + `moduleResolution: "bundler"` no tsconfig. O processo Node **nunca** chega a escutar na porta 3001 — crasha no boot há 9 dias.

**Não requer ação humana** (secrets são irrelevantes ao bug). Escopo migrado para **T-20260421-10** — handoff ao DM com fix cirúrgico.

Quando T-20260421-10 fechar com `/ready` verde, mover esta tarefa para `dm_queue_archive.md` no status COMPLETED-SUPERSEDED.

### Objetivo (histórico — não executar)
Desbloquear deploy API staging (Fly.io) que falha com exit code 1 por ausência de secrets.

### Contexto (histórico — refutado)
Deploy API falha em todos os runs com `exit code 1`. Secrets ausentes: `FLY_API_TOKEN` e `DATABASE_URL_UNPOOLED`. Bloqueia T-019 (smoke test) e valida end-to-end staging.

**Status BLOCKED:** esta tarefa requer ação HUMANA do PO (Luigi) — nenhum agente pode configurar secrets do GitHub. Ao iniciar próxima sessão PO, DM deve relembrar Luigi desta pendência.

### Ação sugerida (histórico — não executar)
1. DM, ao iniciar sessão com Luigi, notifica: *"Para desbloquear T-019 e deploy API, preciso que você configure `FLY_API_TOKEN` e `DATABASE_URL_UNPOOLED` em Settings → Secrets → Actions do repo GitHub."*
2. Após secrets configurados: re-run do workflow `Deploy API (Staging)` via `gh workflow run deploy-api-staging.yml`
3. Marcar T-019 como Concluído no Excel quando smoke test passar

### Escopo negativo — NÃO fazer
- Não tentar configurar secrets programaticamente (fora de escopo de DM/agent)
- Não fazer deploy manual com token temporário — secrets são o caminho correto

### Done quando
- ~~Secrets configurados por Luigi~~ (superseded)
- T-20260421-10 fecha com `/ready` 200 em staging

### Subagentes obrigatórios
Nenhum.

### Persona servida
N/A (infra).

### Gap fechado
N/A (infra).

### Aprendizado registrado (para evitar repetição)
Diagnóstico de deploy sem consumir logs de boot da máquina é especulação. Próxima vez que um deploy falhar sem causa óbvia, **primeiro comando**: `flyctl logs -a <app> --no-tail | Select-Object -Last 100`. Hipóteses (secrets, DNS, port, SSL) só depois. Vale um aditivo no runbook `docs/runbooks/staging-deploy.md` se o DM achar pertinente no PR de T-20260421-10.

--
## [2026-04-22] T-20260422-11 — Adicionar seção "Dashboards estratégicos" ao template §5 do HANDOFF_PROTOCOL

Origin: PO
Priority: P2 (doc-only, destrava consistência de governança)
Status: PENDING
Depends on: — (independente)

### Motivação
Dashboard `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.html` foi adotado como artefato vivo em 2026-04-21 (MEMORY.md seção "Dashboards estratégicos"). Hoje o PM só menciona o dashboard quando há novidade. Com esta alteração, o PM passa a reportar **em toda revisão** o estado de sincronização do dashboard e o status dos 6 gatilhos de T-20260421-1. Fecha o loop: artefato vivo → template oficial → ritual recorrente.

### Escopo
Arquivo único: `docs/process/HANDOFF_PROTOCOL.md`, §5 "Template canônico — Status do PM".

Inserir nova subseção no template, ENTRE `## Inconsistências detectadas (opcional)` e o fechamento do bloco de código, exatamente assim:

~~~
## Dashboards estratégicos (obrigatório)
- NS↔Bússola v1 (`docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.html`):
  - Última sincronização: YYYY-MM-DD | Versão: vN.N
  - Gatilhos T-20260421-1 abertos: [lista ou "nenhum"]
    - [ ] Mudança status RF-004..007
    - [ ] Ajuste Bússola publicado
    - [ ] Nova anti-rec / nova área NS
    - [ ] Mudança em ADR-012
    - [ ] Mudança de fase do projeto
  - Divergências vs estado atual: [lista ou "nenhuma"]
- (adicionar blocos análogos ao incluir novos dashboards vivos no MEMORY.md)
~~~

Adicionar também em §12 "Revisão e evolução" a nota: *"Dashboards vivos (MEMORY.md seção 'Dashboards estratégicos') devem ter entrada correspondente no status do PM — §5."*

### Escopo NEGATIVO
- NÃO alterar `OPERATING_MODEL_v2.md` (ritual não muda, só o template do artefato)
- NÃO alterar `MEMORY.md` (já tem a seção correta)
- NÃO criar ADR (append retrocompatível, coberto por §12 do HANDOFF_PROTOCOL)
- NÃO reescrever §5 inteiro — apenas append da nova subseção
- NÃO tocar no dashboard em si (governança é T-20260421-1)

### Subagentes
Nenhum (doc-only). Validação por leitura.

### Done quando
- [ ] `HANDOFF_PROTOCOL.md` §5 contém a nova subseção "Dashboards estratégicos (obrigatório)" no template
- [ ] §12 menciona vínculo MEMORY.md ↔ §5
- [ ] Commit: `docs(process): adicionar seção Dashboards estratégicos ao template §5 do HANDOFF_PROTOCOL`
- [ ] PR aberto com label `documentation`
- [ ] Próxima revisão do PM (executada após merge) já contém a seção preenchida em `project_sse_status.md`

### Critério de reversão
Se, após 2 revisões consecutivas do PM, a seção nascer sempre vazia (sem gatilhos, sem divergências) e o dashboard permanecer inalterado por >30d, reavaliar: manter obrigatória mas permitir colapsar em 1 linha "sem movimento desde YYYY-MM-DD".

### Persona servida
N/A (governança de processo).

### Gap fechado
N/A (governança de processo).

### Aprendizado registrado (para evitar repetição)
Colar bloco longo com markdown + backticks + caracteres especiais em here-string PowerShell no terminal interativo é frágil: o `'@` final se perde no buffer quando há múltiplas linhas com caracteres de escape. Próxima tarefa longa do PO para o DM: editar o arquivo direto (Edit tool) em vez de script PowerShell colado — ou salvar o corpo em arquivo `.txt` temporário e usar `Get-Content $tmp -Raw`.

---
