-- ══════════════════════════════════════════════════════════════════════════
-- Three-section booking model: actividades | colegios | campamentos
-- All existing events + categories are treated as 'actividades' by default.
-- Run once in the Supabase SQL editor.
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'actividades'
    CHECK (section IN ('actividades', 'colegios', 'campamentos'));

ALTER TABLE event_categories
  ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'actividades'
    CHECK (section IN ('actividades', 'colegios', 'campamentos'));

CREATE INDEX IF NOT EXISTS idx_events_section_status
  ON events(section, status);

CREATE INDEX IF NOT EXISTS idx_event_categories_section
  ON event_categories(section, is_active, sort_order);

-- ── Optional starter categories (edit/delete/add more in admin later) ─────
INSERT INTO event_categories (name, name_long, slug, section, sort_order, is_active)
VALUES
  ('Puertas abiertas',   'Jornada de puertas abiertas',     'puertas-abiertas',   'colegios',    10, true),
  ('Visita guiada',      'Visita guiada al centro',         'visita-guiada',      'colegios',    20, true),
  ('Charla informativa', 'Charla informativa para familias','charla-informativa', 'colegios',    30, true),
  ('Urbano',             'Campamento urbano',               'urbano',             'campamentos', 10, true),
  ('Multiaventura',      'Campamento de multiaventura',     'multiaventura',      'campamentos', 20, true),
  ('Inglés',             'Campamento en inglés',            'ingles',             'campamentos', 30, true),
  ('Deportivo',          'Campamento deportivo',            'deportivo',          'campamentos', 40, true)
ON CONFLICT (slug) DO NOTHING;
