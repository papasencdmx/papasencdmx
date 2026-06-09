-- 1) Register Ciudad de México + the 6 categories
insert into cities (name, slug, domain, newsletter_subdomain, region, country, subscriber_count, is_active)
values ('Ciudad de México','cdmx','papasencdmx.com','newsletter','CDMX','México',0,true)
on conflict (slug) do nothing;

insert into categories (name, name_long, slug, icon, sort_order, is_active) values
 ('Campamentos','Campamentos de Verano','campamentos','sun',1,true),
 ('Colegios','Colegios y Centros Educativos','colegios','graduation-cap',2,true),
 ('Extraescolares','Actividades Extraescolares','extraescolares','palette',3,true),
 ('Ocio Familiar','Planes y Ocio Familiar','ocio-familiar','ferris-wheel',4,true),
 ('Deportes','Clubes y Academias Deportivas','deportes','trophy',5,true),
 ('Salud','Salud Infantil y Familiar','salud','heart-pulse',6,true)
on conflict (slug) do nothing;

-- 2) Admin account (username: admin / password generated below) + secret word "CDMX"
insert into admin_users (username, display_name, password_hash)
values ('admin','Admin','$2b$12$6kFNLtXK1yWpBcxssMou2OWBWoV6.L2fJ.MMvVOSyxdUsFy9zNMu.')
on conflict (username) do update set password_hash = excluded.password_hash;

insert into admin_config (key, value)
values ('login_secret_word','$2b$12$KjOchxVqxopHOQCOLvV6dejSZX4J7.9zYTjsWmVfWbv3SKQE7Nwwu')
on conflict (key) do update set value = excluded.value, updated_at = now();
