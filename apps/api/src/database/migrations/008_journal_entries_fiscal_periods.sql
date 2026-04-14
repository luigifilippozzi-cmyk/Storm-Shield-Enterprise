-- Migration 008: Journal Entries & Fiscal Periods
-- Depends on: 007_accounting_gl.sql (chart_of_accounts)
-- Idempotent: uses IF NOT EXISTS / DROP IF EXISTS where possible.

-- ── 1. Enum types ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'journal_entry_status') THEN
    CREATE TYPE journal_entry_status AS ENUM ('draft','posted','reversed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fiscal_period_status') THEN
    CREATE TYPE fiscal_period_status AS ENUM ('open','closed','locked');
  END IF;
END$$;

-- ── 2. fiscal_periods table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiscal_periods (
  id          UUID PRIMARY KEY,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        VARCHAR(100) NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      fiscal_period_status NOT NULL DEFAULT 'open',
  closed_at   TIMESTAMPTZ,
  closed_by   UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_fp_dates CHECK (start_date < end_date),
  CONSTRAINT uq_fp_tenant_name UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_fp_tenant_id ON fiscal_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fp_tenant_status ON fiscal_periods(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fp_tenant_dates ON fiscal_periods(tenant_id, start_date, end_date);

DROP TRIGGER IF EXISTS trg_fp_updated_at ON fiscal_periods;
CREATE TRIGGER trg_fp_updated_at
  BEFORE UPDATE ON fiscal_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fp_tenant_isolation ON fiscal_periods;
CREATE POLICY fp_tenant_isolation ON fiscal_periods
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
GRANT SELECT, INSERT, UPDATE, DELETE ON fiscal_periods TO sse_app;

-- ── 3. journal_entries table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id                UUID PRIMARY KEY,
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  entry_number      VARCHAR(30) NOT NULL,
  fiscal_period_id  UUID NOT NULL REFERENCES fiscal_periods(id),
  entry_date        DATE NOT NULL,
  description       TEXT NOT NULL,
  status            journal_entry_status NOT NULL DEFAULT 'draft',
  reference_type    VARCHAR(50),
  reference_id      UUID,
  total_debit       DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_credit      DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_by        UUID NOT NULL,
  posted_at         TIMESTAMPTZ,
  posted_by         UUID,
  reversed_entry_id UUID REFERENCES journal_entries(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_je_tenant_entry_number UNIQUE (tenant_id, entry_number)
);

CREATE INDEX IF NOT EXISTS idx_je_tenant_id ON journal_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_je_tenant_status ON journal_entries(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_je_fiscal_period ON journal_entries(fiscal_period_id);
CREATE INDEX IF NOT EXISTS idx_je_entry_date ON journal_entries(tenant_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_je_reference ON journal_entries(reference_type, reference_id)
  WHERE reference_type IS NOT NULL;

DROP TRIGGER IF EXISTS trg_je_updated_at ON journal_entries;
CREATE TRIGGER trg_je_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS je_tenant_isolation ON journal_entries;
CREATE POLICY je_tenant_isolation ON journal_entries
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
GRANT SELECT, INSERT, UPDATE ON journal_entries TO sse_app;
-- No DELETE grant: journal entries are append-only (soft-delete not applicable per accounting rules)

-- ── 4. journal_entry_lines table ───────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id                UUID PRIMARY KEY,
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  journal_entry_id  UUID NOT NULL REFERENCES journal_entries(id),
  account_id        UUID NOT NULL REFERENCES chart_of_accounts(id),
  debit             DECIMAL(14,2) NOT NULL DEFAULT 0,
  credit            DECIMAL(14,2) NOT NULL DEFAULT 0,
  description       TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT chk_jel_debit_or_credit CHECK (
    (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_jel_journal_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_jel_account ON journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_jel_tenant_id ON journal_entry_lines(tenant_id);

ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jel_tenant_isolation ON journal_entry_lines;
CREATE POLICY jel_tenant_isolation ON journal_entry_lines
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
GRANT SELECT, INSERT, UPDATE ON journal_entry_lines TO sse_app;
