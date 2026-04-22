# Bússola de Produto — Storm Shield Enterprise

> Documento de referência estratégica para decisões de roadmap, redesenho de UX e priorização de RFs no SSE.
> Criado em: 2026-04-17 (v1.0 via ADR-009). Atualizado em: 2026-04-21 (v1.1 via ADR-012).
> Autor: Luigi (PO) + PO Assistant
> **Propósito:** Servir de norte a todas as decisões de produto. Deve ser lido antes de qualquer sessão de redesenho, priorização ou discovery de RF.
> **Natureza:** Não é backlog. Não é arquitetura técnica. É bússola — orienta "que produto estamos construindo e para quem".
> **v1.1 (2026-04-21):** incorpora aprendizados de `ANALISE_NETSUITE_vs_BUSSOLA_v1.md` — novo princípio P8 (offline-first), §5 expandida (6 anti-features + 1099-NEC movido para Superamos + MACRS adicionado), §7 nota de nomenclatura "Workspace" + Global Search obrigatório, §8 estendida com RF-004/006/007 e ajuste Cockpit.

---

## 1. Target de Mercado e Anti-Target

### ICP (Ideal Customer Profile) primário

**Body shop médio nos Estados Unidos com 5 a 15 funcionários.** Operação tipicamente familiar ou com um único dono-operador, separação clara entre roles (dono, estimador, técnicos, administrativo), receita majoritariamente via insurance claims, localização regional (Missouri no primeiro vetor, expansão para outros estados do Midwest/South).

Caracteristicas do ICP:
- Receita anual: US$ 800k – US$ 4M
- Separação funcional: 1 dono + 1–2 estimadores + 3–8 técnicos + 0–1 administrativo/contador
- Mix de receita: 70–90% insurance, 10–30% out-of-pocket
- Ferramentas atuais: papel, planilha, QuickBooks desconectado, sistema de estimate isolado (Mitchell/CCC/Audatex), sem ERP integrado
- Dor principal: retrabalho entre sistemas, reconciliação manual, falta de visibilidade do fluxo de caixa, 1099 no fim do ano é um drama

### Anti-target (quem NÃO é cliente)

Decisões de produto **devem ser recusadas** se servirem estes perfis em detrimento do ICP:

| Perfil | Por que não é nosso cliente |
|---|---|
| **PDR solo/mobile (1 pessoa)** | Não precisa de ERP. Planilha + Zelle resolve. Se construirmos para ele, perdemos foco multi-persona. |
| **Rede multi-filial (15+ func, múltiplas locations)** | Compra NetSuite ou Mitchell+QuickBooks integrado. Ciclo de venda longo, requer customização. Fuga de ICP. |
| **General auto repair (oil change, tires, mechanical)** | Workflow diferente — insurance é marginal, parts inventory é central. Domínio adjacente, não alvo. |
| **Glass repair, detailing, windshield** | Volume alto/ticket baixo. Precisa de POS + scheduling robusto. Não é o jogo. |

### Posicionamento estratégico

**SSE é a alternativa "simpler + cheaper + purpose-built" para body shops médios nos EUA.**

Não é o "NetSuite com desconto". É o ERP que um dono de body shop **consegue adotar sem consultor**, que o técnico **usa no celular sem treinamento**, e que o contador **exporta para QuickBooks sem dor de cabeça**. Simplicidade radical é feature, não lacuna.

### Métrica de sucesso (12 meses)

**# de tenants ativos + activation rate.** Operacionalização proposta (a validar com Dev Manager):

> Um tenant é **"activated"** quando executa o happy path operacional mínimo nos primeiros 7 dias: criar ≥1 customer + ≥1 vehicle + ≥1 estimate + ≥1 service order + ≥1 financial transaction.

Toda decisão de roadmap passa pelo filtro: **"isso aumenta activation rate ou mantém tenants ativos?"** Se não, desprioriza.

---

## 2. As 4 Personas Primárias

> Decisão: tratamos 4 personas primárias e colapsamos `manager`/`admin` em **owner-operator** (para ICP 5–15 func, manager dedicado é minoria). `viewer` é persona secundária, não orienta design.

### Persona 1 — Owner-Operator (Dono)

| Dimensão | Detalhe |
|---|---|
| **Analogia forte** | Dono de restaurante de bairro que ainda empratado comida — gerencia e opera. Já foi técnico ou estimador, virou empresário por evolução, não por plano. |
| **Perfil** | 40–60 anos, tech comfort médio-baixo. Email sim, Excel "mais ou menos", celular para tudo. Chegou cedo, vai embora tarde. |
| **Pergunta central** | "Meu negócio está saudável? Tenho caixa para pagar a folha? Estou crescendo ou só me mantendo?" |
| **Horizonte dominante** | H2 (mês) + H3 (trimestre). H1 (semana) quando aperta. |
| **JTBD top 3** | 1. Saber se vou conseguir pagar folha/aluguel no fim do mês sem entrar no cheque especial. 2. Saber a margem real do job quando o cheque da seguradora cai — ganhei ou paguei para trabalhar? 3. Saber se preciso contratar mais um técnico, segurar ou demitir — capacidade vs. backlog. |
| **Canal primário** | Desktop no escritório + celular fora do shop. |

