# ADR 009 — Adoção da Bússola de Produto como Artefato Estratégico Oficial

> **Nota:** Neste documento, "NS" refere-se a um ERP proprietário de terceiros usado exclusivamente como referência comparativa externa, sem relação comercial, licenciamento ou endosso. O nome da marca foi substituído por precaução (ver ADR-014).

**Data:** 2026-04-17
**Status:** Aceito
**Decisor:** Luigi Filippozzi (PO)
**Escopo:** Governança de produto, priorização de roadmap, critério de decisão para RFs e redesenhos

---

## Contexto

O desenvolvimento do SSE avançou ~95% da Fase 1 com resultado técnico sólido: 12 módulos, 65 entidades, 98 endpoints, 293 testes passando, 8 ADRs arquiteturais, CI verde, deploy web verde. A stack multi-tenant (schema-per-tenant + RLS + dual DB users + plan enforcement) é robusta e madura para o estágio do produto.

Apesar disso, a construção foi feita **de baixo para cima** — RF por RF, módulo por módulo — sem um artefato estratégico que ancorasse decisões de priorização em **perguntas de persona e de mercado**. O `CLAUDE.md` organiza o roadmap em 7 Fases × 12 domínios, o que fornece um mapa técnico coerente mas **não responde explicitamente**:

1. Quem é o cliente ideal (ICP) e quem não é?
2. Quais são as personas primárias, suas perguntas centrais e jobs-to-be-done?
3. Qual a métrica de sucesso de produto nos próximos 12 meses?
4. Onde o SSE simplifica vs. NS/Mitchell/CCC, e onde herda?
5. Quais os gaps críticos ordenados por impacto na métrica de sucesso (não por módulo)?

Sintomas concretos da ausência desse artefato observáveis no estado atual:

- **FAM entregou 5 métodos de depreciação** (2 implementados em TS, 3 documentados) — paridade com NS que não tem uso no ICP predominante do produto. Ver ADR-008.
- **Mobile para técnico está em Fase 5** — o técnico é a persona mais frequente no dia-a-dia do shop, mas fica sem ferramenta até ~12 meses pós Fase 1.
- **Dashboard é unitário** — não há landing por persona. Owner, Estimator, Technician e Accountant veem a mesma home e navegam horizontalmente para suas áreas.
- **Insurance workflow** — core para 70–90% da receita do ICP — está subdesenvolvido em UI apesar de existir em schema.
- **Onboarding não é instrumentado** — não há wizard, não há event tracking de activation, apesar de activation rate ser a métrica natural para ERP SaaS multi-tenant.

Na sessão PO de 2026-04-17, foi feita uma discovery estratégica de três perguntas fundacionais que produziu as seguintes respostas:

| Pergunta | Resposta |
|---|---|
| Quem é o ICP em 12 meses? | Body shop médio com 5–15 funcionários nos EUA |
| Qual a métrica de sucesso 12m? | # tenants ativos + activation rate |
| Qual o posicionamento vs. incumbentes? | Alternativa simpler + cheaper + purpose-built |

Essas três respostas formam um trio coerente que permitiu, pela primeira vez no projeto, a redação de um documento de referência estratégica: a **Bússola de Produto** (`docs/strategy/BUSSOLA_PRODUTO_SSE.md`), elaborada na mesma sessão.

## Decisão

Adotar a **Bússola de Produto** como **artefato estratégico oficial** do Storm Shield Enterprise, com os seguintes atributos de governança:

### 1. Localização e versionamento

- Arquivo canônico: `docs/strategy/BUSSOLA_PRODUTO_SSE.md`
- Versionado no repositório junto com código e migrations.
- Qualquer alteração material (mudança de persona, gap, princípio, prioridade) requer commit dedicado com mensagem `docs(strategy): ...` e referência à sessão PO que decidiu.

### 2. Autoridade hierárquica

A Bússola é **camada estratégica acima** do roadmap técnico do CLAUDE.md.

```
Decisão estratégica de produto → Bússola (docs/strategy/)
Decisão arquitetural técnica   → ADRs (docs/decisions/)
Mapa técnico e convenções      → CLAUDE.md
Backlog operacional            → GitHub Issues + .auto-memory/
```

