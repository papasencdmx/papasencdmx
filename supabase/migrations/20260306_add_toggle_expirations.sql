-- Add expiration date columns for toggle states
-- When a date is set and passes, the corresponding boolean should be auto-unchecked
-- NULL = no expiration (infinite)

ALTER TABLE listings ADD COLUMN IF NOT EXISTS active_expires_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS verified_expires_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_expires_at TIMESTAMPTZ DEFAULT NULL;

-- CREATE INDEX IF NOT EXISTS for efficient expiry checks
CREATE INDEX IF NOT EXISTS idx_listings_active_expires ON listings(active_expires_at) WHERE active_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_verified_expires ON listings(verified_expires_at) WHERE verified_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_featured_expires ON listings(featured_expires_at) WHERE featured_expires_at IS NOT NULL;
