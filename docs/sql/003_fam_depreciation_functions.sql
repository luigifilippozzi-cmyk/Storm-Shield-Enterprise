-- ============================================================================
-- STORM SHIELD ENTERPRISE — Fixed Asset Management (FAM) Module
-- Migration 003: Depreciation Calculation Functions + Auto-JE Procedures
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- MACRS Percentage Tables (IRS Publication 946)
-- Half-Year Convention, GDS (General Depreciation System)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS macrs_percentages (
    recovery_period_years   INT NOT NULL,      -- 3, 5, 7, 10, 15, 20
    year_number             INT NOT NULL,      -- 1, 2, 3...
    percentage              DECIMAL(6,3) NOT NULL,
    PRIMARY KEY (recovery_period_years, year_number)
);

INSERT INTO macrs_percentages (recovery_period_years, year_number, percentage) VALUES
    -- 3-Year Property (200% DB, HY)
    (3, 1, 33.33), (3, 2, 44.45), (3, 3, 14.81), (3, 4, 7.41),
    -- 5-Year Property (200% DB, HY)
    (5, 1, 20.00), (5, 2, 32.00), (5, 3, 19.20), (5, 4, 11.52), (5, 5, 11.52), (5, 6, 5.76),
    -- 7-Year Property (200% DB, HY)
    (7, 1, 14.29), (7, 2, 24.49), (7, 3, 17.49), (7, 4, 12.49),
    (7, 5, 8.93),  (7, 6, 8.92),  (7, 7, 8.93),  (7, 8, 4.46),
    -- 10-Year Property (200% DB, HY)
    (10, 1, 10.00), (10, 2, 18.00), (10, 3, 14.40), (10, 4, 11.52), (10, 5, 9.22),
    (10, 6, 7.37),  (10, 7, 6.55),  (10, 8, 6.55),  (10, 9, 6.56),  (10, 10, 6.55), (10, 11, 3.28),
    -- 15-Year Property (150% DB, HY)
    (15, 1, 5.00),  (15, 2, 9.50),  (15, 3, 8.55),  (15, 4, 7.70),  (15, 5, 6.93),
    (15, 6, 6.23),  (15, 7, 5.90),  (15, 8, 5.90),  (15, 9, 5.91),  (15, 10, 5.90),
    (15, 11, 5.91), (15, 12, 5.90), (15, 13, 5.91), (15, 14, 5.90), (15, 15, 5.91), (15, 16, 2.95)
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- fn_calc_monthly_depreciation
-- Calcula o valor mensal de depreciação para um ativo
-- Retorna: depreciation_amount para o mês solicitado
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_calc_monthly_depreciation(
    p_asset_id          UUID,
    p_period_date       DATE    -- primeiro dia do mês
)
RETURNS DECIMAL(14,2) AS $$
DECLARE
    v_asset             RECORD;
    v_depreciable       DECIMAL(14,2);
    v_monthly           DECIMAL(14,2);
    v_macrs_pct         DECIMAL(6,3);
    v_year_num          INT;
    v_recovery_years    INT;
    v_months_elapsed    INT;
    v_remaining_months  INT;
    v_remaining_value   DECIMAL(14,2);
    v_db_rate           DECIMAL(10,6);
