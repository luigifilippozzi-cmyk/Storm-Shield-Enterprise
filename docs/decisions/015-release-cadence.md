# ADR-015: Release Cadence — SSE Staging/Production

**Status:** Accepted  
**Date:** 2026-05-11  
**Author:** Dev Manager Agent  
**Context:** T-20260412-1 resolved (Docker GHCR deploy pipeline active since 2026-04-19); Deploy Web Vercel stable since 2026-05-10 (PR #79).

---

## Contexto

O SSE usa três ambientes: `local` (dev), `staging` (Neon + Fly.io + Vercel), e `production` (target futuro). Com a infra de staging estabilizada e todos os pipelines CI/CD verdes, precisamos de uma cadência formal de releases para evitar deploys ad-hoc e garantir que UAT ocorra antes de qualquer promoção para produção.

---

## Decisão

### Ambientes e pipelines

| Ambiente | Trigger | Pipeline | Stack |
|---|---|---|---|
| Staging | Push/merge em `main` | `deploy-api-staging.yml` (Docker/GHCR → Fly.io) + `deploy-web-staging.yml` (Vercel) | Neon Postgres + Redis Fly.io + Vercel |
| Production | Tag `v*.*.*` em `main` | `deploy-production.yml` (a implementar na Fase 4) | AWS RDS + ECS (Terraform) |

### Cadência de releases

1. **Continuous staging** — Todo merge em `main` dispara deploy automático em staging. CI deve estar verde antes do merge.
2. **Sprint-based production** — Releases de produção ocorrem via tag semântica (`v1.x.y`) ao final de cada sprint/milestone, após UAT manual aprovado em staging.
3. **Hotfix protocol** — Branch `hotfix/SSE-N-desc` a partir de `main`, deploy direto em staging para validação, tag `v1.x.y+1` para produção.
4. **UAT gate** — Antes de qualquer tag de produção, o PO deve validar os critérios de aceite (CA) do milestone em staging. Os roteiros `docs/audits/SSE_Roteiro_Testes_Amigavel_v1.docx` e `docs/audits/SSE_Tour_Completo_Testes_PO_v1.docx` são a referência para UAT da Fase 1.

### Branch protection

- `main` requer CI verde (lint + test + build) antes do merge
- Force-push em `main` é proibido
- Toda mudança de infra (Terraform, Dockerfiles, workflows CI) requer aprovação manual do PO antes do merge

### Smoke tests pós-deploy

Adicionados em PR #79 (2026-05-10) em `deploy-web-staging.yml`:
- API liveness: `GET /health → 200`
- API readiness: `GET /ready → 200` (confirma db:up, redis:up)
- Auth enforcement: endpoint autenticado retorna 401/403 (não 200 anônimo)

---

## Consequências

- **Positivo:** Staging sempre reflete `main`; nenhum código não testado chega a produção; onboarding de novos devs é mais fácil.
- **Negativo:** Deploys em staging são frequentes (podem gerar noise); cold start do Fly.io pode atrasar smoke tests (~10s).
- **Mitigação cold start:** smoke test usa retry com backoff de 10s (implementado em PR #79).

---

## Alternativas consideradas

- **Tags manuais para staging** — Rejeitado: cria fricção desnecessária; staging deve ser sempre atual.
- **GitFlow completo (develop branch)** — Rejeitado para Fase 1: squad pequeno com um Dev Manager; overhead de `develop` não justificado. Reavaliar em Fase 3+ quando houver múltiplos contribuidores paralelos.

---

## Referências

- `docs/decisions/006-staging-deploy-stack.md` — stack de staging escolhida
- `.github/workflows/deploy-api-staging.yml` — pipeline Docker/GHCR → Fly.io
- `.github/workflows/deploy-web-staging.yml` — pipeline Vercel (com smoke tests CA5)
- `docs/audits/SSE_Roteiro_Testes_Amigavel_v1.docx` — roteiro UAT amigável
- PR #79 — smoke tests pós-deploy implementados
