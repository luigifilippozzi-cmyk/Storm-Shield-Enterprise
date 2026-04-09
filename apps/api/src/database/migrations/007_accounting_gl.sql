-- Migration 007: Accounting — General Ledger (Chart of Accounts)
-- Phase 3 start: creates chart_of_accounts table + indexes + RLS policy.
-- Idempotent: uses IF NOT EXISTS / CREATE OR REPLACE where possible.

-- ── 1. Enum types ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
    CREATE TYPE account_type AS ENUM ('asset','liability','equity','revenue','expense');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'normal_balance') THEN
    CREATE TYPE normal_balance AS ENUM ('debit','credit');
  END IF;
END$$;

-- ── 2. chart_of_accounts table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  account_number  VARCHAR(10) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  account_type    account_type NOT NULL,
  normal_balance  normal_balance NOT NULL,
  parent_id       UUID REFERENCES chart_of_accounts(id),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_system       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  -- Each tenant has unique account numbers
  CONSTRAINT uq_coa_tenant_account_number UNIQUE (tenant_id, account_number)
);

-- ── 3. Indexes ─────────────────────────────────────────────────
-- Lookup by tenant (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_coa_tenant_id ON chart_of_accounts(tenant_id);
-- Filter by account type within a tenant
CREATE INDEX IF NOT EXISTS idx_coa_tenant_type ON chart_of_accounts(tenant_id, account_type);
-- Tree traversal: find children of a parent
CREATE INDEX IF NOT EXISTS idx_coa_parent_id ON chart_of_accounts(parent_id);
-- Soft-delete filter
CREATE INDEX IF NOT EXISTS idx_coa_deleted_at ON chart_of_accounts(deleted_at) WHERE deleted_at IS NULL;

-- ── 4. Auto-update updated_at trigger ──────────────────────────
-- Reuses the update_updated_at() function created in migration 000.
DROP TRIGGER IF EXISTS trg_coa_updated_at ON chart_of_accounts;
CREATE TRIGGER trg_coa_updated_at
  BEFORE UPDATE ON chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 5. Row Level Security ──────────────────────────────────────
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: tenant isolation via session variable app.current_tenant_id
DROP POLICY IF EXISTS coa_tenant_isolation ON chart_of_accounts;
CREATE POLICY coa_tenant_isolation ON chart_of_accounts
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Grant access to runtime user (subject to RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON chart_of_accounts TO sse_app;