BEGIN
    SELECT * INTO v_asset FROM fixed_assets WHERE id = p_asset_id;

    IF v_asset IS NULL OR v_asset.status NOT IN ('active') THEN
        RETURN 0;
    END IF;

    -- Se já totalmente depreciado
    IF v_asset.net_book_value <= v_asset.salvage_value THEN
        RETURN 0;
    END IF;

    v_depreciable := v_asset.acquisition_cost - v_asset.salvage_value;
    v_months_elapsed := (EXTRACT(YEAR FROM p_period_date) - EXTRACT(YEAR FROM v_asset.depreciation_start_date)) * 12
                      + (EXTRACT(MONTH FROM p_period_date) - EXTRACT(MONTH FROM v_asset.depreciation_start_date));

    CASE v_asset.depreciation_method

        -- ─── STRAIGHT LINE ───
        WHEN 'straight_line' THEN
            IF v_months_elapsed >= v_asset.useful_life_months THEN
                RETURN 0;
            END IF;
            v_monthly := ROUND(v_depreciable / v_asset.useful_life_months, 2);
            -- Ajuste no último mês para evitar centavos sobrando
            v_remaining_value := v_asset.net_book_value - v_asset.salvage_value;
            IF v_monthly > v_remaining_value THEN
                v_monthly := v_remaining_value;
            END IF;
            RETURN GREATEST(v_monthly, 0);

        -- ─── MACRS ───
        WHEN 'macrs' THEN
            -- Converter vida útil para recovery period em anos
            v_recovery_years := v_asset.useful_life_months / 12;
            -- MACRS: ano do ativo (1-based)
            v_year_num := (v_months_elapsed / 12) + 1;

            SELECT percentage INTO v_macrs_pct
            FROM macrs_percentages
            WHERE recovery_period_years = v_recovery_years
              AND year_number = v_year_num;

            IF v_macrs_pct IS NULL THEN
                RETURN 0;  -- além da vida útil MACRS
            END IF;

            -- MACRS é anual, dividir por 12 para mensal
            v_monthly := ROUND((v_asset.acquisition_cost * v_macrs_pct / 100) / 12, 2);
            v_remaining_value := v_asset.net_book_value;  -- MACRS não tem salvage
            IF v_monthly > v_remaining_value THEN
                v_monthly := v_remaining_value;
            END IF;
            RETURN GREATEST(v_monthly, 0);

        -- ─── DECLINING BALANCE (Double = 200%) ───
        WHEN 'declining_balance' THEN
            IF v_months_elapsed >= v_asset.useful_life_months THEN
                RETURN 0;
            END IF;
            v_db_rate := (2.0 / v_asset.useful_life_months);  -- mensal DDB
            v_monthly := ROUND(v_asset.net_book_value * v_db_rate, 2);

            -- Switch to straight-line quando vantajoso
            v_remaining_months := v_asset.useful_life_months - v_months_elapsed;
            IF v_remaining_months > 0 THEN
                v_remaining_value := v_asset.net_book_value - v_asset.salvage_value;
                IF v_remaining_value / v_remaining_months > v_monthly THEN
                    v_monthly := ROUND(v_remaining_value / v_remaining_months, 2);
                END IF;
            END IF;

            -- Não depreciar abaixo do salvage value
            IF (v_asset.net_book_value - v_monthly) < v_asset.salvage_value THEN
                v_monthly := v_asset.net_book_value - v_asset.salvage_value;
            END IF;
            RETURN GREATEST(v_monthly, 0);

        -- ─── SUM OF YEARS DIGITS ───
        WHEN 'sum_of_years' THEN
            DECLARE
                v_total_years   INT;
                v_sum_digits    INT;
                v_current_year  INT;
                v_year_factor   DECIMAL(10,6);
            BEGIN
                v_total_years := v_asset.useful_life_months / 12;
                v_sum_digits := v_total_years * (v_total_years + 1) / 2;
                v_current_year := (v_months_elapsed / 12) + 1;

                IF v_current_year > v_total_years THEN
                    RETURN 0;
                END IF;

                v_year_factor := (v_total_years - v_current_year + 1)::DECIMAL / v_sum_digits;
                v_monthly := ROUND((v_depreciable * v_year_factor) / 12, 2);

                v_remaining_value := v_asset.net_book_value - v_asset.salvage_value;
                IF v_monthly > v_remaining_value THEN
                    v_monthly := v_remaining_value;
                END IF;
                RETURN GREATEST(v_monthly, 0);
            END;

        -- ─── UNITS OF PRODUCTION ───
        WHEN 'units_of_production' THEN
            -- Requer input externo de unidades; retorna 0 por padrão
            -- A aplicação deve usar fn_calc_units_depreciation() com unidades do período
            RETURN 0;

        ELSE
            RAISE EXCEPTION 'Método de depreciação desconhecido: %', v_asset.depreciation_method;
    END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_calc_monthly_depreciation IS 'Calcula depreciação mensal por ativo. Suporta 5 métodos. MACRS usa tabela IRS Pub 946.';

-- ────────────────────────────────────────────────────────────────────────────
-- fn_calc_units_depreciation (Units of Production)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_calc_units_depreciation(
    p_asset_id              UUID,
    p_units_this_period     DECIMAL(14,2),
    p_total_estimated_units DECIMAL(14,2)
)
RETURNS DECIMAL(14,2) AS $$
DECLARE
    v_asset         RECORD;
    v_depreciable   DECIMAL(14,2);
    v_amount        DECIMAL(14,2);
    v_remaining     DECIMAL(14,2);
