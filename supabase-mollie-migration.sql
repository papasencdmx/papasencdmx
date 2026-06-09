-- ══════════════════════════════════════
-- Mollie Payments Migration
-- ══════════════════════════════════════

-- 1. Add use_mollie to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS use_mollie BOOLEAN DEFAULT false;

-- 2. Add inventory fields to event_occurrences
ALTER TABLE event_occurrences ADD COLUMN IF NOT EXISTS ticket_quantity INTEGER;
ALTER TABLE event_occurrences ADD COLUMN IF NOT EXISTS max_per_purchase INTEGER DEFAULT 5;
ALTER TABLE event_occurrences ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- 3. Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  occurrence_id UUID NOT NULL REFERENCES event_occurrences(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_amount DECIMAL(10,2) NOT NULL,
  attendee_names JSONB NOT NULL DEFAULT '[]',
  notes TEXT CHECK (char_length(notes) <= 300),
  mollie_payment_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_occurrence ON orders(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_mollie ON orders(mollie_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- 5. RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can read orders by id" ON orders;
CREATE POLICY "Anyone can read orders by id" ON orders FOR SELECT USING (true);
