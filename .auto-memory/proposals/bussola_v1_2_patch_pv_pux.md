# Patch: Bússola v1.1 → v1.2 — PV/PUX (§6 reorganizada)

**Arquivo-alvo:** `docs/strategy/BUSSOLA_PRODUTO_SSE.md`
**Origem:** ADR-013 (draft em `.auto-memory/proposals/adr_013_draft.md`)
**Autor:** Luigi (PO) + PO Assistant
**Data:** 2026-04-21
**Aplicação:** pelo DM no PR correspondente (tarefa T-20260421-6 em `dm_queue.md`)

---

## Instruções ao DM

Este é um **patch descritivo** — mostra o que mudar, não um diff mecânico. Aplicar com cuidado de não quebrar âncoras de markdown (`#`, `##`) nem alterar texto de P1–P8.

**Ordem das edições:**

1. Atualizar **header** (linhas 1–9) — bump v1.1 → v1.2 + nota da mudança
2. Substituir **seção §6** inteira pela estrutura §6.1/§6.2/§6.3 descrita abaixo
3. Adicionar **3 linhas** no §9 Registro de Decisões
4. Verificar que §7 e §8 ainda referenciam P1–P8 corretamente (devem continuar válidas — P1–P8 está intacto dentro de §6.1)

---

## EDIÇÃO 1 — Header (linhas 1–9)

**Antes (v1.1):**

```markdown
# Bússola de Produto — Storm Shield Enterprise

> **Nota:** "NS" = ERP de referência externo. Nome substituído por precaução (ADR-014).

> Documento de referência estratégica para decisões de roadmap, redesenho de UX e priorização de RFs no SSE.
> Criado em: 2026-04-17 (v1.0 via ADR-009). Atualizado em: 2026-04-21 (v1.1 via ADR-012).
> Autor: Luigi (PO) + PO Assistant
> **Propósito:** Servir de norte a todas as decisões de produto. Deve ser lido antes de qualquer sessão de redesenho, priorização ou discovery de RF.
> **Natureza:** Não é backlog. Não é arquitetura técnica. É bússola — orienta "que produto estamos construindo e para quem".
> **v1.1 (2026-04-21):** incorpora aprendizados de `ANALISE_NS_vs_BUSSOLA_v1.md` — novo princípio P8 (offline-first), §5 expandida (6 anti-features + 1099-NEC movido para Superamos + MACRS adicionado), §7 nota de nomenclatura "Workspace" + Global Search obrigatório, §8 estendida com RF-004/006/007 e ajuste Cockpit.
```

**Depois (v1.2):**

```markdown
# Bússola de Produto — Storm Shield Enterprise

> Documento de referência estratégica para decisões de roadmap, redesenho de UX e priorização de RFs no SSE.
> Criado em: 2026-04-17 (v1.0 via ADR-009). Atualizado em: 2026-04-21 (v1.1 via ADR-012, v1.2 via ADR-013).
> Autor: Luigi (PO) + PO Assistant
> **Propósito:** Servir de norte a todas as decisões de produto. Deve ser lido antes de qualquer sessão de redesenho, priorização ou discovery de RF.
> **Natureza:** Não é backlog. Não é arquitetura técnica. É bússola — orienta "que produto estamos construindo e para quem".
> **v1.1 (2026-04-21):** incorpora aprendizados de `ANALISE_NS_vs_BUSSOLA_v1.md` — novo princípio P8 (offline-first), §5 expandida, §7 Global Search + nomenclatura "Workspace", §8 estendida com RF-004/006/007.
> **v1.2 (2026-04-21):** incorporação parcial do pacote MF (ADR-013) — §6 reorganizada em §6.1 Produto (P1–P8 intactos), §6.2 Visuais (PV1–PV6 novos), §6.3 UX (PUX1–PUX6 novos). Zero mudança em P1–P8 nem em §1–§5, §7–§8.
```

---