BEGIN
    SELECT * INTO v_asset FROM fixed_assets WHERE id = p_asset_id;
    IF v_asset IS NULL OR v_asset.status != 'active' THEN RETURN 0; END IF;

    v_depreciable := v_asset.acquisition_cost - v_asset.salvage_value;
    v_amount := ROUND(v_depreciable * (p_units_this_period / p_total_estimated_units), 2);

    v_remaining := v_asset.net_book_value - v_asset.salvage_value;
    IF v_amount > v_remaining THEN v_amount := v_remaining; END IF;
    RETURN GREATEST(v_amount, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ────────────────────────────────────────────────────────────────────────────
-- fn_generate_depreciation_schedule
-- Gera o schedule completo pré-calculado para um ativo
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_generate_depreciation_schedule(p_asset_id UUID)
RETURNS INT AS $$
DECLARE
    v_asset         RECORD;
    v_period_num    INT := 0;
    v_period_start  DATE;
    v_period_end    DATE;
    v_amount        DECIMAL(14,2);
    v_accumulated   DECIMAL(14,2) := 0;
    v_remaining     DECIMAL(14,2);
    v_depreciable   DECIMAL(14,2);
    v_inserted      INT := 0;
BEGIN
    SELECT * INTO v_asset FROM fixed_assets WHERE id = p_asset_id;
    IF v_asset IS NULL THEN RAISE EXCEPTION 'Asset % not found', p_asset_id; END IF;

    -- Limpar schedule existente (apenas scheduled, não posted)
    DELETE FROM depreciation_schedules
    WHERE fixed_asset_id = p_asset_id AND status = 'scheduled';

    v_depreciable := v_asset.acquisition_cost - v_asset.salvage_value;
    v_period_start := v_asset.depreciation_start_date;

    FOR i IN 1..v_asset.useful_life_months + 12 LOOP  -- +12 para MACRS half-year
        EXIT WHEN v_accumulated >= v_depreciable;

        v_period_num := i;
        v_period_end := (v_period_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

        -- Simular NBV para cálculo
        v_amount := fn_calc_monthly_depreciation(p_asset_id, v_period_start);

        -- Para schedule pré-calculado, usar straight_line simples se não for o ativo real
        -- (já que fn_calc usa o NBV atual do ativo)
        CASE v_asset.depreciation_method
            WHEN 'straight_line' THEN
                v_amount := ROUND(v_depreciable / v_asset.useful_life_months, 2);
            WHEN 'macrs' THEN
                DECLARE
                    v_year_num INT;
                    v_pct DECIMAL(6,3);
                    v_recovery INT;
                BEGIN
                    v_recovery := v_asset.useful_life_months / 12;
                    v_year_num := ((i - 1) / 12) + 1;
                    SELECT percentage INTO v_pct FROM macrs_percentages
                    WHERE recovery_period_years = v_recovery AND year_number = v_year_num;
                    IF v_pct IS NULL THEN EXIT; END IF;
                    v_amount := ROUND((v_asset.acquisition_cost * v_pct / 100) / 12, 2);
                END;
            ELSE
                -- Para DB/SYD usamos aproximação straight-line no schedule
                v_amount := ROUND(v_depreciable / v_asset.useful_life_months, 2);
        END CASE;

        -- Não ultrapassar depreciável
        IF v_accumulated + v_amount > v_depreciable THEN
            v_amount := v_depreciable - v_accumulated;
        END IF;

        EXIT WHEN v_amount <= 0;

        v_accumulated := v_accumulated + v_amount;
        v_remaining := v_asset.acquisition_cost - v_accumulated - v_asset.salvage_value;

        INSERT INTO depreciation_schedules (
            fixed_asset_id, period_number, period_start, period_end,
            depreciation_amount, accumulated_amount, remaining_value, status
        ) VALUES (
            p_asset_id, v_period_num, v_period_start, v_period_end,
            v_amount, v_accumulated, GREATEST(v_remaining, 0), 'scheduled'
        );

        v_inserted := v_inserted + 1;
        v_period_start := (v_period_start + INTERVAL '1 month')::DATE;
    END LOOP;

    RETURN v_inserted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_generate_depreciation_schedule IS 'Gera schedule completo de depreciação para um ativo. Retorna número de períodos gerados.';

-- ────────────────────────────────────────────────────────────────────────────
-- sp_execute_depreciation
-- Executa depreciação para um ativo em um período fiscal
-- Cria depreciation_entry + journal_entry automaticamente
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sp_execute_depreciation(
    p_asset_id          UUID,
    p_fiscal_period_id  UUID,
    p_entry_date        DATE,
    p_user_id           UUID,
    p_entry_type        depreciation_entry_type_enum DEFAULT 'regular'
)
RETURNS UUID AS $$
DECLARE
    v_asset             RECORD;
    v_category          RECORD;
    v_period            RECORD;
    v_amount            DECIMAL(14,2);
    v_new_accum         DECIMAL(14,2);
    v_new_nbv           DECIMAL(14,2);
    v_je_id             UUID;
    v_entry_id          UUID;
    v_entry_number      VARCHAR(20);
BEGIN
    -- Validações
    SELECT * INTO v_asset FROM fixed_assets WHERE id = p_asset_id AND deleted_at IS NULL;
    IF v_asset IS NULL THEN RAISE EXCEPTION 'Asset % not found', p_asset_id; END IF;
    IF v_asset.status != 'active' THEN RAISE EXCEPTION 'Asset % is not active (status: %)', p_asset_id, v_asset.status; END IF;

    SELECT * INTO v_category FROM asset_categories WHERE id = v_asset.category_id;
    SELECT * INTO v_period FROM fiscal_periods WHERE id = p_fiscal_period_id;
    IF v_period.status NOT IN ('open', 'closing') THEN RAISE EXCEPTION 'Fiscal period % is not open', p_fiscal_period_id; END IF;

    -- Calcular depreciação
    v_amount := fn_calc_monthly_depreciation(p_asset_id, p_entry_date);
    IF v_amount <= 0 THEN RAISE EXCEPTION 'No depreciation to process for asset %', p_asset_id; END IF;

    v_new_accum := v_asset.accumulated_depreciation + v_amount;
    v_new_nbv := v_asset.acquisition_cost - v_new_accum;

    -- Gerar Journal Entry number
    SELECT 'JE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD((COUNT(*) + 1)::TEXT, 6, '0')
    INTO v_entry_number
    FROM journal_entries WHERE tenant_id = v_asset.tenant_id;

    -- Criar Journal Entry (D: 5800 Depreciation Expense / C: 1590 Accumulated Depreciation)
    INSERT INTO journal_entries (
        tenant_id, fiscal_period_id, entry_number, entry_date, entry_type,
        source, description, total_debit, total_credit, is_balanced, status,
        posted_by, posted_at
    ) VALUES (
        v_asset.tenant_id, p_fiscal_period_id, v_entry_number, p_entry_date,
        'standard', 'auto_depreciation',
        'Depreciation: ' || v_asset.asset_name || ' (' || v_asset.asset_tag || ') - ' || TO_CHAR(p_entry_date, 'Mon/YYYY'),
        v_amount, v_amount, TRUE, 'posted',
        p_user_id, NOW()
    ) RETURNING id INTO v_je_id;

    -- Linha 1: D: Depreciation Expense (5800)
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, memo, line_number)
    VALUES (v_je_id, v_category.expense_account_id, v_amount, 0,
            'Depreciation ' || v_asset.asset_tag, 1);

    -- Linha 2: C: Accumulated Depreciation (1590)
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, memo, line_number)
    VALUES (v_je_id, v_category.depreciation_account_id, 0, v_amount,
            'Accum Depr ' || v_asset.asset_tag, 2);

    -- Criar Depreciation Entry
    INSERT INTO depreciation_entries (
        tenant_id, fixed_asset_id, fiscal_period_id, entry_date,
        depreciation_amount, accumulated_depreciation, net_book_value,
        journal_entry_id, entry_type, notes, created_by
    ) VALUES (
        v_asset.tenant_id, p_asset_id, p_fiscal_period_id, p_entry_date,
        v_amount, v_new_accum, v_new_nbv,
        v_je_id, p_entry_type,
        'Auto-generated depreciation for ' || TO_CHAR(p_entry_date, 'Mon YYYY'),
        p_user_id
    ) RETURNING id INTO v_entry_id;

    -- Atualizar caches do ativo
    UPDATE fixed_assets SET
        accumulated_depreciation = v_new_accum,
        net_book_value = v_new_nbv,
        last_depreciation_date = p_entry_date,
        status = CASE
            WHEN v_new_nbv <= v_asset.salvage_value THEN 'fully_depreciated'::asset_status_enum
            ELSE status
        END
    WHERE id = p_asset_id;

    -- Atualizar schedule correspondente
    UPDATE depreciation_schedules SET
        status = 'posted',
        journal_entry_id = v_je_id
    WHERE fixed_asset_id = p_asset_id
      AND status = 'scheduled'
      AND period_start <= p_entry_date
      AND period_end >= p_entry_date;

    RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_execute_depreciation IS 'Executa depreciação mensal para um ativo. Cria JE automático (D:5800/C:1590) e atualiza caches.';

