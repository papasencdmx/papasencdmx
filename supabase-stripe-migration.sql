-- ══════════════════════════════════════════════════════════════════════════
-- Stripe multi-provider support — run once in Supabase SQL editor
-- Adds per-event payment provider choice and Stripe columns to orders.
-- Existing Mollie orders + events continue to work unchanged.
-- ══════════════════════════════════════════════════════════════════════════

-- ── Orders: per-order provider + Stripe refs ──────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'mollie'
    CHECK (payment_provider IN ('mollie', 'stripe')),
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_stripe_session
  ON orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- ── Events: admin-selectable provider per event ───────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'mollie'
    CHECK (payment_provider IN ('mollie', 'stripe'));