### Persona 2 — Estimator (Estimador)

| Dimensão | Detalhe |
|---|---|
| **Analogia forte** | Agente de atletas negociando contratos o dia inteiro. Face do shop para o cliente final e para a seguradora. Vive em ligações, supplements, fotos. |
| **Perfil** | 30–50 anos, tech comfort médio-alto. Certificado I-CAR, fluente em Mitchell/CCC/Audatex. Conhece o jogo das seguradoras. |
| **Pergunta central** | "O que tem na minha fila? Qual estimate precisa de supplement? Qual adjuster está me devendo resposta?" |
| **Horizonte dominante** | H0 (hoje) + H1 (semana). |
| **JTBD top 3** | 1. Abrir um estimate novo com o mínimo de cliques, puxando dados do VIN e da seguradora. 2. Saber o status de cada estimate aberto (aguardando DRP, aguardando supplement, aguardando aprovação) sem ter que perguntar ao dono. 3. Rastrear pagamentos das seguradoras — "o Progressive me deve quanto? Por que não pagou ainda?". |
| **Canal primário** | Desktop no shop (monitor duplo). Celular no campo quando vai buscar veículo. |

### Persona 3 — Technician (Técnico)

| Dimensão | Detalhe |
|---|---|
| **Analogia forte** | Motorista Uber com app que tem que funcionar na hora. Se o app trava, ele volta ao papel e nunca mais usa. |
| **Perfil** | 25–45 anos, tech comfort variado (do técnico sênior que odeia sistema ao júnior nativo digital). PDR specialist, body tech, painter. Mão suja, celular protegido em capa industrial. |
| **Pergunta central** | "O que eu tenho pra fazer agora? Quanto tempo registrei? Tirei as fotos do before/after?" |
| **Horizonte dominante** | H0 (próximas horas) + H1 (paycheck da semana). |
| **JTBD top 3** | 1. Ver as SOs atribuídas a mim hoje, em ordem, sem ter que pedir pro dono. 2. Registrar tempo trabalhado com 2 toques — start/stop — e associar à SO certa. 3. Tirar foto do veículo (before/progress/after) e anexar à SO sem upload lento e sem perder internet no shop. |
| **Canal primário** | **Celular no shop.** Desktop é exceção. |

### Persona 4 — Accountant (Contador)

| Dimensão | Detalhe |
|---|---|
| **Analogia forte** | Auditor que chega uma vez por semana ou mês, abre o livro, mexe, exporta, e some. Não quer saber do dia-a-dia — quer números corretos e audit trail. |
| **Perfil** | 40–65 anos, frequentemente externo (part-time, 1099), CPA ou EA credenciado. Tech comfort alto em ferramentas contábeis (QuickBooks, Xero), médio em tudo fora disso. Influenciador forte — se odeia o sistema, aconselha o dono a trocar. |
| **Pergunta central** | "O período está pronto para fechar? Os journal entries batem? Consigo exportar limpo para QuickBooks/Xero?" |
| **Horizonte dominante** | Ciclo fiscal — fechamento mensal + fechamento anual + temporada de impostos. |
| **JTBD top 3** | 1. Fechar o período mensal sabendo que todas as transações operacionais geraram JE correto automaticamente. 2. Exportar GL, trial balance, P&L, Balance Sheet em formato que QuickBooks/Xero importam sem ajuste manual. 3. Gerar 1099-NEC para contractors em janeiro com um botão, não em planilha a partir de relatórios espalhados. |
| **Canal primário** | Desktop. Acesso remoto — raramente presencial no shop. |

### Resumo: landing por persona

| Persona | Landing proposta | Primeiro KPI que ela vê | Fricção atual |
|---|---|---|---|
| Owner | `/app/cockpit` | Cash disponível + capacidade semanal + margem do mês | Não existe — dashboard atual é operacional, não gerencial |
| Estimator | `/app/estimates/inbox` | # estimates por status + supplements pendentes | Não existe como inbox — existe como lista |
| Technician | `/app/my-work` (mobile-first) | Minhas SOs de hoje + timer ativo | Não existe — mobile é Fase 5 no CLAUDE.md |
| Accountant | `/app/books` | Período aberto + JE pendentes + reconciliação | Não existe — portal contador é Fase 4 |

