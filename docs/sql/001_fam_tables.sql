-- NOTA: Neste documento, "NS" refere-se a um ERP proprietário de terceiros
-- usado exclusivamente como referência comparativa externa, sem relação comercial,
-- licenciamento ou endosso. O nome da marca foi substituído por precaução (ver ADR-014).
-- ============================================================================
-- STORM SHIELD ENTERPRISE — Fixed Asset Management (FAM) Module
-- Migration 001: Core Tables + Constraints
-- PostgreSQL 16+ | Multi-Tenant (schema-per-tenant)
-- ============================================================================
-- Execute dentro do schema do tenant: SET search_path TO tenant_{uuid};
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- ENUM TYPES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TYPE depreciation_method_enum AS ENUM (
    'straight_line',
    'macrs',
    'declining_balance',
    'sum_of_years',
    'units_of_production'
);

CREATE TYPE asset_status_enum AS ENUM (
    'proposal',
    'active',
    'fully_depreciated',
    'disposed',
    'transferred'
);

CREATE TYPE depreciation_schedule_status_enum AS ENUM (
    'scheduled',
    'posted',
    'skipped'
);

CREATE TYPE depreciation_entry_type_enum AS ENUM (
    'regular',
    'adjustment',
    'revaluation',
    'catch_up'
);

CREATE TYPE disposal_type_enum AS ENUM (
    'sale',
    'write_off',
    'transfer',
    'donation'
);

-- ────────────────────────────────────────────────────────────────────────────
-- 1. asset_categories
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE asset_categories (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL REFERENCES tenants(id),
    category_name               VARCHAR(100) NOT NULL,
    description                 TEXT,

    -- 4 contas GL obrigatórias (Leading Practice Oracle/NS)
    asset_account_id            UUID NOT NULL REFERENCES chart_of_accounts(id),
    depreciation_account_id     UUID NOT NULL REFERENCES chart_of_accounts(id),
    expense_account_id          UUID NOT NULL REFERENCES chart_of_accounts(id),
    gain_loss_account_id        UUID NOT NULL REFERENCES chart_of_accounts(id),

    -- Defaults para novos ativos nesta categoria
    default_depreciation_method depreciation_method_enum NOT NULL DEFAULT 'straight_line',
    default_useful_life_months  INT NOT NULL CHECK (default_useful_life_months > 0),
    default_salvage_pct         DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (default_salvage_pct >= 0 AND default_salvage_pct < 100),

    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_asset_category_name UNIQUE (tenant_id, category_name)
);

CREATE INDEX idx_asset_categories_tenant ON asset_categories(tenant_id, is_active);

COMMENT ON TABLE asset_categories IS 'Categorias de ativos fixos com configuração padrão de contas GL e método de depreciação';

-- ────────────────────────────────────────────────────────────────────────────
-- 2. fixed_assets
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE fixed_assets (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL REFERENCES tenants(id),
    category_id                 UUID NOT NULL REFERENCES asset_categories(id),

    asset_tag                   VARCHAR(20) NOT NULL,
    asset_name                  VARCHAR(200) NOT NULL,
    description                 TEXT,
    serial_number               VARCHAR(100),

    status                      asset_status_enum NOT NULL DEFAULT 'proposal',

    -- Aquisição
    acquisition_date            DATE NOT NULL,
    acquisition_cost            DECIMAL(14,2) NOT NULL CHECK (acquisition_cost > 0),
    salvage_value               DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (salvage_value >= 0),
    purchase_transaction_id     UUID REFERENCES financial_transactions(id),
    vendor_id                   UUID,  -- FK flexível (pode ser contractors ou fornecedor externo)

    -- Localização
    location                    VARCHAR(200),

    -- Depreciação
    depreciation_method         depreciation_method_enum NOT NULL,
    useful_life_months          INT NOT NULL CHECK (useful_life_months > 0),
    depreciation_start_date     DATE NOT NULL,

    -- Caches recalculados após cada depreciation_entry
    accumulated_depreciation    DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (accumulated_depreciation >= 0),
    net_book_value              DECIMAL(14,2) NOT NULL CHECK (net_book_value >= 0),
    last_depreciation_date      DATE,

    -- Responsável
    responsible_user_id         UUID REFERENCES users(id),

    -- Extensibilidade
    custom_fields               JSONB,

    -- Timestamps
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at                  TIMESTAMPTZ,  -- soft delete

    -- Constraints
    CONSTRAINT uq_asset_tag UNIQUE (tenant_id, asset_tag),
    CONSTRAINT chk_salvage_le_cost CHECK (salvage_value <= acquisition_cost),
    CONSTRAINT chk_accum_depr_le_depreciable CHECK (
        accumulated_depreciation <= (acquisition_cost - salvage_value)
        OR status IN ('disposed', 'transferred')
    ),
    CONSTRAINT chk_nbv_consistent CHECK (
        net_book_value = acquisition_cost - accumulated_depreciation
        OR status IN ('disposed', 'transferred')
    )
);

