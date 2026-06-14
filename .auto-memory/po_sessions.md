## Sessao 2026-06-14 — PO Cowork (UAT bloqueio Clerk)

Foco: Desbloquear UAT 5/5 apos PRs #88/#89/#90 (deploy API verde).

Decisoes:
- JWT template Clerk (publicMetadata): PATCH /v1/instance retornou 204 mas nao verificavel via API
  Condicao reversao: se proxima sessao confirmar que publicMetadata ainda nao esta no JWT, implementar solucao via codigo (auth.controller.ts retorna tenantId, frontend usa esse endpoint como bootstrap)
- Clerk Org membership: luigi.filippozzi@gmail.com adicionado como org:admin em org_3EC9cu4VckyAhRCb1TXhSLWAgmg
  clerk_org_id gravado no tenant settings via fix-tenant-context.mjs
- DB swap tmp-fix-owner.ts: owner@acme-sse-demo.com -> external_auth_id = user_3DHUjuMQ8xRMSo122gHPKFnpsV4 (luigi)
  PENDENTE: rodar revert apos UAT concluir (ts-node tmp-fix-owner.ts revert)

Estado ao fechar sessao:
- Deploy API staging: VERDE (PRs #88/#89/#90 mergeados)
- Clerk: luigi na org, clerk_org_id no tenant, publicMetadata claim tentada via API
- "Tenant context required" em Customers: AINDA NAO RESOLVIDO ao fechar
- Ultimo teste: logout+login via Google feito, resultado nao capturado

Proximo foco obrigatorio:
1. Confirmar se publicMetadata esta no JWT (F12 > Application > Cookies > __session, decodificar em jwt.io)
2. Se nao estiver: implementar BUG-F (endpoint /auth/tenant no backend + useEffect no frontend para setar X-Tenant-Id via localStorage)
3. Se estiver: o problema e outro — checar auth.guard.ts validacao de orgId vs claims
4. Apos UAT: rodar ts-node apps/api/src/database/seeds/tmp-fix-owner.ts revert

Arquivos temporarios para limpar:
- fix-tenant-context.mjs, fix-tenant-context.ps1, fix-clerk-jwt.mjs (raiz do repo)
- apps/api/src/database/seeds/tmp-fix-owner.ts, tmp-query.ts, tmp-query.mjs

Bugs: BUG-D (deploy) FECHADO | BUG-E (UAT) FECHADO | BUG-F (tenant context) ABERTO
Issues criadas: nenhuma nesta sessao
PRs revisados: #88 #89 #90 (mergeados)
Alinhamento Bussola: nao aplicavel (sessao tecnica de infra/auth)
Proxima sessao: foco em BUG-F + UAT 5/5

---

## Sessao 2026-06-08 ? PO Cowork (continuacao 2026-05-28)

Foco: Executar Caminho D para fechar RC-1 do BUG-D (credencial Neon).

Decisoes:
- Caminho D aprovado: reset Neon Console via Chrome MCP + sync GH/Fly via CLI
  Condicao reversao: se outras sessoes paralelas (DM, scripts locais) quebrarem
  por credencial invalidada, considerar workflow alternativo de rotacao
- workflow_dispatch aceito como mecanismo manual oficial ate RC-2 fechar
  Condicao reversao: se UAT falhar e auto-deploy for necessario para iteracao
  rapida, priorizar RC-2 antes de novos features

Acoes executadas:
1. Neon Console (via Chrome): reset password neondb_owner branch production
2. PowerShell: gh secret set DATABASE_URL + DATABASE_URL_UNPOOLED (repo)
3. PowerShell: flyctl secrets set DATABASE_URL + DATABASE_URL_UNPOOLED (sse-api-staging)
4. PowerShell: gh workflow run "Deploy API (Staging)" --ref main

Resultado: RC-1 FECHADO
- Run 27159265227 success
- Image hash mudou de 01KQNDTZ... (pre-BUG-C) para 01KTM8RC... (com PR #85+#87)
- /ready 200 db:up
- T-20260412-1 oficialmente destravado apos 46 dias

Bugs/Tasks:
- BUG-C: CLOSED (validado em producao via image hash novo)
- BUG-D: 1/5 RCs fechados (RC-1), 1/5 parcial (RC-2)
- T-20260412-1: DESTRAVADO

Issues criadas: 0 (comentario em issue #86 BUG-D)
PRs revisados: 0
Bloqueios: nenhum ? UAT pode prosseguir

Alinhamento Bussola:
- Persona primaria atendida: Admin / body shop owner (Bussola secao 2)
- Gap critico: ativacao destravada ? staging pronto para receber dados reais (Bussola secao 4)

Proxima sessao:
- Smoke UAT 5/5 (login Acme, /customers, /estimates, dashboard, /financial)
- Se UAT verde: fechar BUG-D parcialmente (RC-3/4/5 viram issues separadas)
- Se UAT vermelho: novo BUG-E com payload exato

NOTA DE SEGURANCA: credenciais Neon aparecidas no chat do Cowork devem ser
rotacionadas novamente apos UAT verde para minimizar exposicao.
---
## Sessao 2026-05-28 ? PO Cowork

Foco: Tentativa de smoke UAT pos-BUG-C que evoluiu para handoff DM (BUG-D multi-RC).

Decisoes:
- Aceitar PR #85 como merged sem review arquivo-a-arquivo (599/599 testes + diff regras inviolaveis OK)
  Condicao reversao: se BUG-D RC-1 revelar problema no fix BUG-C, reabrir review do PR #85
- Suspender tentativas de deploy manual Windows; consolidar em BUG-D (multi-RC)
  Condicao reversao: se BUG-D > 5 dias uteis sem fechar, escalar para sessao operating model
- NAO fazer UAT contra imagem pre-BUG-C deployada atualmente
- ADR-011 (release cadence) permanece reservado ate BUG-D fechar

Bugs/Tasks:
- BUG-C: CLOSED (PR #85 merged em c3c7af1, 2026-05-25)
- BUG-D: OPEN P0 (handoff DM em dm_queue.md, atacar 5 causas raizes)
- T-20260412-1: ainda BLOCKED, agora coberto sob BUG-D

Evidencias acumuladas BUG-D (7 itens):
E1 CI failing 3 workflows | E2 Postgres 28P01 migration | E3 flyctl Windows path
E4 flyctl archive/tar bug | E5 workflow naming | E6 imagem pre-BUG-C | E7 secrets OK

Issues criadas: BUG-D no GitHub (referencia em dm_queue.md)
PRs revisados: PR #85 (validacao leve via diff + CI checks)
Bloqueios: BUG-D abrange todos

Alinhamento Bussola:
- Persona primaria afetada: Admin / body shop owner (Bussola secao 2)
- Gap critico: ativacao bloqueada por staging sem dados reais (Bussola secao 4)

Proxima sessao:
- Se BUG-D fechado: smoke UAT 5/5 + cleanup MEMORY.md
- Se BUG-D parcial: revisar PRs do DM por RC fechado
- Se BUG-D travado: sessao dedicada operating model + escalacao
---
## Sessao 2026-05-28 ? PO Cowork

Foco: Tentativa de smoke UAT pos-BUG-C que evoluiu para handoff DM (BUG-D multi-RC).

Decisoes:
- Aceitar PR #85 como merged sem review arquivo-a-arquivo (599/599 testes + diff regras inviolaveis OK)
  Condicao reversao: se BUG-D RC-1 revelar problema no fix BUG-C, reabrir review do PR #85
- Suspender tentativas de deploy manual Windows; consolidar em BUG-D (multi-RC)
  Condicao reversao: se BUG-D > 5 dias uteis sem fechar, escalar para sessao operating model
- NAO fazer UAT contra imagem pre-BUG-C deployada atualmente
- ADR-011 (release cadence) permanece reservado ate BUG-D fechar

Bugs/Tasks:
- BUG-C: CLOSED (PR #85 merged em c3c7af1, 2026-05-25)
- BUG-D: OPEN P0 (handoff DM em dm_queue.md, atacar 5 causas raizes)
- T-20260412-1: ainda BLOCKED, agora coberto sob BUG-D

Evidencias acumuladas BUG-D (7 itens):
E1 CI failing 3 workflows | E2 Postgres 28P01 migration | E3 flyctl Windows path
E4 flyctl archive/tar bug | E5 workflow naming | E6 imagem pre-BUG-C | E7 secrets OK

Issues criadas: BUG-D no GitHub (referencia em dm_queue.md)
PRs revisados: PR #85 (validacao leve via diff + CI checks)
Bloqueios: BUG-D abrange todos

Alinhamento Bussola:
- Persona primaria afetada: Admin / body shop owner (Bussola secao 2)
- Gap critico: ativacao bloqueada por staging sem dados reais (Bussola secao 4)

Proxima sessao:
- Se BUG-D fechado: smoke UAT 5/5 + cleanup MEMORY.md
- Se BUG-D parcial: revisar PRs do DM por RC fechado
- Se BUG-D travado: sessao dedicada operating model + escalacao
---
---
name: PO Sessions Log
description: Registro datado de sess?es do Product Owner ? decis?es estrat?gicas, artefatos produzidos, handoffs ao DM
type: project
---
> **Nota:** "NS" = ERP de refer?ncia externo. Nome substitu?do por precau??o (ADR-014).

# PO Sessions ? Storm Shield Enterprise

---

## Sess?o 2026-05-25 ? PO Cowork

**Foco:** Housekeeping p?s-PR #84 ? registro de sess?o, restaura??o de dm_queue.md truncado, commit dos arquivos sujos

**Decis?es:** Nenhuma decis?o estrat?gica nova. Sess?o operacional.

**T-20260524-1 confirmado COMPLETED:** PR #84 merged ? BUG-A (Clerk /login/tasks 404) + BUG-B (X-Clerk-Org-Id ausente em 12 hooks) + security fix (cross-tenant spoofing via X-Clerk-Org-Id). 599 testes passando.

**Corre??o de integridade:** dm_queue.md estava truncado no working tree (RF-009 cortado na metade, RF-010 ausente) ? restaurado a partir do HEAD via Edit tool.

**PRs revisados:** #84 (retrospectiva ? j? merged)
**Issues criadas:** 0
**Handoffs DM:** 0 (RF-009 e RF-010 j? em dm_queue.md como PENDING)
**Alinhamento B?ssola:** N/A (sess?o de housekeeping)
**Bloqueios:** T-20260412-1 (Fly.io CI) persiste ? n?o cr?tico
**UAT executado:** BUG-A ? CONFIRMADO CORRIGIDO (sem 404 em /login/tasks). BUG-B ?? FIX INCOMPLETO ? dados ausentes em staging mesmo com seed confirmado e org ativa. Novo bug registrado: BUG-C (P1) ? hooks/SSR retornam vazio, zero chamadas de rede capturadas.
**Pr?xima sess?o:** (1) aguardar BUG-C COMPLETED pelo DM; (2) planejamento Fase 2 ? RF-008 convites + IA + Plaid + n8n

> Log mantido pelo PO Assistant (modo Cowork). Complementar ao `project_sse_status.md` (mantido pelo PM Agent).

---

## Sess?o 2026-05-24 ? PO Cowork (continua??o T-20260509-2)

**Decis?es:**
- Neon `tenants.settings->>'clerk_org_id'` atualizado via `fix-org.cjs` (usando padr?o `reset-acme-demo.cjs` com `family:4` IPv4) ? revers?o: reexecutar script se Neon credenciais rotacionarem
- Clerk org `org_3EC9cu4VckyAhRCb1TXhSLWAgmg` vinculada ao tenant Acme ? workaround via `clerk.setActive()` no browser aceito temporariamente at? BUG-A corrigido

**Bugs descobertos:**
- BUG-A: `/login/tasks` ? 404 (Clerk choose-org task redireciona para rota inexistente no Next.js)
- BUG-B: Dashboard KPIs = `?` (API Fly.io unreachable ? consequ?ncia de T-20260412-1)

**PRs revisados:** nenhum
**Issues criadas:** nenhuma (handoff via dm_queue.md)
**Handoffs DM:** T-20260524-1 (P1) ? Fix `/login/tasks` + diagn?stico dados dashboard
**Alinhamento B?ssola:** N/A (sess?o de infraestrutura/UAT setup)
**Bloqueios:** T-20260412-1 (Fly.io API down) impede UAT com dados reais
**Pr?xima sess?o:** aguardar T-20260524-1 COMPLETED + T-20260412-1 desbloqueado para retomar UAT roteiro completo

> Log mantido pelo PO Assistant (modo Cowork). Complementar ao `project_sse_status.md` (mantido pelo PM Agent).

---

## Sessao 2026-05-19 ? PO Cowork

**Foco:** T-20260509-2 (seed Acme staging) + BUG-05 (IPv4 Neon) ? conclusao de ambos

**Decisoes:** Nenhuma decisao estrategica nova. Execucao operacional.

**Bugs corrigidos (seed acme-demo-data.seed.ts ? 17 bugs schema-mismatch):**
- estimates: total_amount->total, declined->rejected, estimated_by ausente
- estimate_lines: total_price->total, line_type ausente
- service_orders: description->notes, start_date->started_at, completed_date->completed_at
- financial_transactions: type->transaction_type, payment_method/created_by ausentes
- chart_of_accounts: type->account_type (x13), code->account_number, onConflict corrigido
- journal_entries: reference_number->entry_number, memo->description, created_by ausente
- journal_entry_lines: debit_amount->debit, credit_amount->credit, line_number->sort_order, created_at/updated_at removidos
- asset_categories: schema totalmente reescrito (4 FKs de COA, category_name, default_*)
- fixed_assets: category_id, asset_name, useful_life_months, depreciation_start_date, net_book_value
- depreciation_schedules: fixed_asset_id, period_number, period_start/end, accumulated_amount, remaining_value, status 'scheduled'

**Outros fixes:**
- acme-personas.seed.ts: dominio .test -> .com (Clerk rejeita TLD .test)
- run-seeds.ps1: reescrito em ASCII puro (em-dashes e checkmarks removidos ? violavam Regra 2 PowerShell)
- Guard do demo-data: customers->estimates como sinal de completude

**Novos artefatos:**
- `provision-acme.ps1` + `apps/api/provision-acme-neon.cjs` ? provisioning standalone para Neon
- `reset-acme-demo.ps1` + `apps/api/reset-acme-demo.cjs` ? limpeza de dados parciais

**Issues criadas:** 0 | **PRs revisados:** 0 | **ADRs:** 0
**Bloqueios ativos:** T-20260412-1 (Fly.io API deploy) ? nao tocado nesta sessao
**Proxima sessao:** UAT manual com roteiros de `docs/audits/` + retomar T-20260412-1

---

## Sess?o 2026-05-10 ? PO Cowork ? Destrava-UAT (continua??o sequ?ncia 2026-05-09)

**Pedido inicial:** "sim" (executar commits + playbook destrava-UAT conforme handoff 2026-05-09).

**Contexto:** Sess?o anterior (2026-05-09) preparou 3 commits + playbook, mas working tree estava sujo e timeout impediu execu??o. Nova sess?o: limpar bloqueios, executar sequ?ncia, destravar UAT para seed Acme.

**Etapas executadas:**

1. ? **Commit 1** ? Memory + governance `chore(memory): session 2026-05-09 ? destrava-UAT (handoff T-20260509-2 + playbook + 3 sessoes)` [2c99f70]
2. ? **Commit 2** ? Roteiros UAT v1.1 `docs(audits): roteiros UAT v1.1 PT-BR ? amigavel (4 personas, ~3h) + tour completo (15 modulos, ~6-8h)` [ab293fa]
3. ? **Commit 3** ? Guia MVP `docs: SSE Guia de Testes MVP v1.2` [a57c39d]
4. ? **Merge commit** ? Sync com origin/main (PR #77 j? estava mergeada) `merge: origin/main into local (pre-destrava-UAT)` [7875679]
5. ? **Playbook destrava-UAT** ? Valida??o completa:
   - PR #77 mergeado ? (BUG-03b fail-fast guard)
   - Handoff DM T-20260509-2 confirmado em dm_queue (PENDING)
   - Smoke backend Fly.io: /health=200, /ready=200 (db:up, redis:up) ?
   - Smoke web root: verde ?
   - BUG-03 validado end-to-end via Chrome com login em 2026-05-09 ?

**Decis?es:** Nenhuma necess?ria ? tudo conforme script.

**Bugs:** 0 novos (BUG-03 j? fechado, todos os smokes verdes).

**Handoffs DM:**
- T-20260509-2 (seed Acme + demo-data) ? registrado em `dm_queue.md`, **aguardando consumo DM** ? quando COMPLETED, UAT manual desbloqueada

**Bloqueios:**
- None ? sequ?ncia destrava-UAT **CONCLU?DA COM SUCESSO**
- Pr?ximo gargalo: DM executar T-20260509-2 (?ta estimada 30?45 min conforme dm_queue.md)

**Alinhamento B?ssola:**
- Personas tocadas: n?o h? mudan?a de specs/RF nesta sess?o (operacional pura)
- Gap tocado: n?o h? mudan?a de specs/RF nesta sess?o
- Regras 15?18: n?o aplic?veis (sess?o sem decis?es estrat?gicas)

**Aprendizados:**
- Git merge em modo Vim: quando interrompido, `git merge --abort` ou completar com `git commit` conforme estado
- Bash sandbox em mount Windows pode ter lock files em permiss?o restrita ? Computer Use timeout + sandbox restri??o = preferir executar direto no PowerShell Windows

**Pr?xima sess?o:**
- Aguardar notifica??o DM: T-20260509-2 COMPLETED
- Iniciar UAT manual com roteiros v1.1 (`SSE_Roteiro_Testes_Amigavel_v1_1.docx` e `SSE_Tour_Completo_Testes_PO_v1_1.docx`)
- Consolidar GoNoGo Fase 1 v3 ap?s UAT verde

---

## Sess?o 2026-05-05 ? PO Cowork ? Setup operacional do super user (interrompido por BUG-03 P0)

**Pedido inicial:** "me ajude a criar o super user" ? resolvido como ambiguidade. Ap?s mini-discovery, confirmado que RF Regra-0 j? est? mergeada (PR #74 2026-05-02); pedido real ? OPERACIONALIZAR o super user em staging.

**Mea culpa registrado:** Pulei o protocolo de abertura no in?cio da sess?o ? li s? `MEMORY.md` (atualizada 2026-04-17), n?o cruzei com `po_sessions.md` (sess?o 2026-05-02 do DM) nem `project_sse_status.md`. Resultado: redigi RF-009/RF-010 + ADR-017 stub + handoff DM como se fosse greenfield. Reverti tudo (Edit reverso em `dm_queue.md`, delete do ADR-017 duplicado, delete de `.po-drafts/`). Li??o refor?ada na mem?ria persistente.

**Decis?es:**
- Aceitar staging sem MFA (Clerk MFA ? Pro, plano atual ? Hobby) ? errata ADR-017 prevista, mas adiada at? BUG-03 fechar
- Backup super user dormente: luigicassab@gmail.com (`SUPER_USER_BACKUP_ACTIVE=false`)
- Email prim?rio super user: luigi.filippozzi@gmail.com
- N?o promover errata ADR-017 enquanto staging estiver quebrada ? sem sentido errar exce??o operacional de algo que n?o funciona

**A??es operacionais executadas (via Chrome assistido):**
- ? Conta Clerk staging prim?ria criada (Luigi Filippozzi ? luigi.filippozzi@gmail.com)
- ? Conta Clerk staging backup criada (Luigi (Backup) ? luigicassab@gmail.com)
- ? Fly.io secrets aplicados via `flyctl secrets set` em `sse-api-staging`: `SUPER_USER_EMAIL` + `SUPER_USER_BACKUP_EMAIL` + `SUPER_USER_BACKUP_ACTIVE=false` (vers?o 39 ? 40, redeploy verde, `/health` 200)
- ? Login no SSE staging confirmado (Last signed in May 5, 2026 no Clerk Dashboard)
- ?? Acesso a `/platform-admin` BLOQUEADO ? descoberto BUG-03 (todas as rotas `/api/*` retornam 404)

**Bugs descobertos:**
- **BUG-03 P0** ? Frontend chama `/api/*` sem rewrite/proxy. `apps/web/next.config.js` n?o tem `rewrites()`; nenhum route handler em `apps/web/src/app/api/`. Validado via console: `/api/health`, `/api/customers`, `/api/tenants/me/wizard/status`, `/api/tenants/platform-admin/tenants` todos retornam 404. Afeta 100% das chamadas API em staging ? n?o s? platform-admin. Por que nunca foi pego: testes mockam fetch, frontend-reviewer audita s? PV/PUX, e2e contra staging real nunca rodou p?s-merge do PR #74.

**ENH/RF:** 0 (n?o escrevi nesta sess?o pela mea culpa ? toda reda??o inicial foi revertida)

**Handoffs DM:**
- T-20260505-1 (BUG-03 P0) ? registrado em `dm_queue.md` topo, com 7 CAs, 3 op??es de fix, escopo negativo, e nota de processo (squad architecture precisa de cobertura e2e contra staging real)

**Bloqueios:**
- Setup operacional do super user em standby at? BUG-03 fechar
- `project_sse_status.md` reportou sa?de VERDE em 2026-05-02; sa?de real em staging ? VERMELHA (toda integra??o frontend?backend quebrada). Nota de corre??o redigida em `project_sse_status.md` nesta sess?o (Atualiza??o PO 2026-05-05).

**Alinhamento B?ssola:**
- Persona ?2.5 (Platform Operator) JTBD #1 (provisioning UI sem SQL) regrediu operacionalmente devido ao BUG-03
- Gap aberto pelo BUG-03 ? provisioning, dashboard, qualquer CRUD inacess?veis em staging para todas as personas

**Sugest?o para retrospectiva (n?o bloqueia):**
- Squad architecture (ADR-007) precisa de subagente OU expans?o do `test-runner` com smoke test e2e contra staging real p?s-deploy. PR #74 passou nos 4 subagentes existentes mas o bug ? trivial de detectar com qualquer GET real contra Vercel URL. Vira RF/ENH em sess?o futura.

**Pr?xima sess?o:**
- Confirmar BUG-03 mergeado + smoke test e2e verde
- Retomar acesso a `/platform-admin` (CA1, CA4 originais do RF Regra-0)
- Redigir errata ADR-017 (MFA Hobby vs Pro) s? ap?s BUG-03 fechar
- Considerar registrar formalmente RF de processo (subagente e2e)

---

## Sess?o 2026-05-02 ? DM Agent ? RF Regra-0 COMPLETED (PR #74 merged)

**T-20260501-4 COMPLETED** ? RF Regra-0 + ADR-017: Super User ?nico de Plataforma (PR #74 merged 2026-05-02).

**Implementa??o real vs spec:** Seguiu spec PO fielmente (8 RNs + CAs). Ajustes t?cnicos durante revis?o:
- Migration 018 convertida de bare `ALTER TABLE` para DO block cross-tenant (db-reviewer HIGH finding ? schema-per-tenant awareness)
- `provisionTenantAdmin` usa `SET LOCAL search_path` em transaction (pool-safe)
- Schema name validated against regex before interpolation
- `superUserEmail` captured in `new_values` JSONB of audit log
- Frontend loading state upgraded to `<Skeleton />` components (PUX6 ? frontend-reviewer MEDIUM)
- `GET /tenants/:id` upgraded with TenantGuard + id-match + `findOneSafe()` (security Critical ? pre-existing schema_name leak fixed)

**M?tricas p?s-merge:** 599 testes (19 novos), 29 suites, 19 migrations, 17 ADRs, 43 pages, build API + web clean.

**Para pr?xima sess?o PO:**
- Confirmar seeds Acme em staging + UAT tour das personas (pendente desde PR #69)
- Revisar `/app/platform-admin` ? CA1?CA15; foco em CA4 (audit_logs is_super_user_action), CA7 (break-glass runbook staging test), CA8 (RLS bypass per-request)
- Definir RF "Consolidated platform health dashboard" (?2.5 JTBDs #1+#3)
- Iniciar planejamento Fase 2 RFs em `RF_BACKLOG.md`

---
## Sess?o 2026-05-01 (noite) ? PO Cowork ? Regra-0 + B?ssola v1.3

**Decis?es:**
- **B?ssola ?2.5 "Persona de Plataforma"** adicionada via op??o 2 (sub-se??o, n?o ?0). Preserva framing "4 personas prim?rias do cliente"; segrega plataforma vs produto. Revers?o: surgir 2? persona de plataforma (Platform Support Engineer) ou compliance multi-pessoa em provisioning ? reabrir e considerar promover para ?0.
- **Regra-0 = super user ?nico de plataforma** via env var (`SUPER_USER_EMAIL`) + break-glass dormente (`SUPER_USER_BACKUP_EMAIL`). Full access cross-tenant; ?nico capaz de provisionar admins de novos tenants; audit obrigat?rio (RN4/RN8). Revers?o: co-fundador/COO surgir, compliance SOC2 exigir aprova??o multi-pessoa, 100+ tenants ativos virarem gargalo, ou incidente de seguran?a na conta.
- **Sequenciamento B?ssola v1.3 ? RF Regra-0** (T-20260501-4 BLOCKED at? v1.3 mergear). Evita criar exce??o arquitetural sem ?ncora formal na B?ssola (regras 15/16 do CLAUDE.md).

**Bugs registrados:** 0
**ENH:** 1 (B?ssola v1.3 ? doc-only, ADR-016)
**RF/ADR:**
- RF Regra-0 (T-20260501-4) ? Super User ?nico de Plataforma, P0, 8 RNs + 15 CAs, 4 subagentes obrigat?rios (test/security/db/frontend)
- ADR-016 ? Persona de Plataforma na B?ssola ?2.5 (companion da B?ssola v1.3)
- ADR-017 ? Super User ?nico de Plataforma Regra-0 (companion da RF, redigido inline na T-20260501-4)

**Issues criadas:** 0 (handoff direto via `.auto-memory/dm_queue.md`, sem GitHub issue por enquanto ? PRs v?o referenciar entradas T-IDs)
**PRs revisados:** 0
**Bloqueios:** T-20260501-4 (RF Regra-0) BLOCKED at? entrada "B?ssola v1.3 + ADR-016" mergear em main
**dm_queue:** 2 tasks novas no fim do arquivo (B?ssola v1.3 P1 + T-20260501-4 P0 PENDING blocked); fila total 6 entradas pendentes

**Alinhamento B?ssola:**
- Persona tocada: nova **Persona 0 ? Platform Operator** (interna, n?o-cliente; formalizada em ?2.5)
- Gap tocado: governan?a multi-tenant centralizada (?2.5 ? n?o est? em ?4 porque ?4 ? gaps de cliente; segrega??o intencional)
- Regra 15 atendida: amenda da B?ssola feita ANTES de redigir RF de plataforma (n?o criou exce??o ad-hoc)
- Regra 16 atendida: RF Regra-0 cita ?2.5 como persona prim?ria servida e o gap fechado na descri??o

**Aprendizados (registrados em mem?ria persistente):**
- Chat UI Cowork re-renderiza `.md` references em paste do terminal como autolinks ? ? display, n?o corrompe input/arquivo. Ground truth = Read tool, nunca display do chat. J? estava em `feedback_gh_issue_and_cowork_autotyper.md` (regra 2); refor?ado como disciplina #9 em `feedback_verification_and_encoding.md` com cross-reference ao sandbox stale.
- Bash sandbox mount pode ficar stale por minutos depois de write Windows-side ? confirmado pela 2? vez. Cruzar com Read tool ? obrigat?rio antes de declarar "corrup??o" ou "n?o foi gravado".
- Pattern repetido: PowerShell here-string com markdown + URLs + backticks no terminal interativo gera d?vida mesmo quando funciona. Para handoffs longos: **Edit tool direto no arquivo** > snippet PowerShell colado. Aplicado nesta sess?o (entrada T-20260501-4 escrita via Edit, sem PowerShell intermedi?rio).

**Pr?xima sess?o:**
- Confirmar B?ssola v1.3 mergeada ? desbloqueia T-20260501-4 automaticamente
- Quando PR de RF Regra-0 vier do DM: revisar com olho em CA1?CA15; foco extra em **CA4** (audit_logs com flag + target_tenant_id), **CA8** (RLS bypass exclusivo per-request, teste com sess?es paralelas), **CA7** (runbook break-glass testado em staging end-to-end)
- Ap?s RF Regra-0 mergear: abrir RF "Consolidated platform health dashboard" (JTBD top 3 da ?2.5: #tenants ativos + alertas + activation por tenant) ? pr?ximo n?mero livre em `docs/strategy/RF_BACKLOG.md`

**Resultado DM (2026-05-01/02 ? fechamento <24h, ciclo curto):**
- B?ssola v1.3 + ADR-016: COMPLETED ? MERGED em main (PR# n?o informado pelo DM; verificar via `gh pr list --state merged --search "ADR-016"`)
- T-20260501-4 RF Regra-0 + ADR-017: COMPLETED ? PR #74 MERGED
- Deltas observados nas m?tricas globais do projeto:
  - Tests: ? ? 599 (+19 desta task; restante ? trabalho paralelo entre sess?es)
  - Migrations: 11 ? 19 (delta 8 ? incluindo `018_super_user_audit_flag.sql`; numera??o diferente de "011" da RF original porque outras migrations entraram entre reda??o e execu??o)
  - ADRs: 14 ? 17 (delta 3 ? ADR-016, ADR-017, e provavelmente ADR-015 release cadence saindo de BLOCKED; confirmar)
  - Pages: ? ? 43; PRs merged: ? ? 74
- **Security extras pegos pelo `security-reviewer` fora dos 15 CAs originais** (escopo da RF ? piso, n?o teto):
  - `GET /tenants/:id` patched ? n?o vaza mais `schema_name` na resposta
  - `SET LOCAL search_path` dentro de transa??o (substituiu session-level ? defesa contra exception skip do reset)
  - Schema name validado por regex (defesa contra injection)
  - `superUserEmail` adicionado ao audit_logs (n?o estava em RN4, mas ? a coisa certa para forensics)
- **Entreg?veis t?cnicos confirmados:** `SuperUserService` + `SuperUserGuard` (env-var auth, Clerk email lookup case-insensitive, break-glass backup), 2 endpoints platform-admin behind guard, Migration 018 (DO block cross-tenant idempotente), Platform Admin UI com `<Skeleton />` (PUX6 ?), runbook `super-user-break-glass.md`, ADR-017 publicado, 19 testes novos.

---

## Sess?o 2026-05-01 ? PO Cowork

**Decis?es:**
- BUG-02 tratado como **fix imediato + RF separado** (signup p?blico fechado j?; invite system na Fase 2). Condi??o de revers?o: se cliente real depender de auto-signup, reabrir e priorizar RF-008 como bloqueante.
- BUG-01 dividido em **01a (login P0)** + **01b (demo data P1)** para destravar UAT antes do tour visual completo.
- Demo data dimensionada como **m?nimo vi?vel** (15 customers, 18 vehicles, 12 estimates, 5 SOs, 30 transactions, 1 FAM, 3 meses). Revers?o: subir para "volume realista" se UAT mostrar que indicadores ficam pobres.
- RF-008 confirmada com 3 perguntas de discovery: convite s? por owner+admin; aceite via Clerk set-password; limite reusa Users do PLAN_FEATURES.

**Bugs registrados:** BUG-01a, BUG-01b, BUG-02 (3 issues GitHub)
**ENH:** 0
**RF/ADR:** RF-008 (rascunho em RF_BACKLOG.md, aguarda planejamento Fase 2)
**Issues criadas:** #64 (BUG-01a), #65 (BUG-01b), #66 (BUG-02)
**PRs revisados:** 0
**Bloqueios:** UAT inteiro bloqueado por BUG-01a at? T-20260501-1 fechar
**dm_queue:** 3 tasks PENDING adicionadas (T-20260501-1/2/3)

**Alinhamento B?ssola:**
- Persona tocada: Persona 1 (Owner-Operator) ? RF-008 ? fun??o do dono/admin
- Gap tocado: Gap 3 (Onboarding / time-to-first-value)
- ?1 ICP/anti-target: BUG-02 refor?a posicionamento "body shop 5?15 func", n?o auto-servi?o
- Regra 16 atendida na descri??o da RF-008

**Resultado DM (2026-05-01 ? fechamento mesmo dia, ciclo <24h):**
- T-20260501-3 BUG-02: COMPLETED ? PR #67 MERGED
- T-20260501-1 BUG-01a: COMPLETED ? PR #68 MERGED
- T-20260501-2 BUG-01b: COMPLETED ? PR #69 MERGED
- Session close docs + dashboard: PR #70 MERGED
- PO diagnostic scripts: PR #71 MERGED
- **Achado t?cnico:** TS2349 em `knex.withSchema()` ? n?o ? callable como const, retorna QueryBuilder. Resolvido via helper `const t = (n) => knex.withSchema(s).table(n)`. Padr?o para futuros seeds multi-schema.
- **Health:** AMARELA (postura conservadora p?s-merge em massa) ? pr?xima revis?o PM deve flipar para VERDE.

**A??es operacionais pendentes do PO (Clerk Dashboard + seeds em staging):**
1. Confirmar Clerk Dashboard staging: Sign-up mode = Restricted (allowlist vazia)
2. `pnpm --filter api seed:run --tenant=acme --type=personas`
3. `pnpm --filter api seed:run --tenant=acme --type=demo-data`
4. Retomar UAT tour com login das 7 personas Acme

**Pr?xima sess?o:**
- Confirmar UAT tour completo ap?s seeds rodarem em staging
- Iniciar planejamento Fase 2: priorizar RF-008 + RFs de IA/Plaid em RF_BACKLOG.md
- Confirmar GoNoGo Fase 1 v3 ap?s UAT verde

---

## Sess?o 2026-04-25 (DM Agent ? session close T-20260421-4 COMPLETED)

**T-20260421-4 COMPLETED** ? RF-006 Payment Hold / Disputed Estimate (PR #51 aberto, aguarda CI+merge).

**Implementa??o real vs spec original:** O spec original descrevia uma tabela `payment_holds` separada. A implementa??o adotou abordagem mais simples e direta: campo `is_paused_by_dispute` na tabela `service_orders` como gate de bloqueio, com 5 campos de disputa na tabela `estimates`. Sem tabela intermedi?ria de holds ? decis?o DM registrada no PR #51.

**Pr?xima prioridade DM:** T-20260421-3c (RF-005c Kanban + SLA) ? P1.

---

## Sess?o 2026-04-22 (parte 2) ? PO Cowork (Trademark hygiene ? substitui??o de marca de ERP externo por sigla NS)

**Contexto:** Luigi abriu a sess?o para escopar a substitui??o de men??es diretas ? marca registrada de um ERP propriet?rio usado como refer?ncia comparativa na documenta??o do SSE. Motiva??o: reduzir exposi??o jur?dica ? o SSE n?o tem rela??o comercial, licenciamento nem endosso do fornecedor; o uso nominativo em repo versionado cria risco latente.

### Decis?es de produto

1. **Estrat?gia de substitui??o: disclaimer + sigla NS.** Disclaimer can?nico padronizado no topo de cada doc impactado + substitui??o textual uniforme. Rejeitada a substitui??o literal pura (sigla amb?gua sem contexto) e a op??o "NS-REF" (quebra fluidez). **Condi??o de revers?o:** ADR suplementar se (a) parecer jur?dico posterior indicar risco residual, (b) sigla "NS" gerar confus?o interna, (c) mudan?a de rela??o com o fornecedor.
2. **Renames com stubs de 60 dias** (at? 2026-06-22) para os 3 arquivos cujos nomes cont?m a marca: 2 em `docs/strategy/` (ANALISE_*_vs_BUSSOLA_v1.{md,html}) e 1 em `docs/decisions/` (012-*-incorporacao-parcial.md). Rejeitados: rename sem stub (quebra bookmarks externos sem aviso) e "manter filename com conte?do trocado" (inconsist?ncia vis?vel).
3. **Escopo GitHub: abrangente.** Editar t?tulo + corpo de issues e PRs em todos os estados (abertos, fechados, mergeados) via `gh api PATCH`. **N?O editar** coment?rios nem reviews (escopo negativo honrado). **N?O reescrever** commits hist?ricos (violaria regra 1 do CLAUDE.md). Rejeitada a op??o conservadora (s? arquivos versionados) ? exposi??o no GitHub seria residual inaceit?vel.
4. **Executar sem aguardar parecer jur?dico.** Mitiga??o precaut?ria, revers?vel, n?o bloqueia trabalho estrat?gico. ADR-014 documenta a decis?o e os crit?rios de revers?o.

### Artefatos produzidos

- **T-20260422-1** (P2, PENDING) registrada em `.auto-memory/dm_queue.md` ? corpo can?nico com 19 arquivos listados, escopo negativo expl?cito, crit?rios de aceite, depend?ncia invertida com T-20260421-1 (sync dashboard aguarda renames).
- **Rascunho ADR-014** em `.auto-memory/proposals/adr_014_draft.md` ? decis?o, disclaimer can?nico, pol?tica de refer?ncia a produtos de terceiros, condi??o de revers?o. DM publica em `docs/decisions/014-remocao-mencao-marca-erp-referencia.md` durante o PR.
- **3 snippets PowerShell can?nicos** (discovery ? execution ? verify) para o sweep do GitHub via `gh api`. Preservados aqui abaixo para uso do DM.

### Snippets can?nicos ? Sweep GitHub (para DM)

```powershell
# ===== ETAPA 1 ? DISCOVERY (dry-run, s? lista) =====
Set-Location "C:\Dev\storm-shield-enterprise"
$data = Get-Date -Format "yyyy-MM-dd-HHmm"
$out = ".auto-memory\sweeps\trademark-sweep-discovery-$data.csv"
New-Item -ItemType Directory -Force -Path ".auto-memory\sweeps" | Out-Null

$issues = gh issue list --state all --search "NS in:title,body" --limit 500 `
  --json number,title,body,state,url,isPullRequest | ConvertFrom-Json
$prs = gh pr list --state all --search "NS in:title,body" --limit 500 `
  --json number,title,body,state,url | ConvertFrom-Json
$issuesOnly = $issues | Where-Object { -not $_.isPullRequest }

$all = @()
$all += $issuesOnly | ForEach-Object {
  [PSCustomObject]@{ Type="issue"; Number=$_.number; State=$_.state; Title=$_.title; URL=$_.url }
}
$all += $prs | ForEach-Object {
  [PSCustomObject]@{ Type="pr"; Number=$_.number; State=$_.state; Title=$_.title; URL=$_.url }
}
$all | Export-Csv -Path $out -NoTypeInformation -Encoding UTF8
$all | Format-Table Type,Number,State,Title -AutoSize
Write-Host "CSV: $out ? REVISAR antes de Etapa 2"

# ===== ETAPA 2 ? EXECU??O (aplica substitui??o via gh api) =====
Set-Location "C:\Dev\storm-shield-enterprise"
$data = Get-Date -Format "yyyy-MM-dd-HHmm"
$discovery = Get-ChildItem ".auto-memory\sweeps\trademark-sweep-discovery-*.csv" `
  | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $discovery) { throw "Rode a Etapa 1 antes." }
$items = Import-Csv $discovery.FullName
$log = ".auto-memory\sweeps\trademark-sweep-exec-$data.log"
Add-Content $log "=== Sweep execu??o $data ==="
$repo = "luigifilippozzi-cmyk/Storm-Shield-Enterprise"
$owner, $name = $repo -split "/"

function Replace-Mark {
  param([string]$text)
  if (-not $text) { return $text }
  $text = $text -replace "NS", "NS"
  $text = $text -replace "NS", "NS"
  $text = $text -replace "NS", "NS"
  $text = $text -replace "NS", "NS"
  $text = $text -replace "NS", "NS"
  return $text
}

foreach ($item in $items) {
  $num = $item.Number; $type = $item.Type
  if ($type -eq "issue") {
    $current = gh issue view $num --repo $repo --json title,body | ConvertFrom-Json
  } else {
    $current = gh pr view $num --repo $repo --json title,body | ConvertFrom-Json
  }
  $newTitle = Replace-Mark $current.title
  $newBody  = Replace-Mark $current.body
  $titleChanged = ($newTitle -ne $current.title)
  $bodyChanged  = ($newBody  -ne $current.body)
  if (-not ($titleChanged -or $bodyChanged)) {
    Add-Content $log "[$type #$num] NO-OP"; continue
  }
  $endpoint = if ($type -eq "issue") { "repos/$owner/$name/issues/$num" } `
              else { "repos/$owner/$name/pulls/$num" }
  $payload = @{}
  if ($titleChanged) { $payload.title = $newTitle }
  if ($bodyChanged)  { $payload.body  = $newBody  }
  ($payload | ConvertTo-Json -Compress) | gh api --method PATCH $endpoint --input - | Out-Null
  Add-Content $log "[$type #$num] UPDATED ? title:$titleChanged body:$bodyChanged"
  Write-Host "? $type #$num"
}
Write-Host "Log: $log"

# ===== ETAPA 3 ? VERIFY (l? de volta) =====
Set-Location "C:\Dev\storm-shield-enterprise"
$residual = @()
$residual += (gh issue list --state all --search "NS in:title,body" --limit 500 `
  --json number,title,state,url,isPullRequest | ConvertFrom-Json `
  | Where-Object { -not $_.isPullRequest })
$residual += (gh pr list --state all --search "NS in:title,body" --limit 500 `
  --json number,title,state,url | ConvertFrom-Json)
if ($residual.Count -eq 0) {
  Write-Host "? GitHub limpo" -ForegroundColor Green
} else {
  Write-Host "? $($residual.Count) residuais:" -ForegroundColor Yellow
  $residual | Select-Object number,title,state,url | Format-Table -AutoSize
}
```

### Task list do acompanhamento (Cowork)

10 tasks criadas, depend?ncias configuradas, **todas conclu?das no mesmo dia**:
- #1 ? #2 ? #3 (PO): registro da tarefa, rascunho ADR-014, log da sess?o
- #4 (Luigi): despachar ao PM/DM ? **feito via script `Load-Briefing.ps1`**
- #5 (DM): executar substitui??es + renames + stubs + publicar ADR-014
- #6 (DM): rodar sweep GitHub (3 etapas)
- #7 (DM): abrir PR + CI verde + mergear ? **PR #47 merged**
- #8 (PO): revisar PR
- #9 (PO): atualizar MEMORY.md p?s-merge ? **feito pelo DM no pr?prio PR**
- #10 (PO, acr?scimo mid-session): criar toolkit `.ps1` do PO em `.auto-memory/scripts/`

### Alinhamento B?ssola

N/A ? mudan?a de compliance/hygiene, n?o afeta personas, ICP ou m?trica-norte. O ADR-014 ? o ve?culo formal da decis?o.

### Fechamento (2026-04-22 fim de dia)

**Entrega DM (PR #47 mergeado ? `58a8c19`):**
- ADR-014 publicado em `docs/decisions/014-remocao-mencao-marca-erp-referencia.md` (status Accepted)
- 19 arquivos com substitui??o textual + disclaimer can?nico aplicado
- 3 renames com stubs de redirect de 60 dias: `ANALISE_NS_vs_BUSSOLA_v1.{md,html}` + `012-ns-incorporacao-parcial.md`
- Sweep GitHub completo (Discovery ? Execution ? Verify) sem residuais
- `.auto-memory/MEMORY.md`, `CLAUDE.md`, `docs/README.md`, ADRs 008/009/012/013 atualizados com novos paths
- ADR-011 publicado em paralelo (T-20260421-10 destravou ? release cadence pode ser considerada na pr?xima sess?o estrat?gica)

**Entrega PM:**
- Issue #46 criada no GitHub (labels: `refactor`, `documentation`, `compliance`, `priority: P2`, `fase-1-mvp`)
- T-20260421-1 atualizada em `dm_queue.md` com bloco de depend?ncia invertida
- `project_sse_status.md` se??o Governan?a registra ADR-014

**Entrega PO (lado Cowork):**
- Toolkit `.auto-memory/scripts/` com `Invoke-PODiagnostic.ps1` (diagn?stico can?nico de abertura) e `Load-Briefing.ps1` (carrega briefing PM/DM no clipboard). README.md + pol?tica de ownership. ASCII-only para evitar quebra de parser em Windows PowerShell 5.1.

**Follow-up aberto e descartado dentro da sess?o:**
- Suspeitei de encoding drift em 17 arquivos locais (UTF-16/truncation vs UTF-8 em HEAD). Investiga??o com `git status` no Windows do Luigi mostrou working tree j? limpo ? o que eu via no sandbox Linux era uma view cached/inconsistente do mount. **Li??o:** cruzar o view do sandbox com `git status` do Windows antes de construir narrativa de corrup??o. Registrado como feedback para mem?ria persistente.

### Pr?xima sess?o

- Fase 1 segue em 95%, sem novos bloqueios.
- ADR-011 publicado abre janela para o ADR-011-reservado (release cadence) ser redigido ? revisitar na pr?xima sess?o.
- T-20260421-1 (sync dashboard NS?B?ssola) execut?vel pelo DM quando houver gatilho (nenhum acumulado no momento).
- Nenhuma a??o humana pendente.

---

## Sess?o 2026-04-22 ? PO Cowork (Split RF-005 XL ratificado ? Split A)

**Contexto:** Luigi abriu a sess?o para validar o split do RF-005 antes do DM abrir branch (T-20260421-3 estava PENDING com complexidade XL e recomenda??o expl?cita de split no pr?prio spec). Luigi pediu an?lise comparativa e ratificou a recomenda??o do PO.

### Decis?es de produto

1. **Split A ratificado** para RF-005 (Estimate State Machine + Inbox):
   - **RF-005a** (backend state machine + ENUM + migration 014 + validator + estimate_status_changes) ? T-20260421-3a, P1, PENDING
   - **RF-005b** (frontend tabela + filtros + ownership + estimate-status-badge) ? T-20260421-3b, P1, BLOCKED by 3a
   - **RF-005c** (frontend kanban drag-drop + SLA jobs) ? T-20260421-3c, P1, BLOCKED by 3a (soft-dep em 3b)
   - **Split B rejeitado** (tabela+kanban bundled): perderia ship incremental do tabela antes do kanban; drag-drop ? maior fonte de incerteza t?cnica e n?o deve bloquear o uso da tabela.
   - **Condi??o de revers?o:** se ap?s 3a + 3b em staging o Estimator (via ritual Operating Model ?5.4) indicar que kanban n?o agrega valor frente ao esfor?o, canibalizar 3c ? entregar s? SLA como ENH, rebater kanban como ENH P2.

2. **RF-006 (T-20260421-4) ? depend?ncia reduzida.** Estava BLOCKED por T-20260421-3 inteiro. Agora BLOCKED **apenas** por T-20260421-3a (o estado `disputed` do ENUM basta para o Payment Hold escutar eventos). Ganho de calend?rio: 3b e 3c podem rodar em paralelo com RF-006.

3. **T-20260421-3 original marcada SUPERSEDED** em `dm_queue.md` com nota hist?rica apontando para os tr?s sub-RFs.

4. **RF-005 no `RF_BACKLOG.md`** anotado com tabela de split + refer?ncia ? task DM de cada parte + condi??o de revers?o. RF-005 s? fecha DONE quando 3c mergear (?ltimo sub-RF do split).

### Alinhamento B?ssola

- Persona tocada: Estimator (prim?ria) ? B?ssola ?2. RN5 de ownership ? princ?pio P5 (insurance-first) + princ?pio P1 (simplificar > completar) ? separar em 3 PRs ? simplifica??o, n?o complexifica??o.
- Gap fechado: Gap 5 (Insurance workflow) ? B?ssola ?4.
- Regras CLAUDE.md ?10: Regra 16 (persona+gap) j? est? obrigat?ria nos 3 PRs via `Done quando`; Regra 17 (handoff can?nico ?4) respeitada ? tasks seguem template; Regra 19 (PV/PUX via frontend-reviewer) obrigat?ria em 3b e 3c.

### Artefatos produzidos

| Artefato | Arquivo | Mudan?a |
|---|---|---|
| Task T-20260421-3 superseded | `.auto-memory/dm_queue.md` | Bloco substitu?do por nota hist?rica curta |
| Nova task DM P1 | `.auto-memory/dm_queue.md` | T-20260421-3a (backend state machine) |
| Nova task DM P1 | `.auto-memory/dm_queue.md` | T-20260421-3b (frontend tabela) BLOCKED by 3a |
| Nova task DM P1 | `.auto-memory/dm_queue.md` | T-20260421-3c (frontend kanban + SLA) BLOCKED by 3a |
| Task T-20260421-4 atualizada | `.auto-memory/dm_queue.md` | Depend?ncia de T-3 inteiro ? apenas T-3a |
| Anota??o RF-005 | `docs/strategy/RF_BACKLOG.md` | Tabela de split + condi??o de revers?o |
| Sess?o logada | `.auto-memory/po_sessions.md` | Esta entrada (append-top) |

### Handoffs

- **Dev Manager:** 3 tarefas novas em `dm_queue.md` (origin=PO). IDs: T-20260421-3a, T-20260421-3b, T-20260421-3c. 1 tarefa atualizada: T-20260421-4 (depend?ncia reduzida).
- **PM Agent:** na pr?xima revis?o di?ria, atualizar "Handoff DM aberto" em `project_sse_status.md` ? substituir T-20260421-3 pelas tr?s sub-tasks + notar que T-4 est? BLOCKED por 3a apenas.

### Bloqueios / alertas

- Nenhum bloqueio novo. T-20260421-3a agora ? a pr?xima P1 do DM (podia iniciar imediatamente ap?s sess?o DM dispon?vel).
- Alerta para o DM: n?o acumular 3a+3b+3c num ?nico PR "para otimizar" ? Split A foi ratificado exatamente para evitar isso. Viola??o = reabrir consulta PO.

### Pr?xima sess?o

Quando T-20260421-3a mergear em staging: sess?o PO curta para (1) marcar T-20260421-4 como PENDING (desbloqueado), (2) validar se algum ajuste de escopo em 3b/3c virou vis?vel ap?s ver o backend real em staging, (3) monitorar condi??o de revers?o do kanban.

### Escopo negativo desta sess?o

- N?o escrevi c?digo (apenas artefatos de decis?o/handoff ? conforme PO n?o executa).
- N?o redigi ADR novo (Split A ? decis?o operacional, n?o arquitetural ? cabe no po_sessions + RF_BACKLOG, n?o em ADR).
- N?o mexi em CLAUDE.md, AGENTS.md, B?ssola, Operating Model.
- N?o toquei ADR-011 (continua reservado ? ?ltima condi??o de destrave j? ocorreu com T-20260421-10 COMPLETED; cabe avaliar ADR-011 em sess?o dedicada).
- N?o alterei `CHANGELOG`.

---

## Sess?o 2026-04-21 (noite, parte 3) ? PO Cowork (Debug assistido do deploy API ? causa real identificada)

**Contexto:** Luigi pediu *"resolver bloqueios existentes"* ap?s a sess?o parte 2. Ap?s AskUserQuestion com 2 perguntas, escopo foi limitado a **T-20260412-1 (Deploy API)** com sa?da tipo **"an?lise PO + plano de a??o"**. O diagn?stico anterior no `project_sse_status.md` dizia *"m?quina sobe mas /ready timeout, poss?vel DATABASE_URL_UNPOOLED inv?lida ou port mismatch"* ? hip?teses nunca verificadas contra logs.

Plano inicial (4 passos) previa debug incremental via flyctl com 4 hip?teses ranqueadas: (1) REDIS_URL ausente, (2) DATABASE_URL pooled ausente, (3) Neon IP allow-list, (4) Redis n?o provisionado. **Todas erradas.**

### Decis?es de produto

1. **Diagn?stico anterior (T-20260412-1) foi REFUTADO.** N?o ? problema de secret, nem de port, nem de Redis, nem de Neon. Logs Fly.io da m?quina `6837ee3c513728` mostram `ERR_MODULE_NOT_FOUND: '/app/packages/shared-utils/dist/uuid'` em loop ? processo Node crasha no boot h? 9 dias.
   - *Causa raiz:* `packages/shared-utils/src/index.ts` (e provavelmente `shared-types/src/index.ts`) tem `export * from './uuid'` **sem extens?o `.js`**. Combinado com `tsconfig.base.json` usando `moduleResolution: "bundler"` (config para webpack/vite, n?o para Node runtime), o `dist/index.js` compilado mant?m os imports sem extens?o. Node ESM quebra.
   - *Por que CI passa:* ts-jest transpila on-the-fly, n?o executa `dist/`. Dev local usa Nest com ts-node. **S? o Docker runtime (que roda `node apps/api/dist/main`) for?a esse caminho.**
   - *Condi??o de revers?o do diagn?stico:* se ap?s Op??o A os logs ainda mostrarem ERR_MODULE_NOT_FOUND em outro m?dulo, o diagn?stico estava incompleto ? rever depend?ncias transitivas.

2. **T-20260412-1 marcada como SUPERSEDED.** N?o requer a??o humana. Escopo migrado para nova tarefa.

3. **T-20260421-10 criada** (P0, PENDING, DM). Escopo surgical Op??o A ? adicionar `.js` aos barrels de `shared-utils` e `shared-types`, trocar `moduleResolution` para `"NodeNext"` em `tsconfig.base.json`. Condi??o de revers?o: se Op??o A romper 3+ m?dulos em cascata, DM aplica Op??o B (override `module: "CommonJS"` s? nos packages, sem tocar root).

4. **ADR-011 continua reservado** ? destrava s? quando T-20260421-10 fechar com `/ready` verde em staging. ADR candidato **ADR-014** (Module resolution strategy) fica a crit?rio do DM se a mudan?a tiver impacto material.

5. **Aprendizado documentado** (na pr?pria tarefa T-20260412-1 como footer hist?rico): diagn?stico de deploy sem consumir logs de boot ? especula??o. Pr?xima vez, primeiro comando ? `flyctl logs --no-tail`. DM pode opcionalmente atualizar `docs/runbooks/staging-deploy.md` no PR da fix.

### Alinhamento B?ssola

- Personas tocadas: N/A ? ? bug de infra/build.
- Gaps tocados: nenhum direto. Indireto: destrava pipeline para entrega de qualquer gap (Fase 1 fechar + Fase 2 come?ar).
- Princ?pios: nenhum.

### Interven??es humanas executadas por Luigi

1. `flyctl version` / `auth whoami` / `apps list` ? confirmaram login e app "suspended" (que na verdade ? cold-stop + crash loop).
2. `flyctl machine start 6837ee3c513728` ? m?quina subiu e caiu em ~10s (exit_code=1, oom_killed=false).
3. `flyctl status` antes e depois ? mostrou `1 total, 1 warning` nas checks, state `stopped` persistente mesmo ap?s start.
4. `curl /health` ? 503 (do proxy Fly, sem m?quina saud?vel); `curl /ready` ? 000 (timeout total).
5. `flyctl logs --no-tail | Select -Last 150` ? entregou a stack trace completa que matou todas as hip?teses de infra.
6. `flyctl machine status` ? confirmou `exit_code=1, oom_killed=false, requested_stop=false` em loop desde 2026-04-21 21:47:16.

### Artefatos produzidos

| Artefato | Arquivo | Mudan?a |
|---|---|---|
| Nova tarefa DM P0 | `.auto-memory/dm_queue.md` (topo) | `T-20260421-10 ? Fix ESM module resolution` (prepend) |
| Tarefa superseded | `.auto-memory/dm_queue.md` (bottom) | `T-20260412-1` atualizada com footer hist?rico + status SUPERSEDED |
| Status atualizado | `.auto-memory/project_sse_status.md` | Novo bloco "Atualiza??o PO (2026-04-21 noite parte 3)" + Health reason corrigido + P0/P1 reordenado + Handoff DM atualizado |
| Sess?o logada | `.auto-memory/po_sessions.md` | Esta entrada |

### Pr?xima sess?o (sugest?o)

Assim que T-20260421-10 fechar com `/ready` 200:
1. Marcar T-20260412-1 como COMPLETED-SUPERSEDED e mover para `dm_queue_archive.md`
2. Atualizar Health para VERDE
3. Desbloquear reda??o de ADR-011 (Release Cadence)
4. Considerar aditivo no runbook `docs/runbooks/staging-deploy.md` ? "primeiro comando ao investigar deploy fail: `flyctl logs --no-tail`"

### Escopo negativo desta sess?o

- N?o mexi em c?digo (apenas diagn?stico + delega??o)
- N?o alterei CLAUDE.md, AGENTS.md, nem ADRs
- N?o toquei B?ssola, RF_BACKLOG, dashboard NS
- N?o redigi ADR-011 (continua reservado)
- N?o abri PR (isso ? tarefa do DM em T-20260421-10)
- N?o mexi em `fly.toml`, Dockerfile nem workflow ? eles est?o corretos

---

## Sess?o 2026-04-21 (noite, parte 2) ? PO Cowork (Incorpora??o parcial do pacote MF ? PV/PUX + squad health)

**Contexto:** imediatamente ap?s a sess?o "NS vs B?ssola" (parte 1), Luigi disponibilizou um pacote de conhecimento exportado do projeto Minhas Finan?as (MF) ? 10 arquivos destilando ~18 meses de aprendizados em governan?a de squad assistido por IA, princ?pios de UX (PUX1?PUX6), princ?pios visuais (PV1?PV6), padr?o de subagente ux-reviewer, estrutura da B?ssola de Produto, regras inviol?veis, workflow Git/PowerShell, anti-patterns e checklist de ado??o. Pediu: *"vamos incorporar a tecnologia estabelecida no mf em nosso projeto ... levando em considera??o a efici?ncia em nossa implementa??o e roadmap estabelecida"*.

Pergunta antes da a??o (AskUserQuestion, 3 perguntas): Luigi confirmou **Op??o A ? Cir?rgica** (PV/PUX na B?ssola + sa?de do squad no Operating Model), **upload dos 3 arquivos-chave antes de executar** (02 ux-reviewer, 03 PV/PUX, 05 template B?ssola), e **absorver em `frontend-reviewer` existente** (sem criar subagente novo).

### Decis?es de produto

1. **ADR-013 ? Op??o A (Cir?rgica) ? DRAFT ? aguarda DM promover a Accepted via T-20260421-6.** B?ssola v1.1 ? v1.2. Operating Model v2.0 ? v2.1. CLAUDE.md ganha Regra 19 (sugest?o ? aplica??o pelo DM). `frontend-reviewer` expandido de 8 para 20 itens (8 base + 6 PV + 6 PUX). ADR-011 segue reservado para release cadence.
   - *Condi??o de revers?o:* (a) 3 PRs consecutivos de UI mergeados sem `frontend-reviewer` mencionar PV/PUX como crit?rio ? sinal de decora??o; (b) RF da Fase 2 com UI que contradiz 2+ princ?pios sem ADR de exce??o ? princ?pios n?o pegaram; (c) retrospectiva trimestral indica atrito > valor ? tradu??o para stack SSE errada. Qualquer condi??o ? reabrir ADR-013.

2. **PV1?PV6 e PUX1?PUX6 adotados integralmente** com reda??o SSE-specific:
   - Stack MF (vanilla HTML + CSS vars + Inter/Fraunces + Lucide) **traduzido** para stack SSE (Next.js 15 + Tailwind + shadcn/ui + next-themes + next/font + lucide-react via shadcn/ui).
   - **Zero conflito** com P1?P8. PV3 e PUX1 refor?am P1 (hero por persona). PUX2 (`tabular-nums`) refor?a P6. PUX6 (skeletons) refor?a P3. PV6 (densidade) complementa P6. Os 8 restantes s?o adi??es novas.
   - *Decis?o adiada (escopo negativo desta sess?o):* paleta concreta (cor prim?ria hex, fam?lias tipogr?ficas) fica para RF-UI-SSE futuro, an?logo ao NRF-UI-WARM do MF. Adotamos **o princ?pio**, n?o os valores.

3. **Novo ritual ?5.4 do Operating Model** ? "Health check do squad (sinais de ado??o quebrada)". Quinzenal, dono PM Agent, checklist de 8 itens (subagentes invocados, princ?pios citados, escopo negativo nas tarefas, ADRs criados quando devia, MEMORY.md atualizado, BLOCKED drenando, lead time est?vel, condi??es de revers?o checadas).

4. **Regra 19 do CLAUDE.md (sugest?o ao DM aplicar em T-20260421-6):**
   > *"Sempre respeitar os princ?pios PV1?PV6 (?6.2) e PUX1?PUX6 (?6.3) da B?ssola em todo PR que cria ou modifica UI. `frontend-reviewer` ? obrigat?rio em PRs de UI e bloqueia merge em caso de viola??o. Viola??o justificada exige ADR pr?prio. Adotado via ADR-013."*

5. **Escopo negativo expl?cito da sess?o:** n?o criar subagente `ux-reviewer` independente; n?o adotar workflow Git/PowerShell do MF (SSE j? tem o seu); n?o redigir paleta/tipografia concretas agora; n?o tocar ?1??5, ?7??8 da B?ssola; n?o tocar ?6 M?tricas nem ?7 Fluxo do Operating Model; n?o alterar CLAUDE.md Regras 1?18.

### Alinhamento B?ssola

- Personas tocadas: **todas as 4** (PV/PUX aplicam-se transversalmente ? Cockpit do Owner, Inbox do Estimator, My Work do Technician, Books do Accountant).
- Gaps tocados: **indireto em todos** ? PV/PUX habilitam Gap 1 (Landing por persona) a entregar com coer?ncia visual.
- Princ?pios refor?ados: **P1** via PV3+PUX1; **P3** via PUX6; **P6** via PUX2+PV6.
- Novo princ?pio: nenhum em ?6.1; **12 novos** em ?6.2 e ?6.3 (PV1?PV6 + PUX1?PUX6).

### Artefatos produzidos

| Artefato | Localiza??o | Opera??o |
|---|---|---|
| ADR-013 draft | `.auto-memory/proposals/adr_013_draft.md` | Novo (DRAFT) |
| Patch B?ssola v1.2 | `.auto-memory/proposals/bussola_v1_2_patch_pv_pux.md` | Novo |
| Patch Operating Model v2.1 | `.auto-memory/proposals/operating_model_v2_1_patch_squad_health.md` | Novo |
| Patch frontend-reviewer | `.auto-memory/proposals/frontend_reviewer_patch_pv_pux.md` | Novo |
| Sugest?o CLAUDE.md Regra 19 | `.auto-memory/proposals/claude_md_rule_19_suggestion.md` | Novo |
| T-20260421-6 (aplicar patches) | `.auto-memory/dm_queue.md` | Novo, P2, Status PENDING |
| T-20260421-7 (expandir frontend-reviewer) | `.auto-memory/dm_queue.md` | Novo, P2, Blocked by T-20260421-6 |
| T-20260421-8 (cross-ref AGENTS + MEMORY) | `.auto-memory/dm_queue.md` | Novo, P2, Blocked by T-20260421-6 |
| T-20260421-9 (sync dashboard) | `.auto-memory/dm_queue.md` | Novo, P2, Blocked by T-20260421-6 |

### Pr?xima sess?o

**Foco sugerido:** (a) acompanhar DM aplicar T-20260421-6..9; (b) ap?s B?ssola v1.2 publicada, agendar sess?o de discovery de paleta concreta (RF-UI-SSE) an?loga ao NRF-UI-WARM do MF; (c) come?ar RF-004 Customer 360 com frontend-reviewer carregando j? o checklist expandido (primeiro teste real de ADR-013).

---

## Sess?o 2026-04-21 (noite) ? PO Cowork (NS vs B?ssola ? an?lise + incorpora??o)

**Contexto:** Luigi pediu an?lise comparativa entre a documenta??o p?blica do NS e a B?ssola de Produto SSE v1.0 (ADR-009). Objetivo: confrontar a B?ssola com padr?es de ind?stria sem perder posicionamento "simpler + cheaper + purpose-built", identificando gaps n?o-vistos, refor?os poss?veis, e padr?es adot?veis sem violar P1?P7. Base: `docs.oracle.com/en/cloud/saas/NS/ns-online-help/` via WebSearch (fetch bloqueado por allowlist). 12 ?reas exploradas.

Durante a sess?o, Luigi enviou duas instru??es de aprova??o:
1. *"este ? o dashboard que eu quero acompanhar daqui para frente, informe o PM e DM"* ? ado??o do HTML como artefato vivo de governan?a estrat?gica.
2. *"eu provo o plano de desenvolvimento"* ? desambigua??o via AskUserQuestion confirmou "Pacote completo" (B?ssola v1.1 + 4 RFs + ADR-012 + dashboard sync + DM tasks).

### Decis?es de produto

1. **ADR-012 ? Op??o A (Adotar ajustes propostos) ? Accepted.** ADR-011 permanece reservado para Release Cadence (aguarda T-20260412-1 sair de BLOCKED).
   - *Condi??o de revers?o:* (a) ?2 dos RFs 004/005/006/007 cancelados antes de dev ? reabrir ADR; (b) P8 atrasar Gap 2 em >30 dias ? reavaliar P8; (c) mudan?a material da B?ssola em Julho/2026 invalidar RFs; (d) RF-007 ?5% uso em 90 dias ? cancelar + novo ADR.

2. **B?ssola promovida para v1.1** ? ?5 Simplificamos (+7 linhas: Custom Segments/Classifications, SuiteFlow, Saved Searches, OneWorld/Subsidiaries, SuiteBilling, Dashboard Portlets configur?veis, Intelligent Transaction Matching); ?5 Superamos (+1099-NEC movido de Herdamos, MACRS nativo, Activation tracking instrumentado); ?6 novo **P8 (Offline-first para shop floor)**; ?7 Global Search Cmd/Ctrl+K obrigat?rio + nota de nomenclatura "Workspace" (n?o "Center"); ?8 (+5 linhas: RF-004 P1, RF-005 P1, RF-006 P1, RF-007 P2, ajuste Cockpit Available vs Cash Balance P1); ?9 (10 decis?es datadas).
   - *Condi??o de revers?o:* revis?o trimestral de Julho/2026 (ADR-010 ?4) ? se personas/gaps mudarem materialmente, redescopar.

3. **4 RFs APPROVED em RF_BACKLOG.md v0.2:**
   - RF-004 Customer 360 View (P1, Fase 2, Persona Estimator, L)
   - RF-005 Estimate State Machine + Inbox (P1, Fase 2, Persona Estimator, XL ? split recomendado)
   - RF-006 Payment Hold / Disputed Estimate (P1, Fase 2, Persona Estimator, M, depende de RF-005)
   - RF-007 Case Management simplificado (P2, Fase 2, Persona Estimator, M, com anti-rec #13 formal)

4. **13 anti-recomenda??es expl?citas** documentadas em `ANALISE_NS_vs_BUSSOLA_v1.md ?7` ? reduzem debate recorrente sobre features NS rejeitadas.

5. **Dashboard NS?B?ssola** (`ANALISE_NS_vs_BUSSOLA_v1.html` + `.md`) adotado como artefato can?nico de acompanhamento cont?nuo, mantido via **T-20260421-1** (standing task) com 6 gatilhos expl?citos.

6. **3 decis?es t?cnicas delegadas ao DM** (cada PR de RF registra):
   - Reversing Journal Entries j? existe no SSE? (relevante p/ RF-005 se toca GL)
   - Half-Year convention MACRS implementada? (relevante se RF toca FAM)
   - Global Search Cmd/Ctrl+K est? no SSE? (relevante p/ RF-004; ENH P1 separado se n?o)
   - *Condi??o de revers?o:* DM decide e registra; se decis?o for "existe mas parcial", PO reavaliar? se abre ENH complementar.

### Alinhamento B?ssola

- Personas tocadas: **Estimator** (prim?ria nos 4 RFs); Owner-Operator (secund?ria via RF-005 kanban); Accountant (secund?ria via RF-006 resolu??o).
- Gaps tocados: **Gap 5 (Insurance workflow)** amplificado por RF-004/005/006/007; **Gap 2 (Mobile Technician)** refor?ado via P8 antes do RF ser escrito.
- Princ?pios refor?ados: **P1 (simplificar > completar)** formalizado em RF-007 via anti-rec #13; **P4 (uma tela = uma decis?o)** validado em RF-004.

### Artefatos produzidos

| Artefato | Localiza??o | Opera??o |
|---|---|---|
| Relat?rio NS vs B?ssola | `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.md` | Novo ? Accepted |
| Dashboard interativo | `docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.html` | Novo ? Accepted (living artifact) |
| ADR-012 formal | `docs/decisions/012-ns-incorporacao-parcial.md` | Novo |
| B?ssola v1.1 | `docs/strategy/BUSSOLA_PRODUTO_SSE.md` | Patch (header, ?5, ?6, ?7, ?8, ?9) |
| RF_BACKLOG v0.2 | `docs/strategy/RF_BACKLOG.md` | Header + RF-004/005/006/007 + Pr?ximos RFs |
| Standing task do dashboard | `.auto-memory/dm_queue.md` T-20260421-1 | Novo |
| Tasks DM para 4 RFs | `.auto-memory/dm_queue.md` T-20260421-2/3/4/5 | Novo |
| Status update PM | `.auto-memory/project_sse_status.md` | Anota??o PO no topo + ADR count 10?11 + RFs |
| Mem?ria do dashboard | `...memory/project_sse_NS_dashboard.md` | Novo |
| Index de mem?ria | `...memory/MEMORY.md` | Patch (entrada do dashboard) |
| Index de auto-memory | `.auto-memory/MEMORY.md` | Patch (se??o "Dashboards estrat?gicos") |

### Issues criadas / PRs revisados
- Issues: nenhuma nova nesta sess?o (4 RFs viram backlog, n?o issues at? DM claim)
- PRs revisados: nenhum (sess?o puramente estrat?gica)

### Bloqueios
- T-20260412-1 (Deploy API) permanece BLOCKED ? aguarda a??o humana do Luigi para configurar secrets Fly.io
- ADR-011 (Release Cadence) permanece reservado

### Pr?xima sess?o PO
- Foco: monitorar primeiro RF em dev (RF-004 ou RF-005) e validar que PR cita persona/gap conforme Regra 16
- Opcional: revisitar T-20260412-1 se Luigi confirmar disponibilidade para mexer em secrets Fly.io

---

## Sess?o 2026-04-20 (tarde) ? PO Cowork (Settings Hardening + Prompt Review)

**Contexto:** Luigi relatou fadiga de prompts de aprova??o em sess?es de subagentes (ex: `cd ... && git fetch && git pull | tail` disparando modal apesar de `Bash(git fetch:*)` estar no allow list). Pediu script para eliminar interrup??es. Escopo alinhado via AskUserQuestion (3 n?veis de agressividade ? limpeza de legado).

### Decis?es de produto

1. **`Bash(*)` total em `.claude/settings.local.json`** ? substitu?do allow list de 80 entradas hiperespec?ficas por `Bash(*)` + 1 Read. Backup preservado em `settings.local.json.bak-20260420`. Op??o escolhida sobre wildcards targetados (mais conservadora) e `defaultMode: bypassPermissions` (mais agressiva, inclu?a Edit/Write/MCP).
   - *Condi??o de revers?o:* se qualquer subagente rodar comando destrutivo inesperado (rm, curl|sh, reset --hard em main, commit direto em main), restaurar do `.bak-20260420` OU trocar para lista targetada (`Bash(git:*)`, `Bash(gh:*)`, `Bash(pnpm:*)`, etc.)
   - *Trade-off aceito:* Regra 1 do CLAUDE.md ("NUNCA push direto em main") agora depende 100% da disciplina do agente, n?o mais de gate de permiss?o. Motivou T-20260420-1.

2. **Revis?o cr?tica dos prompts do squad** ? analisados 6 prompts (DevManager, PMAgent, 4 subagentes). Identificados 10 gaps no contexto p?s-Bash(*), empacotados em 2 tarefas para DM conforme severidade.

### Artefatos produzidos

| Artefato | Localiza??o | Opera??o |
|---|---|---|
| Allow list enxuto | `.claude/settings.local.json` | Reescrita (80 ? 2 entradas) |
| Backup do allow list anterior | `.claude/settings.local.json.bak-20260420` | Novo |
| Handoff T-20260420-1 (P1 hardening DM) | `.auto-memory/dm_queue.md` | Append-top |
| Handoff T-20260420-2 (P2 housekeeping subagentes) | `.auto-memory/dm_queue.md` | Append-top |

### Issues criadas / PRs revisados / Bloqueios

- Issues criadas: 0 (PO-only session)
- PRs revisados: 0
- Bloqueios: T-20260412-1 (Deploy API) permanece BLOCKED ? inalterado por esta sess?o
- Decis?es adiadas: ADR-011 (release cadence) continua reservado at? T-20260412-1 sair de BLOCKED

### Alinhamento B?ssola

- **Persona prim?ria tocada:** N/A (sess?o meta/infra ? seguran?a do processo de delivery)
- **Gap fechado:** N/A (meta)
- Observa??o: T-20260420-2 refor?a **Regra 16** (persona+gap em PRs de UI) via patch no `frontend-reviewer.md`

### Handoffs DM derivados

- **T-20260420-1** (P1 PENDING) ? hardening do `DevManager_Squad_v2.md`: proibi??es destrutivas + escopo negativo na pr?-autoriza??o
- **T-20260420-2** (P2 PENDING) ? housekeeping dos 4 subagentes + alinhamento com regras 15?18
- Ambos registrados conforme template can?nico `HANDOFF_PROTOCOL.md` ?4

### Pr?xima sess?o

1. Aguardar DM consumir T-20260420-1 (P1) ? revisar diff quando PR abrir
2. Monitorar se `Bash(*)` gera comportamento inesperado em subagentes ? caso positivo, acionar condi??o de revers?o
3. Avaliar se T-20260412-1 (Deploy API) avan?ou para permitir destravar ADR-011 (release cadence)

---

## Sess?o 2026-05-09 (parte 3) ? PO Cowork (Execu??o do Passo 1 via Claude in Chrome)

**Contexto:** Luigi pediu para executar o Passo 1 da sequ?ncia destrava-UAT (configurar `NEXT_PUBLIC_API_URL` no Vercel) usando a extens?o Claude in Chrome. Sess?o acompanhada via browser automation.

### Achados cr?ticos

1. **Env var j? existia desde 2026-05-06**, mas estava marcada como **Sensitive** ? incompat?vel com o prefixo `NEXT_PUBLIC_*` do Next.js (que precisa ser inline-able no client bundle). Esse era o root cause real do BUG-03 build failure no PR #77.
2. **Vercel n?o permite desmarcar Sensitive em var existente** ? o checkbox vem com atributo `disabled=""` no DOM. Single-direction flag.
3. **Clerk middleware protege `/api/(.*)`** ? o middleware roda antes dos rewrites do `next.config.js`. Public routes s?o apenas `/`, `/login(.*)`, `/api/webhooks(.*)`. Valida??o end-to-end de `/api/health` ou `/api/ready` retorna 404 (`x-clerk-auth-status: signed-out`) sem autentica??o. Comportamento intencional, n?o bug.
4. **Vercel cache cacheia 404** ? `x-vercel-cache: HIT` mesmo com `Cache-Control: no-cache` no client. Cache ? invalidado naturalmente ap?s login (cookies Clerk variam).

### Decis?es e a??es executadas

1. **Delete da env var Sensitive** confirmada com Luigi (consentimento expl?cito).
2. **Recria??o sem Sensitive** ? Key=`NEXT_PUBLIC_API_URL`, Value=`https://sse-api-staging.fly.dev/api/v1`, Environments=Production+Preview, Sensitive=OFF, Note documentando o motivo da recria??o (data + refer?ncia a build error PR #77).
3. **Redeploy production sem cache** ? checkbox "Use existing Build Cache" desmarcado. Build E5arkhdfD conclu?do em 1m 28s, Status: Ready, Latest.
4. **Valida??o parcial** ? fetch direto a `/api/health` e `/api/v1/health` retornam 404 por causa do Clerk middleware (esperado sem login). Valida??o completa requer login humano.

### Artefatos

| Artefato | Localiza??o |
|---|---|
| Env var nova | Vercel project sse-web-staging (n?o Sensitive, valor correto) |
| Deploy E5arkhdfD | Vercel ? production atual |

### Valida??o end-to-end (executada ap?s login do Luigi)

Ap?s Luigi fazer login (Clerk SSO ou email+senha ? PO Assistant n?o preencheu senha), PO Assistant rodou via Console:

```
/api/health ? 200 {"status":"ok","timestamp":"2026-05-10T04:43:23.145Z"}
/api/ready  ? 200 {"status":"ok","checks":{"db":"up","redis":"up"},"timestamp":"2026-05-10T04:43:25.088Z"}
```

Headers confirmam: `x-vercel-cache: MISS`, `x-matched-path: null`, `x-clerk-auth-status: null`. Cadeia completa funciona: client ? rewrite Next.js ? middleware Clerk ? proxy Vercel ? Fly.io API ? DB + Redis. **BUG-03 efetivamente fechado.**

### Pr?ximos passos (na ordem)

1. ? ~~Luigi (manual): logar e rodar `fetch('/api/health')`~~ ? conclu?do nesta sess?o; ambos retornam 200.
2. **Luigi via PowerShell:** rodar `.auto-memory/scripts/destrava_uat_20260509.ps1` ? agora PR #77 deve buildar com sucesso (fail-fast guard n?o dispara mais).
3. **DM via sess?o Cowork:** consumir T-20260509-2 do dm_queue ? executar `pnpm --filter api seed:run -- --tenant=acme --type=personas` ent?o `--type=demo-data`.
4. **Luigi:** UAT manual com Doc B (tour completo) ou entregar Doc A para amigo/familiar.

### Bloqueios identificados nesta sess?o

- Nenhum P0/P1 novo. Apenas a janela de valida??o dependente de login (intencional do Clerk).

### Pr?xima sess?o PO

**Foco:** receber feedback do teste manual do `/api/health` e, se OK, prosseguir com seed Acme + UAT.

---

## Sess?o 2026-05-09 (parte 2) ? PO Cowork (Playbook destrava-UAT)

**Contexto:** Luigi pediu para "executar a sequ?ncia sugerida para destravar UAT". PO Assistant declarou os limites operacionais (sem `gh` no sandbox, sem acesso aos dom?nios `*.fly.dev`/`*.vercel.app` na allowlist, sem credenciais Vercel/Clerk/Neon) e empacotou a sequ?ncia num playbook PowerShell para Luigi rodar localmente.

### Decis?es de produto

1. **Reconhecimento expl?cito de limite operacional** ? papel PO Assistant n?o inclui execu??o de PR merge via CLI a partir do sandbox. Sandbox bloqueia `gh`, GitHub API, e dom?nios de staging. Solu??o: empacotar comandos prontos para execu??o local pelo Luigi (que tem `gh` autenticado e acesso ao Vercel dashboard).
2. **Vercel env var permanece manual** ? n?o h? CLI Vercel no protocolo deste projeto. Passo 1 da sequ?ncia (configurar `NEXT_PUBLIC_API_URL`) ? via dashboard, com instru??es abaixo.
3. **Seed Acme permanece DM** ? regra "PO n?o executa c?digo" mantida. Handoff T-20260509-2 j? est? no `dm_queue.md` desde sess?o anterior (parte 1, mais cedo neste mesmo dia).
4. **Smoke check inclu?do no playbook** ? testa `/health`, `/ready`, web root, e crucialmente `/api/v1/health` via proxy Vercel ? esse ?ltimo ? o can?rio de BUG-03 (se 200, env var + rewrite OK).

### Artefatos produzidos

| Artefato | Localiza??o | Tamanho | Fun??o |
|---|---|---|---|
| Playbook PowerShell destrava-UAT | `.auto-memory/scripts/destrava_uat_20260509.ps1` | ~5 KB | Script ?nico cobrindo Passo 2 (revisar+mergear PR #77 com guards) + confirmar handoff DM + smoke check 4 endpoints |

### Sequ?ncia operacional consolidada (4 passos)

| Passo | Quem executa | Como | Estimativa |
|---|---|---|---|
| 1 ? Vercel env var | Luigi (manual) | Dashboard Vercel ? Project sse-web-staging ? Settings ? Environment Variables ? Add `NEXT_PUBLIC_API_URL=https://sse-api-staging.fly.dev/api/v1` (Preview + Production) ? Redeploy ?ltimo build | 1 min |
| 2 ? Aprovar+mergear PR #77 | Luigi via PowerShell local | `pwsh .auto-memory/scripts/destrava_uat_20260509.ps1` (script com guards: gh auth, working tree limpo, checks SUCCESS, scan de regras inviol?veis no diff, confirma??o interativa antes de merge) | ~2 min |
| 3 ? Executar seed Acme | DM (sess?o Cowork DM) | Consumir T-20260509-2 do `dm_queue.md`. Comandos: `pnpm --filter api seed:run -- --tenant=acme --type=personas` ent?o `--type=demo-data`. Pr?-cond: `DATABASE_URL_UNPOOLED`, `CLERK_SECRET_KEY` no env. | ~5 min |
| 4 ? UAT manual | Luigi + leigo | Via roteiros `SSE_Roteiro_Testes_Amigavel_v1_1.docx` e `SSE_Tour_Completo_Testes_PO_v1_1.docx` em `docs/audits/` | ~3h amigo / ~6-8h tour completo |

### Issues criadas / PRs revisados / Bloqueios

- Issues criadas: 0
- PRs revisados: 0 (n?o posso, sandbox bloqueia gh + API GitHub)
- Bloqueios identificados: nenhum novo. Mesmos da parte 1 desta data.

### Pr?xima sess?o PO

**Foco:** ap?s Luigi rodar o playbook + DM consumir T-20260509-2, conduzir UAT pessoal via Doc B (tour completo). Registrar bugs encontrados via template BUG.

**Poss?vel pivot:** se smoke check do playbook indicar BUG-03 ainda n?o resolvido (proxy retorna 404/502), abrir nova investiga??o operacional antes de UAT.

---

## Sess?o 2026-05-09 ? PO Cowork (Valida??o de credenciais Doc B + handoff seed Acme)

**Contexto:** Luigi pediu para validar se as personas/logins/senhas descritos no Doc B (tour completo) s?o v?lidos para testes e, se inv?lidos, abrir bug e fazer carga de dados fict?cios para Acme. PO Assistant detectou drift de calend?rio (sess?o anterior datada 28/abr; data real ? 09/mai).

### Achados

1. **Credenciais N?O s?o inv?lidas em c?digo.** Os 7 e-mails (`owner@acme.sse-demo.test`, etc.) e a senha default `DemoPass!2026` correspondem 1:1 ao c?digo em `apps/api/src/database/seeds/acme-personas.seed.ts` (PR #68 merged 2026-05-02, COMPLETED). Os dados demo (15 customers, 18 vehicles, 12 estimates, 5 SOs, 30 transactions, COA, 3 JEs, 1 fixed asset) correspondem ao `acme-demo-data.seed.ts` (PR #69 merged 2026-05-02, COMPLETED).
2. **Credenciais S?O inv?lidas operacionalmente em staging** porque os seeds nunca foram executados contra Neon staging. Sem essa execu??o, login dos 7 personas falha (Clerk users n?o existem).
3. **Bloqueio adicional:** BUG-03 (T-20260505-1, IN_PROGRESS) ? frontend Next.js n?o tem rewrite/proxy correto, retorna 404 nas chamadas `/api/*`. PR #76 merged, PR #77 OPEN aguardando configura??o `NEXT_PUBLIC_API_URL` no Vercel pelo PO. Sem isso, mesmo com seed rodado, login funciona at? a primeira chamada API e quebra.
4. **Decis?o:** n?o abrir BUG novo (BUG-03 j? cobre o sintoma do frontend; c?digo do seed j? est? OK). Em vez disso, registrar handoff DM operacional para executar o seed.

### Decis?es de produto

1. **N?o escrever BUG novo** ? o c?digo do seed est? validado (security-reviewer + db-reviewer PASS). A pend?ncia ? opera??o, n?o corre??o.
2. **Handoff DM can?nico T-20260509-2** redigido no topo de `dm_queue.md`:
   - Comandos exatos: `pnpm --filter api seed:run -- --tenant=acme --type=personas` e depois `--type=demo-data`
   - Pr?-condi??es: tenant slug=acme existir, env vars `DATABASE_URL_UNPOOLED` + `CLERK_SECRET_KEY` + `DEMO_SEED_PASSWORD` no contexto
   - 6 crit?rios de aceite objetivos (counts em customers/vehicles/estimates/SOs + Clerk users + login + idempot?ncia)
   - Escopo negativo expl?cito: n?o rodar em prod, n?o modificar seeds, n?o criar tenants adicionais nesta task
   - *Condi??o de revers?o:* se seed falhar em rerun por diverg?ncia de schema, escalar como BUG separado
3. **Documentos atualizados para v1.1** com 2 caveats expl?citos:
   - Status real do staging (BUG-03 PR #77 pendente, T-20260509-2 PENDING)
   - Pr?-checagem r?pida em 5 passos antes de iniciar UAT
   - Vers?o e data corrigidas (v1.0 28/abr ? v1.1 09/mai)

### Artefatos produzidos / atualizados

| Artefato | Localiza??o | Tamanho | Mudan?a |
|---|---|---|---|
| Handoff DM T-20260509-2 (novo) | `.auto-memory/dm_queue.md` (topo) | +~140 linhas | PENDING ? handoff can?nico para executar seed Acme |
| Roteiro Amig?vel v1.1 (atualizado) | `docs/audits/SSE_Roteiro_Testes_Amigavel_v1_1.docx` | 24.6 KB / 478 par?grafos | Vers?o + data + callout expandido sobre 2 pr?-condi??es (BUG-03 + T-20260509-2) |
| Tour Completo PO v1.1 (atualizado) | `docs/audits/SSE_Tour_Completo_Testes_PO_v1_1.docx` | 37.6 KB / 1349 par?grafos | Vers?o + data + callout "Status do staging" com 4 itens + pr?-checagem em 5 passos |
| Roteiro Amig?vel v1.0 (legado) | `docs/audits/SSE_Roteiro_Testes_Amigavel_v1.docx` | 24.6 KB | Sobrescrito durante atualiza??o ? passou a ter o mesmo conte?do da v1.1 (n?o p?de ser preservado como hist?rico por restri??o de escrita do FS) |
| Tour Completo PO v1.0 (legado) | `docs/audits/SSE_Tour_Completo_Testes_PO_v1.docx` | 37 KB | Permaneceu como hist?rico (timestamp 02/mai, FS bloqueou overwrite) ? distribuir apenas a v1.1 |

### Issues criadas / PRs revisados / Bloqueios

- Issues criadas: 0
- PRs revisados: 0
- Bloqueios identificados:
  - BUG-03 PR #77 OPEN aguardando PO configurar `NEXT_PUBLIC_API_URL` no Vercel
  - T-20260509-2 PENDING (seed Acme) ? entregue como handoff DM nesta sess?o
  - T-20260509-1 PENDING (Tenants module CRUD ausente) ? n?o bloqueia UAT do Acme

### Alinhamento B?ssola

- **Personas tocadas:** todas as 4 ? handoff T-20260509-2 destrava UAT por persona
- **Gaps:** nenhum gap novo identificado; foco operacional, n?o estrat?gico

### Pr?xima sess?o PO

**Foco:** ap?s DM executar T-20260509-2 e PR #77 mergear, conduzir UAT manual do Acme via Doc B (tour completo). Registrar bugs encontrados via template BUG no PO Assistant.

---

## Sess?o 2026-04-28 ? PO Cowork (Atualiza??o + Roteiros de Teste para leigos)

**Contexto:** Sess?o dupla. Primeiro Luigi pediu para atualizar o relat?rio de prontid?o e revisar passo a passo. Detectado drift massivo: Fase 1 100% fechada, deploy API VERDE, 15/15 m?dulos, 580 testes, 15 ADRs (snapshot anterior era 12 m?d, 343 testes, 10 ADRs, deploy API vermelho). Veredicto v1 CONDITIONAL-GO ? v2 GO. Em seguida, Luigi pediu documento para um leigo executar testes. AskUserQuestion identificou 2 p?blicos distintos: amigo/familiar (happy path 4 personas) e Luigi mesmo (tour completo 15 m?dulos). Ambos em PT-BR formato .docx.

### Decis?es de produto

1. **Go/No-Go v2 promovido para GO** ? todas as 3 condi??es C1/C2/C3 da v1 fecharam (T-20260412-1 superseded por T-20260421-10/ADR-011, RF-002 wizard COMPLETED, RF-003 activation tracking COMPLETED). Squad entregou 6 RFs adicionais durante a janela 20?28/abr (RF-004, RF-005a/b/c, RF-006, RF-007).
   - *Condi??o de revers?o:* incidente staging >48h ou coverage <80% at? 2026-05-12 ? regress?o para CONDITIONAL.
2. **Plano de testes UI v2** atualizado cirurgicamente: caveats de T-20260412-1 removidos, matriz de cobertura expandida para 15 m?dulos (notifications, admin, cases adicionados), tasks renomeadas T-20260420-A..QA ? T-20260428-A..QA.
3. **Doc A ? Roteiro Amig?vel (familiar/amigo)** entregue: 4 sess?es por persona ? 30-45min cada, ~3h total. Gloss?rio PT-BR?EN, callouts visuais, espa?o para anota??es manuscritas. Pr?-requisito expl?cito: tenant Acme precisa estar populado (T-20260428-A pendente).
4. **Doc B ? Tour Completo PO (Luigi)** entregue: 15 m?dulos um a um, cada um com tabela de cen?rios (# | ID | A??o | Resultado | Status [ ] OK/[ ] Falha/[ ] N/A), 9 cen?rios cross-module (CM-01 happy path, CM-02 RF-006 payment hold, CM-03 Customer 360 chain), 24 cen?rios negativos (RBAC, plan limits, multi-tenant, valida??o), checklist final consolidado por ?rea. Total estimado 6-8h (execut?vel em 2-3 sess?es).
5. **Decis?o de formato:** ambos em .docx polido (n?o .md) por prefer?ncia expl?cita do Luigi ? facilita imprimir e enviar como anexo.

### Artefatos produzidos

| Artefato | Localiza??o | Tamanho |
|---|---|---|
| Go/No-Go v2 (atualizado) | `docs/audits/SSE_GoNoGo_Fase1_MVP_20260420.md` | ~12.6 KB |
| Plano de Testes UI v2 (atualizado cirurgicamente) | `docs/audits/SSE_Plano_Testes_UI_Fase1_20260420.md` | ~24 KB |
| Roteiro Amig?vel (fam?lia/amigo, novo) | `docs/audits/SSE_Roteiro_Testes_Amigavel_v1.docx` | 24 KB / 476 par?grafos |
| Tour Completo PO (Luigi, novo) | `docs/audits/SSE_Tour_Completo_Testes_PO_v1.docx` | 37 KB / 1342 par?grafos |

### Issues criadas / PRs revisados / Bloqueios

- Issues criadas: 0 (PO-only session)
- PRs revisados: 0
- Bloqueios identificados: nenhum P0/P1 ativo. Apenas T-20260421-1 (NS dashboard) standing P2.

### Alinhamento B?ssola

- **Personas tocadas:** todas as 4 (Owner, Estimator, Technician, Accountant) ? Doc A organiza-se por persona, Doc B mapeia cada m?dulo ? persona prim?ria servida
- **Gaps cobertos:** 5 dos 6 gaps B?ssola validados; Gap 2 (mobile PWA Technician) explicitamente diferido como caveat MVP em ambos os relat?rios
- **RFs entregues al?m do m?nimo:** RF-004 (Customer 360), RF-005a/b/c (Estimate state machine + Inbox + Kanban), RF-006 (Payment Hold), RF-007 (Case Management)

### Decis?es pendentes (4 ratifica??es solicitadas no walkthrough do Go/No-Go)

1. Ratificar GO formal Fase 1?
2. Aceitar fechar Fase 1 sem `inventory`/`rental`?
3. Gap 2 (mobile PWA): caveat aceito ou P0 Fase 2?
4. Demo Acme antes de GO p?blico ou ratificar interno agora?

Mais a pergunta operacional: quer que registre T-20260428-A..QA no `dm_queue.md` agora?

### Pr?xima sess?o PO

**Foco:** receber decis?es de ratifica??o acima e, se aprovado, redigir RFs Fase 2 (IA OCR + Plaid + n8n) em `RF_BACKLOG.md` para destravar handoffs DM.

---

## Sess?o 2026-04-20 ? PO Cowork (Relat?rio de Prontid?o + Plano de Testes UI)

**Contexto:** Luigi pediu atualiza??o do relat?rio de prontid?o (antigo `SSE_Post_Migration_Readiness_Report_20260412.md`, desatualizado) e do plano de testes, incluindo UI com dados fict?cios. Escopo alinhado via AskUserQuestion antes da execu??o.

### Decis?es de produto

1. **Readiness report reescrito como Go/No-Go Fase 1 MVP** ? n?o mais um snapshot p?s-migra??o, mas um documento de decis?o com recomenda??o expl?cita (`CONDITIONAL-GO`) e condi??o de revers?o (revisitar 2026-05-05 com crit?rios C1/C2/C3 objetivos). Doc de 12/abr preservado como hist?rico com header de supersede.
   - *Condi??o de revers?o:* se C1 (deploy API) + C2 (RF-002 wizard) ambos falharem em 2026-05-05 ? regredir para `NO-GO` e realocar squad para infra/wizard sem novos features.
2. **Plano de testes UI cobre 4 categorias complementares** ? Seed demo (A), E2E Playwright (B), QA manual (C), Smoke p?s-deploy (D). Todos os 12 m?dulos ativos, 3 diferidos marcados N/A Fase 1.
3. **Dados fict?cios centralizados no tenant "Acme Auto Body, LLC"** ? 7 users (1 por role), 25 customers, 40 vehicles, 35 estimates com mix de status, 22 SOs, 150 transactions, 8 fixed assets. EINs/placas/VINs usam ranges n?o-alocados para evitar colis?o com dados reais.
4. **Playwright escolhido sobre Cypress** para E2E ? justificativa: maturidade mobile emulation (prepara Gap 2 B?ssola futuro). Admite ADR se DM divergir.
5. **Smoke isolado do seed demo** ? usu?rio `smoke@sse-internal.test` em tenant `smoke-tenant` vazio, n?o Acme. Isola regress?o causada por seed vs. c?digo.

### Artefatos produzidos

| Artefato | Localiza??o | Tamanho |
|---|---|---|
| Relat?rio Go/No-Go Fase 1 MVP (novo) | `docs/audits/SSE_GoNoGo_Fase1_MVP_20260420.md` | ~12.6 KB |
| Plano de Testes UI Fase 1 (novo) | `docs/audits/SSE_Plano_Testes_UI_Fase1_20260420.md` | ~23 KB |
| Header de supersede adicionado | `docs/audits/SSE_Post_Migration_Readiness_Report_20260412.md` | +7 linhas |

### Issues criadas / PRs revisados / Bloqueios

- Issues criadas: 0 (PO-only session)
- PRs revisados: 0
- Bloqueios identificados: **T-20260412-1 Deploy API permanece BLOCKED** ? ? o bloqueio existencial para executar categorias B/C/D do plano de testes. Categoria A (seed) pode avan?ar em paralelo.

### Alinhamento B?ssola

- **Persona prim?ria tocada:** todas as 4 (Owner, Estimator, Technician, Accountant) ? plano de testes UI define roteiro por persona
- **Gaps referenciados:** Gap 1 (landing persona ? RF-001 parcial), Gap 3 (onboarding ? RF-002 pendente), Gap 4 (cockpit Owner ? parcial), Gap 2 e 5 mencionados como escopo negativo Fase 1

### Handoffs DM derivados (n?o registrados ainda ? requer aprova??o Luigi)

Lista sugerida para registro em `.auto-memory/dm_queue.md` em sess?o subsequente:

| ID sugerido | Subject | Prioridade | Depend?ncia |
|---|---|---|---|
| T-20260420-A | Criar script seed Acme Auto Body | P1 | Nenhuma |
| T-20260420-B | Scaffolding Playwright + 2 specs piloto | P1 | T-20260412-1 resolvido |
| T-20260420-C | Specs Playwright m?dulos 3-12 | P2 | T-20260420-B |
| T-20260420-D | Smoke test CI wiring | P2 | T-20260412-1 resolvido |
| T-20260420-QA | Execu??o QA manual com PO | P1 | A + T-20260412-1 |

### Pr?xima sess?o PO

**Foco:** revisar com Luigi se os handoffs T-20260420-A..QA devem ir ao dm_queue.md agora ou aguardar evolu??o de T-20260412-1. Se deploy API desbloquear at? l?, promover para P0 de execu??o.

---

## Sess?o 2026-04-17 ? PO Cowork (parte 6 ? Rollback de duplicatas e consolida??o de handoff)

**Contexto:** PO Assistant iniciou sess?o para consolidar governan?a (B?ssola, Operating Model, HANDOFF_PROTOCOL, release cadence) sem ler `.auto-memory/MEMORY.md` local. Criou 8 patches de duplicatas lossy de artefatos can?nicos pr?-existentes. Luigi detectou no review e autorizou rollback R1?R5.

### Decis?es de produto

1. **Rollback completo aceito** ? deletar todos os artefatos ?rf?os criados pela sess?o; restaurar `.auto-memory/dm_queue.md` can?nico (15 task IDs) via reverse-mojibake do backup `backlog_frozen.md`.
2. **ADR-011 (Release Cadence) deletado como prematuro** ? discutir release cadence enquanto T-20260412-1 (Deploy API staging) est? BLOCKED ? cavalo antes do carro. Conte?do preservado em mem?ria para recriar quando staging estiver verde. Ref: mem?ria PO `project_sse_release_cadence_pending.md`.
3. **`.auto-memory/phase1_close_gate.md` deletado** ? conceito "WIP limit para Fase 2" duplica roadmap por gaps da B?ssola; as refs B1-3/B2-2/B3-4 eram inven??o, can?nicos do repo s?o T-20260412-2 (T-020/021/022) + T-20260412-3.
4. **Protocolo PO Cowork no project instructions est? desatualizado em 2 pontos:** (a) menciona `dm_tasks_pending.md` como can?nico (? DEPRECATED, can?nico ? `dm_queue.md`); (b) n?o manda ler `.auto-memory/MEMORY.md` local na abertura. Patch ao system prompt fica como sugest?o para sess?o futura.

### Artefatos produzidos

| Artefato | Localiza??o |
|---|---|
| `dm_queue.md` can?nico restaurado (15 task IDs, 33.868 chars, UTF-8 BOM) | `.auto-memory/dm_queue.md` |
| Mem?ria PO ? estrutura de handoff can?nica (reescrita: 6 ativos + 2 stubs DEPRECATED + 6 can?nicos em `docs/`) | memory store ? `project_sse_handoff_structure.md` |
| Mem?ria PO ? ADR release cadence pendente de trigger (nova) | memory store ? `project_sse_release_cadence_pending.md` |
| Mem?ria PO ? conven??es PowerShell: `Set-Location` sempre como 1? linha (nova) | memory store ? `feedback_powershell_conventions.md` |
| Mem?ria PO ? estilo de decis?es (atualizada: princ?pio 3 generalizado de "runbooks" para "toda intera??o dependente de a??o humana") | memory store ? `feedback_decisions_and_handoffs.md` |

### Artefatos removidos (rollback)

| Arquivo | Tamanho | Raz?o |
|---|---|---|
| `docs/product/bussola.md` | 1.743 B | Duplicata lossy de `docs/strategy/BUSSOLA_PRODUTO_SSE.md` (3K vs 28K can?nico) |
| `docs/product/operating_model.md` | 1.973 B | Duplicata lossy de `docs/process/OPERATING_MODEL_v2.md` (3K vs 15K can?nico) |
| `docs/product/` | dir | Vazio ap?s deletes |
| `docs/archive/README.md` | 626 B | Enganoso ? nada do repo estava realmente superseded |
| `docs/archive/` | dir | Vazio ap?s delete |
| `docs/decisions/011-release-cadence.md` | 1.489 B | ADR prematuro, sem infra para suportar |
| `.auto-memory/phase1_close_gate.md` | 760 B | Refs inventadas + conceito duplica B?ssola |
| `.auto-memory/backlog_frozen.md` | 37.221 B | Backup redundante ap?s restaura??o bem-sucedida do dm_queue |
| `.auto-memory/dm_tasks_pending.md.bak-2026-04-17-po-cowork` | 2.593 B | Backup do stub DEPRECATED, n?o mais necess?rio |

### Gaps / bugs / ENHs identificados

- **Gap de processo:** protocolo PO Cowork n?o mandata leitura de `.auto-memory/MEMORY.md` na abertura. Se tivesse mandatado, toda a retrabalho desta sess?o teria sido evitada em <30s. Documentado em mem?ria; patch a avaliar em sess?o futura.
- **Observa??o t?cnica:** PowerShell 5.1 `Get-Content -Raw` l? UTF-8 sem BOM como Windows-1252 por default, causando mojibake silencioso de acentos/em-dash ao re-escrever. Mitigado com `[System.IO.File]::WriteAllText(path, content, New-Object System.Text.UTF8Encoding($true))`.
- **Descoberta:** `.auto-memory/`, `docs/strategy/`, `docs/process/`, `docs/decisions/009-010` e `docs/README.md` est?o **untracked no git** ? governan?a viva no filesystem mas sem hist?rico versionado. T-20260417-5 (PENDING) j? endere?a isso.

### Handoffs

- **Dev Manager:** nenhuma task nova criada nesta sess?o. `.auto-memory/dm_queue.md` restaurado mant?m as 15 tarefas preexistentes (T-20260412-1/2/3 + T-20260417-1 a T-20260417-12).
- **PM Agent:** nenhum check solicitado.

### Bloqueios / alertas

- **T-20260412-1 (Deploy API staging) continua BLOCKED** ? sem mudan?a nesta sess?o. Bloqueia aprendizado de produto e decis?o sobre release cadence.
- **Governan?a untracked no git** ? risco de perda acidental at? T-20260417-5 ser executada pelo DM.

### Pr?xima sess?o

**Recomendada ? WS-C (Auditoria + Consolida??o da Documenta??o):** sess?o pr?-planejada em `.auto-memory/next_sessions_plan.md`. Escopo: invent?rio dos 17 arquivos em `docs/` root, proposta de estrutura limpa, commit consolidado da governan?a untracked.

**Alternativa reativa:** aguardar DM executar T-20260417-5 (commit docs) e revisar PR. Sess?o curta de approve+merge.

**Meta-a??o sugerida:** patch ao system prompt do PO Cowork para mandatar leitura de `.auto-memory/MEMORY.md` como passo 0 da abertura. Evita o incidente desta sess?o em futuras.

---

## Sess?o 2026-04-17 ? PO Cowork (parte 5 ? Gaps P0 convertidos em RFs)

**Contexto:** Luigi aceitou recomenda??o A. Apesar do pr?-requisito t?cnico (T-20260417-4 briefing do DM) n?o ter sido executado, PO assumiu varredura t?cnica LEVE e produziu RFs com complexidade marcada como "a validar pelo DM".

### Decis?es de escopo por RF (discovery rodada)

**RF-001 (Landing por Persona):**
- User multi-role ? hierarquia fixa `owner > manager > estimator > technician > accountant > viewer`
- N?o persiste ?ltima escolha; user troca explicitamente quando precisa
- Switcher s? aparece se user tem m?ltiplos roles

**RF-002 (Setup Wizard de Onboarding):**
- Skip permitido; tenant marcado como `wizard_skipped` mas pode ativar organicamente via happy path nos 7 dias
- Sample data criado com `is_sample = true`, vis?vel nas listagens normais
- N?O persiste progresso parcial entre sess?es (decis?o pragm?tica para v0.1)

**RF-003 (Event Tracking de Activation):**
- Tabela pr?pria `public.activation_events` (schema p?blico, n?o tenant-scoped)
- Append-only, com 13 event_types can?nicos incluindo `tenant_activated` computado
- Dashboard interno em `/admin/activation` acess?vel a super_admin
- N?O persiste IP/UserAgent individual (LGPD/CCPA)

### Artefatos produzidos (parte 5)

| Artefato | Localiza??o | Status |
|---|---|---|
| RF Backlog v0.1 | `docs/strategy/RF_BACKLOG.md` | NOVO ? RF-001/002/003 + lista de RFs futuros |
| 3 tasks DM no queue | `.auto-memory/dm_queue.md` | NOVAS (T-20260417-10/11/12) |
| docs/README.md atualizado | `docs/README.md` | Patched com RF_BACKLOG |
| T-20260417-5 expandida | `.auto-memory/dm_queue.md` | Lista agora 12 arquivos novos + 1 root README alterado |

### Tarefas criadas no `dm_queue.md` em parte 5

- **T-20260417-10** (P0) ? Implementar RF-001 (Landing por Persona). Complexidade M (PO assessment). Subagentes: frontend + security + test.
- **T-20260417-11** (P0) ? Implementar RF-002 (Setup Wizard). Complexidade L (PO assessment). Subagentes: frontend + db + test + security.
- **T-20260417-12** (P0) ? Implementar RF-003 (Event Tracking). Complexidade L (PO assessment). Subagentes: db + security + test + frontend.

### Depend?ncias declaradas

- RF-001 ? bloqueia merge de RF-002 (wizard precisa saber onde mandar owner)
- RF-003 ? n?o bloqueia, mas enriquece RF-002 (eventos do wizard)
- Recomenda??o de ordem para o DM: RF-001 ? RF-003 ? RF-002 (ou RF-001 + RF-003 em paralelo, depois RF-002)

### Handoffs

- **Dev Manager:** 3 tarefas novas no queue (T-10/11/12). **Cr?tico:** antes de come?ar qualquer uma, validar complexidade estimada pelo PO com `frontend-reviewer`/`db-reviewer`. Se complexidade for L e requerer quebra, criar sub-RFs em `RF_BACKLOG.md` (PO aprova) antes de branches.
- **PO (pr?xima sess?o):** revisar propostas do DM caso ele queira quebrar RFs em sub-RFs. Tamb?m aprovar PR template + label updates j? pendentes.

### Bloqueios / alertas

- **Pend?ncia conhecida:** T-20260417-4 (briefing t?cnico do DM) continua PENDING. RFs foram produzidos SEM esse input, com complexidade como "PO assessment ? DM deve validar". Risco: estimativas podem divergir materialmente do que DM apurar. **Mitiga??o registrada nas tasks:** cada RF explicitamente pede que DM valide complexidade antes de branchar.
- **Pend?ncia herdada:** T-20260412-1 (GitHub Secrets) ? BLOCKED.

### Pr?xima sess?o

**Op??o A** ? Aguardar DM executar T-20260417-5 (commit do PR consolidado) + T-20260417-8 (moves f?sicos) e revisar ambos. Sess?o curta, foco em approve+merge.

**Op??o B** ? Aguardar DM validar complexidade dos RFs e possivelmente propor sub-RFs. Sess?o curta de ratifica??o.

**Op??o C** ? Criar RF-004+ para Gaps P1 (Gap 2 Mobile, Gap 4 Cockpit Owner, Gap 5 Insurance workflow). Prematura antes dos P0 estarem em implementa??o.

**Recomenda??o:** aguardar sinal do DM (ele vai rodar em algum momento). Pr?xima sess?o PO ? reativa ao que o DM reportar.

---

## Sess?o 2026-04-17 ? PO Cowork (parte 4 ? WS-D: Operating Model v2)

**Contexto:** Em continua??o direta ? parte 3, Luigi aceitou recomenda??o A (WS-D). Pr?-requisito declarado (T-20260417-5 mergeada) foi relaxado pragmaticamente ? produzo artefatos localmente e agrupo no PR existente.

### Decis?es oficializadas (escopo "formalizar o que j? existe")

1. **Cad?ncia PO oficial:** ad-hoc permanente, iniciada por Luigi. Reavaliar em 2026-07.
2. **M?tricas operacionais oficiais (NOVAS):** lead time de tarefas (`PENDING ? COMPLETED`, excluindo BLOCKED) + # tarefas BLOCKED por semana.
3. **Rituais oficializados:** rota??o mensal do `dm_queue` (respons?vel: DM, primeiro dia ?til) + revis?o trimestral do HANDOFF_PROTOCOL (PO + DM, mesma semana da revis?o da B?ssola j? em ADR-009).
4. **Rituais N?O adotados (registrado como "futuro poss?vel"):** retrospectiva mensal (contradiz "formalizar"), revis?o anual de ADRs (overhead).
5. **Hierarquia de documentos autoritativos** declarada explicitamente: B?ssola > CLAUDE.md (estrat?gico); HANDOFF_PROTOCOL > OPERATING_MODEL_v2 > AGENTS.md (operacional); ADRs > CLAUDE.md > conven??o (t?cnico).

### Artefatos produzidos (parte 4)

| Artefato | Localiza??o | Status |
|---|---|---|
| Operating Model v2 | `docs/process/OPERATING_MODEL_v2.md` | NOVO (10 se??es) |
| ADR-010 | `docs/decisions/010-operating-model-v2.md` | NOVO |
| docs/README.md atualizado | `docs/README.md` | Patched (linka OPERATING_MODEL_v2 + ADR-010) |
| dm_queue.md atualizado | `.auto-memory/dm_queue.md` | T-5 expandida (+2 arquivos), T-1 ganha regra 18, T-3 ganha refer?ncia ao OPERATING_MODEL |

### Tarefas atualizadas (n?o criadas ? ampliadas) no `dm_queue.md`

- **T-20260417-5** ? agora cobre 11 arquivos novos + 1 root README alterado (em vez de 7+1). Bundle ?nico p?s-WS-D.
- **T-20260417-1** ? patch CLAUDE.md agora adiciona regra 18 (refer?ncia ao OPERATING_MODEL_v2 + ADR-010), al?m das regras 15/16/17.
- **T-20260417-3** ? patch AGENTS.md agora referencia 5 documentos (vs 4 anteriores), incluindo OPERATING_MODEL_v2.

### Handoffs

- **Dev Manager:** consumir `dm_queue.md` na ordem; T-20260417-5 (PR consolidado) agora cobre WS-A + WS-B + WS-C + WS-D em um ?nico PR doc-only.
- **PM Agent:** pr?xima execu??o do scheduled task ? come?ar a reportar lead time de tarefas + # BLOCKED/semana conforme OPERATING_MODEL_v2 ?6.2.

### Bloqueios / alertas

- **Nenhum bloqueio nesta parte.**
- **Pend?ncia herdada:** T-20260412-1 (GitHub Secrets) continua BLOCKED.
- **Depend?ncia registrada:** activation rate (m?trica de produto da B?ssola) requer Gap 8 implementado. Reportada como "N/A ? pendente" no OPERATING_MODEL_v2 ?6.1 at? instrumenta??o chegar.

### Pr?xima sess?o

A sess?o 2026-04-17 (4 partes) entregou todo o pacote de governan?a: B?ssola (estrat?gia) + Handoff Protocol (operacional) + Operating Model v2 (cad?ncia/m?tricas) + reorganiza??o de docs.

**Pr?xima sess?o recomendada:**

| Op??o | Foco | Quando |
|---|---|---|
| **A (recomendado)** ? Sess?o dos Gaps P0 | Converter Gap 1 (landing por persona), Gap 3 (setup wizard), Gap 8 (activation tracking) em RFs formais | Ap?s T-20260417-4 (briefing t?cnico do DM) conclu?da |
| B ? Approve+merge dos PRs do DM | Sess?o curta de revis?o | Quando o DM tiver executado T-20260417-5 + T-20260417-8 |
| C ? Aguardar PM detectar drift | Sess?o reativa, sem pauta agendada | Sem prazo |

**Marco atingido:** o squad SSE agora tem **modelo de governan?a documentado e formalizado** em 3 n?veis (estrat?gia/operacional/processo) com autoridade hier?rquica expl?cita.

---

## Sess?o 2026-04-17 ? PO Cowork (parte 3 ? WS-C: Auditoria e Consolida??o de Documenta??o)

**Contexto:** Em continua??o direta ? parte 2, Luigi optou pela Op??o A (WS-C) executada em sequ?ncia. Discovery de 4 perguntas rodada com todas recomenda??es default aceitas.

### Decis?es de docs

1. **Prompts hist?ricos (5 arquivos)** ? arquivar em `docs/.archive/prompts-historicos/` (n?o deletar ? manter hist?rico). Confirmado obsoletos: `PROMPT_CLAUDE_CODE_20260406.md` descreve "agente ?nico" que foi substitu?do pelo squad em ADR-007.
2. **Prompts de agentes LIVE (5 arquivos)** ? mover para `.claude/agents/` (alinha com ADR-007, source-of-truth ?nica).
3. **Templates de abertura de sess?o** ? consolidados no `HANDOFF_PROTOCOL.md` ?13 (7 templates: PM di?rio, PM semanal, DM feature, DM bug, DM seguran?a, DM coverage, PO Cowork). Arquivo original `SSE_Templates_Sessao_Agentes.md` ser? removido.
4. **Report datado** (`SSE_Post_Migration_Readiness_Report_20260412.md`) ? mover para `docs/audits/`.
5. **README root** ? patch pontual adicionando se??o "Strategy & Governance" com links para B?ssola, CLAUDE.md, Handoff Protocol, ADRs, docs/README.md.

### Artefatos produzidos (parte 3)

| Artefato | Localiza??o | Status |
|---|---|---|
| Handoff Protocol ?13 (7 templates de abertura) | `docs/process/HANDOFF_PROTOCOL.md` | Estendido |
| docs/README.md ? INDEX da pasta | `docs/README.md` | NOVO |
| README.md root ? Strategy & Governance section | `README.md` | Patched |
| Tasks de move f?sico no dm_queue | `.auto-memory/dm_queue.md` | T-20260417-8 adicionada |
| T-20260417-5 atualizada | `.auto-memory/dm_queue.md` | Lista expandida (12 arquivos no PR) |

### Tarefas adicionadas no `dm_queue.md` em WS-C

- **T-20260417-8** (P1) ? Reorganiza??o f?sica de `docs/` (moves + deletes do WS-C)
- **T-20260417-5** atualizada para refletir todos os arquivos das 3 partes

### Handoffs

- **Dev Manager:** consumir `dm_queue.md` na ordem; T-20260417-5 (commit do PR consolidado) e T-20260417-8 (moves f?sicos) s?o os 2 PRs cr?ticos para deixar o repo no estado novo.
- **PM Agent:** pr?xima execu??o do scheduled task ? adotar template can?nico do `HANDOFF_PROTOCOL.md` ?5 e usar ?13.1/?13.2 como prompt-base.

### Decis?es de processo (meta)

Li??es aplicadas nesta sess?o (vindas da mem?ria de feedback do Luigi):
- Tabela comparativa com **condi??o de revers?o** expl?cita em todas as decis?es majorit?rias
- **Escopo negativo expl?cito** ("N?O fazer nesta entrega") em cada task do dm_queue.md
- **Discovery ? 4 perguntas** com recomenda??o clara antes de cada bloco de execu??o
- **Read-back** ap?s cada Write em arquivo cr?tico (verifica??o embutida)

### Bloqueios / alertas

- **Nenhum bloqueio nesta parte**. WS-C executado sem fric??o.
- **Pend?ncia herdada:** T-20260412-1 (GitHub Secrets) continua BLOCKED por a??o humana do Luigi.
- **Alerta processual:** ap?s o DM executar T-20260417-5 e T-20260417-8, o repo ter? 2 PRs grandes. Luigi precisa revisar e aprovar ambos. Recomenda??o: revisar T-20260417-5 primeiro (n?o toca em c?digo nenhum, s? adiciona docs novos), depois T-20260417-8 (faz git mv, mais cuidado).

### Pr?xima sess?o

**Op??o A (recomendado):** WS-D ? Operating Model v2 conforme briefing em `next_sessions_plan.md ?Sess?o N+2`. Estimativa 45?60 min. Pr?-requisito: T-20260417-5 mergeado (para que docs/process/ esteja oficialmente no repo antes de virar refer?ncia num ADR-010).

**Op??o B:** sess?o dedicada aos Gaps P0 da B?ssola (Gap 1 + Gap 3 + Gap 8 ? RFs). Requer T-20260417-4 (briefing t?cnico do DM) conclu?da antes.

**Op??o C:** revis?o dos PRs do DM (T-20260417-5 e T-20260417-8) ? dependendo de quando o DM executar, pode ser sess?o curta de approve+merge.

---

## Sess?o 2026-04-17 ? PO Cowork (parte 2 ? Governan?a e Handoff)

**Contexto:** Em continua??o ? sess?o parte 1 (ado??o da B?ssola), Luigi pediu para (a) atualizar o repo, (b) definir padr?es claros de handoff PM?DM, (c) revisar profundamente a documenta??o, (d) preparar operating model v2. Discovery definiu escopo: formalizar o que j? existe (n?o redesenhar), auditoria completa de docs em sess?o dedicada, timing faseado (WS-B + WS-A agora; WS-C + WS-D em sess?es pr?prias).

### Decis?es de produto / processo

1. **HANDOFF_PROTOCOL v1.0 aceito** ? ownership matrix, 5 lifecycle states, templates can?nicos, cad?ncia, resolu??o de conflito. Arquivo: `docs/process/HANDOFF_PROTOCOL.md`.
2. **Consolida??o das filas DM** ? `dm_task_queue.md` (PM) + `dm_tasks_pending.md` (PO) unificados em `dm_queue.md` ?nico com `Origin` metadata. Arquivos antigos marcados como deprecated com stub redirect.
3. **Task ID format padronizado:** `T-YYYYMMDD-N`.
4. **Archive strategy:** arquivo separado `dm_queue_archive.md`, rota??o mensal.
5. **Lifecycle states:** PENDING | IN_PROGRESS | BLOCKED | COMPLETED (sem CANCELED ? COMPLETED + comment basta).
6. **Plano WS-C + WS-D** delineado: audit de docs primeiro (baixa complexidade, resultado tang?vel), depois operating model v2 (consolida tudo). Briefing em `.auto-memory/next_sessions_plan.md`.

### Artefatos produzidos (parte 2)

| Artefato | Localiza??o |
|---|---|
| Handoff Protocol v1.0 | `docs/process/HANDOFF_PROTOCOL.md` |
| Dev Manager Queue (unificada) | `.auto-memory/dm_queue.md` |
| DM Queue Archive (vazio inicial) | `.auto-memory/dm_queue_archive.md` |
| Briefing das sess?es WS-C e WS-D | `.auto-memory/next_sessions_plan.md` |
| Stubs deprecated | `.auto-memory/dm_task_queue.md`, `.auto-memory/dm_tasks_pending.md` |
| MEMORY.md atualizado | `.auto-memory/MEMORY.md` |

### Tarefas criadas no `dm_queue.md` nesta sess?o

- **T-20260417-1** (P1) ? Patch CLAUDE.md ?10 com regras 15/16/17
- **T-20260417-2** (P2) ? Atualizar `.github/PULL_REQUEST_TEMPLATE.md`
- **T-20260417-3** (P2) ? Atualizar AGENTS.md com B?ssola + Handoff Protocol
- **T-20260417-4** (P1) ? Briefing t?cnico dos Gaps P0 da B?ssola
- **T-20260417-5** (P1) ? Commit dos 7 documentos estrat?gicos/processos ao repo
- **T-20260417-6** (P2) ? Labels GitHub alinhadas com B?ssola
- **T-20260417-7** (P2) ? Issue templates com persona/gap

### Migra??o preservada

Tarefas do PM Agent do arquivo antigo foram migradas com IDs novos e mantidas:
- T-20260412-1 (P0) ? GitHub Secrets (BLOCKED, requer a??o humana)
- T-20260412-2 (P1) ? Fase 2 Frontend Polish (com ALERTA: reavaliar prioridade ap?s B?ssola)
- T-20260412-3 (P1) ? Fechar Fases 1A e 3

### Handoffs

- **Dev Manager:** 10 tarefas em `dm_queue.md` (3 do PM originais + 7 novas do PO). Executar em ordem de prioridade, com aten??o especial ? T-20260417-5 (que leva tudo desta sess?o ao repo via PR).
- **PM Agent:** adotar template can?nico do `HANDOFF_PROTOCOL.md` ?5 na pr?xima 

## Sess?o 2026-05-24 ? PO Cowork

Decisoes:
- RF-009 APROVADO ? Platform Admin: Tenant Lifecycle Management (P1, proxima sprint). Fecha RF Regra-0 da Bussola ?2.5. Condicao de reversao: se PO permanecer em SQL para provisioning alem de 5 tenants ativos, adiar RF-009b e priorizar script auditado.
- RF-010 APROVADO ? Platform Admin: Support Ticket Management (P1, proxima sprint). Canal interno SSE, 3 estados (Open?In Progress?Resolved). Condicao de reversao: se volume >50 tickets/mes antes do RF estar DONE, pivota para GitHub Issues como canal provisorio.
- Bussola bumped para v1.4 (?8 + ?9 atualizados).

Bugs: nenhum | ENH: nenhum | RF/ADR: RF-009, RF-010
Issues criadas: nenhuma (RFs no backlog, aguardam sprint planning com DM)
PRs revisados: nenhum
Bloqueios: T-20260412-1 (deploy API) persiste
Alinhamento Bussola: Persona 0 (Platform Operator, ?2.5) ? gap Regra-0 e suporte operacional
Proxima sessao: sprint planning para validar split RF-009a/009b e RF-010a/010b com DM + ratificar numeracao de migrations 017/018

---



