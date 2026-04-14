-- Migration 010: FAM tables hardening — NOT NULL constraints + idempotent RLS/triggers
-- Addresses db-reviewer findings from PR #19

-- ── 1. NOT NULL constraints on asset_categories ─────────────────

ALTER TABLE asset_categories
  ALTER COLUMN is_active SET NOT NULL;

-- default_depreciation_method, default_useful_life_months, default_salvage_pct
-- remain nullable: they are optional defaults, NULL means "must specify per asset"

-- ── 2. NOT NULL constraints on fixed_assets ─────────────────────

ALTER TABLE fixed_assets
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN salvage_value SET NOT NULL,
  ALTER COLUMN accumulated_depreciation SET NOT NULL,
  ALTER COLUMN net_book_value SET NOT NULL;

-- ── 3. Idempotent RLS policies ──────────────────────────────────
-- Re-create policies with DROP IF EXISTS guards

DROP POLICY IF EXISTS ac_tenant_isolation ON asset_categories;
CREATE POLICY ac_tenant_isolation ON asset_categories
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS fa_tenant_isolation ON fixed_assets;
CREATE POLICY fa_tenant_isolation ON fixed_assets
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS ds_tenant_isolation ON depreciation_schedules;
CREATE POLICY ds_tenant_isolation ON depreciation_schedules
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS de_tenant_isolation ON depreciation_entries;
CREATE POLICY de_tenant_isolation ON depreciation_entries
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

DROP POLICY IF EXISTS ad_tenant_isolation ON asset_disposals;
CREATE POLICY ad_tenant_isolation ON asset_disposals
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- ── 4. Idempotent triggers ──────────────────────────────────────

DROP TRIGGER IF EXISTS trg_asset_categories_updated_at ON asset_categories;
CREATE TRIGGER trg_asset_categories_updated_at
  BEFORE UPDATE ON asset_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_fixed_assets_updated_at ON fixed_assets;
CREATE TRIGGER trg_fixed_assets_updated_at
  BEFORE UPDATE ON fixed_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
