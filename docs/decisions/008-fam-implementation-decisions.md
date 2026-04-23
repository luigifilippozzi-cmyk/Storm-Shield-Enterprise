# ADR-008: Fixed Asset Management Implementation Decisions

> **Nota:** Neste documento, "NS" refere-se a um ERP proprietário de terceiros usado exclusivamente como referência comparativa externa, sem relação comercial, licenciamento ou endosso. O nome da marca foi substituído por precaução (ver ADR-014).

**Status:** Accepted  
**Date:** 2026-04-12  
**Author:** Dev Manager (automated)

## Context

The Fixed Asset Management (FAM) module was implemented as part of Fase 3 to handle asset tracking, depreciation, and disposal for auto repair businesses. Several design decisions were made during implementation that diverge from or extend the original specification in `docs/sql/001_fam_tables.sql`.

## Decisions

### 1. ENUM values follow `enums.ts`, not SQL spec

**Decision:** `AssetStatus` uses `active | fully_depreciated | disposed | inactive` (from `enums.ts`), not `proposal | active | fully_depreciated | disposed | transferred` (from SQL spec).

**Rationale:** `enums.ts` in `packages/shared-types` is the single source of truth for the NestJS application. The SQL spec was a reference design from the Oracle/NS comparison. `inactive` better represents a paused asset than `proposal` (which implies an approval workflow not yet implemented). `trade_in` in `DisposalType` replaces `transfer` for the same reason.

### 2. Depreciation calculation in NestJS, not stored procedures

**Decision:** The `DepreciationService` calculates depreciation amounts in TypeScript (NestJS layer), not via PostgreSQL stored procedures defined in `docs/sql/003_fam_depreciation_functions.sql`.

**Rationale:** 
- Testability: 48 unit tests cover all calculation paths with mocked Knex
- Portability: no dependency on PL/pgSQL, works with any PostgreSQL provider (Neon, Supabase, RDS)
- Debugging: calculation logic is traceable in application code
- The stored procedures remain available as a reference for future optimization if batch performance requires it

### 3. Status changes only through domain workflows

**Decision:** `UpdateFixedAssetDto` does not allow setting `status` directly. Asset status changes only via:
- Depreciation execution → `fully_depreciated` (when NBV reaches salvage value)
- Disposal workflow → `disposed` (via `POST /:id/dispose`)

**Rationale:** Security review identified that allowing direct status changes would bypass required journal entry creation, leading to GL inconsistencies.

### 4. Plan enforcement uses `fixed-assets` feature flag

**Decision:** All FAM endpoints use `@RequirePlanFeature('fixed-assets')`, which is gated to `pro` and `enterprise` plans (not `accounting`).

**Rationale:** `PLAN_FEATURES` in `plan.guard.ts` already had `fixed-assets` as a separate feature. This allows independent gating — a tenant could have `accounting` (GL) without `fixed-assets` (FAM) if plan structure changes.

### 5. MACRS simplified to straight-line in NestJS

**Decision:** The MACRS depreciation method uses a simplified straight-line calculation in the NestJS layer. Full MACRS with half-year convention and IRS Pub 946 percentages is documented in the stored procedures but not yet implemented in TypeScript.

**Rationale:** Full MACRS requires the `macrs_percentages` table and complex period-based lookups. The simplified version provides correct total depreciation over the asset's life, just with different monthly distribution. Full MACRS can be implemented when a CPA validates the requirements.

### 6. Deferred columns

**Decision:** `purchase_transaction_id`, `vendor_id`, and `buyer_customer_id` were omitted from the initial implementation.

**Rationale:** These require foreign keys to tables not yet fully integrated (financial_transactions for purchase, customers for buyer). They will be added when the cross-module linking is implemented.

## Consequences

- FAM module is fully functional for basic asset lifecycle management
- All depreciation calculations are unit-tested and deterministic
- GL integration is automatic via JournalEntriesService
- Full MACRS and deferred columns are documented for future iteration
- Migration 009 + 010 provide the complete schema with RLS, indexes, and NOT NULL constraints
