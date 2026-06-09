-- Dynamic sections per listing (custom navbar sections)
CREATE TABLE IF NOT EXISTS listing_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT DEFAULT '',
  icon TEXT DEFAULT 'FileText',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_listing_sections_listing_id ON listing_sections(listing_id);

-- Unique slug per listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_sections_unique_slug ON listing_sections(listing_id, slug);

-- RLS
ALTER TABLE listing_sections ENABLE ROW LEVEL SECURITY;

-- Allow public read for active sections
DROP POLICY IF EXISTS "Public can read active listing sections" ON listing_sections;
CREATE POLICY "Public can read active listing sections"
  ON listing_sections FOR SELECT
  USING (is_active = true);

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access on listing_sections" ON listing_sections;
CREATE POLICY "Service role full access on listing_sections"
  ON listing_sections FOR ALL
  USING (true)
  WITH CHECK (true);
