-- Migration 014: Expand estimate_status ENUM (RF-005a, part 1/2)
-- Purpose: Add 7 new canonical values to estimate_status ENUM.
-- IMPORTANT: ALTER TYPE ADD VALUE cannot be used in the same transaction as queries
-- that reference the new values (PG error 55P04). This file ONLY adds the new values.
-- Part 2 (migration 015) uses them for UPDATE + CREATE TABLE + RLS.
-- Scope: TENANT schema (executed per-tenant; no public. prefix)
-- Ref: RF-005a, ADR-012, T-20260421-3a, Split A ratificado 2026-04-22

-- Each value is guarded individually via IF NOT EXISTS (idempotent re-run)

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'submitted_to_adjuster'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'submitted_to_adjuster';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'awaiting_approval'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'awaiting_approval';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'supplement_pending'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'supplement_pending';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'approved_with_supplement'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'approved_with_supplement';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'disputed'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'disputed';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'paid'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'paid';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'closed'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estimate_status')
  ) THEN
    ALTER TYPE estimate_status ADD VALUE 'closed';
  END IF;
END $$;
