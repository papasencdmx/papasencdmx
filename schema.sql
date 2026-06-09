-- ============================================================
-- PADRES EN MADRID — Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- CITIES
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL UNIQUE,
  newsletter_subdomain TEXT,
  region TEXT,
  country TEXT DEFAULT 'México',
  subscriber_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ZONES
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT CHECK (type IN ('distrito', 'barrio', 'municipio')),
  snippet TEXT,
  hub_description TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  priority INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(city_id, slug)
);

-- ZONE ADJACENCY
CREATE TABLE IF NOT EXISTS zone_adjacency (
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  adjacent_zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  PRIMARY KEY (zone_id, adjacent_zone_id)
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_long TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  como_elegir TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- CATEGORY FAQ TEMPLATES
CREATE TABLE IF NOT EXISTS category_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  question_template TEXT NOT NULL,
  answer_template TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- LISTINGS
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones(id),
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  recommendation_reason TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  whatsapp TEXT,
  street_address TEXT,
  postal_code TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  age_min INTEGER,
  age_max INTEGER,
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  price_range TEXT CHECK (price_range IN ('$', '$$', '$$$')),
  languages TEXT[],
  schedule TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_urls TEXT[],
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'standard', 'presencia_anual', 'presencia_total')),
  meta_title TEXT,
  meta_description TEXT,
  google_rating DECIMAL(2,1),
  google_review_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  UNIQUE(city_id, slug)
);

-- LISTING TAGS
CREATE TABLE IF NOT EXISTS listing_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  tag_type TEXT NOT NULL,
  tag_value TEXT NOT NULL,
  UNIQUE(listing_id, tag_type, tag_value)
);

-- LEADS
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  city_id UUID REFERENCES cities(id),
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT,
  message TEXT,
  children_ages TEXT,
  source_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'sent', 'opened', 'responded')),
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CLICK EVENTS
CREATE TABLE IF NOT EXISTS click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  city_id UUID REFERENCES cities(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'phone_reveal', 'website_click', 'whatsapp_click',
    'email_reveal', 'share_whatsapp', 'share_facebook',
    'share_copy_link', 'directions_click', 'save_favorite'
  )),
  source_page TEXT,
  session_id TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- BUSINESS USERS
CREATE TABLE IF NOT EXISTS business_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  listing_id UUID REFERENCES listings(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT,
  is_verified_subscriber BOOLEAN DEFAULT false,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_at TIMESTAMPTZ,
  moderated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PARENT FAVORITES
CREATE TABLE IF NOT EXISTS parent_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(auth_user_id, listing_id)
);

-- EVENT CATEGORIES (separate from listing categories)
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_long TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed event categories
INSERT INTO event_categories (name, name_long, slug, icon, sort_order) VALUES
  ('Teatro', 'Teatro Infantil y Familiar', 'teatro', 'drama', 1),
  ('Música', 'Conciertos y Música en Familia', 'musica', 'music', 2),
  ('Talleres', 'Talleres Creativos para Niños', 'talleres', 'palette', 3),
  ('Aire libre', 'Actividades al Aire Libre', 'aire-libre', 'sun', 4),
  ('Espectáculos', 'Espectáculos y Shows', 'espectaculos', 'sparkles', 5),
  ('Deportes', 'Eventos Deportivos Familiares', 'deportes', 'trophy', 6),
  ('Cine', 'Cine Infantil y Familiar', 'cine', 'film', 7),
  ('Ferias y Mercados', 'Ferias y Mercados Familiares', 'ferias-y-mercados', 'store', 8)
ON CONFLICT (slug) DO NOTHING;

-- EVENTS (parent model — one event can have many date/time occurrences)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id),
  event_category_id UUID REFERENCES event_categories(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  gallery_urls TEXT[],
  -- Pricing
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  is_free BOOLEAN DEFAULT false,
  -- Audience
  age_min INTEGER,
  age_max INTEGER,
  duration_minutes INTEGER,
  -- Location defaults
  location_name TEXT,
  street_address TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  -- Links
  external_url TEXT,
  affiliate_params TEXT,
  -- Source tracking
  source TEXT DEFAULT 'manual',
  source_id TEXT,
  source_url TEXT,
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured BOOLEAN DEFAULT false,
  is_promoted BOOLEAN DEFAULT false,
  -- Meta
  submitted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(city_id, slug)
);

