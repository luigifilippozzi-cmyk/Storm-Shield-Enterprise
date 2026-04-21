-- Migration 012: Add is_sample flag to customers, vehicles, estimates (tenant schema)
-- This migration runs in the context of each tenant schema (search_path must be set).
-- Idempotent: safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'customers'
      AND column_name = 'is_sample'
  ) THEN
    ALTER TABLE customers ADD COLUMN is_sample BOOLEAN NOT NULL DEFAULT false;
    COMMENT ON COLUMN customers.is_sample IS 'True for sample/demo records created by the onboarding wizard';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'vehicles'
      AND column_name = 'is_sample'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN is_sample BOOLEAN NOT NULL DEFAULT false;
    COMMENT ON COLUMN vehicles.is_sample IS 'True for sample/demo records created by the onboarding wizard';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'estimates'
      AND column_name = 'is_sample'
  ) THEN
    ALTER TABLE estimates ADD COLUMN is_sample BOOLEAN NOT NULL DEFAULT false;
    COMMENT ON COLUMN estimates.is_sample IS 'True for sample/demo records created by the onboarding wizard';
  END IF;
END $$;