---

## 3. Diagnóstico da Arquitetura Atual

### O estado real (2026-04-17)

Fase 1 está ~95% concluída. 12 módulos, 98 endpoints, 293 testes, 11 migrations, 8 ADRs. CI verde, deploy Web verde, deploy API vermelho (secrets — pré-existente). Stack sólida: NestJS + Next.js 15 + PostgreSQL 16 (schema-per-tenant + RLS) + Clerk + R2.

**Técnicamente: maduro para o estágio. Estrategicamente: construído de baixo para cima.**

### O viés de origem

O `CLAUDE.md` organiza o projeto em 7 Fases × 12 domínios × 65 entidades. Cada Fase é um bloco técnico coerente (MVP, IA+Integrações, Contabilidade+FAM, etc). **Nenhuma Fase começa com "qual pergunta da persona esta fase responde?"**

Consequência concreta: FAM (Fixed Asset Management) entregou 5 métodos de depreciação com MACRS completa (apenas 2 métodos implementados em TS, os outros 3 documentados — ver ADR-008). O body shop médio do ICP usa Straight-Line e pronto — talvez MACRS simplificado se o contador pede. Os outros 3 métodos são paridade com NetSuite que **contradiz o posicionamento "simpler + cheaper"**.

Essa lógica se repete em outros módulos — listada na seção 4 como gaps.

### Inventário das 12 capacidades atuais vs. persona servida

| Módulo | Persona primária servida | Persona secundária | Avaliação |
|---|---|---|---|
| Platform/IAM/Tenants | Owner (setup inicial) | — | OK — setup once |
| CRM (Customers) | Estimator | Owner | OK — suficiente para happy path |
| Insurance | Estimator | Owner | **Subdesenvolvido** — DRP workflow é core para receita, pouco suporte na UI |
| Vehicles | Estimator, Technician | — | OK — fotos via StorageService funcional |
| Estimates | Estimator | Owner | **Workflow incompleto** — falta inbox/fila/status visual para Estimator |
| Service Orders | Technician, Owner | Estimator | **Mobile ausente** — técnico não consegue usar no celular |
| Contractors | Owner, Accountant | — | OK — CRUD + 1099 tracking entregues |
| Financial | Owner, Accountant | — | Básico — dashboard existe mas não responde "saúde do negócio" |
| Accounting (GL) | Accountant | — | **Fechamento manual** — accountant ainda exporta e reconcilia manualmente |
| Fixed Assets (FAM) | Accountant | Owner | **Over-engineered vs. ICP** — 5 métodos quando 2 bastam |
| Inventory | Technician (partes em SO) | Owner | Parcial — só uso dentro de SO |
| Rental | — (Fase 6) | — | N/A |

**Síntese:** SSE cobre **a operação** razoavelmente bem (Estimator + Technician básico). Cobre **a contabilidade** com over-engineering (Accountant parcial). Não cobre **a gestão** (Owner não tem cockpit) nem **a mobilidade** (Technician sem mobile).

---

## 4. Gaps Críticos de Produto

Gaps ordenados por **impacto na activation rate / retenção de tenants** — não por módulo.

### Gap 1 — Landing única, não por persona (bloqueia activation)

**O que falta:** ao fazer login, cada role vê a mesma dashboard genérica. Técnico precisa navegar até achar suas SOs. Estimator precisa navegar até a lista de estimates. Accountant precisa ir em Reports.

**Por que é crítico:** activation rate depende de time-to-first-value. Se um técnico loga pela primeira vez e não vê imediatamente "suas SOs de hoje", ele pensa "não entendi esse sistema" e o dono perde o momentum de adoção interna.

**Impacto:** bloqueia tanto activation quanto retenção — tenants que não conseguem adoption interna cancelam nos primeiros 90 dias.

**Solução alvo:** 4 landings distintas baseadas em role primário do user (`/app/cockpit`, `/app/estimates/inbox`, `/app/my-work`, `/app/books`). Home atual vira `/app` com redirect por role.

### Gap 2 — Mobile do técnico é Fase 5 (contradiz persona)

**O que falta:** CLAUDE.md posiciona mobile como Fase 5 ("React Native / Expo" em 2–3 meses pós Fase 4). O técnico — **persona mais frequente no dia-a-dia do shop** — fica sem ferramenta até lá.

**Por que é crítico:** sem mobile pro técnico, a operação **continua no papel**. Dono vê relatórios bonitos, técnico continua anotando horas em folha avulsa, estimator continua tirando foto com app da câmera padrão. A adoção fica parcial → tenants "ativados por login" mas não "ativados na operação".

**Impacto:** contradiz o posicionamento. Um dos grandes argumentos contra NetSuite é que mobile é fraco — se SSE também é, perdemos o diferencial.

