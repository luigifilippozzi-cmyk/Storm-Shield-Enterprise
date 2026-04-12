# ADR 006 — Stack de Deploy Staging (Free Tier)

**Data:** 2026-04-05
**Status:** Aceito
**Decisor:** Luigi Filippozzi
**Escopo:** Ambiente de staging do SSE (pré-produção)

---

## Contexto

Storm Shield Enterprise precisa de URLs públicas para:
1. Demonstrar progresso da Fase 1 para stakeholders
2. Validar fluxos ponta-a-ponta em ambiente real (auth, multi-tenant, uploads)
3. Permitir testes externos (beta users) antes do lançamento

Restrições no momento:
- Orçamento zero para staging (projeto pré-receita)
- Arquitetura final será AWS (ECS + RDS + ElastiCache + S3 + CloudFront), mas esse custo
  só se justifica a partir de usuários pagantes
- Stack de staging deve ser **reversível** (fácil migrar para AWS depois)

## Decisão

Adotar stack 100% free tier para staging, com abstrações que facilitam migração futura:

| Camada | Escolha | Justificativa |
|---|---|---|
| Frontend | **Vercel Hobby** | Deploy nativo Next.js, preview URLs automáticas em PRs, zero config |
| Backend | **Fly.io** (shared-cpu-1x, 256 MB, region `iad`) | Dockerfile-based, 3 VMs grátis, auto-stop/start, próximo ao Neon |
| DB | **Neon Postgres** (0.5 GB, us-east-1) | Postgres 16 gerenciado, branching, pooled connections, compatível com migração RDS |
| Redis | **Upstash Redis** (256 MB) | REST + TCP, zero ops, compatível com migração ElastiCache via REDIS_URL |
| Storage | **Cloudflare R2** (10 GB, zero egress) | S3 API-compatível, SEM cobrança de egress, compatível com migração S3 (trocar endpoint) |
| Auth | **Clerk** (Dev instance, 10k MAU) | Já era escolha arquitetural — dev instance é grátis até 10k MAU |

## Alternativas Consideradas

1. **AWS Free Tier desde o início** — rejeitado: 12 meses apenas, complexidade alta (VPC, ECS, RDS, SGs) antes de termos usuários reais, risco de custo inesperado.
2. **Railway / Render** — rejeitado: free tier sunset em 2023-2024, serviços agora requerem cartão e cobram após trial.
3. **Self-hosted em VPS único** ($5 DigitalOcean) — rejeitado: sem auto-scale, ops manual, não escala bem para múltiplos tenants.
4. **Supabase** (DB + Auth + Storage) — rejeitado: Clerk já decidido, não queríamos acoplar Auth ao mesmo fornecedor do DB.

## Consequências

### Positivas
- Custo mensal: **$0** enquanto dentro dos limites (até ~1k usuários ativos)
- Deploy automático em cada push para `main` (GitHub Actions → Fly.io + Vercel)
- Setup completo em ~1 dia (contas + secrets + workflows)
- Todas as camadas têm abstração via env var (`DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`) — migração futura é troca de configuração, não de código

### Negativas / Riscos
- **Fly.io auto-stop**: primeira request após idle demora ~5s (cold start) — aceitável para staging
- **Neon 0.5 GB limit**: suficiente para staging com <100 tenants de teste, precisa upgrade ($19/mês) ou migração quando crescer
- **Cloudflare R2**: bucket requer custom domain se quiser URLs públicas de imagens
- **Clerk dev instance**: domínio `*.clerk.accounts.dev` não é ideal; migrar para prod instance com domínio próprio antes do lançamento
- **Multi-região limitado**: Fly.io grátis é single-region; expansão para LATAM requer upgrade ou AWS

## Gatilhos de Migração para AWS

Migrar uma ou mais camadas para AWS quando:
- **DB**: Neon >0.4 GB usage OU >100 tenants em staging
- **Redis**: Upstash >200 MB OU >1M comandos/dia
- **Backend**: Fly.io cold start impactando UX OU >256 MB RAM necessários
- **Storage**: R2 >8 GB OU necessidade de lifecycle policies avançadas
- **Geral**: qualquer tenant enterprise exigindo SLA/compliance específico (HIPAA, SOC2)

## Implementação

Ver `docs/PROMPT_CLAUDE_CODE_DEPLOY_STAGING.md` (Grupo 0) — executado pelo Agente 1
em `feature/SSE-000-deploy-staging`.

Credenciais: `.credentials-staging.env` (gitignored) + GitHub Secrets.

## Referências

- [Fly.io pricing](https://fly.io/docs/about/pricing/)
- [Neon free tier](https://neon.tech/pricing)
- [Upstash Redis pricing](https://upstash.com/pricing/redis)
- [Cloudflare R2 pricing](https://www.cloudflare.com/products/r2/)
- [Vercel Hobby limits](https://vercel.com/docs/limits/usage)
