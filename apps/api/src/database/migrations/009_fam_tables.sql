-- Migration 009: Fixed Asset Management (FAM) Tables
-- Depends on: 007_accounting_gl (chart_of_accounts), 008_journal_entries_fiscal_periods

-- ── ENUM types ──────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE depreciation_method_enum AS ENUM (
    'straight_line', 'macrs', 'declining_balance', 'sum_of_years', 'units_of_production'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_status_enum AS ENUM (
    'active', 'fully_depreciated', 'disposed', 'inactive'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE disposal_type_enum AS ENUM (
    'sale', 'write_off', 'donation', 'trade_in'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE depreciation_entry_type_enum AS ENUM (
    'regular', 'adjustment', 'revaluation', 'catch_up'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE depreciation_schedule_status_enum AS ENUM (
    'scheduled', 'posted', 'skipped'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 1. asset_categories ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS asset_categories (
  id                          UUID PRIMARY KEY,
  tenant_id                   UUID NOT NULL,
  category_name               VARCHAR(100) NOT NULL,
  description                 TEXT,

  -- GL account links
  asset_account_id            UUID NOT NULL REFERENCES chart_of_accounts(id),
  depreciation_account_id     UUID NOT NULL REFERENCES chart_of_accounts(id),
  expense_account_id          UUID NOT NULL REFERENCES chart_of_accounts(id),
  gain_loss_account_id        UUID NOT NULL REFERENCES chart_of_accounts(id),

  -- Defaults for new assets
  default_depreciation_method depreciation_method_enum DEFAULT 'straight_line',
  default_useful_life_months  INT CHECK (default_useful_life_months > 0),
  default_salvage_pct         DECIMAL(5,2) DEFAULT 0 CHECK (default_salvage_pct >= 0 AND default_salvage_pct < 100),

  is_active                   BOOLEAN DEFAULT TRUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_asset_category_name UNIQUE (tenant_id, category_name)
);

CREATE INDEX IF NOT EXISTS idx_ac_tenant_id ON asset_categories(tenant_id);

-- ── 2. fixed_assets ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fixed_assets (
  id                          UUID PRIMARY KEY,
  tenant_id                   UUID NOT NULL,
  category_id                 UUID NOT NULL REFERENCES asset_categories(id),

  asset_tag                   VARCHAR(20) NOT NULL,
  asset_name                  VARCHAR(200) NOT NULL,
  description                 TEXT,
  serial_number               VARCHAR(100),

  status                      asset_status_enum DEFAULT 'active',

  -- Acquisition
  acquisition_date            DATE NOT NULL,
  acquisition_cost            DECIMAL(14,2) NOT NULL CHECK (acquisition_cost > 0),
  salvage_value               DECIMAL(14,2) DEFAULT 0 CHECK (salvage_value >= 0),

  -- Location & Responsible
  location                    VARCHAR(200),
  responsible_user_id         UUID,

  -- Depreciation config
  depreciation_method         depreciation_method_enum NOT NULL,
  useful_life_months          INT NOT NULL CHECK (useful_life_months > 0),
  depreciation_start_date     DATE NOT NULL,

  -- Cache columns (recalculated after each depreciation entry)
  accumulated_depreciation    DECIMAL(14,2) DEFAULT 0,
  net_book_value              DECIMAL(14,2),
  last_depreciation_date      DATE,

  custom_fields               JSONB,

  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  CONSTRAINT uq_asset_tag UNIQUE (tenant_id, asset_tag),
  CONSTRAINT chk_salvage_lte_cost CHECK (salvage_value <= acquisition_cost)
);

CREATE INDEX IF NOT EXISTS idx_fa_tenant_id ON fixed_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fa_category_id ON fixed_assets(category_id);
CREATE INDEX IF NOT EXISTS idx_fa_status ON fixed_assets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fa_deleted_at ON fixed_assets(deleted_at);

-- ── 3. depreciation_schedules ───────────────────────────────────

CREATE TABLE IF NOT EXISTS depreciation_schedules (
  id                          UUID PRIMARY KEY,
  tenant_id                   UUID NOT NULL,
  fixed_asset_id              UUID NOT NULL REFERENCES fixed_assets(id),
  period_number               INT NOT NULL CHECK (period_number > 0),
  period_start                DATE NOT NULL,
  period_end                  DATE NOT NULL,

  depreciation_amount         DECIMAL(14,2) NOT NULL CHECK (depreciation_amount >= 0),
  accumulated_amount          DECIMAL(14,2) NOT NULL CHECK (accumulated_amount >= 0),
  remaining_value             DECIMAL(14,2) NOT NULL CHECK (remaining_value >= 0),

  status                      depreciation_schedule_status_enum DEFAULT 'scheduled',
  journal_entry_id            UUID REFERENCES journal_entries(id),

  created_at                  TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_schedule_period UNIQUE (fixed_asset_id, period_number)
);

CREATE INDEX IF NOT EXISTS idx_ds_asset_id ON depreciation_schedules(fixed_asset_id);
CREATE INDEX IF NOT EXISTS idx_ds_tenant_id ON depreciation_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ds_status ON depreciation_schedules(fixed_asset_id, status);

-- ── 4. depreciation_entries ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS depreciation_entries (
  id                          UUID PRIMARY KEY,
  tenant_id                   UUID NOT NULL,
  fixed_asset_id              UUID NOT NULL REFERENCES fixed_assets(id),
  fiscal_period_id            UUID NOT NULL REFERENCES fiscal_periods(id),

  entry_date                  DATE NOT NULL,
  depreciation_amount         DECIMAL(14,2) NOT NULL CHECK (depreciation_amount > 0),
  accumulated_depreciation    DECIMAL(14,2) NOT NULL CHECK (accumulated_depreciation >= 0),
  net_book_value              DECIMAL(14,2) NOT NULL CHECK (net_book_value >= 0),

  journal_entry_id            UUID NOT NULL REFERENCES journal_entries(id),
  entry_type                  depreciation_entry_type_enum DEFAULT 'regular',

  notes                       TEXT,
  created_by                  UUID NOT NULL,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_depr_entry_period UNIQUE (fixed_asset_id, fiscal_period_id, entry_type)
);

CREATE INDEX IF NOT EXISTS idx_de_asset_id ON depreciation_entries(fixed_asset_id);
CREATE INDEX IF NOT EXISTS idx_de_tenant_id ON depreciation_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_de_fiscal_period ON depreciation_entries(fiscal_period_id);

-- ── 5. asset_disposals ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS asset_disposals (
  id                          UUID PRIMARY KEY,
  tenant_id                   UUID NOT NULL,
  fixed_asset_id              UUID NOT NULL REFERENCES fixed_assets(id),

  disposal_type               disposal_type_enum NOT NULL,
  disposal_date               DATE NOT NULL,

  disposal_proceeds           DECIMAL(14,2) DEFAULT 0 CHECK (disposal_proceeds >= 0),
  net_book_value_at_disposal  DECIMAL(14,2) NOT NULL,
  gain_loss                   DECIMAL(14,2) NOT NULL,

  buyer_info                  VARCHAR(500),
  journal_entry_id            UUID NOT NULL REFERENCES journal_entries(id),

  reason                      VARCHAR(500) NOT NULL,
  notes                       TEXT,

  approved_by                 UUID,
  approved_at                 TIMESTAMPTZ,
  created_by                  UUID NOT NULL,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_asset_id ON asset_disposals(fixed_asset_id);
CREATE INDEX IF NOT EXISTS idx_ad_tenant_id ON asset_disposals(tenant_id);

-- ── RLS Policies ────────────────────────────────────────────────

ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE depreciation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE depreciation_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_disposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY ac_tenant_isolation ON asset_categories
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY fa_tenant_isolation ON fixed_assets
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY ds_tenant_isolation ON depreciation_schedules
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY de_tenant_isolation ON depreciation_entries
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY ad_tenant_isolation ON asset_disposals
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- ── update_updated_at triggers ──────────────────────────────────

CREATE TRIGGER trg_asset_categories_updated_at
  BEFORE UPDATE ON asset_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_fixed_assets_updated_at
  BEFORE UPDATE ON fixed_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
