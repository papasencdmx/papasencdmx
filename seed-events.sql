-- ============================================================
-- SEED: Sample events scraped from Eventbrite Madrid (family)
-- Run in Supabase SQL Editor AFTER running schema.sql
-- ============================================================

-- Get Madrid city ID
DO $$
DECLARE
  v_city_id UUID;
  v_cat_talleres UUID;
  v_cat_aire_libre UUID;
  v_cat_espectaculos UUID;
  v_cat_teatro UUID;
  v_cat_ferias UUID;
  v_ev1 UUID;
  v_ev2 UUID;
  v_ev3 UUID;
  v_ev4 UUID;
  v_ev5 UUID;
  v_ev6 UUID;
  v_ev7 UUID;
  v_ev8 UUID;
  v_ev9 UUID;
  v_ev10 UUID;
BEGIN
  SELECT id INTO v_city_id FROM cities WHERE slug = 'madrid' LIMIT 1;
  IF v_city_id IS NULL THEN
    RAISE EXCEPTION 'City madrid not found';
  END IF;

  -- Get category IDs
  SELECT id INTO v_cat_talleres FROM event_categories WHERE slug = 'talleres';
  SELECT id INTO v_cat_aire_libre FROM event_categories WHERE slug = 'aire-libre';
  SELECT id INTO v_cat_espectaculos FROM event_categories WHERE slug = 'espectaculos';
  SELECT id INTO v_cat_teatro FROM event_categories WHERE slug = 'teatro';
  SELECT id INTO v_cat_ferias FROM event_categories WHERE slug = 'ferias-y-mercados';

  -- ── Event 1: Taller Decoración Huevos de Pascua ──
  INSERT INTO events (id, city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, street_address, external_url, source, source_url, status, is_featured)
  VALUES (
    gen_random_uuid(), v_city_id,
    'Taller Infantil de Decoración de Huevos de Pascua',
    'taller-decoracion-huevos-pascua',
    'Ven a nuestro taller creativo de Pascua donde los más pequeños podrán decorar sus propios huevos con pinturas, pegatinas y mucha imaginación. Un taller perfecto para disfrutar en familia y llevarse a casa una obra de arte única. Materiales incluidos.',
    'Taller creativo de Pascua para niños. Decora tus propios huevos con pinturas y pegatinas.',
    'https://images.unsplash.com/photo-1457301547464-55b8023a4a3e?w=800&h=450&fit=crop',
    v_cat_talleres,
    8, 12, false, 3, 10, 90,
    'Espacio Creativo Piccolo', 'Calle Picón 17, Madrid',
    'https://www.eventbrite.es/e/taller-infantil-de-decoracion-de-huevos-de-pascua-diy-tickets-1985750797089',
    'eventbrite', 'https://www.eventbrite.es/e/taller-infantil-de-decoracion-de-huevos-de-pascua-diy-tickets-1985750797089',
    'approved', true
  ) RETURNING id INTO v_ev1;

  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev1, '2026-04-04', '17:00', '18:30', 'available'),
    (v_ev1, '2026-04-05', '11:00', '12:30', 'few_left');

  -- ── Event 2: Pequeñas Arquitecturas - Donde Viven los Monstruos ──
  INSERT INTO events (id, city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, street_address, external_url, source, source_url, status, is_featured)
  VALUES (
    gen_random_uuid(), v_city_id,
    'Pequeñas Arquitecturas: Donde Viven los Monstruos',
    'pequenas-arquitecturas-donde-viven-los-monstruos',
    'Taller mensual de arquitectura para familias con Chiquitectos. En esta edición, inspirados por el cuento "Donde viven los monstruos" de Maurice Sendak, construiremos maquetas de mundos imaginarios con materiales reciclados. Los niños explorarán conceptos de espacio, forma y estructura mientras dan rienda suelta a su creatividad.',
    'Taller de arquitectura para familias con Chiquitectos. Construye mundos imaginarios inspirados en el cuento de Sendak.',
    'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&h=450&fit=crop',
    v_cat_talleres,
    15, 15, false, 4, 8, 120,
    'Vualá Librería Juvenil e Infantil', 'Madrid',
    'https://www.eventbrite.es/e/pequenas-arquitecturas-en-la-literatura-donde-viven-los-monstruos-tickets-1977770685360',
    'eventbrite', 'https://www.eventbrite.es/e/pequenas-arquitecturas-en-la-literatura-donde-viven-los-monstruos-tickets-1977770685360',
    'approved', false
  ) RETURNING id INTO v_ev2;

  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev2, '2026-04-25', '18:00', '20:00', 'available');

  -- ── Event 3: Espectáculos Familiares - Riofaunando ──
  INSERT INTO events (id, city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, street_address, external_url, source, source_url, status, is_promoted)
  VALUES (
    gen_random_uuid(), v_city_id,
    'Espectáculos Familiares: Riofaunando',
    'espectaculos-familiares-riofaunando',
    'Disfruta de un espectáculo familiar único en la Casa de México en España. "Riofaunando" es una obra de teatro interactiva que combina música, títeres y narración para llevar a los más pequeños a un viaje por los ríos del mundo, descubriendo la fauna que habita en ellos. Una experiencia educativa y divertida para toda la familia.',
    'Teatro interactivo con música y títeres. Un viaje por los ríos del mundo para toda la familia.',
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=450&fit=crop',
    v_cat_espectaculos,
    0, 0, true, 3, 12, 60,
    'Casa de México en España', 'Calle de Alberto Aguilera 20, Madrid',
    'https://www.eventbrite.es/e/espectaculos-familiares-2026-riofaunando-tickets-1985436048668',
    'eventbrite', 'https://www.eventbrite.es/e/espectaculos-familiares-2026-riofaunando-tickets-1985436048668',
    'approved', true
  ) RETURNING id INTO v_ev3;

  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev3, '2026-04-19', '12:00', '13:00', 'available'),
    (v_ev3, '2026-05-17', '12:00', '13:00', 'available'),
    (v_ev3, '2026-06-21', '12:00', '13:00', 'available');

  -- ── Event 4: Classic&Family Alalpardo ──
  INSERT INTO events (id, city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, street_address, latitude, longitude,
    external_url, source, source_url, status)
  VALUES (
    gen_random_uuid(), v_city_id,
    'Classic&Family Alalpardo — Coches Clásicos en Familia',
    'classic-family-alalpardo-coches-clasicos',
    'Gran concentración de coches clásicos y especiales en Alalpardo. Un plan perfecto para pasar el día en familia con paella popular, actividades infantiles, música en vivo y la oportunidad de ver de cerca los coches más emblemáticos. Zona de juegos para niños y food trucks.',
    'Concentración de coches clásicos con paella, actividades infantiles y música en vivo.',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=450&fit=crop',
    v_cat_aire_libre,
    0, 0, true, 0, 99, 360,
    'Valdeolmos-Alalpardo', 'Calle Alcalá, 28130 Alalpardo, Madrid',
    40.5634, -3.4645,
    'https://www.eventbrite.es/e/classicfamily-alalpardo-concentracion-de-coches-clasicos-y-especiales-tickets-1977312293297',
    'eventbrite', 'https://www.eventbrite.es/e/classicfamily-alalpardo-concentracion-de-coches-clasicos-y-especiales-tickets-1977312293297',
    'approved'
  ) RETURNING id INTO v_ev4;

  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev4, '2026-04-11', '11:00', '17:00', 'available');

  -- ── Event 5: Jugar el Arte en Familia ──
  INSERT INTO events (id, city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, street_address, latitude, longitude,
    external_url, source, source_url, status, is_featured)
  VALUES (
    gen_random_uuid(), v_city_id,
    'Jugar el Arte en Familia',
    'jugar-el-arte-en-familia',
    'Sesiones de juego artístico en la Casa del Lector de Matadero Madrid. Los niños y sus familias explorarán diferentes técnicas artísticas a través del juego libre: pintura, escultura, collage y más. Cada sesión tiene una temática diferente inspirada en las exposiciones del centro. No se necesita experiencia previa.',
    'Juego artístico libre para familias en Matadero Madrid. Pintura, escultura y collage cada sábado.',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=450&fit=crop',
    v_cat_talleres,
    6, 10, false, 3, 12, 90,
    'Casa del Lector — Matadero Madrid', 'Paseo de la Chopera 14, Madrid',
    40.3923, -3.6978,
    'https://www.eventbrite.es/e/jugar-el-arte-en-familia-tickets-1985810013206',
    'eventbrite', 'https://www.eventbrite.es/e/jugar-el-arte-en-familia-tickets-1985810013206',
    'approved', true
  ) RETURNING id INTO v_ev5;

  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev5, '2026-04-18', '16:30', '18:00', 'available'),
    (v_ev5, '2026-04-25', '16:30', '18:00', 'available'),
    (v_ev5, '2026-05-02', '16:30', '18:00', 'available'),
    (v_ev5, '2026-05-09', '16:30', '18:00', 'available'),
    (v_ev5, '2026-05-16', '16:30', '18:00', 'available'),
    (v_ev5, '2026-05-23', '16:30', '18:00', 'available');

  -- ── Event 6: Babycuentos en Liberespacio ──
  INSERT INTO events (id, city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, street_address,
    external_url, source, source_url, status)
  VALUES (
    gen_random_uuid(), v_city_id,
    'Babycuentos en Liberespacio',
    'babycuentos-liberespacio',
    'Sesión de cuentacuentos especialmente diseñada para bebés y niños pequeños. En un ambiente acogedor y tranquilo, una narradora profesional contará historias breves acompañadas de canciones, gestos y pequeños objetos sensoriales. Ideal para primeras experiencias con los libros y la narración.',
    'Cuentacuentos para bebés con canciones y juegos sensoriales en un ambiente acogedor.',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=450&fit=crop',
    v_cat_teatro,
    5, 8, false, 0, 3, 45,
    'Liberespacio', 'Madrid',
    'https://www.eventbrite.com/e/babycuentos-en-liberespacio-tickets-1985298725932',
    'eventbrite', 'https://www.eventbrite.com/e/babycuentos-en-liberespacio-tickets-1985298725932',
    'approved'
  ) RETURNING id INTO v_ev6;

  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev6, '2026-04-17', '17:30', '18:15', 'available'),
    (v_ev6, '2026-05-15', '17:30', '18:15', 'available');

  -- ── Event 7: Cómo Educar en un Mundo de Pantallas ──
  INSERT INTO events (id, city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, street_address,
    external_url, source, source_url, status)
  VALUES (
    gen_random_uuid(), v_city_id,
    'Cómo Educar en un Mundo de Pantallas — Charla-Taller',
    'como-educar-mundo-pantallas',
    'Charla-taller con la psicóloga infantil Alicia Covarrubias sobre el uso responsable de la tecnología en familia. Aprenderás estrategias prácticas para gestionar el tiempo de pantallas, identificar señales de alarma y fomentar un uso saludable de dispositivos digitales en niños y adolescentes. Incluye turno de preguntas.',
    'Charla sobre tecnología y niños con la psicóloga Alicia Covarrubias. Estrategias para padres.',
    'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&h=450&fit=crop',
    v_cat_talleres,
    0, 0, true, 0, 0, 90,
    'Vualá Librería Juvenil e Infantil', 'Madrid',
    'https://www.eventbrite.es/e/como-educar-en-un-mundo-de-pantallas-charla-taller-tickets-1985846603649',
    'eventbrite', 'https://www.eventbrite.es/e/como-educar-en-un-mundo-de-pantallas-charla-taller-tickets-1985846603649',
    'approved'
  ) RETURNING id INTO v_ev7;

  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev7, '2026-04-16', '19:00', '20:30', 'available');

  -- ── Event 8: Walking Adventure Madrid ──
  INSERT INTO events (id, city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, street_address, latitude, longitude,
    external_url, source, source_url, status)
  VALUES (
    gen_random_uuid(), v_city_id,
    'Aventura a Pie por Madrid — Yincana Familiar',
    'aventura-pie-madrid-yincana-familiar',
    'Una mezcla entre búsqueda del tesoro, carrera de aventuras y tour autoguiado a pie por el centro de Madrid. Resuelve acertijos, descubre rincones secretos y aprende historia de forma divertida. Perfecto para familias con niños a partir de 6 años. El recorrido empieza y termina en Sol, con total flexibilidad de horario.',
    'Yincana autoguiada por el centro de Madrid. Acertijos, historia y aventura para toda la familia.',
    'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=450&fit=crop',
    v_cat_aire_libre,
    12, 18, false, 6, 99, 150,
    'Puerta del Sol (inicio y fin)', 'Puerta del Sol, Madrid',
    40.4168, -3.7038,
    'https://www.eventbrite.com/e/interactive-walking-adventure-madrid-spain-tickets-1424860047759',
    'eventbrite', 'https://www.eventbrite.com/e/interactive-walking-adventure-madrid-spain-tickets-1424860047759',
    'approved'
  ) RETURNING id INTO v_ev8;

  -- Many dates for the walking adventure
  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev8, '2026-03-30', '10:00', '12:30', 'available'),
    (v_ev8, '2026-03-31', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-01', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-02', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-03', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-04', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-05', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-06', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-07', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-08', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-09', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-10', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-11', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-12', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-13', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-14', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-15', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-16', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-17', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-18', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-19', '10:00', '12:30', 'available'),
    (v_ev8, '2026-04-20', '10:00', '12:30', 'available');

  -- ── Event 9: Pequeñas Arquitecturas - Charlie y el Ascensor ──
  INSERT INTO events (id, city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, street_address,
    external_url, source, source_url, status)
  VALUES (
    gen_random_uuid(), v_city_id,
    'Pequeñas Arquitecturas: Charlie y el Ascensor de Cristal',
    'pequenas-arquitecturas-charlie-ascensor-cristal',
    'Nueva edición del taller de arquitectura para familias con Chiquitectos. Esta vez nos inspiramos en "Charlie y el Ascensor de Cristal" de Roald Dahl para diseñar y construir edificios imposibles, ascensores fantásticos y fábricas de chocolate en miniatura. Creatividad, ingeniería y diversión para toda la familia.',
    'Taller de arquitectura inspirado en Roald Dahl. Construye edificios imposibles y fábricas de chocolate.',
    'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&h=450&fit=crop',
    v_cat_talleres,
    15, 15, false, 4, 8, 120,
    'Vualá Librería Juvenil e Infantil', 'Madrid',
    'https://www.eventbrite.es/e/pequenas-arquitecturas-en-la-literatura-charlie-y-el-ascensor-de-cristal-tickets-1977772090563',
    'eventbrite', 'https://www.eventbrite.es/e/pequenas-arquitecturas-en-la-literatura-charlie-y-el-ascensor-de-cristal-tickets-1977772090563',
    'approved'
  ) RETURNING id INTO v_ev9;

  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev9, '2026-06-13', '18:00', '20:00', 'available');

  -- ── Event 10: Feria del Libro Infantil de Madrid ──
  INSERT INTO events (id, city_id, title, slug, description, short_description, image_url, event_category_id,
    price_min, price_max, is_free, age_min, age_max, duration_minutes,
    location_name, street_address, latitude, longitude,
    source, status, is_featured, is_promoted)
  VALUES (
    gen_random_uuid(), v_city_id,
    'Feria del Libro Infantil y Juvenil de Madrid 2026',
    'feria-libro-infantil-juvenil-madrid-2026',
    'La gran cita anual con la literatura infantil y juvenil llega al Parque del Retiro. Más de 50 casetas con editoriales especializadas, cuentacuentos diarios, talleres de ilustración, firmas de autores, zona de lectura al aire libre y actividades para todas las edades. Entrada libre. No te pierdas el pabellón de novedades y la zona de intercambio de libros usados.',
    'La gran feria de libros para niños en el Retiro. Cuentacuentos, talleres, firmas y entrada libre.',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop',
    v_cat_ferias,
    0, 0, true, 0, 17, 480,
    'Parque del Retiro', 'Paseo de Fernán Núñez, Madrid',
    40.4153, -3.6845,
    'manual', 'approved', true, true
  ) RETURNING id INTO v_ev10;

  INSERT INTO event_occurrences (event_id, occurrence_date, time_start, time_end, availability) VALUES
    (v_ev10, '2026-04-23', '10:00', '20:00', 'available'),
    (v_ev10, '2026-04-24', '10:00', '20:00', 'available'),
    (v_ev10, '2026-04-25', '10:00', '20:00', 'available'),
    (v_ev10, '2026-04-26', '10:00', '20:00', 'available'),
    (v_ev10, '2026-04-27', '10:00', '20:00', 'available'),
    (v_ev10, '2026-04-28', '10:00', '20:00', 'available'),
    (v_ev10, '2026-04-29', '10:00', '20:00', 'available'),
    (v_ev10, '2026-04-30', '10:00', '20:00', 'available'),
    (v_ev10, '2026-05-01', '10:00', '20:00', 'available'),
    (v_ev10, '2026-05-02', '10:00', '20:00', 'available'),
    (v_ev10, '2026-05-03', '10:00', '20:00', 'available');

  RAISE NOTICE 'Seeded 10 events with % total occurrences',
    (SELECT count(*) FROM event_occurrences);
END $$;