-- ────────────────────────────────────────────────────────────────────────────
-- sp_execute_batch_depreciation
-- Executa depreciação para TODOS os ativos ativos de um tenant em um período
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sp_execute_batch_depreciation(
    p_tenant_id         UUID,
    p_fiscal_period_id  UUID,
    p_entry_date        DATE,
    p_user_id           UUID
)
RETURNS TABLE(asset_id UUID, entry_id UUID, amount DECIMAL(14,2), error_msg TEXT) AS $$
DECLARE
    v_asset RECORD;
    v_entry_id UUID;
    v_amount DECIMAL(14,2);
BEGIN
    FOR v_asset IN
        SELECT id FROM fixed_assets
        WHERE tenant_id = p_tenant_id
          AND status = 'active'
          AND deleted_at IS NULL
          AND (last_depreciation_date IS NULL OR last_depreciation_date < p_entry_date)
        ORDER BY asset_tag
    LOOP
        BEGIN
            v_entry_id := sp_execute_depreciation(v_asset.id, p_fiscal_period_id, p_entry_date, p_user_id);

            SELECT de.depreciation_amount INTO v_amount
            FROM depreciation_entries de WHERE de.id = v_entry_id;

            asset_id := v_asset.id;
            entry_id := v_entry_id;
            amount := v_amount;
            error_msg := NULL;
            RETURN NEXT;
        EXCEPTION WHEN OTHERS THEN
            asset_id := v_asset.id;
            entry_id := NULL;
            amount := 0;
            error_msg := SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_execute_batch_depreciation IS 'Executa depreciação batch para todos os ativos ativos de um tenant. Retorna resultado por ativo.';

