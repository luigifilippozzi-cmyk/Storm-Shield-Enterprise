# Staging Deploy — Operational Runbook

Target URLs:
- API: https://sse-api-staging.fly.dev
- Swagger: https://sse-api-staging.fly.dev/docs
- Liveness: https://sse-api-staging.fly.dev/health
- Readiness: https://sse-api-staging.fly.dev/ready
- Web: https://sse-web-staging.vercel.app

Stack: Fly.io (API) · Vercel (Web) · Neon (Postgres) · Upstash (Redis) · Cloudflare R2 (storage) · Clerk dev instance (auth).

---

## 1. First-Time Setup

These steps must be done **once** by a human with admin access to GitHub, Fly.io, Vercel, and Clerk.

### 1.1 Register GitHub Secrets

GitHub → Settings → Secrets and variables → Actions. Add from `.credentials-staging.env`:

```
DATABASE_URL                       # Neon pooled endpoint
DATABASE_URL_UNPOOLED              # Neon direct endpoint (migrations/DDL)
REDIS_URL                          # Upstash rediss:// URL
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
CORS_ORIGINS                       # https://sse-web-staging.vercel.app,https://*.vercel.app,http://localhost:3000
FLY_API_TOKEN                      # generated in step 1.2
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID                  # generated in step 1.3
```

### 1.2 Fly.io — Create App + Secrets + Token

```bash
flyctl auth login
flyctl launch --name sse-api-staging --region iad --no-deploy --copy-config -c apps/api/fly.toml

flyctl secrets set -a sse-api-staging \
  DATABASE_URL="$DATABASE_URL" \
  DATABASE_URL_UNPOOLED="$DATABASE_URL_UNPOOLED" \
  REDIS_URL="$REDIS_URL" \
  CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
  CLERK_PUBLISHABLE_KEY="$CLERK_PUBLISHABLE_KEY" \
  R2_ACCOUNT_ID="$R2_ACCOUNT_ID" \
  R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  R2_BUCKET_NAME="$R2_BUCKET_NAME" \
  R2_ENDPOINT="$R2_ENDPOINT" \
  CORS_ORIGINS="https://sse-web-staging.vercel.app,https://*.vercel.app,http://localhost:3000"

flyctl tokens create deploy -a sse-api-staging
```

### 1.3 Vercel — Link Project + Env Vars

```bash
cd apps/web
npm install -g vercel@latest
vercel login
vercel link

vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add NEXT_PUBLIC_API_URL production
```

### 1.4 Clerk — Add Staging Domain

Clerk dashboard → Your app → Domains → Add `https://sse-web-staging.vercel.app`.

### 1.5 First Deploy

```bash
flyctl deploy --remote-only -c apps/api/fly.toml
curl https://sse-api-staging.fly.dev/health
curl https://sse-api-staging.fly.dev/ready

cd apps/web && vercel --prod
```

---

## 2. Routine Operations

### 2.1 Normal Deploys

Push to `main`. Two workflows auto-run:
- `deploy-api-staging.yml` — runs migrations → deploys API → smoke-tests `/ready`
- `deploy-web-staging.yml` — builds + deploys web → smoke-tests frontend

### 2.2 Running Migrations Manually

```bash
export DATABASE_URL_UNPOOLED="postgresql://..."
pnpm --filter @sse/api migration:run
```

### 2.3 Tailing Logs

```bash
flyctl logs -a sse-api-staging
vercel logs --follow
```

### 2.4 Fly.io Cold-Start

```bash
flyctl scale count 1 --region iad -a sse-api-staging    # keep warm for demo
flyctl scale count 0 --region iad -a sse-api-staging    # scale back
```

---

## 3. Rollback

### 3.1 API (Fly.io)

```bash
flyctl releases list -a sse-api-staging
flyctl releases rollback <version> -a sse-api-staging
```

### 3.2 Web (Vercel)

Vercel dashboard → Deployments → previous deployment → "Promote to Production".

### 3.3 Database (Neon)

Neon dashboard → Branches → Restore (24h PITR on free tier).

---

## 4. Secret Rotation

### 4.1 Clerk Keys
1. Clerk dashboard → Rotate
2. Update GitHub Secrets + Fly.io + Vercel
3. Redeploy both

### 4.2 Database
1. Neon dashboard → Reset password
2. Update GitHub + Fly.io secrets
3. Redeploy API

### 4.3 Fly.io Token
```bash
flyctl tokens create deploy -a sse-api-staging
# Update FLY_API_TOKEN in GitHub Secrets
```

---

## 5. Troubleshooting

| Symptom | Fix |
|---|---|
| `/ready` 503 db:down | Neon paused (free tier) — hit dashboard to wake; verify DATABASE_URL |
| `/ready` 503 redis:down | Verify REDIS_URL format: `rediss://default:TOKEN@host:6379` |
| CORS error | `flyctl secrets set CORS_ORIGINS=...` |
| Clerk login loop | Add domain in Clerk dashboard |
| Migration fails auth | Verify DATABASE_URL_UNPOOLED in GitHub secrets |
| 5s+ first request | Normal cold-start; see 2.4 |

---

## 6. Monitoring Checklist (weekly)

- [ ] `curl --fail https://sse-api-staging.fly.dev/ready` → 200
- [ ] Web login works
- [ ] Neon < 0.4 GB
- [ ] Upstash < 10k req/day
- [ ] Clerk < 8k MAU
- [ ] Last 5 deploys green
