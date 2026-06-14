## Tarefa DM ? BUG-D: Destravar deploy staging Fly.io (root-cause multi-bug) ? Prioridade P0

Contexto:
Sessao PO 2026-05-28 tentou executar smoke UAT do BUG-C (PR #85 ja merged em main, c3c7af1).
Deploy Fly.io e pre-requisito do UAT e esta bloqueado por multiplas falhas concorrentes
documentadas como T-20260412-1 (BLOCKED desde 2026-04-12).

Esta tarefa autoriza investigacao ampla. DM deve atacar TODAS as causas raizes,
nao patch isolado. UAT Fase 1 esta completamente bloqueado ate deploy verde.

EVIDENCIAS:

E1 ? CI em main FAILING (3 workflows pos-merge BUG-C, SHA c3c7af1)
  - Run 26423752522 Deploy API (Staging) ? failure (28P01)
  - Run 26423752508 Deploy Staging ? failure
  - Run 26423752506 CI ? failure

E2 ? migration:run falha com Postgres 28P01 (invalid_password)
  - mesma raiz que T-20260509-2 e BUG-05, nao resolvido por BUG-C
  - bugs independentes que estavam sobrepostos

E3 ? flyctl da raiz: dockerfile path absoluto Windows
  - apps/api/fly.toml usa path relativo ../../
  - flyctl resolve com prefixo C:\ errado

E4 ? flyctl de apps/api: archive/tar unknown file mode
  - bug conhecido flyctl Windows ao tarball build context

E5 ? Workflow Deploy Staging NAO deploya
  - so faz build+push para ghcr.io
  - deploy-api-staging.yml e separado

E6 ? Maquina Fly.io rodando imagem PRE-BUG-C
  - deployment-01KQNDTZ... criado antes de 2026-05-25 23:24Z
  - healthchecks verdes mas codigo antigo

E7 ? Secrets Fly.io OK
  - DATABASE_URL_UNPOOLED, DATABASE_URL, REDIS_URL, CLERK_SECRET_KEY presentes

CAUSAS RAIZES (atacar TODAS):

RC-1: migration:run com Neon falha (28P01) no GH Actions
  Hipoteses: pooled vs unpooled mismatch / credencial expirada / SSL config
  Acao: instrumentar run-migrations.ts com logging mascarado
        possivelmente migrar para DATABASE_URL_UNPOOLED no step de migration

RC-2: Deploy nao dispara automaticamente
  Workflows sem step flyctl deploy. Auto-deploy desabilitado em T-20260412-1.
  Acao: criar step flyctl deploy OU re-habilitar integracao GitHub-Fly
        justificar via ADR-011

RC-3: Deploy manual Windows tem 2 modos de falha
  Acao: documentar runbook docs/runbooks/staging-deploy.md
        adicionar .dockerignore robusto (node_modules, .git, dist, .turbo, .next)
        considerar mover fly.toml para raiz

RC-4: Workflow naming confuso
  Deploy Staging != Deploy API (Staging)
  Acao: renomear ou consolidar

RC-5: T-20260412-1 sem ADR
  46+ dias sem decisao registrada
  Acao: redigir ADR-011 release cadence quando RC-1 a RC-4 fecharem

CRITERIO DE ACEITE (TODOS):
[ ] RC-1 fechado: migration:run sem 28P01
[ ] RC-2 fechado: deploy automatico OU runbook manual reproducible
[ ] RC-3 fechado: deploy Windows funciona OU alternativa documentada
[ ] RC-4 fechado: workflows renomeados ou consolidados
[ ] RC-5 fechado: ADR-011 redigido
[ ] flyctl status com hash novo contendo c3c7af1 ou superior
[ ] /ready 200 com db:up
[ ] Smoke UAT 5/5 verde (Login Acme, /customers, /estimates, dashboard, /financial)
[ ] PR(s) aprovado(s) pelo PO
[ ] CI em main 100% verde
[ ] MEMORY.md desativa T-20260509-2, BUG-04, BUG-05, T-20260412-1

ESCOPO NEGATIVO:
- NAO migrar provider de Neon
- NAO refatorar TenantDatabaseService alem do necessario
- NAO redesenhar fluxo de release nesta tarefa
- NAO mexer em modulos Fase 1 ausentes
- NAO alterar Bussola
- NAO criar tenant novo (usar Acme)
- NAO commitar segredos (Regra 9)
- NAO mexer em pricing/plans
- NAO tocar gaps P2 Fase 1

Branch: fix/SSE-BUG-D-deploy-staging-multi-rc (ou serie por RC)
Subagentes: test-runner + db-reviewer + security-reviewer
Done quando: criterios acima 100% verdes + PR aprovado pelo PO + UAT 5/5 verde

Protocolo: docs/process/HANDOFF_PROTOCOL.md secao 4 + secao 7
Prioridade P0: bloqueia UAT Fase 1 (95% completa). T-20260412-1 sai de BLOCKED ao fechar.

Memoria correlacionada (LER ANTES DE COMECAR):
- project_sse_t20260509_2_blocked_neon_auth.md
- BUG-05_credential_caching.md
- feedback_deploy_debugging.md
- project_sse_release_cadence_pending.md