## EDIÇÃO 2 — §6 reorganizada

**Substituir toda a seção atual (linhas 286–306, "## 6. Princípios de Design (guardrails)" até antes de "## 7. Arquitetura de Navegação por Persona") pelo bloco abaixo.**

```markdown
## 6. Princípios de Design (guardrails)

Qualquer nova tela, RF ou redesenho deve passar por estes três grupos de filtros:

- **§6.1 Princípios de Produto (P1–P8)** — guardrails estratégicos/operacionais. Definem **o que fazer e para quem**.
- **§6.2 Princípios Visuais (PV1–PV6)** — decisões de identidade. Definem **o que se vê**. Mudança rara.
- **§6.3 Princípios de UX (PUX1–PUX6)** — decisões de experiência. Definem **como se sente**. Aplicação contínua em cada feature.

Violação de qualquer princípio sem justificativa registrada em ADR → descope.

---

### §6.1 — Princípios de Produto (P1–P8)

**P1 — Landing por persona.** Não existe "a home page". Cada persona primária tem seu ponto de entrada com KPI/lista relevante. User com múltiplos roles escolhe workspace no primeiro acesso.

**P2 — Mobile-first para Technician, desktop-first para Owner/Estimator/Accountant.** Mobile não é responsive tardio — é fluxo de uso desenhado para celular. Técnico não deve nunca "rolar horizontalmente" nem "pinch-zoom" para registrar hora.

**P3 — Time-to-first-value < 30 min.** Wizard de onboarding + dados de exemplo opcionais. Qualquer feature que exige mais de 30 min de setup isolado precisa de ADR justificando.

**P4 — Operação do shop não depende do owner estar logado.** Owner viaja, o shop opera. Técnico e estimator têm autonomia completa dentro de seus escopos.

**P5 — Insurance-first, não out-of-pocket-first.** Fluxo padrão de estimate e SO é insurance claim com adjuster. Out-of-pocket é caminho paralelo menor. Invertido do que NS faz.

**P6 — Contabilidade nos bastidores.** Tech/estimator nunca veem "journal entry" ou "debit/credit". Owner vê KPIs agregados em linguagem de negócio ("margem", "receivable", "cash"). Accountant vê GL detalhado — é quem fala a língua contábil.

**P7 — NS é referência, não benchmark.** Feature nova só entra se passa no filtro "body shop médio de 5–15 func usa isso?". Se a justificativa é "NS tem" ou "pode ser necessário no futuro", desprioriza.

**P8 — Offline-first para shop floor (v1.1).** Técnico não pode perder trabalho quando WiFi cai. Operações críticas do mobile (timer, fotos, SO status) funcionam offline e sincronizam quando reconectar. Desktop pode assumir online; mobile do Technician **não**. Sem offline, mobile do técnico vira "ferramenta que só funciona no escritório" — contradiz P2. Origem: gap identificado em `ANALISE_NS_vs_BUSSOLA_v1.md §2.7` (FSM Mobile).

---

### §6.2 — Princípios Visuais (PV1–PV6)  ⭐

> Adotados em v1.2 via ADR-013 (incorporação parcial do pacote MF). Stack-agnósticos no nível do princípio; implementação no SSE usa Tailwind + shadcn/ui + next-themes + next/font. Mudança de qualquer PV exige ADR próprio.

**PV1 — Paleta com intenção.** Uma paleta primária estreita (3–5 cores semânticas) + neutros disciplinados. Cada cor tem papel definido: `primary` (ação principal), `destructive` (perigo/delete), `success` (confirmação), `warning` (alerta), `muted` (neutro de apoio), `background`/`foreground` (surface e texto). No SSE, implementadas como CSS variables do shadcn/ui em `apps/web/src/app/globals.css` + mapeadas no `tailwind.config.ts`. Sem paleta secundária livre. A **paleta concreta** (valores hex da cor primária, escolha de famílias) fica para RF-UI-SSE futuro; PV1 adota **o princípio**, não os valores.

**PV2 — Tipografia dual.** Uma família para títulos/marca + uma família para UI/corpo. Nunca mais que duas famílias ativas. No SSE, carregadas via `next/font` com preload automático. A definição das famílias é decisão PO em sessão futura; PV2 adota a **disciplina de dualidade**, não as famílias específicas.

**PV3 — Hero surfaces.** Cada tela principal tem **uma única superfície hero** que carrega o KPI ou ação central. Alto contraste, geralmente sobre `background` escuro ou `primary`. Reforça P1 — cada landing por persona tem seu hero (Cockpit=Cash disponível, Inbox=fila de estimates, My Work=SO ativa, Books=período aberto + status).

**PV4 — Tokens são a única fonte.** Zero valor hardcoded em componentes. Proibidos: Tailwind arbitrary values com valor literal (`bg-[#abc123]`, `p-[13px]`), `style={{ fontSize: '14px' }}`, cores hex direto no JSX. Permitidos: classes Tailwind utilitárias + CSS variables do shadcn/ui (`bg-primary`, `text-muted-foreground`, `rounded-md`). Dark mode, refactor de paleta e auditoria visual dependem disso.

**PV5 — Dark mode cidadão de primeira.** Dark não é "tema secundário" — é uma das duas faces do produto. No SSE, `next-themes` + CSS variables semânticas do shadcn/ui (`--background`, `--foreground`, `--primary`) trocam automaticamente via `.dark` class. Componentes nunca têm `if (isDark)`. Shop floor à noite e accountant com olhos cansados são ambos primeiros cidadãos.

**PV6 — Densidade controlada.** Densidade alta só em tabelas e listas longas (Trial Balance, Journal Entries, lista de SOs por semana). KPIs, hero cards e CTAs sempre ganham ar. Complementa P6: accountant vê GL denso intencionalmente; owner no Cockpit vê KPIs folgados. "Tudo denso" parece dashboard de SQL Server, não ERP purpose-built.

---

### §6.3 — Princípios de UX (PUX1–PUX6)  ⭐

> Adotados em v1.2 via ADR-013. Cada PR que cria/altera UI é avaliado contra estes 6. `frontend-reviewer` (em `.claude/agents/SSE_Prompts_Squad_IA.md` DM-06) carrega a checklist verificável. Regra 19 do `CLAUDE.md` torna violação bloqueante.

**PUX1 — Hierarquia clara.** Cada tela tem **1–3 elementos hero**, não mais. Tudo o resto se subordina visualmente. Reforça P1 + PV3.
*Verificável:*
- [ ] KPI/ação principal identificável em <2 segundos?
- [ ] Títulos usam a família display quando aplicável?
- [ ] KPIs primários visivelmente maiores que secundários (escala ≥1.5×)?

**PUX2 — Tipografia disciplinada.** Corpo em fonte UI; títulos em display. Escala tipográfica limitada via Tailwind tokens (`text-sm`, `text-base`, `text-lg`, `text-xl`, etc — sem arbitrary). **Números financeiros em `tabular-nums`** (Tailwind: `tabular-nums` utility). Crítico para P6 — GL, P&L, Trial Balance, cockpit cash precisam alinhar colunas.
*Verificável:*
- [ ] Apenas utilities Tailwind de texto (sem `text-[13.5px]`)?
- [ ] Números em colunas alinham verticalmente (`tabular-nums`)?
- [ ] `h1`/`h2` usam classe display; corpo usa sans UI?

**PUX3 — Iconografia única.** **Lucide** é a biblioteca canônica (default do shadcn/ui). **Zero emojis em chrome de UI** — botões, navbar, cards de KPI, headers. Emojis aceitos **apenas em dados do usuário** (campo `notes`, nome de categoria customizada, observação em SO). Tamanhos via tokens Tailwind (`size-4`, `size-5`, `size-6`).
*Verificável:*
- [ ] Nenhum 📊 ou 🏠 em botões, navbar, cards?
- [ ] Todos os ícones vêm de `lucide-react`?
- [ ] Tamanhos usam classes Tailwind, não estilo inline?

**PUX4 — Cor com intenção.** Semântica shadcn/ui em contextos corretos: `primary` = ação central, `destructive` = delete/erro, `success` = confirmação (verde), `warning` = atenção (âmbar), `muted` = neutro secundário. Primária só em CTAs principais (1 por tela). Contraste AA/AAA em hero surfaces dark obrigatório.
*Verificável:*
- [ ] Zero cores hardcoded ou `text-blue-500` ad-hoc?
- [ ] Sucesso não aparece como decoração aleatória?
- [ ] Contraste validado (ex: axe DevTools) em superfícies escuras?

**PUX5 — Espaço respiratório.** Padding e gap via Tailwind scale (`p-2`, `p-4`, `p-6`, `gap-4`, etc). Hero cards ganham `p-8` ou mais. Densidade só onde a função pede — tabelas GL usam `py-1`/`py-2`, KPIs nunca.
*Verificável:*
- [ ] Apenas utilities Tailwind de spacing (sem `p-[12px]`)?
- [ ] Hero cards com gap visualmente folgado?
- [ ] Listas longas usam densidade controlada?

**PUX6 — Ritmo e movimento sóbrios.** Animações curtas via Tailwind transitions (`transition-all duration-200`). **Zero bounce/rotate** em elementos funcionais (botão de save, CTA). **Skeletons em loading** (shadcn/ui `Skeleton`), não spinners infinitos. Reforça P3 — onboarding rápido não pode ter "carregando..." sem forma.
*Verificável:*
- [ ] Durações via classes Tailwind (`duration-150`, `duration-300`)?
- [ ] Loadings usam `<Skeleton />` e não `<Spinner />`?
- [ ] Nenhum `animate-bounce` em botão primário?

---
```

---

## EDIÇÃO 3 — §9 Registro de Decisões (adicionar 3 linhas no final da tabela)

**Adicionar após a linha `| 2026-04-21 | Bússola SSE **v1.1** oficializada via ADR-012 | PO Cowork |`:**

```markdown
| 2026-04-21 | **§6 reorganizada** em §6.1 Produto (P1–P8), §6.2 Visuais (PV1–PV6), §6.3 UX (PUX1–PUX6) — P1–P8 intactos | PO Cowork |
| 2026-04-21 | **PV1–PV6 e PUX1–PUX6 adotados** do pacote MF com redação SSE-specific (Tailwind + shadcn/ui + next-themes + next/font) | PO Cowork |
| 2026-04-21 | Bússola SSE **v1.2** oficializada via ADR-013 | PO Cowork |
```

---

## Verificação pós-patch (DM deve rodar)

1. `grep -c "^## " docs/strategy/BUSSOLA_PRODUTO_SSE.md` — deve retornar 10 (não mudou vs v1.1: §1..§10)
2. `grep -c "^### §6\." docs/strategy/BUSSOLA_PRODUTO_SSE.md` — deve retornar 3 (§6.1, §6.2, §6.3 novos)
3. `grep "P1 — Landing por persona" docs/strategy/BUSSOLA_PRODUTO_SSE.md` — deve continuar encontrado (P1 intacto)
4. `grep "PV1 — Paleta com intenção" docs/strategy/BUSSOLA_PRODUTO_SSE.md` — novo, deve ser encontrado
5. `grep "PUX2 — Tipografia disciplinada" docs/strategy/BUSSOLA_PRODUTO_SSE.md` — novo, deve ser encontrado
6. Validar que §7 "Arquitetura de Navegação por Persona" ainda existe e não foi tocada

---

*Fim do patch Bússola v1.2. Aplicar integralmente em um único commit: `docs(strategy): promote Bussola to v1.2 with PV/PUX (ADR-013)`.*
