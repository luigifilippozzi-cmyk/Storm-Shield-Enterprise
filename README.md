# Storm Shield Enterprise (SSE)

Full-featured ERP SaaS for auto repair businesses (PDR / body shops) in the United States, with initial focus on Missouri.

Covers the complete operational cycle: customer acquisition → estimates → service orders → financial management → accounting → tax compliance.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router) · React 19 · Tailwind CSS · shadcn/ui-style components |
| **Backend** | NestJS · TypeScript · Knex query builder |
| **Auth** | Clerk (@clerk/backend + @clerk/nextjs) · JWT · RBAC (7 roles) |
| **Database** | PostgreSQL 16+ · Multi-tenant (schema per tenant) · RLS · Dual DB users |
| **Cache / Queues** | Redis 7+ · BullMQ |
| **Storage** | AWS S3 / Cloudflare R2 |
| **Automation** | n8n (self-hosted) |
| **Infra** | AWS (Terraform) · Docker · GitHub Actions CI |

## SaaS Architecture

3-layer tenant isolation:
1. **Schema Isolation** — Each tenant gets a dedicated PostgreSQL schema (`tenant_{uuid}`)
2. **Row Level Security** — RLS policies on all tenant-scoped tables enforce isolation at DB level
3. **Dual DB Users** — `sse_app` (runtime, RLS enforced) / `sse_user` (admin, migrations only)

Subscription plan enforcement via `PlanGuard` (feature gating) + `PlanLimitsInterceptor` (resource limits).

## Project Structure

```
storm-shield-enterprise/
├── apps/
│   ├── api/              # NestJS backend (15 domain modules)
│   ├── web/              # Next.js frontend
│   └── mobile/           # React Native (Phase 5)
├── packages/
│   ├── shared-types/     # TypeScript interfaces & enums
│   ├── shared-utils/     # UUID v7, currency, date, validation
│   └── eslint-config/    # Shared ESLint config
├── infra/                # Terraform + Dockerfiles
├── docs/                 # Architecture docs, SQL references, ADRs
└── n8n/                  # Automation workflow exports
```

## Current Status — Phase 1 MVP (~90% complete)

### Backend (NestJS API)
- [x] Monorepo setup (Turborepo + pnpm workspaces)
- [x] Multi-tenant middleware with schema + RLS isolation
- [x] Clerk JWT authentication guard
- [x] RBAC guard with granular `module:action:resource` permissions
- [x] Plan enforcement (feature gating + resource limits)
- [x] Tenant status check (blocks suspended/cancelled)
- [x] PostgreSQL migrations (000–005): public schema, IAM, CRM, estimates, financial, RLS
- [x] Seed data: roles/permissions, chart of accounts (US GAAP), asset categories
- [x] Tenant provisioning CLI script
- [x] 7 complete modules with DTOs, pagination, search, filters, Swagger docs:
  - **Customers** — search (ILIKE), type/source filters, sort whitelist
  - **Vehicles** — search (make/model/VIN/plate), customer filter, **photo upload/delete** (S3/R2)
  - **Estimates** — nested line items, status workflow (draft→sent→approved/rejected→converted), draft-only edit/delete, **document upload/delete**
  - **Service Orders** — 7-state workflow with auto timestamps, status history logging
  - **Financial** — transactions CRUD, summary aggregation, dashboard (monthly trends, category breakdowns)
  - **Insurance** — DRP filter, search (name/code/email)
  - **Users** — search, status/role filters, role assignment/removal, transactional create with role
- [x] Status workflow endpoints with transition validation for estimates and service orders
- [x] 8 additional modules scaffolded for Phase 2+ (accounting, fixed-assets, contractors, inventory, rental, notifications, auth, tenants)
- [x] **StorageService** — S3/R2 file upload with signed URLs, local dev fallback
- [x] **Customer consent** module for LGPD/CCPA compliance (migration 006)
- [x] **Unit tests: 66 tests across 5 services** (customers, vehicles, estimates, financial, users) — all passing

### Frontend (Next.js) — 8 Full CRUD Modules
- [x] App Router with Clerk auth middleware
- [x] Dashboard layout (sidebar + header)
- [x] Reusable UI components (Button, Input, Select, Label, Textarea, Badge, Popover, Command)
- [x] Shared components: `CustomerCombobox` (searchable), `VehicleCombobox` (cascading filter)
- [x] React Query hooks for all modules (CRUD + status transitions + dashboard)
- [x] **Customers** — list (search, type/source filters, sort, pagination), create/edit forms, detail page
- [x] **Vehicles** — list (search, sort by year/created, condition badges, **customer name column**), create/edit with searchable customer select, detail with **photo gallery** (upload/delete)
- [x] **Estimates** — list (status filter, color-coded badges, **customer name column**), create with searchable customer/vehicle selects + dynamic line items, detail with line items table + **document upload** + **status timeline** + workflow actions
- [x] **Service Orders** — list (7-status filter), create/edit, detail with status workflow timeline
- [x] **Financial** — summary cards (real API data), transaction list with inline create, type/category filters, **income vs expenses trend chart** (recharts)
- [x] **Insurance** — list (DRP filter), create/edit, detail with payment terms
- [x] **Dashboard** — real-time metrics (customers, open estimates [sent], active SOs, **monthly revenue**), quick actions, **financial trend chart**, **recent activity feed**
- [x] **Settings** — Clerk account/org info, system version display

