# AGENTS.md — Guia para Agentes Claude Code

> Leitura obrigatória ao abrir uma sessão neste repositório.
> Mantenha este arquivo curto. Detalhes arquiteturais ficam em `CLAUDE.md`.

---

## 1. Protocolo de Abertura (executar SEMPRE no início da sessão)

```bash
# 1. Sincronizar com main
git fetch origin
git pull origin main
git branch -a                       # ver branches abertas por outros agentes
git log --oneline -10               # últimos commits

# 2. Ler contexto do projeto
#    - CLAUDE.md (raiz)            → arquitetura, convenções, stack
#    - .auto-memory/MEMORY.md     → persistent memory index
#    - docs/architecture/SSE_Development_Plan.xlsx → tarefas pendentes
#    - docs/decisions/*.md         → ADRs vigentes (001–008)

# 3. Identificar sua tarefa
#    Pergunte ao Luigi qual grupo/tarefa, OU consulte o prompt da fase ativa
```

---

## 2. Documentos de Referência Obrigatórios

Todo agente do squad deve consultar estes artefatos antes de iniciar trabalho:

1. **`docs/strategy/BUSSOLA_PRODUTO_SSE.md`** — Bússola de Produto. Camada estratégica. Informa priorização, personas, princípios de design. Ver ADR-009 para autoridade.
2. **`docs/process/HANDOFF_PROTOCOL.md`** — Protocolo de Handoff. Camada operacional. Informa ownership de arquivos em `.auto-memory/`, templates, ciclo de vida de tarefas, cadência.
3. **`docs/process/OPERATING_MODEL_v2.md`** — Operating Model. Informa atores, cadência oficial, rituais (rotação mensal, revisões trimestrais), métricas oficiais (lead time, # BLOCKED/semana). Ver ADR-010 para autoridade.
4. **`CLAUDE.md`** — Convenções técnicas. Stack, migrations, regras invioláveis (regras 1–18).
5. **ADRs em `docs/decisions/`** — decisões arquiteturais históricas (001–010).

Em caso de ambiguidade entre documentos, a hierarquia é:
- Decisão estratégica: Bússola > CLAUDE.md
- Decisão operacional: Handoff Protocol > Operating Model v2 > convenções implícitas
- Decisão técnica: ADRs específicas > CLAUDE.md > convenções do módulo

---

## 4. Fontes de Instrução (ordem de prioridade)

| # | Arquivo | Quando usar |
|---|---|---|
| 1 | `docs/strategy/BUSSOLA_PRODUTO_SSE.md` | Camada estratégica — personas, gaps, priorização |
| 2 | `CLAUDE.md` | Arquitetura, stack, 18 regras obrigatórias, convenções universais |
| 3 | `.auto-memory/MEMORY.md` | Persistent memory — project status, priorities, session history |
| 4 | `sse-squad-dashboard.html` | Squad dashboard — live metrics, pipeline, alerts |
| 5 | `docs/decisions/NNN-*.md` | ADRs — justificativas arquiteturais |
| 6 | `docs/architecture/*.docx` | Especificações de BD e requisitos funcionais |
| 7 | Mensagem do Luigi | Supraordena os acima em caso de conflito |

---

## 5. Regras Inegociáveis (resumo das 18 regras do CLAUDE.md)

1. Nunca commitar em `main` direto — sempre feature branch
2. Sempre `tenant_id` em queries + RLS como 2ª camada
3. UUID v7 como PK, `DECIMAL(14,2)` para money (nunca FLOAT)
4. Nunca `CASCADE DELETE` em tabelas financeiras/contábeis
5. Usar `TenantDatabaseService` (nunca `KNEX_CONNECTION` direto em services tenant-scoped)
6. `KNEX_ADMIN_CONNECTION` apenas para migrations e operações cross-tenant
7. RLS policy obrigatória ao criar novas tabelas com `tenant_id`
8. Novos módulos → atualizar `PLAN_FEATURES` + `@RequirePlanFeature`
9. Testes: mínimo 80% coverage nos services
10. Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
11. Nunca commitar `.env`, `.credentials-staging.env`, chaves, tokens
12. Nunca modificar `Leading Practices_Brazil_*.docx` (referência Oracle)
13. Mudança arquitetural → atualizar `CLAUDE.md` + criar ADR em `docs/decisions/`
14. `tenant_id` e `schema_name` nunca expostos em responses para o cliente final
15. Consultar Bússola antes de decisões de priorização, escopo de RF ou redesenho de UX (ver ADR-009)
16. Linkar persona + gap fechado na descrição de PRs com tela nova ou mudança de navegação
17. Seguir `docs/process/HANDOFF_PROTOCOL.md` ao passar tarefas entre agentes
18. Operar conforme `docs/process/OPERATING_MODEL_v2.md` — atores, cadência, rituais, métricas

---

## 6. Fluxo de Trabalho por Tarefa

```
1. git pull origin main
2. git checkout -b feature/SSE-{numero}-{descricao-kebab}
3. Implementar (seguir padrão do CustomersModule como referência)
4. Escrever testes (Jest, >80% coverage)
5. Rodar local: pnpm --filter api test && pnpm --filter api build
6. git commit -m "feat(module): descrição"   (Conventional Commits)
7. git push -u origin feature/SSE-{numero}
8. Abrir PR com descrição detalhada + link para issue/tarefa
9. Avisar Luigi para revisão
```

---

## 7. Coordenação com Outros Agentes

Há outro(s) agente(s) trabalhando neste repo simultaneamente.

- **Antes** de cada grupo/tarefa: `git pull origin main` + `git branch -a`
- **Se encontrar branch conflitante**: pare, avise o Luigi — não sobrescreva trabalho
- **Nunca** force-push em `main` ou `develop`
- **Antes** de implementar algo, verifique se já não foi feito (planilha gerencial + `git log --all --oneline | grep -i "nome-do-modulo"`)

---

## 8. Checklist Final de PR

- [ ] Branch criada a partir de `main` atualizada
- [ ] Commits em formato Conventional Commits
- [ ] Testes passando localmente (`pnpm test`)
- [ ] TypeScript sem erros (`pnpm typecheck`)
- [ ] Nenhum secret/credencial no diff
- [ ] Se novo módulo: registrado em `app.module.ts` + `PLAN_FEATURES`
- [ ] Se nova tabela: migration idempotente + RLS policy + tenant_id + índices
- [ ] Se mudança arquitetural: CLAUDE.md atualizado + ADR criado
- [ ] Descrição do PR explica "o quê" + "por quê" + como testar
- [ ] Se cria/altera UI (`.tsx`): `frontend-reviewer` acionar obrigatoriamente (Regra 19); checklist DM-06 inclui PV1–PV6 + PUX1–PUX6 (Bússola §6.2/§6.3 via ADR-013). Violação bloqueante.

> **Nota (ADR-013, 2026-04-21):** `frontend-reviewer` carrega checklist expandido de 20 itens (8 base + 6 PV + 6 PUX). Regra 19 do `CLAUDE.md` torna violação de PV/PUX bloqueante de merge. Prompt em `.claude/agents/SSE_Prompts_Squad_IA.md` DM-06.

---

## 9. Quando Pedir Ajuda ao Luigi

- Conflito de merge não trivial
- Dúvida sobre regra de negócio (consultar requisitos funcionais primeiro)
- Trade-off arquitetural com impacto em múltiplos módulos
- Necessidade de novo secret / variável de ambiente
- Tarefa bloqueada por dependência externa (API, credencial, decisão de produto)

---

## 10. Referências Rápidas

- **Padrão de referência (copy this pattern):** `apps/api/src/modules/customers/`
- **Frontend pattern:** `apps/web/src/app/(dashboard)/customers/`
- **Convenção de migrations:** `apps/api/src/database/migrations/` (000–010 active)
- **Tenant provisioning:** `apps/api/src/database/tenant-provisioning.ts`
- **Planilha de tarefas:** `docs/architecture/SSE_Development_Plan.xlsx`
- **FAM reference SQL:** `docs/sql/001_fam_tables.sql`, `002_fam_seed_data.sql`, `003_fam_depreciation_functions.sql`
- **ADRs:** `docs/decisions/001-*.md` through `010-*.md`
- **Bússola de Produto:** `docs/strategy/BUSSOLA_PRODUTO_SSE.md`
- **RF Backlog:** `docs/strategy/RF_BACKLOG.md`
- **Handoff Protocol:** `docs/process/HANDOFF_PROTOCOL.md`
- **Operating Model v2:** `docs/process/OPERATING_MODEL_v2.md`
