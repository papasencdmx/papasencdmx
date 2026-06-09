-- Per-listing discount that automatically applies to all camps/events
-- from that listing. Used at checkout: the final charge to the card is the
-- discounted amount.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER
    CHECK (discount_percent IS NULL OR (discount_percent > 0 AND discount_percent <= 80)),
  ADD COLUMN IF NOT EXISTS discount_label TEXT;

COMMENT ON COLUMN listings.discount_percent IS
  '0–80. NULL means no discount. Applied to all events/camps from this listing.';
COMMENT ON COLUMN listings.discount_label IS
  'Optional short campaign tag, e.g. "Oferta de lanzamiento".';

-- Snapshot on the order so the receipt stays accurate even if the
-- listing discount later changes.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2);

COMMENT ON COLUMN orders.discount_percent IS
  'Snapshot of the listing discount applied at purchase time.';
COMMENT ON COLUMN orders.discount_amount IS
  'Euros saved by the discount (subtotal - total).';