Quando há **conflito entre Bússola e CLAUDE.md** — por exemplo, a Bússola sugere antecipar mobile do técnico enquanto o CLAUDE.md posiciona mobile em Fase 5 — a Bússola **prevalece** como input para decisão, mas a mudança efetiva do CLAUDE.md requer sessão PO explícita e pode gerar ADR complementar.

### 3. Uso obrigatório em pontos de decisão

- **Toda sessão PO** começa com releitura das seções 1 (ICP), 2 (personas) e 6 (princípios de design) da Bússola para recalibrar contexto.
- **Todo RF novo** passa pelo filtro da seção 2 e 4: qual persona serve? qual gap fecha? qual princípio respeita? Sem resposta clara → desprioriza.
- **Todo PR** que cria tela nova deve linkar na descrição a persona primária servida, conforme seção 7 (arquitetura de navegação por persona).
- **Priorização de roadmap** (seção 8) substitui a leitura linear por Fases do CLAUDE.md para fins de ordem de implementação. O CLAUDE.md por Fases continua válido como mapa técnico.

### 4. Revisão e cadência

- **Revisão trimestral** obrigatória: as personas ainda são essas? os gaps ainda são estes? a métrica ainda faz sentido? Registra em §9 da Bússola.
- **Revisão ad-hoc** quando houver mudança material de mercado, pivot de segmento, ou descoberta de dados que invalide hipóteses.
- **Atualizações de baixo impacto** (ajustes de redação, nova decisão registrada) podem ser feitas em qualquer sessão PO. Atualizações estruturais (nova persona, mudança de ICP, mudança de métrica de sucesso) requerem novo ADR.

### 5. Escopo do PO Assistant

O PO Assistant (este agente em modo Cowork) é responsável por:

- Lembrar das sessões passadas via `.auto-memory/project_sse_status.md` e dispositivos de memória persistente.
- **Consultar a Bússola** antes de propor priorização, revisar escopo de issue ou redigir novo RF.
- **Alertar** quando houver decisão em curso que contradiz a Bússola sem justificativa explícita.
- **Sugerir atualização da Bússola** quando detectar drift entre o documento e decisões recorrentes.

## Alternativas Consideradas

1. **Não adotar artefato estratégico formal — manter CLAUDE.md como guia único.**
   Rejeitado: CLAUDE.md é excelente como mapa técnico, mas não responde perguntas de persona/mercado. Sem artefato estratégico, decisões de priorização continuam guiadas por inércia arquitetural ("o próximo módulo na Fase X") em vez de impacto no usuário.

2. **Usar um PRD tradicional por release em vez de documento-bússola persistente.**
   Rejeitado: PRDs são táticos e cobrem escopo de release específico. Eles não ancoram decisões de **longo prazo** sobre quem é o cliente, qual é o posicionamento e como priorizamos entre releases. PRDs podem existir complementarmente para features grandes, mas não substituem a bússola.

3. **Adotar a Bússola apenas como documento informal (sem ADR).**
   Rejeitado: sem registro formal de ADR, o documento perde autoridade em 3–6 meses. Novos contributors (humanos ou agentes IA) não sabem se é "oficial" ou "brainstorm". O ADR resolve isso permanentemente.

4. **Replicar literalmente a Bússola do projeto Minhas Finanças (MF).**
   Rejeitado: MF tem 1 persona (controller familiar); SSE tem 4 personas. MF é B2C single-user; SSE é B2B SaaS multi-tenant. MF compete em app store; SSE compete com ERPs. A estrutura geral é inspiração válida — o conteúdo é necessariamente novo.

## Consequências

### Positivas

- **Clareza estratégica permanente** — qualquer contributor (humano ou agente) consegue ler a Bússola e entender quem é o cliente, qual é o jogo, e como priorizar.
- **Filtro anti-bloat** — feature com racional "NS tem" sem passar no filtro da persona é descartada antes do dev.
- **Instrumentação da métrica** — adoção da Bússola força a discussão "como medimos activation?", criando o Gap 8 da seção 4 da Bússola.
- **Alinhamento squad IA** — PM Agent, Dev Manager e subagentes passam a ter artefato único de referência estratégica, complementar ao CLAUDE.md técnico.
- **Rastreabilidade de decisões de produto** — a Bússola tem §9 com registro datado, separado do ADR tradicional (que cobre decisões arquiteturais).

