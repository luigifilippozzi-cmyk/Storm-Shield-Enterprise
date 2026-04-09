# Storm Shield Enterprise — Deploy Staging (Grupo 0, PRIORIDADE MÁXIMA)

> **Adendo ao** `PROMPT_CLAUDE_CODE_FASE1.md`. Este grupo deve ser executado **ANTES** dos Grupos A/B/C.
>
> Objetivo: colocar o SSE no ar em URLs públicas (grátis) para que Luigi possa compartilhar e validar a Fase 1 conforme ela é entregue.

---

## Stack de Deploy Staging (100% Free Tier)

| Camada | Serviço | Custo | Notas |
|---|---|---|---|
| Frontend (Next.js) | **Vercel** Hobby | $0 | Deploy via GitHub integration |
| Backend (NestJS) | **Fly.io** | $0 (3 shared VMs) | Região `iad` (Ashburn, VA) |
| PostgreSQL | **Neon** Free | $0 (0.5 GB) | Região `aws-us-east-1` |
| Redis | **Upstash** Free | $0 (256 MB) | REST + Redis TCP |
| Storage S3 | **Cloudflare R2** | $0 (10 GB, zero egress) | Bucket `sse-storage-staging` |
| Auth | **Clerk** Dev instance | $0 (10k MAU) | Domain `*.clerk.accounts.dev` |

Todas as credenciais **já foram provisionadas** e estão em
`.credentials-staging.env` (arquivo na raiz do repo, **não commitado**, está no `.gitignore`).

---

## Credenciais disponíveis (ler de `.credentials-staging.env`)

```
# Cloudflare R2
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
R2_BUCKET_NAME=sse-storage-staging, R2_ENDPOINT

# Neon Postgres (us-east-1)
DATABASE_URL (pooled),  DATABASE_URL_UNPOOLED (direct — use p/ migrations)

# Upstash Redis
REDIS_URL=rediss://default:{TOKEN}@profound-labrador-79493.upstash.io:6379
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

# Fly.io (token ainda NÃO existe — vai gerar via flyctl)
FLY_APP_NAME=sse-api-staging, FLY_ORG=personal, FLY_REGION=iad

# Vercel
VERCEL_TOKEN, VERCEL_ORG_ID=J9G8MRvR9ucpJj59AB8Aw8cS
VERCEL_PROJECT_ID (ainda vazio — vai ser preenchido após `vercel link`)

# Clerk (development instance)
CLERK_PUBLISHABLE_KEY=pk_test_..., CLERK_SECRET_KEY=sk_test_...
```

⚠️ **NUNCA** commite o arquivo `.credentials-staging.env`. Use-o apenas para ler e depois registrar os valores como GitHub Secrets.

---

## GRUPO 0 — Deploy Staging (branch: `feature/SSE-000-deploy-staging`)

### 0.1 — Registrar GitHub Secrets

Antes de qualquer workflow, adicionar no repositório
`https://github.com/luigifilippozzi-cmyk/Storm-Shield-Enterprise` → Settings → Secrets and variables → Actions:

```
DATABASE_URL              (pooled)
DATABASE_URL_UNPOOLED     (direct)
REDIS_URL
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_ENDPOINT
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
FLY_API_TOKEN             (gerar em 0.2)
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID         (após 0.4)
```

Como Luigi precisa clicar manualmente na UI do GitHub, me peça para fazer essa etapa — você apenas descreve a lista acima em um PR ou comentário.

### 0.2 — Fly.io App (backend NestJS)

1. Instalar `flyctl` local ou usar `npx @flydotio/dockerfile` para gerar Dockerfile otimizado.
2. Criar `apps/api/fly.toml`:
   ```toml
   app = "sse-api-staging"
   primary_region = "iad"

   [build]
     dockerfile = "../../infra/docker/api.Dockerfile"

   [env]
     NODE_ENV = "staging"
     PORT = "3000"

   [http_service]
     internal_port = 3000
     force_https = true
     auto_stop_machines = "stop"
     auto_start_machines = true
     min_machines_running = 0

   [[vm]]
     size = "shared-cpu-1x"
     memory = "256mb"
   ```
3. Executar:
   ```bash
   fly launch --name sse-api-staging --region iad --no-deploy --copy-config
   fly secrets set DATABASE_URL=... DATABASE_URL_UNPOOLED=... REDIS_URL=... \
      CLERK_SECRET_KEY=... CLERK_PUBLISHABLE_KEY=... \
      R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... \
      R2_BUCKET_NAME=... R2_ENDPOINT=... \
      --app sse-api-staging
   fly tokens create deploy -a sse-api-staging    # copia o token para GitHub Secret FLY_API_TOKEN
   ```
