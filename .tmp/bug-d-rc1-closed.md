## RC-1 FECHADO + Imagem nova deployada ? 2026-06-08

Acoes executadas nesta sessao PO Cowork:
1. Reset password de neondb_owner no Neon Console (production branch)
2. gh secret set DATABASE_URL e DATABASE_URL_UNPOOLED (repo level)
3. flyctl secrets set DATABASE_URL e DATABASE_URL_UNPOOLED (sse-api-staging)
4. gh workflow run "Deploy API (Staging)" --ref main

Resultado:
- Run 27159265227: success
- Image antes: deployment-01KQNDTZ57S2WAXKT7WHK25127 (pre-BUG-C)
- Image depois: deployment-01KTM8RCMWAGKS4X3NK72611JT (com PR #85 + #87)
- /health: 200 OK
- /ready: 200 OK com db:up + redis:up
- Migration rodou com nova credencial sem 28P01

Status dos 5 RCs:
[X] RC-1 FECHADO: credencial Neon rotacionada nos 3 lugares (Neon/GH/Fly)
[~] RC-2 PARCIAL: workflow_dispatch funciona como trigger manual confiavel
    Auto-trigger via push em paths apps/api/** continua valido (design intencional)
[ ] RC-3 OPEN: deploy manual Windows (archive/tar) ? substituido na pratica por workflow_dispatch
[ ] RC-4 OPEN: workflow naming (Deploy Staging != Deploy API (Staging))
[ ] RC-5 OPEN: ADR-011 release cadence

Proximo passo: Smoke UAT 5/5 em sessao dedicada (login Acme,
/customers, /estimates, dashboard, /financial).

Considerar fechamento de BUG-D apos UAT verde ? RC-3, RC-4, RC-5 podem virar
issues separadas P2/P3 pois nao bloqueiam mais UAT.