### Infrastructure
- [x] Docker Compose dev stack (PostgreSQL 16 + Redis 7 + n8n)
- [x] Docker Compose prod stack (API + Web + Postgres + Redis) with health checks
- [x] Multi-stage Dockerfiles for API and Web (Next.js standalone output)
- [x] `/health` endpoint (bypasses API prefix) for container liveness checks
- [x] `/ready` endpoint with DB + Redis connectivity checks for load balancer readiness
- [x] GitHub Actions CI (lint → test → build) — passing
- [x] GitHub Actions Deploy Staging — auto-builds images and pushes to ghcr.io on main push
- [x] PR template with checklist

## Getting Started

```bash
# Prerequisites: Node.js 20+, pnpm 10+, Docker

# Clone and install
git clone https://github.com/luigifilippozzi-cmyk/Storm-Shield-Enterprise.git
cd Storm-Shield-Enterprise
cp .env.example .env    # Configure Clerk keys and DB credentials
pnpm install

# Start dev services
docker compose up -d

# Run migrations
pnpm --filter @sse/api migration:run

# Start all apps
pnpm dev
# API: http://localhost:3001  |  Web: http://localhost:3000
```

## Development

```bash
pnpm dev                                # Start all apps in dev mode
pnpm --filter @sse/api dev              # API only
pnpm --filter @sse/web dev              # Frontend only
pnpm build                              # Build all
pnpm test                               # Run all tests
pnpm lint                               # Lint all packages

# Database
pnpm --filter @sse/api migration:run    # Run migrations
pnpm --filter @sse/api seed:run         # Run seed data
pnpm --filter @sse/api tenant:create    # Provision new tenant
```

## Deployment (Staging)

Staging runs on a 100% free-tier stack:

| Service | Provider | Notes |
|---|---|---|
| API | Fly.io (`iad`, shared-cpu-1x) | Auto-stop when idle, auto-start on request |
| Web | Vercel (Hobby) | Next.js optimized builds |
| PostgreSQL | Neon (Free, 0.5 GB) | Pooled + unpooled endpoints |
| Redis | Upstash (Free, 256 MB) | TLS (`rediss://`) |
| Storage | Cloudflare R2 (10 GB) | Zero egress fees |
| Auth | Clerk (Dev, 10k MAU) | SSO + MFA |

Every push to `main` triggers two GitHub Actions workflows:
- **deploy-api-staging** — runs SQL migrations against Neon, deploys API to Fly.io, smoke-tests `/ready`
- **deploy-web-staging** — builds and deploys frontend to Vercel, smoke-tests the URL

Fly.io auto-stops the API machine after idle period (first request takes ~5s cold start). Monthly cost: **$0** within free tier limits.

Staging URLs:
- API: https://sse-api-staging.fly.dev
- Web: https://sse-web-staging.vercel.app
- Swagger: https://sse-api-staging.fly.dev/docs

See [docs/runbooks/staging-deploy.md](docs/runbooks/staging-deploy.md) for the full operational runbook (setup, rollback, secret rotation, troubleshooting).

**Production** (future): AWS ECS Fargate + RDS + ElastiCache, managed via Terraform. Docker images also published to `ghcr.io` on each push to `main`.

## Conventions

- **Git**: Conventional Commits · `main` → `feature/SSE-xxx-description`
- **DB**: UUID v7 PKs · DECIMAL(14,2) for money · Soft deletes · Audit trail
- **Security**: AES-256-GCM field encryption · Rate limiting · CORS · Helmet.js
- **RBAC**: 7 roles (owner → viewer) · Granular permissions (`module:action:resource`)
- **API**: class-validator DTOs · Swagger annotations · `PaginatedResult<T>` standard response

## API Endpoints

All endpoints require Clerk JWT + tenant context. Swagger docs at `/docs` when running the API.

| Module | Endpoints |
|---|---|
| Customers | `GET/POST /customers`, `GET/PUT/DELETE /customers/:id` |
| Vehicles | `GET/POST /vehicles`, `GET/PUT/DELETE /vehicles/:id` |
| Estimates | `GET/POST /estimates`, `GET/PUT/DELETE /estimates/:id`, `PATCH /estimates/:id/status` |
| Service Orders | `GET/POST /service-orders`, `GET/PUT/DELETE /service-orders/:id`, `PATCH /service-orders/:id/status` |
| Financial | `GET /financial/summary`, `GET /financial/dashboard`, `GET/POST /financial/transactions`, `GET/PUT/DELETE /financial/transactions/:id` |
| Insurance | `GET/POST /insurance`, `GET/PUT/DELETE /insurance/:id` |
| Users | `GET/POST /users`, `GET/PUT/DELETE /users/:id`, `POST /users/:id/roles`, `DELETE /users/:id/roles/:roleId` |

## Roadmap

| Phase | Focus | Status |
|---|---|---|
| 1 — MVP | CRM, Vehicles, Estimates, Service Orders, Financial | **~90%** (CI green · 66 tests · staging infra ready · all P0 closed · photo/doc upload · consent module · 4 remaining P2 polish items) |
| 2 — AI + Integrations | OCR, bank integration (Plaid), n8n automations | Planned |
| 3 — Accounting + FAM | General Ledger, Fixed Assets, Depreciation, Reports | Planned |
| 4 — Tax Compliance | Sales Tax, 1099-NEC, LGPD/CCPA, QuickBooks export | Planned |
| 5 — Mobile | React Native app for technicians | Planned |
| 6 — Rental + Analytics | Vehicle rental, demand forecasting, dashboards | Planned |
| 7 — Marketplace | CCC ONE/Mitchell integration, vendor marketplace | Planned |

## License

Proprietary — All rights reserved.