4. Criar `.github/workflows/deploy-api-staging.yml`:
   ```yaml
   name: Deploy API (Staging)
   on:
     push:
       branches: [main]
       paths: ['apps/api/**', 'packages/**', 'infra/docker/api.Dockerfile']
     workflow_dispatch:
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: superfly/flyctl-actions/setup-flyctl@master
         - run: flyctl deploy --remote-only -c apps/api/fly.toml
           env:
             FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
   ```
5. Primeiro deploy manual: `flyctl deploy --remote-only -c apps/api/fly.toml`.
6. Rodar migrations contra Neon (direct URL): `DATABASE_URL=$DATABASE_URL_UNPOOLED pnpm --filter api migration:run`.

### 0.3 — Configurar CORS no backend

No `apps/api/src/main.ts`, garantir que `app.enableCors({...})` aceita:
- `https://sse-web-staging.vercel.app`
- `https://*.vercel.app` (previews)
- `http://localhost:3000` (dev)

### 0.4 — Vercel Project (frontend Next.js)

1. Criar `apps/web/vercel.json`:
   ```json
   {
     "buildCommand": "cd ../.. && pnpm --filter web build",
     "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
     "outputDirectory": ".next",
     "framework": "nextjs"
   }
   ```
2. Instalar Vercel CLI: `npm i -g vercel`.
3. Executar (capturar output):
   ```bash
   cd apps/web
   vercel link --yes --project sse-web-staging --org luigifilippozzi-cmyks-projects
   # isso cria .vercel/project.json com "projectId": "prj_..."
   ```
4. Registrar o `projectId` como GitHub Secret `VERCEL_PROJECT_ID`.
5. Setar env vars no projeto Vercel:
   ```bash
   vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production <<< 'pk_test_...'
   vercel env add CLERK_SECRET_KEY production <<< 'sk_test_...'
   vercel env add NEXT_PUBLIC_API_URL production <<< 'https://sse-api-staging.fly.dev'
   ```
6. Criar `.github/workflows/deploy-web-staging.yml`:
   ```yaml
   name: Deploy Web (Staging)
   on:
     push:
       branches: [main]
       paths: ['apps/web/**', 'packages/**']
     workflow_dispatch:
   jobs:
     deploy:
       runs-on: ubuntu-latest
       env:
         VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
         VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
       steps:
         - uses: actions/checkout@v4
         - uses: pnpm/action-setup@v4
           with: { version: 9 }
         - uses: actions/setup-node@v4
           with: { node-version: 20, cache: 'pnpm' }
         - run: npm i -g vercel@latest
         - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
         - run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
         - run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
   ```
7. Primeiro deploy manual: `vercel --prod`.

### 0.5 — Configurar Clerk Redirect URLs

No dashboard Clerk (`dashboard.clerk.com`) → App "SSE Staging" → Domains, adicionar:
- `https://sse-web-staging.vercel.app` (production domain)

### 0.6 — Smoke test

Após deploys concluídos:
```bash
curl https://sse-api-staging.fly.dev/health        # { status: "ok" }
curl https://sse-api-staging.fly.dev/docs          # Swagger UI
open https://sse-web-staging.vercel.app            # Next.js app carrega login
```

Verificar que:
- Login com Clerk funciona
- Tenant é criado via `/api/tenants` (ou manualmente via script)
- CRUD de customer funciona end-to-end

### 0.7 — Documentar no README

Adicionar seção "Deploy Staging" no `README.md` com:
- URLs públicas: API + Web
- Como rodar migrations em staging
- Como rotacionar secrets
- Como promover deploy para produção (futuro)

---

## Entregáveis do Grupo 0

- [ ] Branch `feature/SSE-000-deploy-staging` mergeada em `main`
- [ ] `apps/api/fly.toml` + `infra/docker/api.Dockerfile` otimizado multi-stage
- [ ] `apps/web/vercel.json` + `.vercel/project.json` (committed sem secrets)
- [ ] `.github/workflows/deploy-api-staging.yml`
- [ ] `.github/workflows/deploy-web-staging.yml`
- [ ] Migrations rodadas no Neon (schema `public` + primeiro tenant de teste)
- [ ] `https://sse-api-staging.fly.dev/health` respondendo 200
- [ ] `https://sse-web-staging.vercel.app` carregando login do Clerk
- [ ] README.md atualizado com seção de deploy

---

## Observações

- **Custo mensal esperado: $0** dentro dos limites free tier (até ~1k usuários)
- **Quando migrar para AWS** (trigger: >10k MAU ou plano enterprise): substituir Fly.io por ECS, Vercel por CloudFront+S3, Neon por RDS, Upstash por ElastiCache. A camada de abstração (DATABASE_URL, REDIS_URL, S3 client) já facilita isso.
- **Fly.io tem auto-stop**: a primeira request após período ocioso demora ~5s para acordar. Aceitável para staging.
- **Neon pooler endpoint**: use para o app. Direct endpoint: use apenas para migrations/DDL.
