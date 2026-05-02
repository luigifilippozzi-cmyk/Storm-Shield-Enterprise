-- Migration 018 — Super User Audit Flag (cross-tenant)
-- Adds is_super_user_action + target_tenant_id to audit_logs in every existing tenant schema.
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
-- Depends on: migration 004 (audit_logs table per-tenant schema).
-- New tenants: provisioning script must also apply this migration (see tenant-provisioning.ts).

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schema_name FROM public.tenants WHERE deleted_at IS NULL
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.audit_logs
         ADD COLUMN IF NOT EXISTS is_super_user_action BOOLEAN NOT NULL DEFAULT FALSE,
         ADD COLUMN IF NOT EXISTS target_tenant_id UUID NULL',
      r.schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_audit_super_user
         ON %I.audit_logs(is_super_user_action)
         WHERE is_super_user_action = TRUE',
      r.schema_name
    );
  END LOOP;
END $$;
