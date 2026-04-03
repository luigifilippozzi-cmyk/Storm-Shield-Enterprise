# ADR-005: SaaS Tenant Isolation — 3-Layer Defense

## Status
Accepted

## Date
2026-04-03

## Context
Storm Shield Enterprise is a multi-tenant SaaS. A single bug that forgets a `WHERE tenant_id = X` clause could leak data between tenants. We need defense-in-depth beyond application-level filtering.

## Decision
Implement 3 layers of tenant isolation:

### Layer 1: Schema Isolation
Each tenant gets a dedicated PostgreSQL schema (`tenant_{uuid}`). The `TenantDatabaseService` sets `SET search_path TO "tenant_xxx", public` at the start of each request.

### Layer 2: Row Level Security (RLS)
All tables with `tenant_id` have RLS policies that check `current_tenant_id()` — a PostgreSQL function that reads `app.current_tenant_id` from the session. Even if a query lacks a `WHERE tenant_id`, RLS blocks cross-tenant access.

### Layer 3: Dual Database Users
- `sse_app` — used by the runtime application. Subject to RLS policies.
- `sse_user` — used by migrations and provisioning. Bypasses RLS (superuser).

The runtime connection never uses the admin user.

## Consequences
- **Positive**: A code bug cannot leak data across tenants — RLS is enforced at the database level regardless of application code.
- **Positive**: Schema isolation means even table names/indexes are per-tenant, reducing contention.
- **Negative**: Slightly more complex connection management (two users, search_path per request).
- **Negative**: New tables with `tenant_id` must always get a corresponding RLS policy (enforced via CLAUDE.md rule #13).

## Subscription Plan Enforcement
Additionally, we implement plan-based feature gating and resource limits:
- `PlanGuard` checks if the tenant's plan includes the required module.
- `PlanLimitsInterceptor` checks resource counts against plan limits on creation.
- The `TenantMiddleware` loads the plan from the `tenants` table and blocks suspended/cancelled tenants.

Plans: free (limited), starter (expanded), pro (full features), enterprise (unlimited).
