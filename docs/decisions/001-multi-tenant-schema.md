# ADR-001: Multi-Tenant Schema Isolation

**Date:** 2026-04-04
**Status:** Accepted
**Deciders:** Luigi Filippozzi

## Context

Storm Shield Enterprise (SSE) is a SaaS ERP serving multiple auto repair businesses (tenants). We need a strategy to isolate tenant data in PostgreSQL that balances security, performance, and operational complexity.

### Options Considered

1. **Shared schema + tenant_id column** - Simplest, but relies entirely on application code for isolation
2. **Schema-per-tenant** - Each tenant gets its own PostgreSQL schema within a shared database
3. **Database-per-tenant** - Maximum isolation, but operational overhead scales linearly

## Decision

We chose **schema-per-tenant** (option 2) combined with Row Level Security (RLS) as defense-in-depth.

Each tenant receives a schema named `tenant_{uuid}`. The `TenantDatabaseService` sets `SET search_path TO "tenant_xxx", public` per request, and also sets `SET app.current_tenant_id` for RLS enforcement.

## Rationale

- **Security**: Schema isolation prevents accidental cross-tenant queries at the database level. RLS provides a second barrier even if application code misses a `WHERE tenant_id = X`.
- **Performance**: Shared database allows connection pooling. PostgreSQL handles hundreds of schemas efficiently.
- **Operations**: Single database to backup, monitor, and migrate. Tenant provisioning is a SQL script, not a new database.
- **Scale target**: 500+ tenants in Phase 1, which is well within PostgreSQL schema limits.

## Consequences

- Migrations must be applied to every tenant schema (handled by `tenant-provisioning.ts`)
- Connection pool is shared across tenants (mitigated by Neon's serverless pooler in staging/prod)
- Dual DB users required: `sse_app` (RLS-enforced runtime) and `sse_user` (admin for migrations)

## Related

- [ADR-005: SaaS Tenant Isolation](005-saas-tenant-isolation.md) — detailed 3-layer isolation design
