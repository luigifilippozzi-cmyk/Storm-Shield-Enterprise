---
title: HANDOFF — Dev Manager — T-20260509-2
date: 2026-05-10
for: Dev Manager Agent
origin: PO Cowork (2026-05-09 → 2026-05-10)
---

# 🎯 HANDOFF DM — T-20260509-2

## Tarefa Resumida

**Executar seed Acme em staging para destravar UAT manual**

| Campo | Valor |
|---|---|
| **Task ID** | T-20260509-2 |
| **Priority** | P1 |
| **Status** | PENDING |
| **Estimated Time** | 30–45 min |
| **Bloqueador?** | Sim — UAT manual não pode rodar sem dados |

---

## Contexto

PO entregou 2 roteiros de teste em `docs/audits/`:
- `SSE_Roteiro_Testes_Amigavel_v1_1.docx` — happy path para leigos, ~3h
- `SSE_Tour_Completo_Testes_PO_v1_1.docx` — tour completo 15 módulos para PO, ~6-8h

**Ambos assumem:** tenant Acme com 7 usuários personas + dados demo carregados.

**Status atual:** Seeds existem no código (PRs #68, #69 — MERGED 2026-05-02), mas **não foram executados contra staging**. Sem dados, login dos 7 users falha.

---

## Pré-Condições (Validar Antes)

```bash
# 1. Neon staging DATABASE_URL_UNPOOLED disponível?
echo $DATABASE_URL_UNPOOLED

# 2. Clerk staging CLERK_SECRET_KEY disponível? (não logar no terminal!)
echo "Configurada: $([ -z $CLERK_SECRET_KEY ] && echo 'NAO' || echo 'SIM')"

# 3. NODE_ENV = staging (não production!)
echo $NODE_ENV
```

---

## Passos Executáveis

### 1️⃣ Verificar tenant Acme

```bash
psql $DATABASE_URL_UNPOOLED -c "SELECT id, slug, schema_name, status FROM public.tenants WHERE slug='acme';"
```

**Esperado:** Uma linha com `acme | schema_name=tenant_<uuid>`

**Se retornar vazio:** Provisionar antes
```bash
pnpm --filter api tenant:create acme "Acme Auto Body, LLC"
```

### 2️⃣ Rodar seed personas

```bash
pnpm --filter api seed:run -- --tenant=acme --type=personas
```

**Esperado na saída:**
```
Creating 7 Clerk users (owner, admin, manager, estimator, technician, accountant, viewer)...
Done. 7 Clerk users + role assignments created.
```

### 3️⃣ Rodar seed demo-data

```bash
pnpm --filter api seed:run -- --tenant=acme --type=demo-data
```

**Esperado na saída:**
```
Seeding Acme demo data: 15 customers, 18 vehicles, 12 estimates, 5 service orders...
Done.
```

### 4️⃣ Validar contagens (substituir `<acme-uuid>` pelo schema real)

```bash
# Descobrir UUID
ACME_UUID=$(psql $DATABASE_URL_UNPOOLED -t -c "SELECT id FROM public.tenants WHERE slug='acme';" | tr -d ' ')

# Validar contagens
psql $DATABASE_URL_UNPOOLED <<EOF
SELECT COUNT(*) AS customers FROM tenant_${ACME_UUID}.customers;
SELECT COUNT(*) AS vehicles FROM tenant_${ACME_UUID}.vehicles;
SELECT COUNT(*) AS estimates FROM tenant_${ACME_UUID}.estimates;
SELECT COUNT(*) AS service_orders FROM tenant_${ACME_UUID}.service_orders;
SELECT COUNT(*) AS journal_entries FROM tenant_${ACME_UUID}.journal_entries;
SELECT COUNT(*) AS fixed_assets FROM tenant_${ACME_UUID}.fixed_assets;
EOF
```

**Esperado:**
- customers: **15**
- vehicles: **18**
- estimates: **12**
- service_orders: **5**
- journal_entries: **3+** (alguns)
- fixed_assets: **1+** (pelo menos um)

### 5️⃣ Validar Clerk Dashboard

Abrir [Clerk Dashboard staging](https://dashboard.clerk.com) → Applications → SSE Staging → Users

**Esperado:** 7 usuários com emails `*@acme.sse-demo.test`:
- `owner@acme.sse-demo.test`
- `admin@acme.sse-demo.test`
- `manager@acme.sse-demo.test`
- `estimator@acme.sse-demo.test`
- `technician@acme.sse-demo.test`
- `accountant@acme.sse-demo.test`
- `viewer@acme.sse-demo.test`

Verificar `publicMetadata.tenantId` e `privateMetadata.role` preenchidos.

### 6️⃣ Testar login (final validation)

Abrir `https://sse-web-staging.vercel.app`

**Esperado:** 
- Página `/auth/signin` carrega
- Login com `owner@acme.sse-demo.test` + password `DemoPass!2026` bem-sucedido
- Redireciona para `/dashboard` com cockpit visível
- Dados Acme visíveis (customers, estimates, etc.)

---

## Critérios de Aceite (6)

- [ ] `SELECT COUNT(*) FROM tenant_<acme>.customers` = **15**
- [ ] `SELECT COUNT(*) FROM tenant_<acme>.vehicles` = **18**
- [ ] `SELECT COUNT(*) FROM tenant_<acme>.estimates` = **12**
- [ ] `SELECT COUNT(*) FROM tenant_<acme>.service_orders` = **5**
- [ ] 7 Clerk users visíveis no Dashboard com metadata correto
- [ ] Login bem-sucedido + dashboard carrega dados Acme

---

## Escopo Negativo (O QUE NÃO FAZER)

- ❌ Rodar seed em **produção** — apenas staging
- ❌ Commitar secrets no repo
- ❌ Modificar código dos seeds (`acme-personas.seed.ts`, `acme-demo-data.seed.ts`)
- ❌ Criar tenants adicionais
- ❌ Editar dados pós-seed (quebra idempotência)

---

## Done Quando

1. ✅ 6 critérios de aceite acima satisfeitos
2. ✅ Mover task de PENDING → COMPLETED em `.auto-memory/dm_queue.md`
3. ✅ Adicionar linha em `project_sse_status.md` registrando seed + data
4. ✅ Notificar PO: "T-20260509-2 COMPLETED — UAT manual desbloqueada"

---

## Dependências & Bloqueadores

**Bloqueia:** UAT manual (PR #77 + Vercel env var já OK conforme validação PO 2026-05-09)

**Independente de:**
- T-20260509-1 (Tenants module CRUD — separate task P2)
- T-20260506-1 (Secrets security fix — separate task P1)

---

## Referências

- **Arquivo principal:** `.auto-memory/dm_queue.md` (topo)
- **Seeds no código:** 
  - `apps/api/src/database/seeds/acme-personas.seed.ts`
  - `apps/api/src/database/seeds/acme-demo-data.seed.ts`
- **Roteiros UAT:**
  - `docs/audits/SSE_Roteiro_Testes_Amigavel_v1_1.docx`
  - `docs/audits/SSE_Tour_Completo_Testes_PO_v1_1.docx`
- **Protocolo:** `docs/process/HANDOFF_PROTOCOL.md` §4 (template) + §7 (ciclo de vida)

---

## Perguntas Frequentes (DM)

**P: Posso rodar em paralelo com T-20260509-1 ou T-20260506-1?**  
R: Sim, são totalmente independentes. Rodar T-20260509-2 não afeta os outros.

**P: E se o tenant Acme já existir com dados antigos?**  
R: Seeds são idempotentes — rerun atualiza sem duplicar. Safe to rerun.

**P: Preciso fazer deploy depois?**  
R: Não. É operação de dados em staging (Neon). Web e API staging já estão deployados.

**P: Quanto tempo leva?**  
R: ~30–45 min (seed + validações + teste manual).

---

**Pronto para consumo DM. Boa sorte!** 🚀