**Solução alvo:** não é React Native na Fase 5. É **mobile web PWA responsiva** começando na Fase 2, cobrindo: minhas SOs + timer + upload de fotos + consulta de estimate. Next.js já é Server Components — entrega isso sem novo stack.

### Gap 3 — Onboarding / time-to-first-value não instrumentado

**O que falta:** um tenant novo chega, cria schema, faz login. E aí? Não há **setup wizard** guiado. Não há dados de exemplo. Não há checklist visível. Activation rate como métrica só faz sentido se o caminho para activation é óbvio.

**Por que é crítico:** é literalmente o que a métrica escolhida exige. Sem isso, o roadmap está desancorado da métrica.

**Impacto:** activation rate vai ficar baixo em qualquer cohort até esse gap ser fechado.

**Solução alvo:** wizard de 5 passos no primeiro login do owner: (1) dados do shop + plano, (2) convidar estimator/técnico/contador, (3) cadastrar 1 insurance company, (4) criar customer+vehicle+estimate exemplo com dados reais, (5) abrir 1 SO a partir do estimate. Se completar em <30 min → tenant é "onboarded". Activation (happy path mínimo) vem nos 7 dias seguintes com uso real.

### Gap 4 — Cockpit do Owner ausente

**O que falta:** dashboard atual parece ser orientada a operações (listas, contadores). Owner quer saber "meu negócio está saudável" — cash disponível, margem do mês, capacidade da semana, # SOs em atraso, receivable das seguradoras.

**Por que é crítico:** owner é quem decide manter ou cancelar o contrato. Se ele loga e não vê valor gerencial imediato, ele cancela — independentemente de quanto o estimator goste do sistema.

**Impacto:** alto em retenção de tenants no mês 3–6, justamente quando o free trial ou starter expira.

**Solução alvo:** `/app/cockpit` com 5 KPIs fixos: (a) Cash disponível (soma de bank_accounts com saldo real), (b) Receivable de insurance em aberto, (c) Capacidade utilizada da semana (hours_assigned / hours_available), (d) Margem mês-a-mês (receita líquida / receita bruta), (e) # SOs com risco de atraso. Mais 3 alertas proativos.

### Gap 5 — Insurance workflow subdesenvolvido (contradiz core do ICP)

**O que falta:** o ICP tem 70–90% de receita vindo de insurance claims. SSE tem `insurance_companies`, `insurance_contacts`, `insurance_payments`, `estimate_supplements`. Mas o **workflow** — "estimate criado → enviado para adjuster → aguardando approval → supplement → paid" — não parece estar materializado como fluxo de UI na Fase 1.

**Por que é crítico:** é **o** ciclo operacional do ICP. Se SSE não modela isso bem, é uma planilha bonita.

**Impacto:** diferencial frente a NetSuite (que não tem DRP nativo) — perdemos se não entregamos.

**Solução alvo:** estimate como state machine visível ao Estimator: draft → submitted → awaiting_approval → approved → supplement_pending → paid. Kanban ou timeline. Isso encaixa em Fase 2 ou Fase 1.5 (interim release).

### Gap 6 — FAM com over-engineering vs. ICP

**O que está construído:** 5 métodos de depreciação (Straight-Line + MACRS + 3 ainda não implementados em TS). Auto-JE. Batch execution. Disposal. Depreciation schedules. 6 categorias seed. ADR-008 já reconhece parcialmente isso ("MACRS simplificado no NestJS").

**O que o ICP usa:** Straight-Line para 90% dos assets (tools, equipment, office furniture). MACRS para veículos (requisito IRS). Disposal ocasional.

**Avaliação:** os 3 métodos não implementados (Declining Balance, Sum-of-Years, Units of Production) são paridade com NetSuite. Mantê-los no backlog pesa na cognição do produto sem retorno para o ICP.

**Solução alvo:** **Descope formal dos 3 métodos** para o plano `enterprise` apenas (ou Fase 7). FAM encerra Fase 3 com Straight-Line + MACRS. Poupa 2–4 semanas de dev que vão para Gap 1/2/4.

### Gap 7 — Portal do Contador em Fase 4 (conflita com persona influenciadora)

**O que o CLAUDE.md diz:** "Portal do Contador (read-only com export)" na Fase 4.

**Por que é gap:** contador é **persona influenciadora** — se o contador diz "esse sistema não exporta limpo pro QuickBooks", o dono troca. Adiar para Fase 4 (2–3 meses pós Fase 3) significa 6+ meses sem cobrir essa persona. Nesse intervalo, qualquer contador que toque o sistema vai reclamar.

**Impacto:** churn por influência externa. Difícil de medir, fácil de evitar.

