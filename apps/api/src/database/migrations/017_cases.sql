-- Migration 017: Cases (tenant schema)
-- Purpose: Lightweight case management for customer complaints, quality issues, and general inquiries
-- Ref: RF-007, Bussola §4 Gap 5 (partial), ADR-012, anti-rec #13 (no full ticketing system)
-- Persona: Estimator (primary), Owner-Operator (review)
-- NOTE: No soft delete (deleted_at) deviation from universal convention — cases are operational
-- records, not financial/audit entries. RF-007 explicitly scopes to lightweight tracking only.
-- If retention is required in future, add deleted_at via ALTER TABLE migration.

-- ── ENUMs (idempotent, schema-qualified) ──

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'case_type' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE case_type AS ENUM (
      'complaint',
      'quality_issue',
      'refund_request',
      'general_inquiry',
      'other'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'case_status' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE case_status AS ENUM (
      'open',
      'in_progress',
      'resolved',
      'closed'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'case_priority' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE case_priority AS ENUM (
      'low',
      'medium',
      'high'
    );
  END IF;
END $$;

-- ── Table ──

CREATE TABLE IF NOT EXISTS cases (
  id                    UUID            NOT NULL,
  tenant_id             UUID            NOT NULL,
  case_type             case_type       NOT NULL,
  opened_by_user_id     UUID            NOT NULL,
  customer_id           UUID            NULL,
  vehicle_id            UUID            NULL,
  related_estimate_id   UUID            NULL,
  related_so_id         UUID            NULL,
  title                 TEXT            NOT NULL,
  body                  TEXT            NOT NULL,
  status                case_status     NOT NULL DEFAULT 'open',
  priority              case_priority   NOT NULL DEFAULT 'medium',
  assigned_to_user_id   UUID            NULL,
  opened_at             TIMESTAMPTZ     NOT NULL DEFAULT now(),
  resolved_at           TIMESTAMPTZ     NULL,
  resolution_notes      TEXT            NULL,
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT now(),

  CONSTRAINT cases_pkey PRIMARY KEY (id)
);

-- ── Indexes ──

CREATE INDEX IF NOT EXISTS idx_cases_tenant_status
  ON cases (tenant_id, status)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cases_tenant_customer
  ON cases (tenant_id, customer_id)
  WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cases_tenant_assigned
  ON cases (tenant_id, assigned_to_user_id)
  WHERE assigned_to_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cases_tenant_created
  ON cases (tenant_id, created_at DESC);

-- ── updated_at trigger ──

DROP TRIGGER IF EXISTS trg_cases_updated_at ON cases;
CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Row Level Security ──

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cases' AND policyname = 'cases_tenant_isolation'
  ) THEN
    CREATE POLICY cases_tenant_isolation ON cases
      USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;
