-- ══════════════════════════════════════════════════════════════════════════
-- Orders: per-order access_token to prevent IDOR on /mis-entradas/<PCM-XXXX>
-- The ticket URL becomes /mis-entradas/PCM-0004?t=<32-hex-token>.
-- Run once in the Supabase SQL editor.
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS access_token TEXT;

-- Backfill existing rows with a secure token
UPDATE orders
   SET access_token = replace(gen_random_uuid()::text, '-', '')
 WHERE access_token IS NULL;

-- Future rows get one automatically
ALTER TABLE orders
  ALTER COLUMN access_token SET DEFAULT replace(gen_random_uuid()::text, '-', ''),
  ALTER COLUMN access_token SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_access_token ON orders(access_token);
