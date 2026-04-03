-- Migration: 004_financial
-- Description: Financial transactions, insurance payments, contractors

-- ══════════════════════════════════════
-- ENUMS
-- ══════════════════════════════════════
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE payment_method AS ENUM ('cash', 'check', 'credit_card', 'debit_card', 'ach', 'wire', 'insurance_payment');
CREATE TYPE payment_status AS ENUM ('pending', 'received', 'partial', 'overdue', 'written_off');
CREATE TYPE contractor_status AS ENUM ('active', 'inactive');

-- ══════════════════════════════════════
-- FINANCIAL TRANSACTIONS
-- ══════════════════════════════════════
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    transaction_type transaction_type NOT NULL,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    payment_method payment_method NOT NULL,
    reference_number VARCHAR(100) NULL,
    service_order_id UUID NULL REFERENCES service_orders(id),
    customer_id UUID NULL REFERENCES customers(id),
    contractor_id UUID NULL,
    transaction_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_fin_tx_tenant ON financial_transactions(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_fin_tx_type ON financial_transactions(tenant_id, transaction_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_fin_tx_date ON financial_transactions(tenant_id, transaction_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_fin_tx_customer ON financial_transactions(customer_id) WHERE deleted_at IS NULL AND customer_id IS NOT NULL;
CREATE INDEX idx_fin_tx_so ON financial_transactions(service_order_id) WHERE deleted_at IS NULL AND service_order_id IS NOT NULL;

-- ══════════════════════════════════════
-- INSURANCE PAYMENTS
-- ══════════════════════════════════════
CREATE TABLE insurance_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    insurance_company_id UUID NOT NULL REFERENCES insurance_companies(id),
    estimate_id UUID NOT NULL REFERENCES estimates(id),
    service_order_id UUID NULL REFERENCES service_orders(id),
    claim_number VARCHAR(50) NOT NULL,
    expected_amount DECIMAL(14,2) NOT NULL,
    received_amount DECIMAL(14,2) NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    check_number VARCHAR(50) NULL,
    received_date DATE NULL,
    check_reminder_at TIMESTAMPTZ NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ins_payments_tenant ON insurance_payments(tenant_id);
CREATE INDEX idx_ins_payments_status ON insurance_payments(tenant_id, status);
CREATE INDEX idx_ins_payments_insurance ON insurance_payments(insurance_company_id);
CREATE INDEX idx_ins_payments_reminder ON insurance_payments(check_reminder_at) WHERE check_reminder_at IS NOT NULL AND status = 'pending';

-- ══════════════════════════════════════
-- CONTRACTORS
-- ══════════════════════════════════════
CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(30) NOT NULL,
    ein VARCHAR(12) NULL,
    ssn_encrypted BYTEA NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(2) NULL,
    zip VARCHAR(10) NULL,
    specialty VARCHAR(100) NULL,
    hourly_rate DECIMAL(10,2) NULL,
    status contractor_status NOT NULL DEFAULT 'active',
    w9_on_file BOOLEAN NOT NULL DEFAULT false,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_contractors_tenant ON contractors(tenant_id) WHERE deleted_at IS NULL;

-- ══════════════════════════════════════
-- CONTRACTOR PAYMENTS
-- ══════════════════════════════════════
CREATE TABLE contractor_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    contractor_id UUID NOT NULL REFERENCES contractors(id),
    service_order_id UUID NULL REFERENCES service_orders(id),
    amount DECIMAL(14,2) NOT NULL,
    payment_method payment_method NOT NULL,
    reference_number VARCHAR(100) NULL,
    description VARCHAR(500) NULL,
    payment_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contractor_payments_contractor ON contractor_payments(contractor_id);
CREATE INDEX idx_contractor_payments_tenant ON contractor_payments(tenant_id);

-- ══════════════════════════════════════
-- BANK ACCOUNTS
-- ══════════════════════════════════════
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_number_encrypted BYTEA NULL,
    routing_number_encrypted BYTEA NULL,
    account_type VARCHAR(50) NOT NULL DEFAULT 'checking',
    current_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_tenant ON bank_accounts(tenant_id);

-- ══════════════════════════════════════
-- COMMISSIONS
-- ══════════════════════════════════════
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    service_order_id UUID NOT NULL REFERENCES service_orders(id),
    commission_type VARCHAR(50) NOT NULL,
    base_amount DECIMAL(14,2) NOT NULL,
    rate DECIMAL(5,4) NOT NULL,
    commission_amount DECIMAL(14,2) NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commissions_tenant ON commissions(tenant_id);
CREATE INDEX idx_commissions_user ON commissions(user_id);

-- ══════════════════════════════════════
-- AUDIT LOGS
-- ══════════════════════════════════════
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NULL,
    old_values JSONB NULL,
    new_values JSONB NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(tenant_id, resource_type, resource_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(tenant_id, created_at);

-- ══════════════════════════════════════
-- NOTIFICATIONS
-- ══════════════════════════════════════
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    channel VARCHAR(50) NOT NULL DEFAULT 'in_app',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB NULL,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Triggers
CREATE TRIGGER trg_fin_tx_updated_at BEFORE UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_ins_payments_updated_at BEFORE UPDATE ON insurance_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_contractors_updated_at BEFORE UPDATE ON contractors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_contractor_payments_updated_at BEFORE UPDATE ON contractor_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_commissions_updated_at BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
