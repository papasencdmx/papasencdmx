-- Add Revolut Merchant API identifiers on orders. Parallel to stripe_session_id
-- and mollie_payment_id. We only ever populate one trio per order.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS revolut_order_id UUID,
  ADD COLUMN IF NOT EXISTS revolut_public_id TEXT;

-- Default new events to Revolut. Existing rows untouched.
ALTER TABLE events
  ALTER COLUMN payment_provider SET DEFAULT 'revolut';

-- Widen the check constraint if one exists (harmless if not). Safe to re-run.
DO $$
BEGIN
  ALTER TABLE events DROP CONSTRAINT IF EXISTS events_payment_provider_check;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

ALTER TABLE events
  ADD CONSTRAINT events_payment_provider_check
  CHECK (payment_provider IN ('mollie', 'stripe', 'revolut'));

-- Mirror on orders (column also exists there).
DO $$
BEGIN
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_provider_check;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_provider_check
  CHECK (payment_provider IS NULL OR payment_provider IN ('mollie', 'stripe', 'revolut'));

CREATE INDEX IF NOT EXISTS idx_orders_revolut_order_id ON orders(revolut_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_revolut_public_id ON orders(revolut_public_id);