-- EVENT OCCURRENCES (one event → many dates/times)
CREATE TABLE IF NOT EXISTS event_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  occurrence_date DATE NOT NULL,
  time_start TEXT,
  time_end TEXT,
  -- Location override (if different from parent event)
  location_name TEXT,
  street_address TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  -- Ticket
  ticket_url TEXT,
  availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'few_left', 'sold_out', 'cancelled')),
  notes TEXT,
  UNIQUE(event_id, occurrence_date, time_start)
);

-- GUIDES
CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(city_id, slug)
);

-- GUIDE LISTINGS
CREATE TABLE IF NOT EXISTS guide_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES guides(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(guide_id, listing_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_listings_zone ON listings(zone_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_listings_city_category ON listings(city_id, category_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_listings_city_zone ON listings(city_id, zone_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(city_id, is_featured) WHERE is_active = true AND is_featured = true;
CREATE INDEX IF NOT EXISTS idx_leads_listing ON leads(listing_id);
CREATE INDEX IF NOT EXISTS idx_leads_city_created ON leads(city_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_click_events_listing ON click_events(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_click_events_type ON click_events(listing_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_zones_city ON zones(city_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_events_city_status ON events(city_id, status) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_events_category ON events(event_category_id);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source, source_id);
CREATE INDEX IF NOT EXISTS idx_event_occurrences_event ON event_occurrences(event_id);
CREATE INDEX IF NOT EXISTS idx_event_occurrences_date ON event_occurrences(occurrence_date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Public can read active listings
DROP POLICY IF EXISTS "Public reads active listings" ON listings;
CREATE POLICY "Public reads active listings" ON listings
  FOR SELECT USING (is_active = true);

-- Service role can do everything (for API routes)
DROP POLICY IF EXISTS "Service role full access listings" ON listings;
CREATE POLICY "Service role full access listings" ON listings
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access leads" ON leads;
CREATE POLICY "Service role full access leads" ON leads
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access clicks" ON click_events;
CREATE POLICY "Service role full access clicks" ON click_events
  FOR ALL USING (auth.role() = 'service_role');

-- Business users see own leads
DROP POLICY IF EXISTS "Business sees own leads" ON leads;
CREATE POLICY "Business sees own leads" ON leads
  FOR SELECT USING (
    listing_id IN (
      SELECT listing_id FROM business_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Business users see own clicks
DROP POLICY IF EXISTS "Business sees own clicks" ON click_events;
CREATE POLICY "Business sees own clicks" ON click_events
  FOR SELECT USING (
    listing_id IN (
      SELECT listing_id FROM business_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Anyone can insert leads and clicks (public forms)
DROP POLICY IF EXISTS "Anyone can submit leads" ON leads;
CREATE POLICY "Anyone can submit leads" ON leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can log clicks" ON click_events;
CREATE POLICY "Anyone can log clicks" ON click_events
  FOR INSERT WITH CHECK (true);

-- Event tables RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads approved events" ON events;
CREATE POLICY "Public reads approved events" ON events
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Service role full access events" ON events;
CREATE POLICY "Service role full access events" ON events
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public reads event occurrences" ON event_occurrences;
CREATE POLICY "Public reads event occurrences" ON event_occurrences
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE status = 'approved')
  );

DROP POLICY IF EXISTS "Service role full access occurrences" ON event_occurrences;
CREATE POLICY "Service role full access occurrences" ON event_occurrences
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public reads active event categories" ON event_categories;
CREATE POLICY "Public reads active event categories" ON event_categories
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Service role full access event categories" ON event_categories;
CREATE POLICY "Service role full access event categories" ON event_categories
  FOR ALL USING (auth.role() = 'service_role');
