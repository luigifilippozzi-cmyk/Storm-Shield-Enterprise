-- Migration 015: estimate_status_changes table + legacy mapping (RF-005a, part 2/2)
-- Purpose: Map legacy status values to canonical equivalents; create append-only
--   audit table estimate_status_changes with RLS and immutability triggers.
-- PREREQUISITE: Migration 014 must be applied first (new ENUM values must be committed
--   in a separate transaction before being referenced here — PG requirement).
-- Scope: TENANT schema (executed per-tenant; no public. prefix)
-- Ref: RF-005a, ADR-012, T-20260421-3a, Split A ratificado 2026-04-22

-- ══════════════════════════════════════
-- STEP 1: Map legacy status values to canonical equivalents
-- Only updates rows with explicit mapping; no forced defaults.
-- Idempotent: re-running when rows already migrated is a no-op.
-- Legacy values (sent, supplement_requested, converted) remain in the ENUM type
-- but should not be used going forward.
-- ══════════════════════════════════════
UPDATE estimates SET status = 'submitted_to_adjuster', updated_at = NOW()
  WHERE status = 'sent';

UPDATE estimates SET status = 'supplement_pending', updated_at = NOW()
  WHERE status = 'supplement_requested';

UPDATE estimates SET status = 'closed', updated_at = NOW()
  WHERE status = 'converted';

-- ══════════════════════════════════════
-- STEP 2: Create estimate_status_changes (append-only audit trail)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS estimate_status_changes (
  id                  UUID          NOT NULL,
  tenant_id           UUID          NOT NULL,
  estimate_id         UUID          NOT NULL REFERENCES estimates(id) ON DELETE RESTRICT,
  from_status         estimate_status NOT NULL,
  to_status           estimate_status NOT NULL,
  changed_by_user_id  UUID          NOT NULL,
  changed_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  notes               TEXT          NULL,

  CONSTRAINT estimate_status_changes_pkey PRIMARY KEY (id)
);

-- Index for per-estimate history queries (most common access pattern)
CREATE INDEX IF NOT EXISTS idx_estimate_status_changes_estimate
  ON estimate_status_changes (tenant_id, estimate_id, changed_at DESC);

-- Index for audit queries by user
CREATE INDEX IF NOT EXISTS idx_estimate_status_changes_user
  ON estimate_status_changes (tenant_id, changed_by_user_id, changed_at DESC);

-- ══════════════════════════════════════
-- STEP 3: Enforce append-only semantics (no UPDATE / DELETE)
-- ══════════════════════════════════════
CREATE OR REPLACE FUNCTION prevent_estimate_status_changes_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'estimate_status_changes is append-only — UPDATE and DELETE are not permitted';
END;
$$;

DROP TRIGGER IF EXISTS trg_estimate_status_changes_no_update ON estimate_status_changes;
CREATE TRIGGER trg_estimate_status_changes_no_update
  BEFORE UPDATE ON estimate_status_changes
  FOR EACH ROW EXECUTE FUNCTION prevent_estimate_status_changes_mutation();

DROP TRIGGER IF EXISTS trg_estimate_status_changes_no_delete ON estimate_status_changes;
CREATE TRIGGER trg_estimate_status_changes_no_delete
  BEFORE DELETE ON estimate_status_changes
  FOR EACH ROW EXECUTE FUNCTION prevent_estimate_status_changes_mutation();

-- ══════════════════════════════════════
-- STEP 4: Row Level Security
-- ══════════════════════════════════════
ALTER TABLE estimate_status_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_estimate_status_changes ON estimate_status_changes;
CREATE POLICY tenant_isolation_estimate_status_changes ON estimate_status_changes
  FOR SELECT USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_estimate_status_changes ON estimate_status_changes;
CREATE POLICY tenant_insert_estimate_status_changes ON estimate_status_changes
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
