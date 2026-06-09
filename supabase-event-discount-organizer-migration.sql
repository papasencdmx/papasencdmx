-- Move discount + organizer info onto the event (camp) itself.
-- Each camp now owns its own discount and organizer display data,
-- independent of the linked listing.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER
    CHECK (discount_percent IS NULL OR (discount_percent > 0 AND discount_percent <= 80)),
  ADD COLUMN IF NOT EXISTS discount_label TEXT,
  ADD COLUMN IF NOT EXISTS organizer_name TEXT,
  ADD COLUMN IF NOT EXISTS organizer_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS organizer_founded_year INTEGER
    CHECK (organizer_founded_year IS NULL OR (organizer_founded_year >= 1900 AND organizer_founded_year <= 2100)),
  ADD COLUMN IF NOT EXISTS organizer_is_verified BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN events.discount_percent IS
  '0-80. Applied to the final charge on Stripe/Mollie. NULL = no discount.';
COMMENT ON COLUMN events.discount_label IS
  'Optional short campaign tag shown alongside the discount pill.';
COMMENT ON COLUMN events.organizer_name IS
  'Display name of the camp organizer (shown in "Organizado por" block).';
COMMENT ON COLUMN events.organizer_logo_url IS
  'Logo/avatar URL for the organizer block.';
COMMENT ON COLUMN events.organizer_founded_year IS
  'Year the organizer started running this camp/program — shows as "Desde YYYY".';
COMMENT ON COLUMN events.organizer_is_verified IS
  'Shows a green verified badge next to the organizer name.';