**Solução alvo:** export básico (GL + Trial Balance + JE) em CSV/XLSX + link-share com role `viewer` limitado a módulos accounting/financial, entregue como **ENH na Fase 2**, não como módulo completo na Fase 4. Portal completo segue para Fase 4 como planejado.

### Gap 8 — Sem sensor de activation / não saberemos se estamos avançando

**O que falta:** métrica de sucesso é `# tenants ativos + activation rate`. Infra para medir isso (event tracking do happy path, funnel de activation, cohort analysis básica) não existe.

**Por que é crítico:** não dá para otimizar o que não se mede. Qualquer priorização "isso ajuda activation?" fica qualitativa/vibe-based sem instrumentação.

**Impacto:** alto na governança — decisões de roadmap ficam arbitrárias.

**Solução alvo:** **Event tracking mínimo** (tabela `activation_events` ou integração PostHog/Mixpanel) registrando os 5 marcos do happy path por tenant. Dashboard interno para PO/Dev Manager. Entregar em Fase 1.5 / Fase 2 early.

---

## 5. Posicionamento vs. NetSuite / Mitchell / CCC

Tabela de filtro para toda feature nova. Se uma feature está em "Simplificamos", não implementamos nível-NetSuite.

### Onde SIMPLIFICAMOS (consciência deliberada)

| Dimensão | NetSuite / Mitchell faz | SSE faz | Racional |
|---|---|---|---|
| Approval workflows | Multi-nível, matriz de aprovadores | Aprovação presencial/oral; log de status | Body shop 5–15 func aprova cara-a-cara. Workflow formal cria burocracia sem valor. |
| Depreciação | 5+ métodos (SL, MACRS, DB, SYD, UOP) | 2 métodos (SL + MACRS simplificado) | 90% dos assets do ICP é SL. MACRS simplificado atende IRS em primeira aproximação. |
| RBAC | Permissões granulares por field | 4 roles operacionais + viewer | Granularidade inutilizada em operação de 10 pessoas. |
| Fiscal periods | Soft close + Hard close + sub-ledgers | Close simples (abre/fecha) | Contabilidade doméstica US GAAP não exige; accountant fecha uma vez. |
| Multi-currency | Nativo, multi-book | USD only | 100% do ICP opera em USD. i18n vira débito. |
| Multi-language | 30+ idiomas | EN primário, PT-BR para suporte | Market é US. PT-BR só para equipe interna + futuro Brasil. |
| Reporting | Self-service com drag-and-drop | 4 relatórios canônicos (P&L, BS, TB, Dep Schedule) | Self-service requer DSL próprio + treinamento. ICP não usa. |
| Custom fields | Full customization por tenant | Schema fixo + campos `notes` em entidades chave | Custom fields explodem complexidade e migração. |
| Workflow automation | BPMN-ish com approvals condicionais | n8n workflows pré-definidos | Body shop não modela BPM. Pré-definido é o certo. |
| Approval de budget | Budget vs actual com alertas | Cash-based P&L + dashboard simples | Owner-operator não roda budgeting formal. |
| **Custom Segments / Classifications (Dept/Class/Location)** | Departments, Classes, Locations, Custom Segments — dimensões de análise configuráveis | Nenhum — tenant = 1 shop = 1 location | Violação direta de P7. Anti-target §1 (rede multi-filial). Adicionado v1.1. |
| **SuiteFlow / Workflow Designer** | BPMN visual builder com approval routing multinível | n8n workflows pré-definidos pelo time SSE | Body shop não modela BPM. Pré-definido é o certo. Já aludido; explicitado v1.1. |
| **Saved Searches / Custom KPIs** | User monta query → vira KPI em portlet | 4 relatórios canônicos fixos (P&L, BS, TB, Dep Schedule) + KPIs fixos por persona | Self-service reporting exige training + cria dívida de suporte. ICP não usa. Adicionado v1.1. |
| **OneWorld / Subsidiaries** | Multi-entity consolidado (várias empresas num tenant) | 1 tenant = 1 empresa = 1 shop | Anti-target §1 (rede multi-filial). Adicionado v1.1. |
| **SuiteBilling / Usage billing** | Recurring + one-time + usage + overage por linha | Plano fixo mensal via Stripe (4 tiers + PlanGuard) | Fase 7+. Atualizar quando houver 1000+ tenants ativos. Adicionado v1.1. |
| **Dashboard Portlets configuráveis** | User arrasta/solta portlets no dashboard | KPIs fixos por persona (sem drag-and-drop) | Configurabilidade vira distração. User não customiza dashboard. Adicionado v1.1. |
| **Intelligent Transaction Matching (ML-based)** | ML-based match de bank transactions | Regra simples: amount + date ±3 dias (via Plaid Fase 2) | ML é overkill para body shop 5–15 func. Adicionado v1.1. |

