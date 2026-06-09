-- Abandoned checkouts: people who started filling the booking form but never paid.
-- Row is upserted on form-fill + on pay-click; deleted when the order is actually paid.

CREATE TABLE IF NOT EXISTS abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  occurrence_id UUID REFERENCES event_occurrences(id) ON DELETE SET NULL,
  buyer_name TEXT,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  attendee_names TEXT[],
  quantity INT,
  notes TEXT,
  pack_name TEXT,
  stage TEXT NOT NULL DEFAULT 'form_fill'
    CHECK (stage IN ('form_fill', 'pay_click', 'pay_failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, buyer_email)
);

CREATE INDEX IF NOT EXISTS idx_abandoned_event ON abandoned_checkouts(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abandoned_email ON abandoned_checkouts(buyer_email);

ALTER TABLE abandoned_checkouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can upsert abandoned" ON abandoned_checkouts;
DROP POLICY IF EXISTS "Anyone can upsert abandoned" ON abandoned_checkouts;
CREATE POLICY "Anyone can upsert abandoned" ON abandoned_checkouts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update abandoned" ON abandoned_checkouts;
DROP POLICY IF EXISTS "Anyone can update abandoned" ON abandoned_checkouts;
CREATE POLICY "Anyone can update abandoned" ON abandoned_checkouts
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access abandoned" ON abandoned_checkouts;
DROP POLICY IF EXISTS "Service role full access abandoned" ON abandoned_checkouts;
CREATE POLICY "Service role full access abandoned" ON abandoned_checkouts
  FOR ALL USING (auth.role() = 'service_role');
