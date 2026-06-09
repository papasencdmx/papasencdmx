-- ============================================================
-- Filtered Pages + Partner Submission System
-- Safe migration — preserves existing schema, no renames, no duplicates
-- ============================================================

-- 1) New `pages` table (filtered listing pages)
-- Each row drives a /p/[slug] dynamic route
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'guide'
    CHECK (page_type IN ('guide', 'ofertas', 'events', 'extraescolares', 'planes')),
  hero_headline TEXT,
  hero_subheadline TEXT,
  meta_title TEXT,
  meta_description TEXT,
  -- filter_config example:
  -- {
  --   "show_zone_filter": true,
  --   "show_age_filter": true,
  --   "show_type_filter": true,
  --   "show_price_filter": true,
  --   "tag_types": ["page_category"],
  --   "tag_values": ["campamento", "campamento-urbano"],
  --   "default_sort": "featured_first"
  -- }
  filter_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Ordered array of listing IDs pinned to top
  featured_listing_ids UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (city_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_pages_city_status ON pages(city_id, status);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);

-- RLS for pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads published pages" ON pages;
DROP POLICY IF EXISTS "Public reads published pages" ON pages;
CREATE POLICY "Public reads published pages" ON pages
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Service role full access pages" ON pages;
DROP POLICY IF EXISTS "Service role full access pages" ON pages;
CREATE POLICY "Service role full access pages" ON pages
  FOR ALL USING (auth.role() = 'service_role');

-- 2) Add genuinely new columns to listings
-- (We DO NOT touch: name, slug, description, short_description, email, phone,
--  website, cover_image_url, price_min, price_max, age_min, age_max, zone_id,
--  is_active, is_featured, tier, tags via listing_tags)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS submission_status TEXT
    CHECK (submission_status IS NULL OR submission_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'submission')),
  ADD COLUMN IF NOT EXISTS booking_url TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by TEXT;

COMMENT ON COLUMN listings.submission_status IS
  'Partner-submission workflow status. NULL for admin-created (manual). pending → approved/rejected.';
COMMENT ON COLUMN listings.source IS
  'How the listing entered the system: manual (admin) or submission (/colaborar form).';
COMMENT ON COLUMN listings.booking_url IS
  'External URL where families sign up / book (for partner-submitted listings).';

CREATE INDEX IF NOT EXISTS idx_listings_submission_status
  ON listings(submission_status)
  WHERE submission_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_source ON listings(source);

-- 3) Allow public INSERT on listings ONLY for partner submissions
-- (status forced to pending, source forced to submission, is_active false until approved)
DROP POLICY IF EXISTS "Anyone can submit a listing" ON listings;
DROP POLICY IF EXISTS "Anyone can submit a listing" ON listings;
CREATE POLICY "Anyone can submit a listing" ON listings
  FOR INSERT
  WITH CHECK (
    submission_status = 'pending'
    AND source = 'submission'
    AND is_active = false
  );

-- 4) Helper view for tag-based listing membership
-- Convenience: query listings by tag_value in one shot
CREATE OR REPLACE VIEW listings_with_tags AS
SELECT
  l.*,
  COALESCE(
    array_agg(lt.tag_value) FILTER (WHERE lt.tag_value IS NOT NULL),
    ARRAY[]::TEXT[]
  ) AS tag_values,
  COALESCE(
    array_agg(DISTINCT lt.tag_type) FILTER (WHERE lt.tag_type IS NOT NULL),
    ARRAY[]::TEXT[]
  ) AS tag_types
FROM listings l
LEFT JOIN listing_tags lt ON lt.listing_id = l.id
GROUP BY l.id;