CREATE INDEX idx_fixed_assets_tenant_status ON fixed_assets(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_fixed_assets_tenant_category ON fixed_assets(tenant_id, category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_fixed_assets_depreciation ON fixed_assets(tenant_id, status, last_depreciation_date)
    WHERE status = 'active' AND deleted_at IS NULL;

COMMENT ON TABLE fixed_assets IS 'Registro principal de ativos fixos — ciclo: proposal → active → fully_depreciated → disposed';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. depreciation_schedules
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE depreciation_schedules (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixed_asset_id              UUID NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,

    period_number               INT NOT NULL CHECK (period_number > 0),
    period_start                DATE NOT NULL,
    period_end                  DATE NOT NULL,

    depreciation_amount         DECIMAL(14,2) NOT NULL CHECK (depreciation_amount >= 0),
    accumulated_amount          DECIMAL(14,2) NOT NULL CHECK (accumulated_amount >= 0),
    remaining_value             DECIMAL(14,2) NOT NULL CHECK (remaining_value >= 0),

    status                      depreciation_schedule_status_enum NOT NULL DEFAULT 'scheduled',
    journal_entry_id            UUID REFERENCES journal_entries(id),

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_schedule_period UNIQUE (fixed_asset_id, period_number),
    CONSTRAINT chk_period_dates CHECK (period_end >= period_start)
);

CREATE INDEX idx_depr_schedule_asset ON depreciation_schedules(fixed_asset_id, status);

COMMENT ON TABLE depreciation_schedules IS 'Programação pré-calculada de depreciação — gerada na ativação do ativo';

-- ────────────────────────────────────────────────────────────────────────────
-- 4. depreciation_entries
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE depreciation_entries (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL REFERENCES tenants(id),
    fixed_asset_id              UUID NOT NULL REFERENCES fixed_assets(id),
    fiscal_period_id            UUID NOT NULL REFERENCES fiscal_periods(id),

    entry_date                  DATE NOT NULL,
    depreciation_amount         DECIMAL(14,2) NOT NULL CHECK (depreciation_amount > 0),
    accumulated_depreciation    DECIMAL(14,2) NOT NULL CHECK (accumulated_depreciation >= 0),
    net_book_value              DECIMAL(14,2) NOT NULL CHECK (net_book_value >= 0),

    journal_entry_id            UUID NOT NULL REFERENCES journal_entries(id),
    entry_type                  depreciation_entry_type_enum NOT NULL DEFAULT 'regular',

    notes                       TEXT,
    created_by                  UUID NOT NULL REFERENCES users(id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_depr_entry_period UNIQUE (fixed_asset_id, fiscal_period_id, entry_type)
);

CREATE INDEX idx_depr_entries_asset ON depreciation_entries(fixed_asset_id, fiscal_period_id);
CREATE INDEX idx_depr_entries_tenant ON depreciation_entries(tenant_id, entry_date);

COMMENT ON TABLE depreciation_entries IS 'Execução efetiva de depreciação — cada entry gera JE automático D:5800/C:1590';

-- ────────────────────────────────────────────────────────────────────────────
-- 5. asset_disposals
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE asset_disposals (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL REFERENCES tenants(id),
    fixed_asset_id              UUID NOT NULL REFERENCES fixed_assets(id),

    disposal_type               disposal_type_enum NOT NULL,
    disposal_date               DATE NOT NULL,

    disposal_proceeds           DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (disposal_proceeds >= 0),
    net_book_value_at_disposal  DECIMAL(14,2) NOT NULL CHECK (net_book_value_at_disposal >= 0),
    gain_loss                   DECIMAL(14,2) NOT NULL,  -- pode ser negativo (perda)

    buyer_customer_id           UUID REFERENCES customers(id),
    journal_entry_id            UUID NOT NULL REFERENCES journal_entries(id),

    reason                      VARCHAR(500) NOT NULL,
    notes                       TEXT,

    approved_by                 UUID REFERENCES users(id),
    approved_at                 TIMESTAMPTZ,
    created_by                  UUID NOT NULL REFERENCES users(id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_gain_loss CHECK (gain_loss = disposal_proceeds - net_book_value_at_disposal),
    CONSTRAINT chk_sale_has_buyer CHECK (
        (disposal_type = 'sale' AND buyer_customer_id IS NOT NULL)
        OR disposal_type != 'sale'
    ),
    CONSTRAINT chk_disposal_approved CHECK (
        (approved_by IS NOT NULL AND approved_at IS NOT NULL)
        OR (approved_by IS NULL AND approved_at IS NULL)
    )
);

CREATE INDEX idx_asset_disposals_tenant ON asset_disposals(tenant_id, disposal_date);
CREATE INDEX idx_asset_disposals_asset ON asset_disposals(fixed_asset_id);

COMMENT ON TABLE asset_disposals IS 'Descarte de ativos — venda, baixa, transferência ou doação com JE automático';

-- ────────────────────────────────────────────────────────────────────────────
-- updated_at TRIGGER (reusável)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_asset_categories
    BEFORE UPDATE ON asset_categories
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER set_updated_at_fixed_assets
    BEFORE UPDATE ON fixed_assets
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

COMMIT;
