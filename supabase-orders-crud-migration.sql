-- ══════════════════════════════════════════════════════════════════════════
-- Orders CRUD migration: human-readable order #, admin notes, refund fields,
-- and extended payment_status enum (refunded / cancelled).
-- Run once in the Supabase SQL editor.
-- ══════════════════════════════════════════════════════════════════════════

CREATE SEQUENCE IF NOT EXISTS orders_number_seq;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);

-- Trigger: auto-assign order_number on insert when missing
CREATE OR REPLACE FUNCTION assign_order_number() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'PCM-' || LPAD(nextval('orders_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_number ON orders;
DROP TRIGGER IF EXISTS trg_orders_number ON orders;
CREATE TRIGGER trg_orders_number BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION assign_order_number();

-- Backfill existing rows (oldest first keeps the sequence intuitive)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM orders WHERE order_number IS NULL ORDER BY created_at LOOP
    UPDATE orders
       SET order_number = 'PCM-' || LPAD(nextval('orders_number_seq')::text, 4, '0')
     WHERE id = r.id;
  END LOOP;
END$$;

-- Extend payment_status to include refunded / cancelled
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending','paid','failed','expired','refunded','cancelled'));

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_event_status ON orders(event_id, payment_status);
