# Análise Comparativa: NS vs. Bússola SSE — v1

> **Nota:** Neste documento, "NS" refere-se a um ERP proprietário de terceiros usado exclusivamente como referência comparativa externa, sem relação comercial, licenciamento ou endosso. O nome da marca foi substituído por precaução (ver ADR-014).

> **Propósito:** Confrontar as melhores práticas documentadas do NS (referência de arquitetura, funcionalidade e navegabilidade) com a Bússola de Produto SSE, para identificar gaps, reforçar decisões existentes e propor ajustes de priorização.
> **Autor:** PO Assistant (Cowork) — sob direção de Luigi (PO)
> **Data:** 2026-04-21
> **Status:** ACCEPTED via ADR-012 (2026-04-21). Artefato vivo — manutenção governada por T-20260421-1 em `.auto-memory/dm_queue.md`. Próxima revisão trimestral da Bússola: 2026-07 (ADR-010 §4).
> **Natureza:** Antes PROPOSTA — agora autoritativo. Ajustes incorporados à Bússola v1.1 + 4 RFs APPROVED em `RF_BACKLOG.md` v0.2 + 4 tasks DM em `dm_queue.md` (T-20260421-2/3/4/5).
> **Changelog Bússola:** v1.1 (2026-04-21) via ADR-012 — §5 expandido (descopes + 1099-NEC + MACRS), P8 offline-first adicionado, 4 RFs aprovados (RF-004/005/006/007). v1.2 (2026-04-22) via ADR-013 — §6 reorganizado em §6.1 (P1–P8) / §6.2 (PV1–PV6) / §6.3 (PUX1–PUX6), princípios de valor e UX adotados.
> **Status RFs (2026-04-23):** RF-001 ✓ DONE (PR #31) | RF-002 ✓ DONE (PR #37) | RF-003 ✓ DONE (PR #33) | RF-004 ✓ DONE (PR #44) | RF-005 ✓ DONE (PRs #48/#49/#50/#52) | RF-006 ✓ DONE (PR #51) | RF-007 ✓ DONE (PR #56). **Todos os 7 RFs aprovados CONCLUÍDOS.** Gatilho #1 disparado — DM sync 2026-04-23.
> **Base NS:** `docs.oracle.com/en/cloud/saas/NS/ns-online-help/` — consultada via WebSearch em 2026-04-21 (allowlist bloqueou fetch direto).

---

## Sumário Executivo

Navegar a doc do NS **valida a direção da Bússola** em praticamente todos os pontos estratégicos e **revela 4 padrões concretos** que o SSE pode adotar sem violar o posicionamento "simpler + cheaper + purpose-built". Não surgiu nenhuma ameaça que exija reescopo amplo.

Síntese em 6 pontos:

1. **Centers (NS) = Workspaces por persona (Bússola §7)** — RF-001 segue padrão de indústria. Reduz risco de adoção. Nenhuma mudança de rumo.
2. **FSM Mobile valida Gap 2 como P1** — NS entrega mobile offline nativo para field service; é a referência que o mercado conhece. Manter Gap 2 em 90–120 dias reduz risco competitivo.
3. **Customer 360 é o primeiro padrão concreto a adotar** — tela unificada com abas (Overview, Estimates, Orders, Receivables, Activities, History) substitui a navegação fragmentada atual. **Proposta: RF-004.**
4. **Payment Hold + In-Transit Payments são conceitos financeiros que SSE deveria adotar** — o primeiro aplicado a supplements disputados com adjuster; o segundo para tornar a KPI "Cash disponível" do Cockpit honesta. **Propostas: RF-006 e ajuste no Gap 4.**
5. **Confirmações onde SSE já é mais estratégico que NS:** activation tracking instrumentado (RF-003), 1099-NEC nativo (Fase 4), onboarding wizard <30 min (RF-002), MACRS nativo (FAM). Nenhum ajuste; reforçar narrativa comercial.
6. **Reforços a Bússola §5 (onde simplificamos):** 4 áreas onde NS tem features avançadas que explicitamente NÃO entram no SSE — SuiteBilling, OneWorld/multi-subsidiary, SuiteFlow (workflow designer), Dashboard drag-and-drop. Documentar como descope deliberado evita debate recorrente.

**Impacto na priorização atual:** nenhuma mudança P0/P1. 4 novos RFs propostos (RF-004 a RF-007) com prioridade P1–P2 entrando no horizonte 60–120 dias, **depois** de RF-001/002 e do Cockpit do Owner. Roadmap do CLAUDE.md por Fases segue válido; Bússola §8 recebe 3 adições pontuais.

---

## 1. Metodologia

### O que foi consultado

Áreas da doc NS exploradas (conforme recorte definido na abertura desta sessão):

| Área | Tópicos consultados |
|---|---|
| **Core ERP** | Chart of Accounts, Journal Entries, Accounting Periods, Financial Reports, AP/AR, Bank Reconciliation, Vendor Payments, Sales Tax, 1099 |
| **Fixed Assets Management** | Depreciation methods, Asset categories, Asset disposal, Tax depreciation conventions |
| **CRM** | Customer 360, Lead Management, Case Management, Support |
| **Work Orders / Service** | Field Service Management, Work Order lifecycle, Track Service Time, FSM Mobile |
| **UX / Navigation** | Role-based Centers, Dashboard Portlets (KPI, Meter, Scorecard, Trend), Saved Searches, Global Search, Shortcuts, Keyboard Shortcuts |
| **Mobile** | NS for Mobile (iOS/Android), Offline, My Dashboard, My Approvals |
| **SaaS / Billing** | SuiteBilling, Subscription lifecycle, Revenue Recognition (consulta de contexto, não adoção) |
| **Governança** | Workflow automation (SuiteFlow), Approval Routing, Custom Segments, Classifications (Dept/Class/Location), Subsidiaries |

### Filtro aplicado

Cada padrão NS foi classificado contra os Princípios P1–P7 da Bússola §6 e contra os filtros de §5 (Simplificamos / Herdamos / Superamos). Um padrão entra na lista de sugestões **apenas** se:

- Serve uma das 4 personas primárias (§2) **OU** fecha um Gap crítico (§4), **E**
- Passa no teste "body shop médio de 5–15 func usa isso?" (P7), **E**
- Não viola a simplicidade radical (§1).

### Limitação conhecida

A doc oficial do NS ficou bloqueada pela allowlist de egress da Cowork para fetch direto; a consulta foi feita via WebSearch restrito a `docs.oracle.com`, o que devolve trechos curtos de cada página. Para as 11 áreas consultadas, os trechos foram suficientes para reconhecer padrões de alto nível, mas **não** para auditar detalhes finos (ex: exato data model de um objeto, todas as opções de um workflow). Onde necessário, a análise adota hipóteses explicitadas com "**[Assumption]**".

---

## 2. Mapeamento área por área

Para cada área, a tabela mostra: (a) o que o NS faz, (b) o estado atual do SSE, (c) diagnóstico contra a Bússola, (d) recomendação.

### 2.1 Chart of Accounts e General Ledger

| Dimensão | NS | SSE (hoje) | Diagnóstico | Recomendação |
|---|---|---|---|---|
| Estrutura de contas | 15+ tipos (AR, AP, Bank, CC, Fixed Asset, COGS, Income, Expense, Deferred Revenue, etc.) | 9 tipos US GAAP (ADR-003) alinhados com modelo body shop | OK — cobrimos o essencial do ICP | Manter. Não expandir para multi-subsidiary/multi-book. |
| Import do COA | CSV Import Assistant no primeiro setup | Seed fixo no provisioning (`chart_of_accounts.seed.ts`) | Simplificação deliberada — dono não monta COA, herda | Manter. **Reforçar em §5:** "COA fixo como padrão, não import self-service." |
| Account numbering | Custom por tenant | Fixo 1000–9999 seguindo US GAAP | Trade-off aceito | Manter. ICP não customiza COA; contador externo aceita padrão. |
| Deferred revenue / expense | Full advanced rev rec (ARM) | Ausente | Anti-target — SaaS billing complexo não é nosso jogo | **Explicitar em §5:** "Revenue recognition avançada fica de fora (plano enterprise via integração contador)." |

**Sem ação imediata.** O GL do SSE é adequado ao ICP. Qualquer expansão (deferred revenue, multi-currency, multi-book) é violação direta de P7.

### 2.2 Journal Entries e Fiscal Periods

| Dimensão | NS | SSE (hoje) | Diagnóstico | Recomendação |
|---|---|---|---|---|
| Manual JE | Sim, com balanced D/C enforcement | Sim (migration 008) | Paridade funcional | OK |
| Reversing entries | Suportado | **[Assumption]** parcial/ausente | Item contábil padrão — accountant espera | **Sugestão:** confirmar com Dev Manager se JE reversing existe; se não, ENH pequena Fase 3. |
| Recurring JE | Suportado (templates) | Ausente | Usado para rent, insurance, depreciação mensal | Depreciação mensal já está no backlog (cron job). Outros recurring JE → ENH pós Fase 3. |
| Accounting Period status | Open / Closed / Locked | **[Assumption]** Open/Closed binário | NS tem 3 status; SSE tem 2 conforme ADR-003 | Manter 2 status. Locked é overhead sem valor para ICP. |
| Adjusting entries no período fechado | Exige reabrir ou JE no período seguinte | **[Assumption]** comportamento similar | OK | Documentar no Accountant Portal (Fase 4) a política. |

**Ação pequena:** confirmar com DM existência de reversing JE; se ausente, abrir ENH P2 com label `fase-3-accounting`.

### 2.3 Fixed Assets Management

| Dimensão | NS | SSE (hoje) | Diagnóstico | Recomendação |
|---|---|---|---|---|
| Métodos de depreciação | SL, Fixed Declining, SYD, Asset Usage, Units-of-Production, Units of Time, user-defined | SL + MACRS (implementados); DB/SYD/UOP documentados (ADR-008) | SSE **tem MACRS nativo** — NS usa alternate tax methods separados | **Manter Gap 6 como descope formal:** ADR para mover DB/SYD/UOP para plano `enterprise`. Reforçar que MACRS é diferencial. |
| Asset categories com defaults | Sim (useful life, salvage, method por categoria) | 6 categorias seed (ADR-008) | Paridade | OK |
| Asset disposal (sale / write-off) | Suportado com auto-JE | Suportado (ADR-008) | Paridade funcional | OK |
| Tax conventions (Half Year, Mid-Quarter) | Suportado | **[Assumption]** não implementado | MACRS do IRS **exige** Half Year convention para a maioria dos assets | **Validar com DM:** se não há Half Year convention implementado, é gap de compliance IRS. Se há, documentar em ADR-008 como fechado. |
| Batch depreciation | Mensal | Batch execution (ADR-008) | Paridade | OK |
| Alternate methods por book (GAAP vs Tax) | Multi-book | USD/US GAAP só | Anti-target | Manter simples. |

**Ação:** abrir ENH confirmando status de Half Year convention (MACRS). Se ausente, é P1 compliance. Se presente, ADR-008 deve mencionar explicitamente.

### 2.4 Accounts Payable / Vendor Bills / Bank Reconciliation

| Dimensão | NS | SSE (hoje) | Diagnóstico | Recomendação |
|---|---|---|---|---|
| Vendor bills (AP) | Full workflow: enter → approve → pay | Básico via `financial_transactions` | Gap — AP formal não está no Fase 1 | **Fase 2 ou Fase 3**. Hoje shop lança "expense" sem rastrear bill vs payment. Aceitável para ICP 5-15 func? **Validar com Luigi.** |
| **Payment Hold em disputed bills** | Flag no bill que bloqueia pagamento | Ausente | **Padrão valioso** para supplements em disputa com adjuster | **Proposta: RF-006** (ver §5). |
| Pay bills batch (múltiplos vendors) | Sim | Ausente | Body shop pequeno paga 5–10 bills/mês — batch é conveniência | P2 — ENH quando AP formal entrar |
| Bank data matching (Intelligent) | Sim, ML-based | Planejado Fase 2 (Plaid) | Plaid já está no roadmap | Manter Fase 2. Não implementar ML matching no SSE — violação de P7. Regra simples "match by amount + date ±3 dias" basta. |
| **In-Transit Payments** | Distingue standard balance vs available balance | Ausente | **Relevante para KPI "Cash disponível" do Cockpit (Gap 4)** — sem isso, a KPI mente durante float | **Ajuste no RF do Cockpit** (ver §5). |
| Manual match / exceptions | UI lado-a-lado | Planejado Fase 2 | OK | Manter |

**Ação imediata:** incorporar conceito de "available balance" na especificação do Cockpit (Gap 4) antes de redigir o RF de Cockpit.

### 2.5 Sales Tax + 1099

| Dimensão | NS | SSE (hoje) | Diagnóstico | Recomendação |
|---|---|---|---|---|
| Sales Tax | SuiteTax Engine (multi-state, multi-jurisdiction) | Planejado Fase 4 (Missouri primeiro) | Escala gradual aceitável | Manter. Reforçar que **auto repair services são geralmente isentos de sales tax na maioria dos estados** — escopo é só parts/materials. Confirmar com contador. |
| 1099-MISC/NEC | **NS NÃO gera 1099** — usa Yearli, Sovos, Track1099 | **SSE vai gerar nativo** (planejado Fase 4) | **Diferencial vs. NS** | Manter. Adicionar em §5 da Bússola como "Superamos". |
| Tax agency setup | Multi-agency complexo | Missouri-first (estado), expandir | OK | Manter |
| Sales tax por item | Por SKU | Por tipo de item (parts vs labor) | Simplificação aceitável | Documentar em ADR futuro quando Fase 4 começar |

**Ação:** atualizar §5 da Bússola — "1099-NEC nativo" vai para coluna "Superamos", não "Herdamos".

### 2.6 CRM (Customer)

Esta é a **área com gap concreto mais relevante** da análise.

| Dimensão | NS | SSE (hoje) | Diagnóstico | Recomendação |
|---|---|---|---|---|
| **Customer 360 View** | Página unificada com abas: Overview, Opportunities & Estimates, Orders & Returns, Receivables, Activities (Cases, Emails, Notes) | Páginas fragmentadas (customer detail, estimate list filtrada, etc.) | **Gap de padrão** — fricção para Estimator e Owner | **Proposta: RF-004 Customer 360** (ver §5) |
| "See Customer History" | Link consolidando transactions + interactions + communications | **[Assumption]** não existe ou está disperso | Quick-win de UX | Parte do RF-004 |
| Lead management | Lead → Prospect → Customer (pipeline) | Customer único state | Body shop não tem "lead" real — walk-in ou insurance referral | Manter simples. **Não** adotar pipeline lead formal. |
| Case management (tickets) | Types, origins, rules, territories, auto-assignment | Ausente | **Gap parcial** — supplements com adjuster + complaints do customer = caso | **Proposta: RF-007 Disputed Claim / Complaint Case** (ver §5) |
| Contact management (pessoas ≠ empresas) | Contact entity separado do Customer | **[Assumption]** Customer representa a pessoa (B2C shop) | OK para B2C; para B2B insurance (adjuster é contato da insurance company) já existe `insurance_contacts` | Manter. **Reforço em §5:** "Contact management simplificado — insurance contacts são a exceção." |

**Ação:** RF-004 é a proposta mais importante deste relatório. Detalhada em §5.

### 2.7 Work Orders / Service Orders / Field Service

| Dimensão | NS | SSE (hoje) | Diagnóstico | Recomendação |
|---|---|---|---|---|
| Work Order lifecycle | Create → Assign → In Progress → Complete | `service_orders` com status workflow similar | Paridade conceitual | OK — validar que status transitions estão documentados |
| **Track Service Time (start/end auto-gera time bill)** | Mobile: tap start / tap stop / time bill created | `so_time_entries` | **[Assumption]** exige entrada manual hoje | Alinhar com Gap 2 — timer mobile que gera `so_time_entry` automaticamente. Já está implícito no RF futuro de Mobile PWA. **Explicitar na spec.** |
| **FSM Mobile — offline** | Sim, sync quando online | Planejado mas offline não está explícito | **Crítico para shop floor** (WiFi ruim em oficina) | **Adicionar requisito de offline-first ao RF futuro de Mobile Technician** (Gap 2). Pode virar princípio P8 da Bússola. |
| FSM Mobile — customer/asset history acesso | Técnico vê histórico do veículo na SO | Parcialmente — via vehicle relationship | Alinha com Gap 2 | Especificar no RF: "técnico vê fotos anteriores + SOs passadas do mesmo veículo direto na tela da SO atual" |
| Scheduler / dispatch | Scheduler recebe live updates | **[Assumption]** SSE não tem dispatcher role dedicado | Body shop 5–15 func não tem dispatcher — owner ou estimator faz | Manter. Não introduzir dispatcher role. |
| Spare parts / van inventory | Rastreado em tempo real | `so_parts_used` existe | Paridade conceitual para shop fixo (não van) | OK — SSE não faz mobile van inventory. ICP é shop-based. |

**Ação:** quando redigir o RF de Mobile PWA Technician (Gap 2, P1 futuro), incorporar explicitamente: (a) offline-first com sync queue, (b) timer auto-cria time entry, (c) acesso ao histórico do veículo na tela da SO.

### 2.8 Navegação / Dashboards / UX

| Dimensão | NS | SSE (hoje) | Diagnóstico | Recomendação |
|---|---|---|---|---|
| **Role-based Centers** (tabbed pages por role) | Sim — standard e customizável | RF-001 em spec (PROPOSED) | **Validação:** NS faz igual — nosso approach é industry-standard, não experimento | Manter RF-001. Usar "Center" ou "Workspace" — **decisão de nomenclatura** (ver §7). |
| **Home page determinada pelo role** | Sim, com fallback por último usado | RF-001 RN3 especifica redirect por role | Paridade | Manter |
| Dashboard Portlets (KPI/Meter/Scorecard/Trend) | 4 tipos de portlet nativos | Dashboard atual é página custom | NS é flexível, SSE é purpose-built | **Manter simplicidade.** §5 da Bússola já simplifica self-service reporting. **Adicionar: "Portlets configuráveis pelo user ficam de fora — KPIs fixos por persona."** |
| Saved Searches as Custom KPIs | Poderoso — usuário cria KPI próprio | Ausente | Violação direta de P7 | **Explicitar em §5** — "saved searches / custom KPIs ficam de fora; relatórios canônicos fixos" |
| **Global Search (Alt+G / Cmd+K)** | Sim | Mencionado em §7 da Bússola, não implementado | **Padrão esperado** | Validar com DM se está planejado. Se não, **ENH P1** — é fricção baixa/alto valor. |
| Navigation Portlet / Shortcuts | Sim, customizáveis | Sidebar fixa por workspace (RF-001) | Simplicidade do SSE é deliberada | Manter. User não customiza sidebar. |
| Keyboard Shortcuts | Mapeamento extenso | **[Assumption]** ausente | Low priority para body shop tech comfort médio-baixo | P3 — não virar RF. |

**Ações:** (a) atualizar §5 da Bússola com "portlets/saved searches de fora"; (b) validar existência de Global Search no SSE.

### 2.9 Mobile

| Dimensão | NS | SSE (hoje) | Diagnóstico | Recomendação |
|---|---|---|---|---|
| Native app iOS/Android | Sim, free stores | Planejado Fase 5 via React Native | Bússola já propõe PWA web responsiva em Fase 2 (Gap 2) | **Manter** proposta Bússola — PWA entrega 80% do valor em 20% do custo. Native app de Fase 5 é opcional. |
| Offline | Sim | Não especificado | **Gap de especificação** no Gap 2 | Adicionar ao RF futuro |
| My Dashboard mobile | Native mobile-only portlets | Parte do RF-001 (technician workspace em mobile) | Alinha | OK |
| My Approvals mobile | Sim | Sem approval flow (simplificação deliberada §5) | OK | Manter |
| Role change on mobile | Sim | RF-001 workspace switcher deve funcionar em mobile | Implícito — validar | Documentar explicitamente |

**Ação:** quando redigir RF futuro de Mobile PWA Technician, exigir offline sync e role switcher responsivo.

### 2.10 Workflow / Approvals (Área onde SIMPLIFICAMOS)

| Dimensão | NS | SSE (hoje) | Diagnóstico |
|---|---|---|---|
| SuiteFlow (visual workflow designer) | Sim, BPMN-ish | Ausente | **Consciente** — Bússola §5 simplifica |
| Approval routing | Multi-nível, conditional, non-sequential | Ausente | **Consciente** — §5 já trata |
| Custom workflow fields | Full customization | Ausente | Violaria P7 |
| Email automation baseada em workflow | Sim | n8n workflows pré-definidos | Nossa substituição (§5) |

**Ação:** nenhuma. §5 da Bússola já cobre estas decisões. **Reforçar na Bússola:** SuiteFlow / workflow designer ficam de fora explicitamente (hoje não está enumerado).

### 2.11 Classifications (Dept/Class/Location) + Subsidiaries + Custom Segments

| Dimensão | NS | SSE (hoje) | Diagnóstico | Recomendação |
|---|---|---|---|---|
| Departments | Sim | Ausente | Body shop 5–15 func não tem departamentos. ICP não usa | Não implementar |
| Classes | Sim (cost classification) | Ausente | Substituído pelo tipo de conta | Não implementar |
| Locations | Sim (multi-localização) | 1 location por tenant implícito | **Anti-target Bússola §1** — rede multi-filial | Não implementar |
| **Subsidiaries (OneWorld)** | Sim | Ausente | **Anti-target Bússola §1** | Não implementar |
| Custom Segments | Sim | Ausente | Overhead sem valor para ICP | Não implementar |

**Ação:** adicionar linha em §5 da Bússola: "Classifications/Subsidiaries/Custom Segments — anti-target explícito. Tenant = 1 shop = 1 location."

### 2.12 SuiteBilling / Subscription (contexto SaaS interno do SSE, não feature para cliente)

**NS:** suporta múltiplos planos por billing account, charges (recurring/one-time/usage), revenue recognition por subscription line, lifecycle Draft → Pending Activation → Active.

**SSE:** atualmente usa Clerk + Stripe simples (4 planos free/starter/pro/enterprise com PlanGuard + resource limits). Não há recurring revenue recognition, não há usage billing.

**Diagnóstico:** para um SaaS com 500+ tenants target, o modelo atual é **suficiente para Fase 1–3**. SuiteBilling é referência para quando chegarmos a 1000+ tenants com usage-based billing, mas isso é Fase 7+ e depende de tração.

**Recomendação:** não incluir no roadmap. Documentar como "sistema interno de billing pode evoluir para usage-based após 1000 tenants ativos — decisão futura".

---

## 3. Reforços à Bússola (o que a análise confirma)

Nenhuma destas decisões muda, mas ganham suporte objetivo:

1. **§1 Posicionamento simpler + cheaper + purpose-built** — validado em cada área. NS oferece features que ICP body shop não usa (OneWorld, SuiteBilling, SuiteFlow, Saved Search KPIs). Descope continua certo.
2. **§2 4 Personas primárias** — NS usa Centers por role; mesmo padrão. Validação de indústria.
3. **§4 Gap 1 (Landing por persona)** — NS Centers é exatamente o padrão. Reduz risco de RF-001.
4. **§4 Gap 2 (Mobile Technician)** — FSM Mobile com offline é **referência concreta do mercado**. Sem isso, SSE não compete em mobility.
5. **§4 Gap 3 (Onboarding wizard)** — **NS NÃO tem wizard de tenant setup** (implementação é feita por parceiro/consultor em semanas). Wizard <30 min é diferencial forte.
6. **§4 Gap 8 (Activation tracking)** — NS tem dashboards pós-implementação; não vi "activation rate" como métrica padrão. Diferencial SSE.
7. **§5 Onde simplificamos** — aumenta a lista (ver §4 deste documento).
8. **§6 Princípios P1–P7** — nenhum desafiado.
9. **§7 Arquitetura de navegação** — Centers do NS = Workspaces do SSE. Mesmo padrão.
10. **§8 Ordem de ataque** — nenhum re-arranjo nas prioridades P0/P1 atuais.

---

## 4. Atualizações sugeridas na Bússola (não aplicadas)

Estas são **sugestões** para o PO incorporar via sessão de revisão da Bússola (ver §4 do ADR-010 — revisão trimestral). Cada uma vem com racional curto.

### 4.1 Expansão de §5 — Onde simplificamos (adicionar linhas)

| Dimensão | NS faz | SSE faz | Racional |
|---|---|---|---|
| **Custom Segments / Classifications** | Departments, Classes, Locations, Custom Segments | Nenhum — tenant = 1 shop = 1 location | Violação direta de P7. Anti-target §1. |
| **SuiteFlow / Workflow Designer** | BPMN visual builder | n8n workflows pré-definidos | Body shop não modela BPM. Pré-definido é o certo (já aludido, mas não explícito). |
| **Saved Searches / Custom KPIs** | User monta query → vira KPI | Relatórios canônicos fixos (4: P&L, BS, TB, Depreciation Schedule) + KPIs fixos por persona | Self-service reporting exige training + cria dívida de suporte. ICP não usa. |
| **OneWorld / Subsidiaries** | Multi-entity consolidado | 1 tenant = 1 empresa | Anti-target §1 (rede multi-filial). |
| **SuiteBilling / Usage billing** | Recurring + one-time + usage + overage | Plano fixo mensal (Stripe simples) | Fase 7+. Atualizar quando houver 1000+ tenants. |
| **Payment Holds genérico** | Flag em qualquer bill disputed | Específico para supplements em disputa (ver RF-006) | Adotamos o padrão no **caso de uso relevante**, não como feature genérica. |

### 4.2 Adição em §5 — Onde superamos (mover item)

Mover **"1099-NEC nativo"** da seção "Herdamos" para "Superamos":

> **1099-NEC nativo** | NS **não gera 1099** — depende de integradores externos (Yearli, Sovos, Track1099). SSE gera nativamente por ser essencial ao ICP (contractors 1099 são operação padrão do shop).

E adicionar:

> **MACRS nativo** | NS trata MACRS como "alternate tax method" separado. SSE tem MACRS nativo em FAM (ADR-008) porque é requisito IRS para veículos do shop — feature essencial ao ICP, não extensão.

### 4.3 Adição em §6 — Princípios (proposta de P8)

> **P8 — Offline-first para shop floor.** Técnico não pode perder trabalho quando WiFi cai. Operações críticas do mobile (timer, fotos, SO status) funcionam offline e sincronizam quando reconectar. Desktop pode assumir online; mobile do técnico não.

Racional: gap concreto identificado na análise NS FSM Mobile. Body shop tem WiFi ruim tipicamente. Sem offline, mobile do técnico vira "ferramenta que só funciona no escritório" — contradiz P2.

### 4.4 Expansão de §7 — Navegação

Adicionar nota de decisão:

> **Nomenclatura:** adotamos o termo **"Workspace"** (não "Center" como NS) para não importar jargão NS para o SSE. Workspace é autodescritivo em EN e PT-BR.

E adicionar à "Regras":

> **Global Search (Cmd/Ctrl+K)** é **obrigatório** em todos os workspaces. User acessa qualquer entidade (customer, vehicle, estimate, SO) digitando parte do nome/número sem navegar menu. Se não existir hoje, é ENH P1 independente dos outros RFs.

### 4.5 Adição em §8 — Ordem de ataque

Adicionar 4 linhas ao final:

| Prioridade | Horizonte | Itens | Gaps resolvidos | Justificativa |
|---|---|---|---|---|
| **P1** | 60–90 dias | **RF-004 Customer 360** (tela unificada) | Fecha fricção CRM — não está nos 8 gaps originais, mas é 90% dos cliques do Estimator | NS tem como padrão. Reduz tempo médio para abrir estimate. |
| **P1** | 60–90 dias | **RF-006 Payment Hold em Estimates disputados** | Complementa Gap 5 (Insurance workflow) | Estimator precisa "congelar" SO quando supplement está em disputa. |
| **P2** | 90–120 dias | **RF-007 Case Management simplificado** | Parcial em Gap 5 | Customer complaint + supplement dispute viram cases rastreáveis. Não é feature massiva, é estrutura de dados. |
| **P1** | Concorrente ao Cockpit | Ajuste RF do Cockpit: **incluir Available Balance distinct from Cash** | Refina Gap 4 | Sem isso, KPI "Cash disponível" é enganoso durante float bancário. |

---

## 5. Novos RFs propostos (rascunho resumido)

Cada RF abaixo segue o template oficial do arquivo `RF_BACKLOG.md`. Quando PO aprovar, eu abro cada um como seção nova no backlog via handoff DM.

### RF-004 — Customer 360 View

**Gap fechado:** fricção CRM (novo gap, não nos 8 originais — candidato a entrar como Gap 9 ou ficar como RF orientado a UX).
**Persona primária:** Estimator; secundária: Owner, Accountant.
**Princípio:** P1 (landing por persona) aplicado a detalhe de entidade.
**Prioridade:** P1, Fase 2.

**Descrição:** ao clicar em um customer, exibir página unificada com abas:
1. **Overview** (foto de identificação, contatos, balance, última atividade)
2. **Vehicles** (lista de veículos + foto thumbnail)
3. **Estimates** (todos, com status badges)
4. **Service Orders** (todas, com status e total)
5. **Payments & Receivables** (pagos + em aberto, insurance vs out-of-pocket split)
6. **Activity** (timeline de interactions + consent events + communications)
7. **Documents** (docs anexados via StorageService)

Substitui a navegação atual "ir para customer → clicar → voltar → filtrar estimates por customer".

**Regras de negócio chave:**
- Abas renderizam via tabs (shadcn Tabs component). Default Overview.
- Quick actions no header da página: "Novo Estimate", "Nova SO", "Add Note"
- Balance e receivables calculados via query agregada (não cacheada — real-time).
- Activity timeline faz merge de: estimate_status_changes + so_status_history + customer_interactions + notifications enviadas.

**Complexidade:** L. Frontend pesado (7 abas), backend é maioria reuso de endpoints existentes + 1 ou 2 endpoints agregadores.

---

### RF-005 — Estimate State Machine + Inbox do Estimator

**Gap fechado:** Gap 5 (Insurance workflow subdesenvolvido).
**Persona primária:** Estimator.
**Princípio:** P5 (insurance-first).
**Prioridade:** P1, Fase 2.

(Este RF já estava previsto em Bússola §8 como "RF futuro — Insurance workflow visual". Apenas formaliza.)

**Descrição:** implementar state machine explícita em `estimates.status`:

```
draft → submitted_to_adjuster → awaiting_approval → approved → supplement_pending → approved_with_supplement → paid → closed
                                        ↓                              ↓
                                      rejected                       disputed (novo — ver RF-006)
```

Inbox do Estimator (`/app/estimates/inbox`, conforme RF-001) mostra kanban/tabela com colunas por estado.

---

### RF-006 — Payment Hold / Disputed Estimate

**Gap fechado:** complementa Gap 5. Inspiração: NS Payment Hold.
**Persona primária:** Estimator.
**Princípio:** P5.
**Prioridade:** P1, Fase 2.

**Descrição:** estado `disputed` adicional no estimate com campos:
- `dispute_reason` (enum: adjuster_underpayment, supplement_rejected, claim_denied, other)
- `dispute_notes` (text)
- `dispute_opened_at`, `dispute_resolved_at`
- `blocks_so_progression` (bool — default true): SO vinculada fica pausada até resolução

Quando estimate vai para `disputed`:
1. SO não avança de status sem override explícito do Owner
2. Notificação para Owner
3. Timer de SLA interno (dispute em aberto >14 dias = alerta)

Histórico de disputes vira parte do Customer 360 activity (RF-004).

---

### RF-007 — Case Management simplificado

**Gap fechado:** complementa Gap 5 e serve customer complaints em geral.
**Persona primária:** Estimator (abre casos); Owner (revisa); Customer (subject).
**Prioridade:** P2, Fase 2.

**Descrição:** entidade `cases` leve, não é CRM ticket full. Suporta 2 tipos:
- `complaint` — cliente insatisfeito com reparo
- `dispute` — desacordo com adjuster (sobreposição com RF-006 — **decisão DM** se fica case único ou se dispute é case especializado)

Campos básicos: `id`, `tenant_id`, `case_type`, `opened_by_user_id`, `customer_id NULL`, `vehicle_id NULL`, `related_estimate_id NULL`, `related_so_id NULL`, `title`, `body`, `status (open/in_progress/resolved/closed)`, `priority (low/med/high)`, `assigned_to_user_id`, `opened_at`, `resolved_at`, `resolution_notes`.

Lista em `/app/cases` (secundário, não vira workspace próprio).

---

## 6. Sugestão de ajuste no RF do Cockpit do Owner (Gap 4)

Ainda não foi redigido como RF (mencionado em §8 da Bússola como "RF futuro — Cockpit"). Antes de redigir, incorporar:

**KPI "Cash disponível" deve distinguir:**
- **Cash balance** (saldo contábil total em bank_accounts)
- **Available balance** (cash balance - pending outbound payments em trânsito)

Exibido como "$XX,XXX available ($YY,YYY total)".

Racional: sem essa distinção, Owner vê $50k no sábado, aprova gasto de $30k, e na terça descobre que $25k já estava comprometido em vendor bills agendados. É a exata falha que Bússola §3 descreve ("não existe — dashboard atual é operacional, não gerencial").

Padrão copiado de NS In-Transit Payments.

---

## 7. O que ficou fora (anti-recomendações explícitas)

Para evitar debate recorrente, documentar o que **NÃO** entra mesmo tendo sido visto no NS:

1. **SuiteFlow / Workflow Designer** — approvals formais não são nosso problema (§5).
2. **Saved Searches / Custom KPIs** — self-service reporting não é nosso problema (§5).
3. **Departments / Classes / Locations / Custom Segments / Subsidiaries** — classification trio do NS fica de fora; anti-target §1.
4. **OneWorld / Multi-entity consolidation** — anti-target §1.
5. **Intelligent Transaction Matching ML-based** — Plaid + regra simples "match by amount+date ±3d" é suficiente (§5, P7).
6. **SuiteBilling / Recurring revenue recognition** — nosso billing interno é Stripe simples. Fase 7+ se tração.
7. **Multi-book accounting (GAAP + Tax simultâneos)** — 1 book US GAAP. MACRS calculado em runtime para depreciation schedule, não como book separado.
8. **Multi-currency / Multi-language full i18n** — §5. Manter USD/EN primário.
9. **Scheduler / Dispatcher role** — Owner ou Estimator faz dispatch manualmente. Body shop 5–15 func.
10. **Native iOS/Android app** — PWA responsiva cobre 80% do valor (§5). Native app é Fase 7 opcional.
11. **Soft close + Hard close + sub-ledgers** — Open/Closed binário basta (§5, já confirmado ADR-003).
12. **Van inventory real-time tracking** — SSE é shop-based. Sem vans.
13. **Case Management full (tipos + origens + regras + territórios + auto-assignment)** — RF-007 é versão simplificada, manual assignment.

Estas 13 decisões de descope ficam documentadas aqui como referência rápida para discovery futuro. Próxima vez que alguém perguntar "mas e se fizermos X do NS?", este documento responde.

---

## 8. Rascunho ADR-012

> **Nota:** ADR-011 está reservado para release cadence (ver memória: `project_sse_release_cadence_pending.md` — depende de T-20260412-1 sair de BLOCKED). Este ADR usa slot 012.

```
## ADR-012 — Incorporação parcial de padrões NS à Bússola v1.1

Contexto:
Em 2026-04-21, sessão PO Cowork realizou análise comparativa entre a
documentação pública do NS (docs.oracle.com/en/cloud/saas/NS) e
a Bússola de Produto SSE v1.0 (ADR-009). Análise documentada em
docs/strategy/ANALISE_NS_vs_BUSSOLA_v1.md.

Objetivo: identificar padrões validados pela indústria que possam reforçar o
SSE sem violar o posicionamento "simpler + cheaper + purpose-built".

Opções consideradas:

| Opção | Risco | Custo | Reversão |
|---|---|---|---|
| A. Adotar ajustes propostos via Bússola v1.1 | Baixo — mudanças são adições, não redesenho | ~1 sessão PO para revisar + validar com DM | Revisitar na revisão trimestral de julho/2026 |
| B. Esperar revisão trimestral natural (julho/2026) | Perda de janela de 2–3 meses para incorporar aprendizados no roadmap Fase 2 | Zero | Nenhuma (não muda) |
| C. Descartar aprendizados | Contradiz princípio de evolução da Bússola | Zero | Fica no histórico como insumo |

Decisão: A (adotar ajustes).

Justificativa:
- Validações encontradas reforçam decisões já tomadas (baixo risco).
- 4 novos RFs propostos (RF-004 a RF-007) complementam gaps existentes
  sem abrir frentes novas.
- Janela de incorporação está aberta — Fase 2 ainda não congelou escopo.
- Princípio novo P8 (offline-first shop floor) é gap concreto identificado
  que afeta Gap 2 (Mobile Technician) se não for endereçado.

Condição de reversão:
- Se ≥2 dos novos RFs (RF-004 a RF-007) forem reavaliados como overhead
  e cancelados antes de entrarem em dev, reabrir este ADR.
- Se P8 conflitar com complexidade do PWA na Fase 2 ao ponto de atrasar
  Gap 2 em >30 dias, reavaliar P8 como "nice to have, não requisito".

Consequências:

+ Bússola v1.1 passa a enumerar 13 anti-recomendações explícitas
  (hoje implícitas), reduzindo debate recorrente.
+ 4 RFs adicionados ao backlog — escopo claro, complexidade mapeada.
+ Princípio P8 alinha Gap 2 com padrão de indústria (FSM Mobile).
+ §5 (simplificamos) fica mais robusta.

- Custo de sessão PO para formalizar a v1.1 e redigir os 4 novos RFs.
- Pressão no Fase 2 para incluir RF-004 e RF-006 (P1) além dos itens já
  previstos (Cockpit, Insurance workflow, Mobile PWA).

Arquivo: docs/decisions/012-ns-incorporacao-parcial.md
Relacionado: ADR-009 (Bússola), ADR-010 (Operating Model v2).
```

---

## 9. Próximos passos (sugeridos)

Ordem sugerida para o PO:

1. **Ler este documento** (≤ 45 min) e marcar partes que discorda.
2. **Sessão PO curta (60 min)** para decidir:
   - (a) Aprovar a v1.1 da Bússola com ajustes de §4 deste relatório? Ou esperar revisão trimestral?
   - (b) Aprovar RF-004 a RF-007 para entrar no backlog?
   - (c) Aprovar P8 como novo princípio?
3. Se SIM em (a) e (b): PO redige ADR-012 + atualiza Bússola para v1.1 + abre RF-004/005/006/007 em `RF_BACKLOG.md`.
4. Se alguns SIM alguns NÃO: registrar decisão parcial em `.auto-memory/po_sessions.md` com condições de reversão.
5. **Handoff para DM:** após RFs aprovados, gerar tarefas DM para Fase 2 incluindo os novos RFs na ordem P1 (RF-004, RF-006) → P2 (RF-007).
6. **Validação com DM:** 3 perguntas técnicas pendentes levantadas neste documento:
   - Reversing JE existe no SSE? (§2.2)
   - Half Year convention em MACRS está implementada? (§2.3)
   - Global Search (Cmd+K) está no SSE? (§2.8)

---

## 10. Registro desta análise

| Data | Item | Autor |
|---|---|---|
| 2026-04-21 | Análise comparativa NS vs Bússola — v1 | PO Assistant (Cowork) |
| 2026-04-21 | 4 RFs propostos (RF-004 a RF-007) | PO Assistant |
| 2026-04-21 | 13 anti-recomendações explícitas consolidadas | PO Assistant |
| 2026-04-21 | Rascunho ADR-012 | PO Assistant |

Fontes consultadas (docs.oracle.com):
- [Table of Contents](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/toc.htm)
- [Customer Relationship Management (CRM)](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_N3945914.html)
- [Customer 360 View](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_0709124630.html)
- [Chart of Accounts Management](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/chapter_N1439850.html)
- [Journal Entries](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/chapter_N1468455.html)
- [Accounting Period Management](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/chapter_N1445226.html)
- [Fixed Assets Management Overview](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/chapter_N2126441.html)
- [Preconfigured Depreciation Methods](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_N2137654.html)
- [Asset Disposal by Sale or Write-Off](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_N2160101.html)
- [Field Service Management](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/article_1140906473.html)
- [Tracking Field Service Time](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/article_0918103711.html)
- [NS for Mobile Overview](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/chapter_1553504120.html)
- [Navigation Menu](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_4323290738.html)
- [Centers](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_164208316196.html)
- [Key Performance Indicators](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/chapter_N595760.html)
- [Global Search Overview](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_161899349589.html)
- [Bank Data Matching and Reconciliation](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/chapter_4842302228.html)
- [In-Transit Payments](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_1535398724.html)
- [Vendor Records for 1099 Contractors](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_N2364122.html)
- [Form 1099-MISC](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_N2045726.html)
- [Classifications Overview](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_N261486.html)
- [Setting Up Case Management](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/chapter_N2421072.html)
- [Estimates](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_N1069662.html)
- [Converting an Estimate](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_N1073352.html)
- [SuiteBilling Overview](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/chapter_1520360275.html)
- [Using Custom SuiteFlow Workflows for Approval Routing](https://docs.oracle.com/en/cloud/saas/NS/ns-online-help/section_N2396465.html)

---

*Este documento é insumo estratégico, não artefato autoritativo. A Bússola permanece em v1.0 até ADR-012 ser aceito pelo PO em sessão formal.*
