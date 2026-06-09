-- ============================================================
-- PADRES EN MADRID — Events Feature Setup
-- Copy-paste this ENTIRE file into Supabase SQL Editor and hit Run
-- ============================================================


-- ============================
-- STEP 1: Backup old events table
-- ============================
ALTER TABLE IF EXISTS events RENAME TO events_legacy;

-- Drop the old index that referenced events
DROP INDEX IF EXISTS idx_events_city_date;


-- ============================
-- STEP 2: Create event_categories table
-- ============================
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

-- Seed the 8 event categories
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


-- ============================
-- STEP 3: Create new events table (parent model)
-- ============================
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
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  is_free BOOLEAN DEFAULT false,
  age_min INTEGER,
  age_max INTEGER,
  duration_minutes INTEGER,
  location_name TEXT,
  street_address TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  external_url TEXT,
  affiliate_params TEXT,
  source TEXT DEFAULT 'manual',
  source_id TEXT,
  source_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured BOOLEAN DEFAULT false,
  is_promoted BOOLEAN DEFAULT false,
  submitted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(city_id, slug)
);


-- ============================
-- STEP 4: Create event_occurrences table
-- ============================
CREATE TABLE IF NOT EXISTS event_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  occurrence_date DATE NOT NULL,
  time_start TEXT,
  time_end TEXT,
  location_name TEXT,
  street_address TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  ticket_url TEXT,
  availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'few_left', 'sold_out', 'cancelled')),
  notes TEXT,
  UNIQUE(event_id, occurrence_date, time_start)
);


-- ============================
-- STEP 5: Indexes
-- ============================
CREATE INDEX IF NOT EXISTS idx_events_city_status ON events(city_id, status) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_events_category ON events(event_category_id);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source, source_id);
CREATE INDEX IF NOT EXISTS idx_event_occurrences_event ON event_occurrences(event_id);
CREATE INDEX IF NOT EXISTS idx_event_occurrences_date ON event_occurrences(occurrence_date);


-- ============================
-- STEP 6: Row Level Security
-- ============================
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


-- ============================
-- STEP 7: Migrate old events data (if any existed)
-- ============================
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

INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end)
SELECT id, event_date, event_time_start, event_time_end
FROM events_legacy
WHERE event_date IS NOT NULL;


-- ============================
-- STEP 8: Seed 10 sample events (from Eventbrite)
-- ============================
DO $$
DECLARE
  v_city_id UUID;
  v_cat_talleres UUID;
  v_cat_aire_libre UUID;
  v_cat_espectaculos UUID;
  v_cat_teatro UUID;
  v_cat_ferias UUID;
  v_ev UUID;
