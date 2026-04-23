-- Migration 014: Estimate State Machine (RF-005a)
-- Purpose: Expand estimate_status ENUM to 10 canonical values + append-only status history table
-- Scope: TENANT schema (executed per-tenant; no public.prefix)
-- Ref: RF-005a, ADR-012, dm_queue.md T-20260421-3a, Split A ratificado 2026-04-22

-- ══════════════════════════════════════
-- STEP 1: Expand ENUM (idempotent via DO block)
-- New canonical values: submitted_to_adjuster, awaiting_approval, supplement_pending,
--   approved_with_supplement, disputed, paid, closed
-- Retained values: draft, approved, rejected
-- Legacy values kept in type (can't remove in PG): sent, supplement_requested, converted
-- ══════════════════════════════════════
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'submitted_to_adjuster'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'submitted_to_adjuster';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'awaiting_approval'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'awaiting_approval';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'supplement_pending'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'supplement_pending';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'approved_with_supplement'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'approved_with_supplement';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'disputed'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'disputed';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'paid'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'paid';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'closed'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'closed';
  END IF;
END $$;

-- ══════════════════════════════════════
-- STEP 2: Map legacy status values to canonical equivalents
-- Only updates rows with explicit mapping; no forced defaults
-- Idempotent: re-running when rows already migrated is a no-op
-- ══════════════════════════════════════
UPDATE estimates SET status = 'submitted_to_adjuster', updated_at = NOW()
  WHERE status = 'sent';

UPDATE estimates SET status = 'supplement_pending', updated_at = NOW()
  WHERE status = 'supplement_requested';

UPDATE estimates SET status = 'closed', updated_at = NOW()
  WHERE status = 'converted';

-- ══════════════════════════════════════
-- STEP 3: Create estimate_status_changes (append-only audit trail)
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
-- STEP 4: Enforce append-only semantics (no UPDATE / DELETE)
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
-- STEP 5: Row Level Security
-- ══════════════════════════════════════
ALTER TABLE estimate_status_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_estimate_status_changes ON estimate_status_changes;
CREATE POLICY tenant_isolation_estimate_status_changes ON estimate_status_changes
  FOR SELECT USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_insert_estimate_status_changes ON estimate_status_changes;
CREATE POLICY tenant_insert_estimate_status_changes ON estimate_status_changes
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
