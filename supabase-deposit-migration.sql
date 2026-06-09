-- Per-event deposit ("Reserva tu plaza") feature
-- Lets buyers pay a partial deposit; the remainder is paid offline to the
-- organizer / via direct contact from the Padres en Madrid team.

-- 1) Event-level deposit configuration
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS deposit_percent INT
    CHECK (deposit_percent IS NULL OR (deposit_percent >= 5 AND deposit_percent <= 95));

COMMENT ON COLUMN events.deposit_percent IS
  'When set (5-95), public page shows a partial-payment button. NULL = full payment only.';

-- 2) Order-level deposit tracking
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_deposit BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_percent INT,
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(10, 2);

-- 3) Extend payment_status to allow deposit_paid
DO $$
BEGIN
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'deposit_paid', 'failed', 'expired', 'refunded', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_orders_is_deposit ON orders(is_deposit) WHERE is_deposit = true;
