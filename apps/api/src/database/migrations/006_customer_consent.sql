-- ══════════════════════════════════════
-- CUSTOMER CONSENT RECORDS (LGPD/CCPA)
-- ══════════════════════════════════════

CREATE TABLE customer_consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    consent_type VARCHAR(50) NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ NULL,
    revoked_by UUID NULL REFERENCES users(id),
    consent_text TEXT NULL,
    version VARCHAR(20) NULL,
    ip_address VARCHAR(45) NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consent_customer ON customer_consent_records(customer_id);
CREATE INDEX idx_consent_tenant ON customer_consent_records(tenant_id);
CREATE INDEX idx_consent_type ON customer_consent_records(tenant_id, consent_type);
