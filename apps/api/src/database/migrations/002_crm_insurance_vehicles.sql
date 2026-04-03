-- Migration: 002_crm_insurance_vehicles
-- Description: CRM, Insurance Companies, and Vehicles tables

-- ══════════════════════════════════════
-- ENUMS
-- ══════════════════════════════════════
CREATE TYPE customer_type AS ENUM ('individual', 'business');
CREATE TYPE customer_source AS ENUM ('insurance', 'walk_in', 'referral', 'website', 'other');
CREATE TYPE interaction_type AS ENUM ('phone', 'email', 'in_person', 'sms');
CREATE TYPE vehicle_condition AS ENUM ('excellent', 'good', 'fair', 'poor');

-- ══════════════════════════════════════
-- INSURANCE COMPANIES
-- ══════════════════════════════════════
CREATE TABLE insurance_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NULL,
    is_drp BOOLEAN NOT NULL DEFAULT false,
    payment_terms_days INTEGER NOT NULL DEFAULT 30,
    phone VARCHAR(30) NULL,
    email VARCHAR(255) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(2) NULL,
    zip VARCHAR(10) NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_insurance_tenant ON insurance_companies(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_insurance_drp ON insurance_companies(tenant_id, is_drp) WHERE deleted_at IS NULL;

-- ══════════════════════════════════════
-- INSURANCE CONTACTS
-- ══════════════════════════════════════
CREATE TABLE insurance_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    insurance_company_id UUID NOT NULL REFERENCES insurance_companies(id),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NULL,
    phone VARCHAR(30) NULL,
    email VARCHAR(255) NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ins_contacts_company ON insurance_contacts(insurance_company_id);

-- ══════════════════════════════════════
-- CUSTOMERS
-- ══════════════════════════════════════
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    type customer_type NOT NULL DEFAULT 'individual',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(30) NOT NULL,
    phone_secondary VARCHAR(30) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(2) NULL,
    zip VARCHAR(10) NULL,
    source customer_source NOT NULL DEFAULT 'walk_in',
    insurance_company_id UUID NULL REFERENCES insurance_companies(id),
    policy_number VARCHAR(50) NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_phone ON customers(tenant_id, phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_email ON customers(tenant_id, email) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX idx_customers_name ON customers(tenant_id, last_name, first_name) WHERE deleted_at IS NULL;

-- ══════════════════════════════════════
-- CUSTOMER INTERACTIONS
-- ══════════════════════════════════════
CREATE TABLE customer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    user_id UUID NOT NULL REFERENCES users(id),
    type interaction_type NOT NULL,
    subject VARCHAR(255) NOT NULL,
    notes TEXT NULL,
    interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interactions_customer ON customer_interactions(customer_id);

-- ══════════════════════════════════════
-- VEHICLES
-- ══════════════════════════════════════
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    vin VARCHAR(17) NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    trim VARCHAR(100) NULL,
    color VARCHAR(50) NULL,
    mileage INTEGER NULL CHECK (mileage >= 0),
    condition vehicle_condition NULL,
    license_plate VARCHAR(20) NULL,
    license_state VARCHAR(2) NULL,
    insurance_company_id UUID NULL REFERENCES insurance_companies(id),
    claim_number VARCHAR(50) NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_vehicles_tenant ON vehicles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_customer ON vehicles(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_vin ON vehicles(tenant_id, vin) WHERE deleted_at IS NULL AND vin IS NOT NULL;
CREATE UNIQUE INDEX idx_vehicles_vin_unique ON vehicles(tenant_id, vin) WHERE deleted_at IS NULL AND vin IS NOT NULL;

-- ══════════════════════════════════════
-- VEHICLE PHOTOS
-- ══════════════════════════════════════
CREATE TABLE vehicle_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    storage_key VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL,
    photo_type VARCHAR(50) NOT NULL DEFAULT 'general',
    taken_at TIMESTAMPTZ NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_photos_vehicle ON vehicle_photos(vehicle_id);

-- Triggers
CREATE TRIGGER trg_insurance_companies_updated_at BEFORE UPDATE ON insurance_companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_insurance_contacts_updated_at BEFORE UPDATE ON insurance_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
