-- ============================================================================
-- STORM SHIELD ENTERPRISE — Fixed Asset Management (FAM) Module
-- Migration 002: Seed Data — GL Accounts + Asset Categories
-- ============================================================================
-- Pré-requisito: chart_of_accounts já populado com contas base (1000-9000)
-- Execute dentro do schema do tenant: SET search_path TO tenant_{uuid};
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- Novas contas no Chart of Accounts para suporte completo FAM
-- ────────────────────────────────────────────────────────────────────────────

-- Subcontas de Fixed Assets (1500)
INSERT INTO chart_of_accounts (tenant_id, parent_account_id, account_code, account_name, account_type, account_subtype, normal_balance, level, is_header, is_system_account, accepts_entries, description, sort_order)
SELECT
    t.id,
    fa.id,  -- parent = 1500 Fixed Assets
    v.code,
    v.name,
    'asset',
    'fixed_asset',
    'debit',
    3,
    FALSE,
    TRUE,
    TRUE,
    v.descr,
    v.sort_ord
FROM tenants t
CROSS JOIN (VALUES
    ('1530', 'Furniture & Fixtures',      'Mobiliário, estantes, bancadas, equipamentos de escritório.',  1530),
    ('1540', 'Computer Equipment',        'Computadores, tablets, impressoras, scanners, redes.',         1540),
    ('1550', 'Leasehold Improvements',    'Benfeitorias em imóvel alugado (pintura, divisórias, HVAC).', 1550)
) AS v(code, name, descr, sort_ord)
CROSS JOIN chart_of_accounts fa
WHERE fa.account_code = '1500' AND fa.tenant_id = t.id
ON CONFLICT DO NOTHING;

-- Conta de Ganho/Perda em Descarte de Ativos (9100)
INSERT INTO chart_of_accounts (tenant_id, parent_account_id, account_code, account_name, account_type, account_subtype, normal_balance, level, is_header, is_system_account, accepts_entries, description, sort_order)
SELECT
    t.id,
    oe.id,  -- parent = 9000 Other Expenses
    '9100',
    'Gain/Loss on Asset Disposal',
    'expense',
    'other_expense',
    'debit',
    2,
    FALSE,
    TRUE,
    TRUE,
    'Ganho ou perda na venda/baixa de ativos fixos. Crédito = ganho, Débito = perda.',
    9100
FROM tenants t
CROSS JOIN chart_of_accounts oe
WHERE oe.account_code = '9000' AND oe.tenant_id = t.id
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- Asset Categories (Seed Data conforme IRS Publication 946)
-- ────────────────────────────────────────────────────────────────────────────

-- Função helper para inserir categorias referenciando contas GL por code
DO $$
DECLARE
    t_id     UUID;
    acc_1510 UUID;
    acc_1520 UUID;
    acc_1530 UUID;
    acc_1540 UUID;
    acc_1550 UUID;
    acc_1590 UUID;
    acc_5800 UUID;
    acc_9100 UUID;
BEGIN
    FOR t_id IN SELECT id FROM tenants LOOP
        -- Buscar IDs das contas GL para este tenant
        SELECT id INTO acc_1510 FROM chart_of_accounts WHERE tenant_id = t_id AND account_code = '1510';
        SELECT id INTO acc_1520 FROM chart_of_accounts WHERE tenant_id = t_id AND account_code = '1520';
        SELECT id INTO acc_1530 FROM chart_of_accounts WHERE tenant_id = t_id AND account_code = '1530';
        SELECT id INTO acc_1540 FROM chart_of_accounts WHERE tenant_id = t_id AND account_code = '1540';
        SELECT id INTO acc_1550 FROM chart_of_accounts WHERE tenant_id = t_id AND account_code = '1550';
        SELECT id INTO acc_1590 FROM chart_of_accounts WHERE tenant_id = t_id AND account_code = '1590';
        SELECT id INTO acc_5800 FROM chart_of_accounts WHERE tenant_id = t_id AND account_code = '5800';
        SELECT id INTO acc_9100 FROM chart_of_accounts WHERE tenant_id = t_id AND account_code = '9100';

        -- Inserir categorias
        INSERT INTO asset_categories (tenant_id, category_name, description, asset_account_id, depreciation_account_id, expense_account_id, gain_loss_account_id, default_depreciation_method, default_useful_life_months, default_salvage_pct)
        VALUES
            -- Machinery & Equipment — MACRS 7 anos, sem residual
            (t_id, 'Machinery & Equipment',
             'Spray booths, frame machines, paint mixers, compressors, lifts, welders.',
             acc_1510, acc_1590, acc_5800, acc_9100,
             'macrs', 84, 0),

            -- Vehicles (Fleet) — MACRS 5 anos, 10% residual
            (t_id, 'Vehicles (Fleet)',
             'Delivery trucks, tow trucks, company cars, mobile PDR vans.',
             acc_1520, acc_1590, acc_5800, acc_9100,
             'macrs', 60, 10.00),

            -- Furniture & Fixtures — Straight-Line 7 anos, 5% residual
            (t_id, 'Furniture & Fixtures',
             'Office desks, chairs, shelving, reception counter, break room furniture.',
             acc_1530, acc_1590, acc_5800, acc_9100,
             'straight_line', 84, 5.00),

            -- Computer Equipment — MACRS 5 anos, sem residual
            (t_id, 'Computer Equipment',
             'Workstations, laptops, tablets, printers, networking equipment, POS terminals.',
             acc_1540, acc_1590, acc_5800, acc_9100,
             'macrs', 60, 0),

            -- Leasehold Improvements — Straight-Line 15 anos, sem residual
            (t_id, 'Leasehold Improvements',
             'Bay modifications, HVAC, electrical upgrades, signage, parking lot improvements.',
             acc_1550, acc_1590, acc_5800, acc_9100,
             'straight_line', 180, 0),

            -- Tools & Small Equipment — Straight-Line 3 anos, sem residual
            (t_id, 'Tools & Small Equipment',
             'PDR tools, light kits, hand tools, diagnostic scanners, detail equipment.',
             acc_1510, acc_1590, acc_5800, acc_9100,
             'straight_line', 36, 0)

        ON CONFLICT (tenant_id, category_name) DO NOTHING;
    END LOOP;
END $$;

COMMIT;
