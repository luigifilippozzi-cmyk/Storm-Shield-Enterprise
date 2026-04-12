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

## 2. Fontes de Instrução (ordem de prioridade)

| # | Arquivo | Quando usar |
|---|---|---|
| 1 | `CLAUDE.md` | Arquitetura, stack, 14 regras obrigatórias, convenções universais |
| 2 | `.auto-memory/MEMORY.md` | Persistent memory — project status, priorities, session history |
| 3 | `sse-squad-dashboard.html` | Squad dashboard — live metrics, pipeline, alerts |
| 4 | `docs/decisions/NNN-*.md` | ADRs — justificativas arquiteturais |
| 5 | `docs/architecture/*.docx` | Especificações de BD e requisitos funcionais |
| 6 | Mensagem do Luigi | Supraordena os acima em caso de conflito |

---

## 3. Regras Inegociáveis (resumo das 14 regras do CLAUDE.md)

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

---

## 4. Fluxo de Trabalho por Tarefa

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

## 5. Coordenação com Outros Agentes

Há outro(s) agente(s) trabalhando neste repo simultaneamente.

- **Antes** de cada grupo/tarefa: `git pull origin main` + `git branch -a`
- **Se encontrar branch conflitante**: pare, avise o Luigi — não sobrescreva trabalho
- **Nunca** force-push em `main` ou `develop`
- **Antes** de implementar algo, verifique se já não foi feito (planilha gerencial + `git log --all --oneline | grep -i "nome-do-modulo"`)

---

## 6. Checklist Final de PR

- [ ] Branch criada a partir de `main` atualizada
- [ ] Commits em formato Conventional Commits
- [ ] Testes passando localmente (`pnpm test`)
- [ ] TypeScript sem erros (`pnpm typecheck`)
- [ ] Nenhum secret/credencial no diff
- [ ] Se novo módulo: registrado em `app.module.ts` + `PLAN_FEATURES`
- [ ] Se nova tabela: migration idempotente + RLS policy + tenant_id + índices
- [ ] Se mudança arquitetural: CLAUDE.md atualizado + ADR criado
- [ ] Descrição do PR explica "o quê" + "por quê" + como testar

---

## 7. Quando Pedir Ajuda ao Luigi

- Conflito de merge não trivial
- Dúvida sobre regra de negócio (consultar requisitos funcionais primeiro)
- Trade-off arquitetural com impacto em múltiplos módulos
- Necessidade de novo secret / variável de ambiente
- Tarefa bloqueada por dependência externa (API, credencial, decisão de produto)

---

## 8. Referências Rápidas

- **Padrão de referência (copy this pattern):** `apps/api/src/modules/customers/`
- **Frontend pattern:** `apps/web/src/app/(dashboard)/customers/`
- **Convenção de migrations:** `apps/api/src/database/migrations/` (000–010 active)
- **Tenant provisioning:** `apps/api/src/database/tenant-provisioning.ts`
- **Planilha de tarefas:** `docs/architecture/SSE_Development_Plan.xlsx`
- **FAM reference SQL:** `docs/sql/001_fam_tables.sql`, `002_fam_seed_data.sql`, `003_fam_depreciation_functions.sql`
- **ADRs:** `docs/decisions/001-*.md` through `008-*.md`
