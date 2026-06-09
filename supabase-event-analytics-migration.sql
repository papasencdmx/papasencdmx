-- Per-event analytics: extend existing page_views and add an interactions table
-- so we can build a simple funnel: view → reserve_click → pay_start → paid order.

-- 1) Extend page_views to support event pages.
ALTER TABLE page_views
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_page_views_event
  ON page_views(event_id, created_at DESC);

-- 2) Dedicated table for click/interaction events.
CREATE TABLE IF NOT EXISTS event_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('reserve_click', 'pay_start', 'external_ticket_click')),
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_interactions_event_kind
  ON event_interactions(event_id, kind, created_at DESC);

-- RLS: allow anonymous INSERT (tracking), admin-only SELECT.
ALTER TABLE event_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert interactions" ON event_interactions;
DROP POLICY IF EXISTS "Anyone can insert interactions" ON event_interactions;
CREATE POLICY "Anyone can insert interactions" ON event_interactions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON event_interactions;
DROP POLICY IF EXISTS "Service role full access" ON event_interactions;
CREATE POLICY "Service role full access" ON event_interactions
  FOR ALL USING (auth.role() = 'service_role');
