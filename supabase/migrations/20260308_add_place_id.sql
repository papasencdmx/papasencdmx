ALTER TABLE listings ADD COLUMN IF NOT EXISTS google_place_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_place_id
  ON listings(google_place_id) WHERE google_place_id IS NOT NULL;
