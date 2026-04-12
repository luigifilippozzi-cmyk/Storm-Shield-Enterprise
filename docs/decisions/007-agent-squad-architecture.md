# ADR 007 — Agent Squad Architecture (IA Development Team)

**Data:** 2026-04-08
**Status:** Aceito
**Decisor:** Luigi Filippozzi
**Escopo:** Modelo de desenvolvimento com agentes IA para SSE

---

## Contexto

O desenvolvimento do SSE na Fase 1 usava 3 agentes Claude Code independentes trabalhando em paralelo (Agentes 1, 2 e 3), cada um em seu próprio feature branch. Esse modelo gerou problemas concretos:

1. **Inconsistência de padrões** — cada agente tomava decisões técnicas locais (nomes de variáveis, estrutura de DTOs, tratamento de erros) sem visibilidade do que os outros faziam
2. **Decisões arquiteturais descoordenadas** — agente A criava um pattern, agente B criava outro para o mesmo problema
3. **Risco de conflitos de merge** — 3 branches longos divergindo de `main` simultaneamente
4. **Retrabalho** — código que precisava ser refeito após merge por não seguir o padrão adotado por outro agente
5. **Ausência de revisão especializada** — nenhum agente tinha expertise profunda em segurança, performance de queries ou frontend

Com a migração do repositório para `C:\Dev\storm-shield-enterprise` e a consolidação da Fase 1 (~90% concluída, 224 testes passando), era o momento de reformular o modelo de trabalho.

## Decisão

Adotar um **Squad de IA estruturado** com hierarquia clara, subagentes especializados e integração via MCP (Model Context Protocol):

```
Product Owner (Luigi)
    │
    ├── PM Agent (scheduled task)
    │       Status reports diários, impedimentos, métricas
    │
    └── Dev Manager Agent (scheduled task)
            Estratégia técnica, coordenação, decisões arquiteturais
            │
            ├── security-reviewer    → audit multi-tenant, RLS, tenant_id exposure
            ├── test-runner          → testes, coverage (meta 80%), relatórios Jest
            ├── db-reviewer          → migrations, queries Knex, políticas RLS, índices
            └── frontend-reviewer    → Next.js/React, hooks, componentes, acessibilidade
```

### Componentes da Decisão

1. **4 subagentes especializados** em `.claude/agents/`, cada um com prompt focado em seu domínio
2. **MCP GitHub habilitado** em `.claude/settings.json` — acesso direto ao repositório (commits, PRs, branches)
3. **Agent Teams habilitado** — orquestração nativa de subagentes dentro de sessões Claude Code
4. **Scheduled tasks** para PM Agent e Dev Manager com prompts estruturados e dashboards
5. **Protocolo de coordenação** documentado em `AGENTS.md` §5

## Alternativas Consideradas

1. **Manter 3 agentes independentes** — rejeitado: problemas descritos acima persistiriam, especialmente à medida que a codebase cresce nas Fases 2-4
2. **1 agente único fazendo tudo** — rejeitado: perde a capacidade de revisão cruzada e especialização; context window insuficiente para todo o projeto
3. **Squad sem MCP (apenas prompts)** — rejeitado: sem MCP GitHub, os agentes não têm visibilidade real do estado do repositório (branches, PRs abertos, CI status)
4. **Ferramentas externas (Linear, Jira)** — rejeitado: adiciona complexidade desnecessária neste estágio; o squad IA opera dentro do Claude Code ecosystem

## Consequências

### Positivas
- **Coordenação centralizada**: Dev Manager toma decisões técnicas consistentes
- **Revisão especializada por domínio**: cada subagente tem foco profundo (segurança, testes, DB, frontend)
- **Rastreabilidade**: MCP GitHub permite que agentes vejam commits, PRs e branches sem sair do Claude Code
- **Escalabilidade**: novos subagentes podem ser adicionados (ex: `performance-reviewer`, `api-reviewer`) sem alterar a arquitetura
- **Governança documentada**: protocolos em CLAUDE.md §11, AGENTS.md §5, e este ADR

### Negativas / Riscos
- **Overhead de coordenação**: scheduled tasks consomem tokens e tempo; precisa balancear frequência vs custo
- **Dependência do Claude Code ecosystem**: MCP servers e Agent Teams são features em evolução; breaking changes possíveis
- **Curva de aprendizado**: novos desenvolvedores (humanos ou agentes) precisam ler CLAUDE.md + AGENTS.md + ADRs antes de contribuir
- **Single point of failure**: se o Dev Manager Agent produzir decisões inconsistentes, propaga para todos os subagentes

### Mitigações
- PM Agent monitora métricas e escala impedimentos ao PO (Luigi)
- Protocolos claros de `git pull` antes de cada tarefa e escalação de conflitos
- Regra: mensagens diretas de Luigi supraordenam qualquer decisão do squad
- Revisão periódica dos prompts dos scheduled tasks para manter alinhamento

## Implementação

Branch: `feature/SSE-035-consolidation-and-squad-setup` (merged via PR #13)

### Arquivos Criados/Modificados

| Arquivo | Ação |
|---|---|
| `.claude/agents/security-reviewer.md` | Criado — prompt do subagente de segurança |
| `.claude/agents/test-runner.md` | Criado — prompt do subagente de testes |
| `.claude/agents/db-reviewer.md` | Criado — prompt do subagente de banco de dados |
| `.claude/agents/frontend-reviewer.md` | Criado — prompt do subagente de frontend |
| `.claude/settings.json` | Atualizado — MCP GitHub + Agent Teams habilitados |
| `CLAUDE.md` §11 | Atualizado — regras do squad e protocolo de orquestração |
| `AGENTS.md` §5 | Atualizado — coordenação entre agentes |
| `docs/SSE_Squad_IA_Guide.md` | Criado — guia operacional completo |

## Referências

- [Claude Code Agent Teams](https://docs.anthropic.com/en/docs/claude-code)
- [MCP Protocol](https://modelcontextprotocol.io/)
- PR #13: `feature/SSE-035-consolidation-and-squad-setup`
- `docs/SSE_Squad_IA_Guide.md` — guia operacional
