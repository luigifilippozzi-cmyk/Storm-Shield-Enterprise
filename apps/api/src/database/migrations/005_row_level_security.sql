-- Migration: 005_row_level_security
-- Description: Enable RLS on all tenant-scoped tables as defense-in-depth.
-- The application sets `app.current_tenant_id` session variable per request.
-- Even if application code forgets a WHERE tenant_id = X, RLS blocks cross-tenant access.

-- ══════════════════════════════════════
-- App user for RLS (used by the application connection)
-- The superuser/migration user bypasses RLS by default.
-- The app connects as `sse_app` which respects RLS policies.
-- ══════════════════════════════════════

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sse_app') THEN
        CREATE ROLE sse_app LOGIN PASSWORD 'sse_app_password_dev';
    END IF;
END
$$;

-- Grant schema usage and table access to sse_app
GRANT USAGE ON SCHEMA public TO sse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sse_app;

-- ══════════════════════════════════════
-- Helper function to get current tenant_id from session
-- ══════════════════════════════════════
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ══════════════════════════════════════
-- Enable RLS on all tenant-scoped tables
-- Policy: rows visible only when tenant_id matches session variable
-- ══════════════════════════════════════

-- IAM tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_users ON users
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_users ON users
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_roles ON roles
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_roles ON roles
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_role_permissions ON role_permissions
    USING (role_id IN (SELECT id FROM roles WHERE tenant_id = current_tenant_id()));
CREATE POLICY tenant_insert_role_permissions ON role_permissions
    FOR INSERT WITH CHECK (role_id IN (SELECT id FROM roles WHERE tenant_id = current_tenant_id()));

ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_user_role_assignments ON user_role_assignments
    USING (user_id IN (SELECT id FROM users WHERE tenant_id = current_tenant_id()));
CREATE POLICY tenant_insert_user_role_assignments ON user_role_assignments
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE tenant_id = current_tenant_id()));

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_user_sessions ON user_sessions
    USING (user_id IN (SELECT id FROM users WHERE tenant_id = current_tenant_id()));
CREATE POLICY tenant_insert_user_sessions ON user_sessions
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE tenant_id = current_tenant_id()));

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_tenant_settings ON tenant_settings
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_tenant_settings ON tenant_settings
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- CRM tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_customers ON customers
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_customers ON customers
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_customer_interactions ON customer_interactions
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_customer_interactions ON customer_interactions
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- Insurance tables
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_insurance_companies ON insurance_companies
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_insurance_companies ON insurance_companies
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE insurance_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_insurance_contacts ON insurance_contacts
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_insurance_contacts ON insurance_contacts
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- Vehicle tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_vehicles ON vehicles
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_vehicles ON vehicles
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE vehicle_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_vehicle_photos ON vehicle_photos
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_vehicle_photos ON vehicle_photos
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- Estimate tables
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_estimates ON estimates
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_estimates ON estimates
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE estimate_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_estimate_lines ON estimate_lines
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_estimate_lines ON estimate_lines
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE estimate_supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_estimate_supplements ON estimate_supplements
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_estimate_supplements ON estimate_supplements
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE estimate_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_estimate_documents ON estimate_documents
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_estimate_documents ON estimate_documents
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- Service Order tables
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_service_orders ON service_orders
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_service_orders ON service_orders
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE so_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_so_tasks ON so_tasks
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_so_tasks ON so_tasks
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE so_time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_so_time_entries ON so_time_entries
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_so_time_entries ON so_time_entries
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE so_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_so_photos ON so_photos
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_so_photos ON so_photos
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE so_parts_used ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_so_parts_used ON so_parts_used
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_so_parts_used ON so_parts_used
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE so_external_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_so_external_services ON so_external_services
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_so_external_services ON so_external_services
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE so_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_so_status_history ON so_status_history
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_so_status_history ON so_status_history
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- Financial tables
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_financial_transactions ON financial_transactions
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_financial_transactions ON financial_transactions
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE insurance_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_insurance_payments ON insurance_payments
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_insurance_payments ON insurance_payments
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_contractors ON contractors
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_contractors ON contractors
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE contractor_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_contractor_payments ON contractor_payments
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_contractor_payments ON contractor_payments
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_bank_accounts ON bank_accounts
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_bank_accounts ON bank_accounts
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_commissions ON commissions
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_commissions ON commissions
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_audit_logs ON audit_logs
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_notifications ON notifications
    USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_insert_notifications ON notifications
    FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- ══════════════════════════════════════
-- NOTE: The `tenants` and `api_keys` tables in public schema do NOT have RLS
-- because they are platform-level tables accessed by the platform admin.
-- ══════════════════════════════════════
