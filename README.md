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

## Current Status — Phase 1 MVP

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
  - **Vehicles** — search (make/model/VIN/plate), customer filter
  - **Estimates** — nested line items, status workflow (draft→sent→approved/rejected→converted), draft-only edit/delete
  - **Service Orders** — 7-state workflow with auto timestamps, status history logging
  - **Financial** — transactions CRUD, summary aggregation, dashboard (monthly trends, category breakdowns)
  - **Insurance** — DRP filter, search (name/code/email)
  - **Users** — search, status/role filters, role assignment/removal endpoints
- [x] Status workflow endpoints with transition validation for estimates and service orders
- [x] 8 additional modules scaffolded for Phase 2+ (accounting, fixed-assets, contractors, inventory, rental, notifications, auth, tenants)

### Frontend (Next.js) — 8 Full CRUD Modules
- [x] App Router with Clerk auth middleware
- [x] Dashboard layout (sidebar + header)
- [x] Reusable UI components (Button, Input, Select, Label, Textarea, Badge)
- [x] React Query hooks for all modules (CRUD + status transitions)
- [x] **Customers** — list (search, type/source filters, sort, pagination), create/edit forms, detail page
- [x] **Vehicles** — list (search, sort by year/created, condition badges), create/edit forms, detail page
- [x] **Estimates** — list (status filter, color-coded badges), create with dynamic line items, detail with status workflow actions
- [x] **Service Orders** — list (7-status filter), create/edit, detail with status workflow timeline
- [x] **Financial** — summary cards (real API data), transaction list with inline create, type/category filters
- [x] **Insurance** — list (DRP filter), create/edit, detail with payment terms
- [x] **Dashboard** — real-time metrics (customers, open estimates, active SOs, monthly revenue), quick actions
- [x] **Settings** — Clerk account/org info, system version display

### Infrastructure
- [x] Docker Compose dev stack (PostgreSQL 16 + Redis 7 + n8n)
- [x] Docker Compose prod stack (API + Web + Postgres + Redis) with health checks
- [x] Multi-stage Dockerfiles for API and Web (Next.js standalone output)
- [x] `/health` endpoint (bypasses API prefix) for container liveness checks
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

## Deployment

Every push to `main` automatically builds and publishes Docker images to GitHub Container Registry:

- `ghcr.io/luigifilippozzi-cmyk/storm-shield-enterprise/api:latest`
- `ghcr.io/luigifilippozzi-cmyk/storm-shield-enterprise/web:latest`

To run the full production stack on any Docker host:

```bash
cp .env.example .env.production    # Fill in CLERK_*, POSTGRES_*, REDIS_PASSWORD
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Images are tagged with both `latest` and the commit SHA.

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
| 1 — MVP | CRM, Vehicles, Estimates, Service Orders, Financial | **In Progress** |
| 2 — AI + Integrations | OCR, bank integration (Plaid), n8n automations | Planned |
| 3 — Accounting + FAM | General Ledger, Fixed Assets, Depreciation, Reports | Planned |
| 4 — Tax Compliance | Sales Tax, 1099-NEC, LGPD/CCPA, QuickBooks export | Planned |
| 5 — Mobile | React Native app for technicians | Planned |
| 6 — Rental + Analytics | Vehicle rental, demand forecasting, dashboards | Planned |
| 7 — Marketplace | CCC ONE/Mitchell integration, vendor marketplace | Planned |

## License

Proprietary — All rights reserved.
