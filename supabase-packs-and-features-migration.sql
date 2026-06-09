-- ══════════════════════════════════════════════════════════════════════════
-- Packs + feature groups migration
-- Adds pack-style occurrences (date range + name + price) and a new
-- event_features table for "what this includes" grouped facility lists.
-- Also adds pack_name snapshot to orders.
-- Run once in the Supabase SQL editor.
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Extend event_occurrences with pack fields ──────────────────────────
ALTER TABLE event_occurrences
  ADD COLUMN IF NOT EXISTS date_end DATE,
  ADD COLUMN IF NOT EXISTS pack_name TEXT,
  ADD COLUMN IF NOT EXISTS pack_description TEXT,
  ADD COLUMN IF NOT EXISTS price_override DECIMAL(10,2);

COMMENT ON COLUMN event_occurrences.date_end IS
  'For pack-style occurrences (camps): end date of the session. NULL for single-date events.';
COMMENT ON COLUMN event_occurrences.pack_name IS
  'Display name like "Semana 1" or "Mes completo". NULL for non-pack occurrences.';
COMMENT ON COLUMN event_occurrences.price_override IS
  'Pack price; overrides events.price_min when set. NULL means use event price.';

-- ── 2. New event_features table (grouped facilities) ─────────────────────
CREATE TABLE IF NOT EXISTS event_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  items TEXT[] NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_features_event
  ON event_features(event_id, sort_order);

ALTER TABLE event_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads event features" ON event_features;
DROP POLICY IF EXISTS "Public reads event features" ON event_features;
CREATE POLICY "Public reads event features" ON event_features
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE status = 'approved')
  );

DROP POLICY IF EXISTS "Service role full access event features" ON event_features;
DROP POLICY IF EXISTS "Service role full access event features" ON event_features;
CREATE POLICY "Service role full access event features" ON event_features
  FOR ALL USING (auth.role() = 'service_role');

-- ── 3. Pack snapshot on orders ────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS pack_name TEXT;

COMMENT ON COLUMN orders.pack_name IS
  'Snapshot of the pack name at purchase time (for campamentos). NULL for non-pack orders.';
