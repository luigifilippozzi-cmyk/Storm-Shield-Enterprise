# Changelog

All notable changes to Storm Shield Enterprise are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **CustomerCombobox** — searchable select with debounced API search, shows name + phone (`b335a2a`)
- **VehicleCombobox** — cascading select filtered by customer, shows year/make/model/VIN (`b335a2a`)
- **Popover** and **Command** UI components (shadcn/ui + cmdk pattern) (`b335a2a`)
- **Estimate line items table** on detail page with type, description, qty, unit price, total (`b335a2a`)
- **TrendChart** component (recharts BarChart: income vs expenses, last 12 months) (`0584a98`)
- **RecentActivity** dashboard component showing last 5 customers + 5 transactions (`0584a98`)
- **useFinancialDashboard** hook for `/financial/dashboard` endpoint (`0584a98`)
- **Unit tests** for 5 backend services — 66 tests, all passing (`0c0ca5f`):
  - `customers.service.spec.ts` — 11 tests (CRUD, search, type/source filters)
  - `vehicles.service.spec.ts` — 10 tests (CRUD, customer_id/make/year filters)
  - `estimates.service.spec.ts` — 14 tests (CRUD, lines, status transitions, draft-only rules)
  - `financial.service.spec.ts` — 16 tests (CRUD, summary, dashboard aggregations)
  - `users.service.spec.ts` — 15 tests (CRUD, role assignment, transaction handling)
- **User role assignment** on creation with database transaction (`3f7c0fb`)
- **Staging deploy infrastructure** — Fly.io + Vercel + Neon + Upstash (`f900041`)
  - GitHub Actions workflows for API and Web staging deploys
  - Database migration runner script
  - Redis module configuration
  - Staging deploy runbook
- **Architecture dashboard** — interactive HTML explorer for GitHub Pages (`2a47b93`, `4ffaf6c`)
- **Grupo B gap analysis audit** (`8925f65`)
- **StorageService** — S3/R2 file upload/download/delete with signed URLs, local fallback for dev
- **Vehicle photo upload** — `POST /vehicles/:id/photos`, `DELETE /vehicles/:id/photos/:photoId`, `GET /vehicles/:id/photos`
- **Vehicle photos gallery** — frontend component with upload and delete
- **Estimate document upload** — `POST /estimates/:id/documents`, `DELETE /estimates/:id/documents/:docId`
- **EstimateDocuments** component — document list with upload in estimate detail
- **StatusTimeline** component — visual status change history on estimate detail
- **Customer consent** module — CRUD for customer consent records (LGPD/CCPA), migration 006
- **Customer name column** in vehicles and estimates list pages (backend JOIN)
- **CommonModule** with shared StorageService for cross-module file handling

### Changed
- Vehicle form now uses `CustomerCombobox` instead of UUID text input (`b335a2a`)
- Estimate form now uses `CustomerCombobox` + `VehicleCombobox` with cascading selection (`b335a2a`)
- Dashboard "Open Estimates" now counts `sent` status instead of `draft` (fix B4-2) (`0584a98`)
- Dashboard "Total Revenue" now shows **monthly revenue** from current month (fix B4-3) (`0584a98`)

### Fixed
- Jest `moduleNameMapper` paths for `@sse/shared-utils` and `@sse/shared-types` (`6055412`)
- Missing `zod` and `uuid` dependencies in `@sse/shared-utils` package (`6055412`)
- `trx` mock in `users.service.spec.ts` made callable for transaction tests (`6055412`)
- Dashboard HTML encoding for emojis and special characters (`4ffaf6c`)

## [0.1.0] — 2026-04-04

### Added
- Initial Phase 1 MVP scaffold — monorepo (Turborepo + pnpm), NestJS API, Next.js frontend
- Multi-tenant architecture with 3-layer isolation (schema + RLS + dual DB users)
- Clerk authentication integration (backend + frontend)
- SaaS hardening — plan enforcement, tenant status checks
- 7 complete API modules: Customers, Vehicles, Estimates, Service Orders, Financial, Insurance, Users
- 8 frontend CRUD modules with React Query hooks
- PostgreSQL migrations (000-005) with seed data
- Docker Compose dev + prod stacks
- GitHub Actions CI pipeline (lint + test + build)