### Onde HERDAMOS (requisito regulatório ou padrão)

| Dimensão | Por que herdamos |
|---|---|
| Chart of Accounts US GAAP | Requisito regulatório — contador precisa disso exportável. |
| Double-entry bookkeeping | Base de toda contabilidade; não há "simplificação" válida. |
| Audit trail (audit_logs) | Requisito de segurança SaaS multi-tenant + eventual compliance SOC 2. |
| Sales Tax (Missouri, depois multi-state) | Requisito local. |
| Multi-tenant isolation (schema + RLS) | Requisito SaaS. Já entregue. |
| AES-256-GCM em campos sensíveis | Requisito de segurança para SSN/EIN/bank accounts. |

### Onde SUPERAMOS (diferencial)

| Dimensão | Como superamos |
|---|---|
| UX purpose-built | Não é ERP genérico adaptado — é ERP desenhado para body shop. Landing por persona, linguagem do domínio, fluxos operacionais do shop. |
| DRP / Insurance workflow nativo | NetSuite não tem. Mitchell tem estimate mas não ERP integrado. SSE tem ambos. Gap 5 transforma isso em diferencial visível. |
| Mobile-first para técnico | NetSuite mobile é business-user oriented (vendedor consultando CRM). SSE mobile é shop-floor oriented (técnico registrando hora com câmera). Gap 2. |
| Onboarding <1h | NetSuite requer implementação com parceiro (semanas). SSE requer wizard (minutos). Gap 3. |
| Preço | $30–$200/mês vs. $500–$5000/mês. Permite o ICP existir como cliente. |
| **1099-NEC nativo** | NetSuite **não gera 1099** — depende de integradores externos (Yearli, Sovos, Track1099). SSE gera nativamente. Essencial ao ICP (contractors 1099 são operação padrão do shop). Movido de Herdamos → Superamos em v1.1. |
| **MACRS nativo em FAM** | NetSuite trata MACRS como "alternate tax method" separado, exigindo configuração. SSE tem MACRS nativo (ADR-008) porque é requisito IRS para veículos do shop. Feature essencial, não extensão. Adicionado v1.1. |
| **Activation tracking instrumentado** | NetSuite tem dashboards pós-implementação; não trata activation rate como métrica padrão. SSE tem tabela `activation_events` + dashboard interno (RF-003). Diferencial de governança PO/PM. Adicionado v1.1. |

---

## 6. Princípios de Design (guardrails)

Qualquer nova tela, RF ou redesenho deve passar por estes 7 filtros. Violação sem justificativa → descope.

**P1 — Landing por persona.** Não existe "a home page". Cada persona primária tem seu ponto de entrada com KPI/lista relevante. User com múltiplos roles escolhe workspace no primeiro acesso.

**P2 — Mobile-first para Technician, desktop-first para Owner/Estimator/Accountant.** Mobile não é responsive tardio — é fluxo de uso desenhado para celular. Técnico não deve nunca "rolar horizontalmente" nem "pinch-zoom" para registrar hora.

**P3 — Time-to-first-value < 30 min.** Wizard de onboarding + dados de exemplo opcionais. Qualquer feature que exige mais de 30 min de setup isolado precisa de ADR justificando.

**P4 — Operação do shop não depende do owner estar logado.** Owner viaja, o shop opera. Técnico e estimator têm autonomia completa dentro de seus escopos.

**P5 — Insurance-first, não out-of-pocket-first.** Fluxo padrão de estimate e SO é insurance claim com adjuster. Out-of-pocket é caminho paralelo menor. Invertido do que NetSuite faz.

**P6 — Contabilidade nos bastidores.** Tech/estimator nunca veem "journal entry" ou "debit/credit". Owner vê KPIs agregados em linguagem de negócio ("margem", "receivable", "cash"). Accountant vê GL detalhado — é quem fala a língua contábil.

**P7 — NetSuite é referência, não benchmark.** Feature nova só entra se passa no filtro "body shop médio de 5–15 func usa isso?". Se a justificativa é "NetSuite tem" ou "pode ser necessário no futuro", desprioriza.

**P8 — Offline-first para shop floor (adicionado v1.1).** Técnico não pode perder trabalho quando WiFi cai. Operações críticas do mobile (timer, fotos, SO status) funcionam offline e sincronizam quando reconectar. Desktop pode assumir online; mobile do Technician **não**. Sem offline, mobile do técnico vira "ferramenta que só funciona no escritório" — contradiz P2. Origem: gap identificado em `ANALISE_NETSUITE_vs_BUSSOLA_v1.md §2.7` (FSM Mobile).

---

## 7. Arquitetura de Navegação por Persona

### Proposta: landing + navegação primária por role

