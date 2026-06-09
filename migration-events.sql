-- ============================================================
-- EVENTS MIGRATION: old flat events → new parent + occurrences model
-- Run this AFTER creating the new tables (event_categories, events, event_occurrences)
-- ============================================================

-- Step 1: Rename old events table for backup
ALTER TABLE events RENAME TO events_legacy;

-- Step 2: Create the new events table (run schema.sql first to create it)
-- (Assuming you ran schema.sql which creates events, event_categories, event_occurrences)

-- Step 3: Copy legacy events → new events table
-- Maps: price → price_min, event_date removed (goes to occurrences)
INSERT INTO events (
  id, city_id, listing_id, event_category_id,
  title, slug, description, short_description,
  image_url, price_min, is_free,
  age_min, age_max,
  location_name, street_address, latitude, longitude,
  external_url, status, submitted_by, created_at, updated_at
)
SELECT
  id, city_id, listing_id, NULL,
  title, slug, description, short_description,
  image_url, price, is_free,
  age_min, age_max,
  location_name, street_address, latitude, longitude,
  external_url, status, submitted_by, created_at, created_at
FROM events_legacy;

-- Step 4: Create one occurrence per legacy event (from event_date)
INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end)
SELECT
  id,
  event_date,
  event_time_start,
  event_time_end
FROM events_legacy
WHERE event_date IS NOT NULL;

-- Step 5: Verify
-- SELECT count(*) FROM events;
-- SELECT count(*) FROM event_occurrences;
-- SELECT count(*) FROM events_legacy;

-- Step 6: (Optional) Drop legacy table after verification
-- DROP TABLE IF EXISTS events_legacy;

-- NOTE: The old index idx_events_city_date references events_legacy now.
-- Drop it if it causes issues:
-- DROP INDEX IF EXISTS idx_events_city_date;
