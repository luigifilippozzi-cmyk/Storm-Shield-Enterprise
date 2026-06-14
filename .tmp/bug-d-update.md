## Tarefa DM ? BUG-D atualizacao (status apos PR #87) ? Prioridade P0

PO verificou estado real apos relatorio DM de "saude VERDE". Realidade:

CI workflow: VERDE (PR #87 resolveu 18 TS errors) ? OK, agradecido
Deploy Staging (build+push): VERDE ? OK
Deploy API (Staging) workflow: AINDA FAILURE em main (run 26596067407)

PR #87 fixou problema DIFERENTE do que o handoff BUG-D pedia.
PR #87 nao fechou nenhum dos 5 RCs do BUG-D. Resolveu um bug paralelo que
estava bloqueando CI mas nao estava nas 7 evidencias do handoff original.

PROGRESSO REAL no BUG-D:
[OK] RC parcial: descoberto que step Apply SQL migrations JA usa DATABASE_URL_UNPOOLED
     (elimina hipotese RC-1a pooled/unpooled mismatch)
[ ] RC-1 NAO fechado: migration:run ainda falha (precisa logs completos para
    isolar entre RC-1b credencial expirada vs RC-1c SSL/connection config)
[ ] RC-2 NAO fechado
[ ] RC-3 NAO fechado
[ ] RC-4 NAO fechado
[ ] RC-5 NAO fechado

ACAO IMEDIATA SOLICITADA:
1. Comentar issue #86 com PR #87 referenciado + status real (4 RCs ainda abertos)
2. Atacar RC-1: pegar log COMPLETO do run 26596067407 step Apply SQL migrations
   - identificar mensagem exata do erro (28P01? timeout? SSL?)
   - se 28P01: hipotese RC-1b credencial Neon expirada (atualizar secret)
   - se SSL/connection: hipotese RC-1c (instrumentar run-migrations.ts)
3. Sequencia recomendada: RC-1 -> RC-2 -> RC-4 -> RC-3 -> RC-5
   (RC-3 deploy Windows pode ser substituido por RC-2 auto-deploy se preferir)

NAO MARCAR BUG-D COMO RESOLVIDO ate todos os 5 RCs fecharem + smoke UAT 5/5 verde.
NAO REPORTAR "saude VERDE" enquanto Deploy API (Staging) falhar em main.

Contexto adicional descoberto nesta verificacao:
- main HEAD agora: f032fa1 (Merge PR #87) sobre c3c7af1 (Merge PR #85)
- Issue #86 BUG-D tem 0 comments ? DM nao interagiu com o handoff publico
- dm_queue.md entrada 2026-05-28 BUG-D continua valida sem alteracao

Done quando: criterios originais do BUG-D atendidos integralmente.
