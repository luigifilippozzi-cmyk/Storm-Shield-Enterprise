-- Migration 013: Activation Events (public schema)
-- Purpose: Track tenant activation metrics for the activation rate KPI
-- Scope: PUBLIC schema (cross-tenant; no RLS needed — admin-only reads)
-- Ref: RF-003, Bussola §4 Gap 8, Operating Model v2 §6.1

-- Idempotency guard
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activation_event_type') THEN
    CREATE TYPE activation_event_type AS ENUM (
      'tenant_created',
      'first_user_login',
      'wizard_started',
      'wizard_step_1_completed',
      'wizard_step_2_completed',
      'wizard_step_3_completed',
      'wizard_step_4_completed',
      'wizard_step_5_completed',
      'wizard_completed',
      'wizard_skipped',
      'first_customer_created',
      'first_vehicle_created',
      'first_estimate_created',
      'first_service_order_created',
      'first_financial_transaction_created',
      'tenant_activated',
      'subscription_started',
      'subscription_upgraded',
      'subscription_canceled'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.activation_events (
  id            UUID          NOT NULL,
  tenant_id     UUID          NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id       UUID          NULL,
  event_type    activation_event_type NOT NULL,
  event_data    JSONB         NULL,
  occurred_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT activation_events_pkey PRIMARY KEY (id)
);

-- Composite index for activation rate queries (cross-tenant, time-filtered)
CREATE INDEX IF NOT EXISTS idx_activation_events_tenant_occurred
  ON public.activation_events (tenant_id, occurred_at DESC);

-- Index for event-type funnel queries
CREATE INDEX IF NOT EXISTS idx_activation_events_type_occurred
  ON public.activation_events (event_type, occurred_at DESC);

-- Prevent UPDATE and DELETE to enforce append-only semantics
CREATE OR REPLACE FUNCTION prevent_activation_events_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'activation_events is append-only — UPDATE and DELETE are not permitted';
END;
$$;

DROP TRIGGER IF EXISTS trg_activation_events_no_update ON public.activation_events;
CREATE TRIGGER trg_activation_events_no_update
  BEFORE UPDATE ON public.activation_events
  FOR EACH ROW EXECUTE FUNCTION prevent_activation_events_mutation();

DROP TRIGGER IF EXISTS trg_activation_events_no_delete ON public.activation_events;
CREATE TRIGGER trg_activation_events_no_delete
  BEFORE DELETE ON public.activation_events
  FOR EACH ROW EXECUTE FUNCTION prevent_activation_events_mutation();