BEGIN
  SELECT id INTO v_city_id FROM cities WHERE slug = 'madrid' LIMIT 1;
  IF v_city_id IS NULL THEN
    RAISE EXCEPTION 'City "madrid" not found — make sure your cities table has a madrid row';
  END IF;

  SELECT id INTO v_cat_talleres FROM event_categories WHERE slug = 'talleres';
  SELECT id INTO v_cat_aire_libre FROM event_categories WHERE slug = 'aire-libre';
  SELECT id INTO v_cat_espectaculos FROM event_categories WHERE slug = 'espectaculos';
  SELECT id INTO v_cat_teatro FROM event_categories WHERE slug = 'teatro';
  SELECT id INTO v_cat_ferias FROM event_categories WHERE slug = 'ferias-y-mercados';

  -- 1. Taller Decoración Huevos de Pascua
  INSERT INTO events (city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, street_address, external_url, source, source_url, status, is_featured)
  VALUES (v_city_id,
    'Taller Infantil de Decoración de Huevos de Pascua',
    'taller-decoracion-huevos-pascua',
    'Ven a nuestro taller creativo de Pascua donde los más pequeños podrán decorar sus propios huevos con pinturas, pegatinas y mucha imaginación. Un taller perfecto para disfrutar en familia y llevarse a casa una obra de arte única. Materiales incluidos.',
    'Taller creativo de Pascua para niños. Decora tus propios huevos con pinturas y pegatinas.',
    'https://images.unsplash.com/photo-1457301547464-55b8023a4a3e?w=800&h=450&fit=crop',
    v_cat_talleres, 8, 12, false, 3, 10, 90,
    'Espacio Creativo Piccolo', 'Calle Picón 17, Madrid',
    'https://www.eventbrite.es/e/taller-infantil-de-decoracion-de-huevos-de-pascua-diy-tickets-1985750797089',
    'eventbrite', 'https://www.eventbrite.es/e/taller-infantil-de-decoracion-de-huevos-de-pascua-diy-tickets-1985750797089',
    'approved', true
  ) RETURNING id INTO v_ev;
  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev, '2026-04-04', '17:00', '18:30', 'available'),
    (v_ev, '2026-04-05', '11:00', '12:30', 'few_left');

  -- 2. Pequeñas Arquitecturas: Donde Viven los Monstruos
  INSERT INTO events (city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, external_url, source, source_url, status)
  VALUES (v_city_id,
    'Pequeñas Arquitecturas: Donde Viven los Monstruos',
    'pequenas-arquitecturas-donde-viven-los-monstruos',
    'Taller mensual de arquitectura para familias con Chiquitectos. Inspirados por "Donde viven los monstruos" de Maurice Sendak, construiremos maquetas de mundos imaginarios con materiales reciclados.',
    'Taller de arquitectura para familias con Chiquitectos. Construye mundos imaginarios inspirados en Sendak.',
    'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&h=450&fit=crop',
    v_cat_talleres, 15, 15, false, 4, 8, 120,
    'Vualá Librería Juvenil e Infantil',
    'https://www.eventbrite.es/e/pequenas-arquitecturas-en-la-literatura-donde-viven-los-monstruos-tickets-1977770685360',
    'eventbrite', 'https://www.eventbrite.es/e/pequenas-arquitecturas-en-la-literatura-donde-viven-los-monstruos-tickets-1977770685360',
    'approved'
  ) RETURNING id INTO v_ev;
  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev, '2026-04-25', '18:00', '20:00', 'available');

  -- 3. Espectáculos Familiares: Riofaunando (FREE + promoted)
  INSERT INTO events (city_id, title, slug, description, short_description, image_url, event_category_id,
    is_free, age_min, age_max, duration_minutes,
    location_name, street_address, external_url, source, source_url, status, is_promoted)
  VALUES (v_city_id,
    'Espectáculos Familiares: Riofaunando',
    'espectaculos-familiares-riofaunando',
    'Disfruta de un espectáculo familiar único en la Casa de México. "Riofaunando" combina música, títeres y narración para llevar a los más pequeños a un viaje por los ríos del mundo.',
    'Teatro interactivo con música y títeres. Un viaje por los ríos del mundo para toda la familia.',
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=450&fit=crop',
    v_cat_espectaculos, true, 3, 12, 60,
    'Casa de México en España', 'Calle de Alberto Aguilera 20, Madrid',
    'https://www.eventbrite.es/e/espectaculos-familiares-2026-riofaunando-tickets-1985436048668',
    'eventbrite', 'https://www.eventbrite.es/e/espectaculos-familiares-2026-riofaunando-tickets-1985436048668',
    'approved', true
  ) RETURNING id INTO v_ev;
  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev, '2026-04-19', '12:00', '13:00', 'available'),
    (v_ev, '2026-05-17', '12:00', '13:00', 'available'),
    (v_ev, '2026-06-21', '12:00', '13:00', 'available');

  -- 4. Classic&Family Alalpardo (FREE + coords)
  INSERT INTO events (city_id, title, slug, description, short_description, image_url, event_category_id,
    is_free, age_min, age_max, duration_minutes,
    location_name, street_address, latitude, longitude, external_url, source, source_url, status)
  VALUES (v_city_id,
    'Classic&Family Alalpardo — Coches Clásicos en Familia',
    'classic-family-alalpardo-coches-clasicos',
    'Gran concentración de coches clásicos en Alalpardo. Plan perfecto con paella popular, actividades infantiles, música en vivo y food trucks.',
    'Concentración de coches clásicos con paella, actividades infantiles y música en vivo.',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=450&fit=crop',
    v_cat_aire_libre, true, 0, 99, 360,
    'Valdeolmos-Alalpardo', 'Calle Alcalá, 28130 Alalpardo, Madrid',
    40.5634, -3.4645,
    'https://www.eventbrite.es/e/classicfamily-alalpardo-concentracion-de-coches-clasicos-y-especiales-tickets-1977312293297',
    'eventbrite', 'https://www.eventbrite.es/e/classicfamily-alalpardo-concentracion-de-coches-clasicos-y-especiales-tickets-1977312293297',
    'approved'
  ) RETURNING id INTO v_ev;
  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev, '2026-04-11', '11:00', '17:00', 'available');

  -- 5. Jugar el Arte en Familia (featured, 6 dates)
  INSERT INTO events (city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, street_address, latitude, longitude, external_url, source, source_url, status, is_featured)
  VALUES (v_city_id,
    'Jugar el Arte en Familia',
    'jugar-el-arte-en-familia',
    'Sesiones de juego artístico en Matadero Madrid. Pintura, escultura, collage y más. Cada sesión tiene una temática diferente. No se necesita experiencia previa.',
    'Juego artístico libre para familias en Matadero Madrid. Pintura, escultura y collage cada sábado.',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=450&fit=crop',
    v_cat_talleres, 6, 10, false, 3, 12, 90,
    'Casa del Lector — Matadero Madrid', 'Paseo de la Chopera 14, Madrid',
    40.3923, -3.6978,
    'https://www.eventbrite.es/e/jugar-el-arte-en-familia-tickets-1985810013206',
    'eventbrite', 'https://www.eventbrite.es/e/jugar-el-arte-en-familia-tickets-1985810013206',
    'approved', true
  ) RETURNING id INTO v_ev;
  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev, '2026-04-18', '16:30', '18:00', 'available'),
    (v_ev, '2026-04-25', '16:30', '18:00', 'available'),
    (v_ev, '2026-05-02', '16:30', '18:00', 'available'),
    (v_ev, '2026-05-09', '16:30', '18:00', 'available'),
    (v_ev, '2026-05-16', '16:30', '18:00', 'available'),
    (v_ev, '2026-05-23', '16:30', '18:00', 'available');

  -- 6. Babycuentos en Liberespacio
  INSERT INTO events (city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, external_url, source, source_url, status)
  VALUES (v_city_id,
    'Babycuentos en Liberespacio',
    'babycuentos-liberespacio',
    'Cuentacuentos para bebés con canciones, gestos y objetos sensoriales. Ideal para primeras experiencias con los libros.',
    'Cuentacuentos para bebés con canciones y juegos sensoriales en un ambiente acogedor.',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=450&fit=crop',
    v_cat_teatro, 5, 8, false, 0, 3, 45,
    'Liberespacio',
    'https://www.eventbrite.com/e/babycuentos-en-liberespacio-tickets-1985298725932',
    'eventbrite', 'https://www.eventbrite.com/e/babycuentos-en-liberespacio-tickets-1985298725932',
    'approved'
  ) RETURNING id INTO v_ev;
  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev, '2026-04-17', '17:30', '18:15', 'available'),
    (v_ev, '2026-05-15', '17:30', '18:15', 'available');

  -- 7. Cómo Educar en un Mundo de Pantallas (FREE)
  INSERT INTO events (city_id, title, slug, description, short_description, image_url, event_category_id,
    is_free, duration_minutes,
    location_name, external_url, source, source_url, status)
  VALUES (v_city_id,
    'Cómo Educar en un Mundo de Pantallas — Charla-Taller',
    'como-educar-mundo-pantallas',
    'Charla-taller con la psicóloga Alicia Covarrubias sobre uso responsable de tecnología en familia. Estrategias prácticas para gestionar el tiempo de pantallas.',
    'Charla sobre tecnología y niños con la psicóloga Alicia Covarrubias. Estrategias para padres.',
    'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&h=450&fit=crop',
    v_cat_talleres, true, 90,
    'Vualá Librería Juvenil e Infantil',
    'https://www.eventbrite.es/e/como-educar-en-un-mundo-de-pantallas-charla-taller-tickets-1985846603649',
    'eventbrite', 'https://www.eventbrite.es/e/como-educar-en-un-mundo-de-pantallas-charla-taller-tickets-1985846603649',
    'approved'
  ) RETURNING id INTO v_ev;
  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev, '2026-04-16', '19:00', '20:30', 'available');

  -- 8. Aventura a Pie por Madrid (many dates)
  INSERT INTO events (city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, street_address, latitude, longitude, external_url, source, source_url, status)
  VALUES (v_city_id,
    'Aventura a Pie por Madrid — Yincana Familiar',
    'aventura-pie-madrid-yincana-familiar',
    'Una mezcla entre búsqueda del tesoro, carrera de aventuras y tour autoguiado a pie por el centro de Madrid. Resuelve acertijos y descubre rincones secretos.',
    'Yincana autoguiada por el centro de Madrid. Acertijos, historia y aventura para toda la familia.',
    'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=450&fit=crop',
    v_cat_aire_libre, 12, 18, false, 6, 99, 150,
    'Puerta del Sol (inicio y fin)', 'Puerta del Sol, Madrid',
    40.4168, -3.7038,
    'https://www.eventbrite.com/e/interactive-walking-adventure-madrid-spain-tickets-1424860047759',
    'eventbrite', 'https://www.eventbrite.com/e/interactive-walking-adventure-madrid-spain-tickets-1424860047759',
    'approved'
  ) RETURNING id INTO v_ev;
  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev, '2026-03-30', '10:00', '12:30', 'available'),
    (v_ev, '2026-03-31', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-01', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-02', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-03', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-04', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-05', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-06', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-07', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-08', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-09', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-10', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-11', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-12', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-13', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-14', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-15', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-16', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-17', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-18', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-19', '10:00', '12:30', 'available'),
    (v_ev, '2026-04-20', '10:00', '12:30', 'available');

  -- 9. Pequeñas Arquitecturas: Charlie y el Ascensor de Cristal
  INSERT INTO events (city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, external_url, source, source_url, status)
  VALUES (v_city_id,
    'Pequeñas Arquitecturas: Charlie y el Ascensor de Cristal',
    'pequenas-arquitecturas-charlie-ascensor-cristal',
    'Taller de arquitectura inspirado en Roald Dahl. Diseña y construye edificios imposibles, ascensores fantásticos y fábricas de chocolate en miniatura.',
    'Taller de arquitectura inspirado en Roald Dahl. Construye edificios imposibles y fábricas de chocolate.',
    'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&h=450&fit=crop',
    v_cat_talleres, 15, 15, false, 4, 8, 120,
    'Vualá Librería Juvenil e Infantil',
    'https://www.eventbrite.es/e/pequenas-arquitecturas-en-la-literatura-charlie-y-el-ascensor-de-cristal-tickets-1977772090563',
    'eventbrite', 'https://www.eventbrite.es/e/pequenas-arquitecturas-en-la-literatura-charlie-y-el-ascensor-de-cristal-tickets-1977772090563',
    'approved'
  ) RETURNING id INTO v_ev;
  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev, '2026-06-13', '18:00', '20:00', 'available');

  -- 10. Feria del Libro Infantil (featured + promoted, 11 days)
  INSERT INTO events (city_id, title, slug, description, short_description, image_url, event_category_id,
    is_free, age_min, age_max, duration_minutes,
    location_name, street_address, latitude, longitude, source, status, is_featured, is_promoted)
  VALUES (v_city_id,
    'Feria del Libro Infantil y Juvenil de Madrid 2026',
    'feria-libro-infantil-juvenil-madrid-2026',
    'La gran cita anual con la literatura infantil en el Retiro. Más de 50 casetas, cuentacuentos diarios, talleres de ilustración, firmas de autores y zona de lectura al aire libre.',
    'La gran feria de libros para niños en el Retiro. Cuentacuentos, talleres, firmas y entrada libre.',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop',
    v_cat_ferias, true, 0, 17, 480,
    'Parque del Retiro', 'Paseo de Fernán Núñez, Madrid',
    40.4153, -3.6845,
    'manual', 'approved', true, true
  ) RETURNING id INTO v_ev;
  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev, '2026-04-23', '10:00', '20:00', 'available'),
    (v_ev, '2026-04-24', '10:00', '20:00', 'available'),
    (v_ev, '2026-04-25', '10:00', '20:00', 'available'),
    (v_ev, '2026-04-26', '10:00', '20:00', 'available'),
    (v_ev, '2026-04-27', '10:00', '20:00', 'available'),
    (v_ev, '2026-04-28', '10:00', '20:00', 'available'),
    (v_ev, '2026-04-29', '10:00', '20:00', 'available'),
    (v_ev, '2026-04-30', '10:00', '20:00', 'available'),
    (v_ev, '2026-05-01', '10:00', '20:00', 'available'),
    (v_ev, '2026-05-02', '10:00', '20:00', 'available'),
    (v_ev, '2026-05-03', '10:00', '20:00', 'available');

  RAISE NOTICE 'Done! Seeded 10 events.';
END $$;


-- ============================
-- VERIFY: Run these to check
-- ============================
SELECT 'event_categories' as table_name, count(*) as rows FROM event_categories
UNION ALL
SELECT 'events', count(*) FROM events
UNION ALL
SELECT 'event_occurrences', count(*) FROM event_occurrences;