```
Login → detecta role primário → redirect para workspace

Owner        → /app/cockpit        [H2+H3: saúde do negócio]
Estimator    → /app/estimates/inbox [H0+H1: fila + insurance follow-up]
Technician   → /app/my-work         [H0+H1: minhas SOs + timer + fotos]
Accountant   → /app/books           [Fiscal cycle: período + JE + export]
```

### Navegação secundária (sidebar por workspace)

| Workspace | Seções visíveis | Seções ocultas |
|---|---|---|
| Owner Cockpit | Overview, Cash Flow, Capacity, Receivable, Team, Reports | GL detalhado (linka para Books só se role accountant), SO detail (drill-down sob demanda) |
| Estimator Inbox | My Estimates, Insurance Companies, Customers, Vehicles, Supplements | Financial, Accounting, FAM |
| Technician My Work | Today's SOs, Time Clock, Photos, Parts Used | Tudo o resto |
| Accountant Books | Chart of Accounts, Journal Entries, Fiscal Periods, Reports, FAM, 1099, Export | Operational CRUD (customers/vehicles visível read-only se precisar) |

### Regras

- **User com múltiplos roles** (ex: owner que também estima) escolhe workspace ativo no topo (pattern tipo "switch workspace"). Default é role mais "alto" (owner > manager > estimator > technician > accountant > viewer).
- **Settings** (categorias, contas, users, plan) fica fora dos workspaces — sempre acessível por owner/admin via menu do avatar.
- **Search global (Cmd/Ctrl+K) é obrigatório** em todos os workspaces — customer name, VIN, estimate #, SO #. User acessa qualquer entidade digitando parte do nome/número sem navegar menu. Se não existir no SSE hoje, é ENH P1 independente dos outros RFs (ver `ANALISE_NETSUITE_vs_BUSSOLA_v1.md §2.8`).
- **Não implementar** navegação horizontal de botões tipo Minhas Finanças ("14 páginas, todas iguais"). Hierarquia de persona > workspace > seção > tela é explícita.

### Nota de nomenclatura (v1.1)

Adotamos o termo **"Workspace"** (e não "Center" como NetSuite) para não importar jargão de ERP genérico para o SSE. "Workspace" é autodescritivo em EN e PT-BR, e sinaliza melhor a intenção de "ambiente de trabalho da persona" do que "centro" (que sugere centralidade hierárquica). Origem: `ANALISE_NETSUITE_vs_BUSSOLA_v1.md §2.8`.

---

## 8. Ordem de Ataque — Roadmap Ancorado em Gaps

> Esta ordem **substitui a leitura linear por Fases** do CLAUDE.md para fins de prioridade. O CLAUDE.md por Fases segue válido como mapa técnico; a Bússola é a camada de decisão.

| Prioridade | Horizonte | Itens | Gaps resolvidos | Justificativa |
|---|---|---|---|---|
| **P0** | 30–60 dias | Setup Wizard + Event tracking de activation (Fase 1.5) | Gap 3, Gap 8 | Instrumenta a métrica. Sem isso, roadmap é vibe. |
| **P0** | 30–60 dias | Landing por persona + sidebar por workspace (Fase 1.5) | Gap 1 | Habilita time-to-first-value. Baixa complexidade, alto impacto. |
| **P1** | 60–90 dias | Cockpit do Owner (5 KPIs + alertas) (Fase 2 early) | Gap 4 | Ancoragem de retenção. Owner é decisor de cancelamento. |
| **P1** | 60–90 dias | Insurance workflow visual (state machine + inbox do Estimator) (Fase 2) | Gap 5 | Diferencial vs. NetSuite. Core do ICP. |
| **P1** | 90–120 dias | Mobile PWA para Technician (SOs + timer + fotos) (Fase 2) | Gap 2 | Completa adoption interna. Destrava "shop inteiro usando". |
| **P2** | 90–120 dias | Export básico para Accountant (GL + TB + JE em CSV/XLSX) (Fase 2) | Gap 7 parcial | Antecipa cobertura da persona influenciadora. |
| **P2** | 120–150 dias | Descope formal dos 3 métodos de depreciação extras para plano enterprise | Gap 6 | Poupa dev time. Documentar em ADR. |
| **P3** | 150–180 dias | Portal do Contador completo (Fase 4 conforme CLAUDE.md) | Gap 7 total | Cobre persona com experiência dedicada. |
| **P1** (v1.1) | 60–90 dias | **RF-004 Customer 360 View** — tela unificada com 7 abas | Fricção CRM (Gap 9 candidato) | Padrão NetSuite validado. 90% dos cliques do Estimator caem aqui. |
| **P1** (v1.1) | 60–90 dias | **RF-005 Estimate State Machine + Inbox** | Gap 5 | Formaliza o "RF futuro — Insurance workflow visual". Core do ICP. |
| **P1** (v1.1) | 60–90 dias | **RF-006 Payment Hold / Disputed Estimate** | Gap 5 complementar | Evita shop continuar trabalho enquanto claim está travado. Inspiração NetSuite Payment Hold. |
| **P1** (v1.1) | Concorrente com Cockpit | **Ajuste RF do Cockpit** — incluir Available Balance distinct from Cash Balance | Gap 4 refinado | Sem isso, KPI "Cash disponível" é enganoso durante float bancário. Inspiração NetSuite In-Transit Payments. |
| **P2** (v1.1) | 90–120 dias | **RF-007 Case Management simplificado** | Gap 5 parcial | Customer complaint + disputes não-estimate. Estrutura leve, anti-rec #13 formaliza limite de escopo. |

