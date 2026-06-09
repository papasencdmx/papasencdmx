-- ============================================
-- Tracked Links (enlaces) feature
-- ============================================

-- Main table: tracked links
CREATE TABLE IF NOT EXISTS tracked_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,              -- the /go/[slug] part
    destination_url TEXT NOT NULL,           -- where to redirect
    label TEXT NOT NULL,                     -- human-readable name (e.g. "SEK Ciudalcampo - Guia Verano")
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL, -- optional link to a listing
    campaign TEXT,                           -- e.g. "guia-verano-2026", "newsletter-marzo"
    utm_source TEXT,                         -- default utm_source for copy button
    utm_medium TEXT,                         -- default utm_medium
    utm_campaign TEXT,                       -- default utm_campaign
    utm_content TEXT,                        -- default utm_content
    total_clicks INTEGER DEFAULT 0,         -- denormalized counter
    unique_clicks INTEGER DEFAULT 0,        -- denormalized unique counter
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Click events table
CREATE TABLE IF NOT EXISTS link_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    link_id UUID NOT NULL REFERENCES tracked_links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ DEFAULT now(),
    referrer TEXT,                           -- where the click came from
    user_agent TEXT,
    device_type TEXT,                        -- 'mobile', 'desktop', 'tablet'
    country TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    ip_hash TEXT                             -- anonymized IP for unique counting
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tracked_links_slug ON tracked_links(slug);
CREATE INDEX IF NOT EXISTS idx_tracked_links_campaign ON tracked_links(campaign);
CREATE INDEX IF NOT EXISTS idx_tracked_links_listing ON tracked_links(listing_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_link_id ON link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON link_clicks(clicked_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_tracked_links_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tracked_links_timestamp ON tracked_links;
CREATE TRIGGER set_tracked_links_timestamp
    BEFORE UPDATE ON tracked_links
    FOR EACH ROW EXECUTE FUNCTION update_tracked_links_timestamp();

-- Function to increment click counters
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id UUID, ip_hash_val TEXT)
RETURNS void AS $$
DECLARE
    is_unique BOOLEAN;
BEGIN
    -- Check if this IP hash already clicked this link
    SELECT NOT EXISTS(
        SELECT 1 FROM link_clicks
        WHERE link_clicks.link_id = increment_link_clicks.link_id
          AND link_clicks.ip_hash = ip_hash_val
          AND link_clicks.id != (
              SELECT id FROM link_clicks
              WHERE link_clicks.link_id = increment_link_clicks.link_id
              ORDER BY clicked_at DESC LIMIT 1
          )
    ) INTO is_unique;

    -- Always increment total
    UPDATE tracked_links SET total_clicks = total_clicks + 1
    WHERE id = increment_link_clicks.link_id;

    -- Increment unique only if first time
    IF is_unique THEN
        UPDATE tracked_links SET unique_clicks = unique_clicks + 1
        WHERE id = increment_link_clicks.link_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
