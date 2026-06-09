-- Rich content fields for listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS section_content JSONB DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS founded_date DATE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT false;