### Nota sobre Fase 2 (IA + Integrações)

O CLAUDE.md descreve Fase 2 como "OCR + Classificador IA + Plaid + n8n". A Bússola sugere **reordenar Fase 2** para incluir primeiro os itens P0/P1 acima (activation, cockpit, insurance workflow, mobile) — que entregam a métrica de sucesso — e **depois** IA/integrações, que agregam valor mas não destravam a métrica de 12 meses sozinhas.

Este reordenamento é **sugestão do PO** e entra como input para o Dev Manager. Decisão final cabe a Luigi em sessão específica.

---

## 9. Registro de Decisões

| Data | Decisão | Sessão |
|---|---|---|
| 2026-04-17 | ICP definido: body shop médio 5–15 func nos EUA | PO Cowork |
| 2026-04-17 | Métrica de sucesso 12m: # tenants ativos + activation rate | PO Cowork |
| 2026-04-17 | Posicionamento: alternativa simpler + cheaper + purpose-built | PO Cowork |
| 2026-04-17 | 4 personas primárias: Owner, Estimator, Technician, Accountant | PO Cowork |
| 2026-04-17 | Manager/admin colapsados em Owner; Viewer tratado como secundário | PO Cowork |
| 2026-04-17 | 8 gaps críticos identificados, priorizados por impacto-na-métrica | PO Cowork |
| 2026-04-17 | Princípios de design P1–P7 aprovados como guardrails | PO Cowork |
| 2026-04-17 | Landing por persona: `/app/cockpit`, `/app/estimates/inbox`, `/app/my-work`, `/app/books` | PO Cowork |
| 2026-04-17 | Reordenamento sugerido para Fase 2 (activation/cockpit/insurance/mobile antes de IA) — a ratificar | PO Cowork |
| 2026-04-17 | Descope formal dos 3 métodos de depreciação extras para plano enterprise — a registrar em ADR próprio | PO Cowork |
| 2026-04-17 | Bússola SSE v0.1 oficializada via ADR-009 | PO Cowork |
| 2026-04-21 | Análise comparativa NetSuite vs Bússola concluída (v1) | PO Cowork |
| 2026-04-21 | Dashboard NetSuite↔Bússola adotado como artefato vivo (HTML interativo) | PO Cowork |
| 2026-04-21 | **RF-004 a RF-007 aprovados** (Customer 360, Estimate State Machine, Payment Hold, Case Management) | PO Cowork |
| 2026-04-21 | **Princípio P8 (offline-first shop floor)** adicionado a §6 | PO Cowork |
| 2026-04-21 | **§5 expandida** — 7 novas linhas em Simplificamos; 1099-NEC movido para Superamos; MACRS e activation tracking adicionados a Superamos | PO Cowork |
| 2026-04-21 | **§7 atualizada** — nota de nomenclatura "Workspace"; Global Search obrigatório | PO Cowork |
| 2026-04-21 | **§8 ajustada** — 5 linhas novas (RF-004, RF-005, RF-006, RF-007, ajuste Cockpit/Available Balance) | PO Cowork |
| 2026-04-21 | Bússola SSE **v1.1** oficializada via ADR-012 | PO Cowork |

---

## 10. Como usar este documento

- **Toda sessão PO** começa com releitura das seções 1, 2 e 6 para recalibrar.
- **Todo RF novo** passa pelo filtro: qual persona serve? Qual gap fecha? Qual princípio respeita? Se a resposta é "nenhuma", desprioriza.
- **Todo PR** que cria tela nova deve linkar para a persona primária na descrição.
- **Revisão trimestral** da Bússola: as personas ainda são essas? Os gaps ainda são estes? A métrica ainda faz sentido?
- **Atualização** só em sessão PO com decisão explícita. Registro no §9.

---

*Este documento é bússola, não mapa. Se estiver apontando para a direção errada, é ele que atualizamos — não a realidade.*
