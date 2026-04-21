-- Migration 011: Add wizard tracking fields to public.tenants
-- Idempotent: safe to run multiple times

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wizard_status_enum') THEN
    CREATE TYPE wizard_status_enum AS ENUM ('pending', 'completed', 'skipped');
  END IF;
END $$;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS wizard_status wizard_status_enum NOT NULL DEFAULT 'pending';

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS wizard_completed_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_wizard_status
  ON public.tenants(wizard_status)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.tenants.wizard_status IS 'Onboarding wizard state: pending | completed | skipped';
COMMENT ON COLUMN public.tenants.wizard_completed_at IS 'Timestamp when wizard was fully completed (NULL if skipped or pending)';
