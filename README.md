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
│   ├── api/              # NestJS backend (9 domain modules)
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
- [x] Customer CRUD — full service with pagination, search (ILIKE), filters, sort whitelist
- [x] Customer DTOs with class-validator + Swagger annotations
- [x] 9 domain modules scaffolded (tenants, auth, users, customers, insurance, vehicles, estimates, service-orders, financial)

### Frontend (Next.js)
- [x] App Router with Clerk auth middleware
- [x] Dashboard layout (sidebar + header)
- [x] Customer list page — data table with search, type/source filters, sortable columns, pagination
- [x] Customer create/edit form — full validation, US states, all fields
- [x] Customer detail page — organized sections with edit/delete actions
- [x] React Query hooks for all customer CRUD operations
- [x] Reusable UI components (Button, Input, Select, Label, Textarea, Badge)
- [ ] Vehicles CRUD
- [ ] Estimates CRUD
- [ ] Service Orders CRUD
- [ ] Financial dashboard

### Infrastructure
- [x] Docker Compose (PostgreSQL 16 + Redis 7 + n8n)
- [x] GitHub Actions CI (lint → test → build)
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

## Conventions

- **Git**: Conventional Commits · `main` → `develop` → `feature/SSE-xxx-description`
- **DB**: UUID v7 PKs · DECIMAL(14,2) for money · Soft deletes · Audit trail
- **Security**: AES-256-GCM field encryption · Rate limiting · CORS · Helmet.js
- **RBAC**: 7 roles (owner → viewer) · Granular permissions (`module:action:resource`)

## License

Proprietary — All rights reserved.
