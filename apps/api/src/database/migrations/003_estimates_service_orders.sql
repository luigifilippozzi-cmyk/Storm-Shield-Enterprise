-- Migration: 003_estimates_service_orders
-- Description: Estimates, Service Orders, and related tables

-- ══════════════════════════════════════
-- ENUMS
-- ══════════════════════════════════════
CREATE TYPE estimate_status AS ENUM ('draft', 'sent', 'approved', 'rejected', 'supplement_requested', 'converted');
CREATE TYPE estimate_line_type AS ENUM ('labor', 'parts', 'paint', 'sublet', 'other');
CREATE TYPE service_order_status AS ENUM ('pending', 'in_progress', 'waiting_parts', 'waiting_approval', 'completed', 'delivered', 'cancelled');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');

-- ══════════════════════════════════════
-- ESTIMATES
-- ══════════════════════════════════════
CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    estimate_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    insurance_company_id UUID NULL REFERENCES insurance_companies(id),
    claim_number VARCHAR(50) NULL,
    status estimate_status NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    deductible DECIMAL(14,2) NULL,
    notes TEXT NULL,
    estimated_by UUID NOT NULL REFERENCES users(id),
    approved_at TIMESTAMPTZ NULL,
    approved_by UUID NULL REFERENCES users(id),
    valid_until DATE NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE(tenant_id, estimate_number)
);

CREATE INDEX idx_estimates_tenant ON estimates(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_estimates_customer ON estimates(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_estimates_vehicle ON estimates(vehicle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_estimates_status ON estimates(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_estimates_insurance ON estimates(insurance_company_id) WHERE deleted_at IS NULL AND insurance_company_id IS NOT NULL;

-- ══════════════════════════════════════
-- ESTIMATE LINES
-- ══════════════════════════════════════
CREATE TABLE estimate_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    estimate_id UUID NOT NULL REFERENCES estimates(id),
    line_type estimate_line_type NOT NULL,
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    is_taxable BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_estimate_lines_estimate ON estimate_lines(estimate_id);

-- ══════════════════════════════════════
-- ESTIMATE SUPPLEMENTS
-- ══════════════════════════════════════
CREATE TABLE estimate_supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    estimate_id UUID NOT NULL REFERENCES estimates(id),
    supplement_number INTEGER NOT NULL,
    reason TEXT NOT NULL,
    amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    status estimate_status NOT NULL DEFAULT 'draft',
    requested_by UUID NOT NULL REFERENCES users(id),
    approved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(estimate_id, supplement_number)
);

CREATE INDEX idx_supplements_estimate ON estimate_supplements(estimate_id);

-- ══════════════════════════════════════
-- ESTIMATE DOCUMENTS
-- ══════════════════════════════════════
CREATE TABLE estimate_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    estimate_id UUID NOT NULL REFERENCES estimates(id),
    storage_key VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_estimate_docs_estimate ON estimate_documents(estimate_id);

-- ══════════════════════════════════════
-- SERVICE ORDERS
-- ══════════════════════════════════════
CREATE TABLE service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_number VARCHAR(50) NOT NULL,
    estimate_id UUID NOT NULL REFERENCES estimates(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    status service_order_status NOT NULL DEFAULT 'pending',
    assigned_to UUID NULL REFERENCES users(id),
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    delivered_at TIMESTAMPTZ NULL,
    estimated_completion DATE NULL,
    total_labor_hours DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    total_parts_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE(tenant_id, order_number)
);

CREATE INDEX idx_so_tenant ON service_orders(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_so_customer ON service_orders(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_so_vehicle ON service_orders(vehicle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_so_status ON service_orders(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_so_estimate ON service_orders(estimate_id);

-- ══════════════════════════════════════
-- SO TASKS
-- ══════════════════════════════════════
CREATE TABLE so_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    service_order_id UUID NOT NULL REFERENCES service_orders(id),
    description VARCHAR(500) NOT NULL,
    status task_status NOT NULL DEFAULT 'pending',
    assigned_to UUID NULL REFERENCES users(id),
    estimated_hours DECIMAL(6,2) NULL,
    actual_hours DECIMAL(6,2) NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_so_tasks_order ON so_tasks(service_order_id);

-- ══════════════════════════════════════
-- SO TIME ENTRIES
-- ══════════════════════════════════════
CREATE TABLE so_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    service_order_id UUID NOT NULL REFERENCES service_orders(id),
    task_id UUID NULL REFERENCES so_tasks(id),
    user_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NULL,
    hours DECIMAL(6,2) NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_time_entries_order ON so_time_entries(service_order_id);
CREATE INDEX idx_time_entries_user ON so_time_entries(user_id);

-- ══════════════════════════════════════
-- SO PHOTOS
-- ══════════════════════════════════════
CREATE TABLE so_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    service_order_id UUID NOT NULL REFERENCES service_orders(id),
    task_id UUID NULL REFERENCES so_tasks(id),
    storage_key VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL,
    photo_type VARCHAR(50) NOT NULL DEFAULT 'progress',
    taken_at TIMESTAMPTZ NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_so_photos_order ON so_photos(service_order_id);

-- ══════════════════════════════════════
-- SO PARTS USED
-- ══════════════════════════════════════
CREATE TABLE so_parts_used (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    service_order_id UUID NOT NULL REFERENCES service_orders(id),
    part_name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100) NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    supplier VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_so_parts_order ON so_parts_used(service_order_id);

-- ══════════════════════════════════════
-- SO EXTERNAL SERVICES (sublet)
-- ══════════════════════════════════════
CREATE TABLE so_external_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    service_order_id UUID NOT NULL REFERENCES service_orders(id),
    vendor_name VARCHAR(255) NOT NULL,
    description VARCHAR(500) NOT NULL,
    cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    invoice_number VARCHAR(100) NULL,
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_so_external_order ON so_external_services(service_order_id);

-- ══════════════════════════════════════
-- SO STATUS HISTORY
-- ══════════════════════════════════════
CREATE TABLE so_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    service_order_id UUID NOT NULL REFERENCES service_orders(id),
    from_status service_order_status NULL,
    to_status service_order_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_so_status_history_order ON so_status_history(service_order_id);

-- Triggers
CREATE TRIGGER trg_estimates_updated_at BEFORE UPDATE ON estimates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_estimate_lines_updated_at BEFORE UPDATE ON estimate_lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_estimate_supplements_updated_at BEFORE UPDATE ON estimate_supplements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_service_orders_updated_at BEFORE UPDATE ON service_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_so_tasks_updated_at BEFORE UPDATE ON so_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_so_parts_updated_at BEFORE UPDATE ON so_parts_used
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_so_external_updated_at BEFORE UPDATE ON so_external_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
