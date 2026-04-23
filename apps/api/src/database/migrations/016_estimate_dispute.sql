-- Migration 016: Estimate dispute fields + service_order pause flag (RF-006)
-- Purpose: Add dispute tracking fields to estimates and is_paused_by_dispute flag
--   to service_orders. Enables Payment Hold / Disputed Estimate workflow.
-- Scope: TENANT schema (executed per-tenant; no public. prefix)
-- Ref: RF-006, ADR-012, T-20260421-4, Split A ratificado 2026-04-22

-- ══════════════════════════════════════
-- STEP 1: Create dispute_reason ENUM type (idempotent)
-- ══════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_reason') THEN
    CREATE TYPE dispute_reason AS ENUM (
      'adjuster_underpayment',
      'supplement_rejected',
      'claim_denied',
      'total_loss_dispute',
      'other'
    );
  END IF;
END;
$$;

-- ══════════════════════════════════════
-- STEP 2: Add dispute fields to estimates (idempotent)
-- ══════════════════════════════════════
ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS dispute_reason        dispute_reason NULL,
  ADD COLUMN IF NOT EXISTS dispute_notes         TEXT           NULL,
  ADD COLUMN IF NOT EXISTS dispute_opened_at     TIMESTAMPTZ    NULL,
  ADD COLUMN IF NOT EXISTS dispute_resolved_at   TIMESTAMPTZ    NULL,
  ADD COLUMN IF NOT EXISTS blocks_so_progression BOOLEAN        NOT NULL DEFAULT true;

-- Index for querying open disputes (SLA monitoring)
CREATE INDEX IF NOT EXISTS idx_estimates_dispute_open
  ON estimates (tenant_id, dispute_opened_at)
  WHERE dispute_opened_at IS NOT NULL AND dispute_resolved_at IS NULL;

-- ══════════════════════════════════════
-- STEP 3: Add is_paused_by_dispute to service_orders (idempotent)
-- ══════════════════════════════════════
ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS is_paused_by_dispute BOOLEAN NOT NULL DEFAULT false;

-- Index for fetching paused orders quickly
CREATE INDEX IF NOT EXISTS idx_service_orders_paused
  ON service_orders (tenant_id, is_paused_by_dispute)
  WHERE is_paused_by_dispute = true;