-- ────────────────────────────────────────────────────────────────────────────
-- sp_dispose_asset
-- Executa descarte de ativo (venda ou write-off) com JE automático
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sp_dispose_asset(
    p_asset_id          UUID,
    p_disposal_type     disposal_type_enum,
    p_disposal_date     DATE,
    p_proceeds          DECIMAL(14,2),
    p_reason            VARCHAR(500),
    p_buyer_id          UUID,       -- NULL se write_off
    p_fiscal_period_id  UUID,
    p_user_id           UUID,
    p_approver_id       UUID
)
RETURNS UUID AS $$
DECLARE
    v_asset         RECORD;
    v_category      RECORD;
    v_gain_loss     DECIMAL(14,2);
    v_je_id         UUID;
    v_disposal_id   UUID;
    v_entry_number  VARCHAR(20);
    v_line_num      INT := 0;
BEGIN
    SELECT * INTO v_asset FROM fixed_assets WHERE id = p_asset_id AND deleted_at IS NULL;
    IF v_asset IS NULL THEN RAISE EXCEPTION 'Asset % not found', p_asset_id; END IF;
    IF v_asset.status IN ('disposed') THEN RAISE EXCEPTION 'Asset % already disposed', p_asset_id; END IF;

    SELECT * INTO v_category FROM asset_categories WHERE id = v_asset.category_id;

    v_gain_loss := p_proceeds - v_asset.net_book_value;

    -- JE number
    SELECT 'JE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD((COUNT(*) + 1)::TEXT, 6, '0')
    INTO v_entry_number
    FROM journal_entries WHERE tenant_id = v_asset.tenant_id;

    -- Journal Entry para descarte
    INSERT INTO journal_entries (
        tenant_id, fiscal_period_id, entry_number, entry_date, entry_type,
        source, description,
        total_debit, total_credit, is_balanced, status,
        posted_by, posted_at
    ) VALUES (
        v_asset.tenant_id, p_fiscal_period_id, v_entry_number, p_disposal_date,
        'standard', 'auto_depreciation',
        'Asset Disposal (' || p_disposal_type || '): ' || v_asset.asset_name || ' (' || v_asset.asset_tag || ')',
        v_asset.acquisition_cost + GREATEST(-v_gain_loss, 0),  -- total debits
        v_asset.acquisition_cost + GREATEST(-v_gain_loss, 0),  -- = total credits (balanced)
        TRUE, 'posted', p_user_id, NOW()
    ) RETURNING id INTO v_je_id;

    -- D: Accumulated Depreciation (reverter acumulado)
    v_line_num := v_line_num + 1;
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, memo, line_number)
    VALUES (v_je_id, v_category.depreciation_account_id, v_asset.accumulated_depreciation, 0,
            'Reverse accum depr ' || v_asset.asset_tag, v_line_num);

    -- D: Cash/AR (se venda com proceeds > 0)
    IF p_proceeds > 0 THEN
        v_line_num := v_line_num + 1;
        -- Usar conta 1010 (Cash) — buscar
        INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, memo, line_number)
        SELECT v_je_id, coa.id, p_proceeds, 0,
               'Disposal proceeds ' || v_asset.asset_tag, v_line_num
        FROM chart_of_accounts coa
        WHERE coa.tenant_id = v_asset.tenant_id AND coa.account_code = '1010';
    END IF;

    -- D ou C: Gain/Loss (9100)
    IF v_gain_loss < 0 THEN
        -- Perda: Débito
        v_line_num := v_line_num + 1;
        INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, memo, line_number)
        VALUES (v_je_id, v_category.gain_loss_account_id, ABS(v_gain_loss), 0,
                'Loss on disposal ' || v_asset.asset_tag, v_line_num);
    ELSIF v_gain_loss > 0 THEN
        -- Ganho: Crédito
        v_line_num := v_line_num + 1;
        INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, memo, line_number)
        VALUES (v_je_id, v_category.gain_loss_account_id, 0, v_gain_loss,
                'Gain on disposal ' || v_asset.asset_tag, v_line_num);
    END IF;

    -- C: Fixed Asset (custo original)
    v_line_num := v_line_num + 1;
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit_amount, credit_amount, memo, line_number)
    VALUES (v_je_id, v_category.asset_account_id, 0, v_asset.acquisition_cost,
            'Remove asset ' || v_asset.asset_tag, v_line_num);

    -- Recalcular totais do JE
    UPDATE journal_entries SET
        total_debit = (SELECT SUM(debit_amount) FROM journal_entry_lines WHERE journal_entry_id = v_je_id),
        total_credit = (SELECT SUM(credit_amount) FROM journal_entry_lines WHERE journal_entry_id = v_je_id)
    WHERE id = v_je_id;

    -- Criar registro de disposal
    INSERT INTO asset_disposals (
        tenant_id, fixed_asset_id, disposal_type, disposal_date,
        disposal_proceeds, net_book_value_at_disposal, gain_loss,
        buyer_customer_id, journal_entry_id, reason,
        approved_by, approved_at, created_by
    ) VALUES (
        v_asset.tenant_id, p_asset_id, p_disposal_type, p_disposal_date,
        p_proceeds, v_asset.net_book_value, v_gain_loss,
        p_buyer_id, v_je_id, p_reason,
        p_approver_id, NOW(), p_user_id
    ) RETURNING id INTO v_disposal_id;

    -- Atualizar status do ativo
    UPDATE fixed_assets SET
        status = 'disposed',
        net_book_value = 0,
        accumulated_depreciation = v_asset.acquisition_cost - v_asset.salvage_value
    WHERE id = p_asset_id;

    RETURN v_disposal_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_dispose_asset IS 'Executa descarte de ativo (venda/write-off/transfer). Gera JE automático com ganho/perda.';

-- ────────────────────────────────────────────────────────────────────────────
-- Trigger: Auto-generate schedule when asset becomes active
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_asset_activated()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status = 'proposal') THEN
        -- Set NBV = acquisition_cost on activation
        NEW.net_book_value := NEW.acquisition_cost;
        -- Generate depreciation schedule
        PERFORM fn_generate_depreciation_schedule(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fixed_asset_activated
    BEFORE UPDATE ON fixed_assets
    FOR EACH ROW
    WHEN (NEW.status = 'active' AND OLD.status = 'proposal')
    EXECUTE FUNCTION trg_asset_activated();

COMMIT;