### Negativas / Riscos

- **Custo de manutenção** — a Bússola precisa ser atualizada. Se virar documento morto, contradiz a decisão e perde valor.
- **Risco de rigidez** — princípios da seção 6 podem ser aplicados de forma dogmática, bloqueando RFs válidos com justificativa forte. Mitigado pelo princípio "violação requer justificativa explícita", não "proibição".
- **Risco de conflito com CLAUDE.md** — enquanto ambos existirem, pode haver dúvida sobre qual prevalece em decisões específicas. Mitigado pela regra de autoridade hierárquica explícita nesta ADR (§Decisão item 2).
- **Necessidade de evangelização** — subagentes (security, test, db, frontend) operam em CLAUDE.md primariamente. Precisam ser informados da Bússola para considerarem-na em reviews que tocam UX/persona.

### Mitigações

- PR template (`.github/PULL_REQUEST_TEMPLATE.md`) deve incluir campo "Persona servida + gap fechado (ref. Bússola §2/§4)".
- Revisão trimestral formal previne documento morto.
- Patch sugerido ao CLAUDE.md adiciona referência à Bússola na seção 10 (Regras para o Claude Code), garantindo que qualquer leitura do CLAUDE.md direciona para a Bússola quando a decisão é estratégica.
- PM Agent inclui no daily status um check de "houve decisão nesta semana que contradiz a Bússola?".

## Implementação

### Arquivos criados

| Arquivo | Ação | Observação |
|---|---|---|
| `docs/strategy/BUSSOLA_PRODUTO_SSE.md` | Criado | Bússola de Produto v0.1 — 10 seções |
| `docs/decisions/009-adocao-bussola-de-produto.md` | Criado | Este ADR |

### Arquivos a alterar (sugestões — não executadas pelo PO nesta sessão)

| Arquivo | Ação sugerida | Responsável |
|---|---|---|
| `CLAUDE.md` §10 | Adicionar item "15. Sempre consultar `docs/strategy/BUSSOLA_PRODUTO_SSE.md` antes de decisões de priorização e escopo" | Dev Manager (via PR separado) |
| `.github/PULL_REQUEST_TEMPLATE.md` | Adicionar seção "Persona servida + gap fechado (ref. Bússola)" | Dev Manager (via PR separado) |
| `AGENTS.md` | Referenciar Bússola como input estratégico complementar ao CLAUDE.md | Dev Manager (via PR separado) |
| `.auto-memory/project_sse_status.md` | Registrar sessão 2026-04-17 com adoção da Bússola e ADR-009 | PO Assistant (nesta sessão) |

### Dependências para o próximo horizonte

A Bússola §8 identifica prioridades P0 que requerem decisão e execução pelo Dev Manager:

- **P0-30d**: Setup wizard de onboarding + event tracking de activation (Gap 3 + Gap 8)
- **P0-30d**: Landing por persona + sidebar por workspace (Gap 1)
- **P1-60d**: Cockpit do Owner + Insurance workflow visual + Mobile PWA Technician (Gaps 4, 5, 2)

Estes itens devem ser convertidos em RFs e issues GitHub em sessão PO subsequente, passando pelo protocolo de discovery ≤3 perguntas conforme project instructions do PO Assistant.

## Referências

- `docs/strategy/BUSSOLA_PRODUTO_SSE.md` — Bússola de Produto v0.1
- `CLAUDE.md` — Bootstrap técnico do SSE
- `docs/decisions/007-agent-squad-architecture.md` — ADR do Squad IA
- `docs/decisions/008-fam-implementation-decisions.md` — Exemplo concreto de gap "paridade NS" reconhecido pelo próprio squad (MACRS simplificado)
- Referência externa: documento `BUSSOLA_PRODUTO.md` do projeto Minhas Finanças (MF) — inspiração estrutural, conteúdo integralmente novo para SSE
