import Link from "next/link";
import {
  ArrowRight, MapPin, Star, ShieldCheck, CalendarDays, Mail, Flame
} from "lucide-react";
import { getCategories, getZones, getListings, getUpcomingEvents, getListingCount } from "@/lib/data";
import { getBeehiivPosts } from "@/lib/beehiiv";
import { homeMetadata, websiteSchema, organizationSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { HeroSection } from "@/components/HeroSection";
import { NewsletterCta } from "@/components/NewsletterCta";
import { getCityConfig } from "@/config/city";

export const metadata = homeMetadata();
export const revalidate = 3600;

const config = getCityConfig();

// Emoji + accent color per category slug
const CATEGORY_META: Record<string, { emoji: string; color: string; desc: string; icon?: string }> = {
  campamentos: { emoji: "⭐", icon: "/icons/camp.png", color: "text-amber-500", desc: "Verano, Semana Santa, invierno" },
  colegios: { emoji: "🏫", icon: "/icons/colegios.png", color: "text-blue-500", desc: "Públicos, privados, bilingües" },
  extraescolares: { emoji: "🎨", icon: "/icons/extraescolares.png", color: "text-violet-500", desc: "Idiomas, música, robótica, arte" },
  "ocio-familiar": { emoji: "🎡", icon: "/icons/ocio_familiar.webp", color: "text-pink-500", desc: "Planes, parques, restaurantes" },
  deportes: { emoji: "⚽", icon: "/icons/deportes.webp", color: "text-emerald-500", desc: "Clubes, academias, albercas" },
  salud: { emoji: "💚", icon: "/icons/salud.png", color: "text-teal-500", desc: "Pediatras, terapeutas, nutrición" },
};

// Fallback categories when database is empty
const FALLBACK_CATEGORIES = [
  { slug: "campamentos", name: "Campamentos", name_long: "Campamentos de Verano", count: 142 },
  { slug: "colegios", name: "Colegios", name_long: "Colegios y Centros Educativos", count: 318 },
  { slug: "extraescolares", name: "Extraescolares", name_long: "Actividades Extraescolares", count: 205 },
  { slug: "ocio-familiar", name: "Ocio Familiar", name_long: "Planes y Ocio Familiar", count: 167 },
  { slug: "deportes", name: "Deportes", name_long: "Clubes y Academias Deportivas", count: 189 },
  { slug: "salud", name: "Salud", name_long: "Salud Infantil y Familiar", count: 134 },
];

// Fallback zones
const FALLBACK_ZONES = [
  "Polanco", "Condesa", "Roma Norte", "Coyoacán", "Del Valle",
  "Santa Fe", "Nápoles", "San Ángel", "Lomas de Chapultepec", "Narvarte",
  "Satélite", "Pedregal",
];

// Fallback events
const FALLBACK_EVENTS = [
  { title: "Carnaval Infantil en Coyoacán", date: "2026-03-01", day: "Sáb", time: "17:00", zone: "Coyoacán", free: true, emoji: "🎭" },
  { title: "Taller de Robótica para Niños", date: "2026-03-02", day: "Dom", time: "10:00", zone: "Del Valle", free: false, price: 300, emoji: "🤖" },
  { title: "Cuentacuentos en Chapultepec", date: "2026-03-08", day: "Sáb", time: "11:00", zone: "Polanco", free: true, emoji: "📚" },
  { title: "Puertas Abiertas Colegio Americano", date: "2026-03-08", day: "Sáb", time: "10:00", zone: "Santa Fe", free: true, emoji: "🏫" },
  { title: "Clínica de Tenis Junior", date: "2026-03-09", day: "Dom", time: "9:00", zone: "Pedregal", free: false, price: 500, emoji: "🎾" },
  { title: "Festival de Ciencia Familiar", date: "2026-03-15", day: "Sáb", time: "10:00", zone: "Centro", free: true, emoji: "🔬" },
];

// Fallback featured listings
const FALLBACK_FEATURED = [
  { name: "Campamento Pipiol", zone: "Pedregal", cat: "Campamentos", catSlug: "campamentos", rating: 4.7, reviews: 89, verified: true, emoji: "🏕️" },
  { name: "Colegio Americano", zone: "Santa Fe", cat: "Colegios", catSlug: "colegios", rating: 4.5, reviews: 134, verified: true, emoji: "🏫" },
  { name: "Club Deportivo Chapultepec", zone: "Polanco", cat: "Deportes", catSlug: "deportes", rating: 4.6, reviews: 212, verified: true, emoji: "🎾" },
  { name: "Taller de Arte Frida", zone: "Coyoacán", cat: "Extraescolares", catSlug: "extraescolares", rating: 4.8, reviews: 67, verified: true, emoji: "🎨" },
];

// Newsletter blog posts
const NEWSLETTER_POSTS = [
  { title: "Los 10 mejores campamentos de verano en CDMX para 2026", tag: "Guía", date: "24 feb", emoji: "🏕️", read: "8 min", hot: true },
  { title: "Qué hacer este finde: planes en familia en el Bosque de Chapultepec", tag: "Planes", date: "22 feb", emoji: "🌳", read: "4 min", hot: false },
  { title: "Cómo elegir colegio en la CDMX: la guía definitiva", tag: "Educación", date: "19 feb", emoji: "🏫", read: "12 min", hot: false },
  { title: "5 clases de robótica para niños que vale la pena probar", tag: "Extraescolares", date: "15 feb", emoji: "🤖", read: "6 min", hot: false },
];

// Trust strip
const TRUST_PARTNERS = [
  "Colegio Americano", "KidZania", "Papalote Museo del Niño", "Club Mundet", "Hospital Infantil de México"
];

export default async function HomePage() {
  // Fetch from database, fall back to mock data when empty
  let [dbCategories, dbZones, { listings: dbFeatured }, dbEvents, totalCount, beehiivPosts] = await Promise.all([
    getCategories(),
    getZones(),
    getListings({ featured: true, limit: 4 }),
    getUpcomingEvents({ limit: 6 }),
    getListingCount(),
    getBeehiivPosts(4),
  ]);

  const hasDbCategories = dbCategories.length > 0;
  const hasDbZones = dbZones.length > 0;
  const hasDbFeatured = dbFeatured.length > 0;
  const hasDbEvents = dbEvents.length > 0;
  const displayCount = totalCount > 0 ? totalCount : 1155;

  // Use DB zones if available, else fallback
  const displayZones = hasDbZones
    ? dbZones.filter((z) => z.priority <= 2).slice(0, 12)
    : null;

  return (
    <>
      <JsonLd data={[websiteSchema(), organizationSchema()]} />

      {/* ── Hero ── */}
      <HeroSection
        subscriberCount={config.subscriberCount}
        cityName={config.cityName}
        newsletterDomain={config.newsletterDomain}
        displayCount={displayCount}
      />

      {/* ── Newsletter Blog Posts ── */}
      <section className="container-padres pt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ocean-900 tracking-tight">
              Lo ultimo en la newsletter
            </h2>
            <p className="text-sm text-warm-500 mt-1">Miércoles y domingos, directo a tu bandeja</p>
          </div>
          <a
            href={`https://${config.newsletterDomain}`}
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-copper-500 hover:text-copper-400 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver archivo <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {beehiivPosts.length > 0
            ? beehiivPosts.map((post, i) => {
              const tag = post.content_tags?.[0] || "Newsletter";
              const pubDate = new Date(post.publish_date * 1000);
              const dateStr = pubDate.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
              const readMin = Math.max(3, Math.ceil(post.title.length / 8));
              return (
                <a
                  key={post.id}
                  href={post.web_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card group p-5 hover:border-warm-300"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-copper-500 bg-copper-50 px-2 py-0.5 rounded-md">
                      {tag}
                    </span>
                    {i === 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-red-500">
                        <Flame className="h-3 w-3" /> Popular
                      </span>
                    )}
                  </div>
                  {post.thumbnail_url && (
                    <img src={post.thumbnail_url} alt={post.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                  )}
                  <h3 className="font-display text-base font-bold text-ocean-900 leading-snug tracking-tight group-hover:text-copper-500 transition-colors">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-3 text-xs text-warm-400 font-medium">
                    <span>{dateStr}</span>
                    <span className="text-warm-300">·</span>
                    <span>{readMin} min lectura</span>
                  </div>
                </a>
              );
            })
            : NEWSLETTER_POSTS.map((post, i) => (
              <a
                key={i}
                href={`https://${config.newsletterDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card group p-5 hover:border-warm-300"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-copper-500 bg-copper-50 px-2 py-0.5 rounded-md">
                    {post.tag}
                  </span>
                  {post.hot && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-500">
                      <Flame className="h-3 w-3" /> Popular
                    </span>
                  )}
                </div>
                <span className="text-[28px] block mb-2">{post.emoji}</span>
                <h3 className="font-display text-base font-bold text-ocean-900 leading-snug tracking-tight group-hover:text-copper-500 transition-colors">
                  {post.title}
                </h3>
                <div className="flex items-center gap-2 mt-3 text-xs text-warm-400 font-medium">
                  <span>{post.date}</span>
                  <span className="text-warm-300">·</span>
                  <span>{post.read} lectura</span>
                </div>
              </a>
            ))
          }
        </div>
      </section>

      {/* ── Directory Categories ── */}
      <section className="container-padres pt-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ocean-900 tracking-tight">
              Directorio familiar
            </h2>
            <p className="text-sm text-warm-500 mt-1">
              {displayCount.toLocaleString("es-MX")}+ servicios verificados en {config.cityName} y alrededores
            </p>
          </div>
          <Link href="/campamentos" className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-copper-500 hover:text-copper-400 transition-colors">
            Ver todo <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(hasDbCategories ? dbCategories : FALLBACK_CATEGORIES).map((cat) => {
            const meta = CATEGORY_META[cat.slug] || { emoji: "📌", color: "text-warm-500", desc: "" };
            const count = "count" in cat ? (cat as any).count : null;
            return (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="card group p-5 text-left hover:border-warm-300"
              >
                {meta.icon ? (
                  <img src={meta.icon} alt={cat.name} className="w-14 h-14 object-contain" />
                ) : (
                  <span className="text-[28px] block">{meta.emoji}</span>
                )}
                <h3 className="font-display text-[15px] font-bold text-ocean-900 mt-2.5 mb-0.5 tracking-tight group-hover:text-copper-500 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-warm-400 leading-snug line-clamp-2">
                  {meta.desc || `${cat.name_long} en ${config.cityName}`}
                </p>
                {count && (
                  <p className={`text-xs font-bold mt-2 ${meta.color}`}>
                    {count}+ listados
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        {/* Zones as pills */}
        <div className="mt-5">
          <p className="text-xs text-warm-500 font-semibold mb-2">Zonas populares:</p>
          <div className="flex flex-wrap gap-1.5">
            {displayZones
              ? displayZones.map((zone) => (
                <Link key={zone.slug} href={`/zonas/${zone.slug}`} className="zone-pill">
                  {zone.name}
                </Link>
              ))
              : FALLBACK_ZONES.map((name) => (
                <span key={name} className="zone-pill cursor-default">
                  {name}
                </span>
              ))
            }
          </div>
        </div>
      </section>

      {/* ── Events + Featured side-by-side ── */}
      <section className="container-padres pt-14 overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-2 items-start">

          {/* Events column */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-ocean-900 tracking-tight flex items-center gap-2 min-w-0">
                <CalendarDays className="h-5 w-5 text-copper-500 shrink-0" />
                <span className="truncate">Proximos eventos</span>
              </h2>
              <Link href="/ofertas" className="flex items-center gap-1.5 text-sm font-bold text-copper-500 hover:text-copper-400 transition-colors whitespace-nowrap shrink-0">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-warm-200 bg-white overflow-hidden">
              {hasDbEvents
                ? dbEvents.map((event, i) => {
                  const nextDate = event.next_occurrence_date || event.occurrences?.[0]?.occurrence_date;
                  const nextTime = event.occurrences?.[0]?.time_start;
                  const dateObj = nextDate ? new Date(nextDate + "T00:00:00") : new Date();
                  const dayNum = dateObj.getDate();
                  const monthShort = dateObj.toLocaleDateString("es-MX", { month: "short" });
                  const dayName = dateObj.toLocaleDateString("es-MX", { weekday: "short" });
                  return (
                    <Link
                      key={event.id}
                      href={`/ofertas/${event.slug}`}
                      className={`flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-warm-50 ${i < dbEvents.length - 1 ? "border-b border-warm-100" : ""
                        }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-ocean-900/[0.04] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-extrabold text-copper-500 uppercase tracking-wide">{dayName}</span>
                        <span className="text-base font-extrabold text-ocean-900 leading-none">{dayNum}</span>
                        <span className="text-[9px] text-warm-400 uppercase font-semibold">{monthShort}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-warm-800 truncate">{event.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-warm-400 font-medium min-w-0 overflow-hidden">
                          {nextTime && <span className="shrink-0">{nextTime}</span>}
                          {nextTime && event.location_name && <span className="text-warm-300 shrink-0">·</span>}
                          {event.location_name && (
                            <span className="flex items-center gap-1 min-w-0 truncate"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{event.location_name}</span></span>
                          )}
                        </div>
                      </div>
                      {event.is_free && (
                        <span className="text-[11px] font-bold text-verified-500 bg-verified-50 px-2 py-0.5 rounded-md shrink-0">Gratis</span>
                      )}
                    </Link>
                  );
                })
                : FALLBACK_EVENTS.map((ev, i) => {
                  const dateObj = new Date(ev.date);
                  const dayNum = dateObj.getDate();
                  const monthShort = dateObj.toLocaleDateString("es-MX", { month: "short" });
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-warm-50 cursor-pointer ${i < FALLBACK_EVENTS.length - 1 ? "border-b border-warm-100" : ""
                        }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-ocean-900/[0.04] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-extrabold text-copper-500 uppercase tracking-wide">{ev.day}</span>
                        <span className="text-base font-extrabold text-ocean-900 leading-none">{dayNum}</span>
                        <span className="text-[9px] text-warm-400 uppercase font-semibold">{monthShort}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-warm-800 truncate">{ev.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-warm-400 font-medium min-w-0 overflow-hidden">
                          <span className="shrink-0">{ev.time}</span>
                          <span className="text-warm-300 shrink-0">·</span>
                          <span className="flex items-center gap-1 min-w-0 truncate"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{ev.zone}</span></span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {ev.free ? (
                          <span className="text-[11px] font-bold text-verified-500 bg-verified-50 px-2 py-0.5 rounded-md">Gratis</span>
                        ) : (
                          <span className="text-[11px] font-semibold text-warm-600 bg-warm-100 px-2 py-0.5 rounded-md">$ {ev.price}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>

          {/* Featured column */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-ocean-900 tracking-tight min-w-0 truncate">
                ⭐ Recomendados
              </h2>
              <Link href="/campamentos" className="flex items-center gap-1.5 text-sm font-bold text-copper-500 hover:text-copper-400 transition-colors whitespace-nowrap shrink-0">
                Ver directorio <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-3">
              {hasDbFeatured
                ? dbFeatured.map((listing) => {
                  const catSlug = listing.category?.slug || "listing";
                  const meta = CATEGORY_META[catSlug] || { emoji: "📌", color: "text-warm-500", desc: "" };
                  return (
                    <Link
                      key={listing.id}
                      href={`/${catSlug}/${listing.slug}`}
                      className="card group flex items-center gap-3.5 p-4 hover:shadow-card-hover"
                    >
                      <div className="w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-warm-50 to-warm-200 flex items-center justify-center shrink-0">
                        {meta.icon ? <img src={meta.icon} alt={catSlug} className="w-11 h-11 object-contain" /> : <span className="text-[26px]">{meta.emoji}</span>}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-warm-800 truncate">{listing.name}</h4>
                          {listing.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-verified-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-warm-400 font-medium overflow-hidden">
                          {listing.google_rating && (
                            <span className="flex items-center gap-0.5 text-featured-500 shrink-0">
                              <Star className="h-3 w-3 fill-featured-500" /> {listing.google_rating.toFixed(1)}
                            </span>
                          )}
                          {listing.google_review_count && <span className="shrink-0">({listing.google_review_count})</span>}
                          {listing.zone && (
                            <><span className="text-warm-300 shrink-0">·</span><span className="truncate">{listing.zone.name}</span></>
                          )}
                        </div>
                        <span className="text-[11px] text-copper-500 font-semibold">{listing.category?.name}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-warm-300 shrink-0 group-hover:text-copper-500 transition-colors" />
                    </Link>
                  );
                })
                : FALLBACK_FEATURED.map((f) => {
                  const meta = CATEGORY_META[f.catSlug] || { emoji: "📌", color: "text-warm-500", desc: "" };
                  return (
                    <div
                      key={f.name}
                      className="card group flex items-center gap-3.5 p-4 hover:shadow-card-hover cursor-pointer"
                    >
                      <div className="w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-warm-50 to-warm-200 flex items-center justify-center shrink-0">
                        {meta.icon ? <img src={meta.icon} alt={f.name} className="w-11 h-11 object-contain" /> : <span className="text-[26px]">{meta.emoji}</span>}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-warm-800 truncate">{f.name}</h4>
                          {f.verified && <ShieldCheck className="h-3.5 w-3.5 text-verified-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-warm-400 font-medium overflow-hidden">
                          <span className="flex items-center gap-0.5 text-featured-500 shrink-0">
                            <Star className="h-3 w-3 fill-featured-500" /> {f.rating}
                          </span>
                          <span className="shrink-0">({f.reviews})</span>
                          <span className="text-warm-300 shrink-0">·</span>
                          <span className="truncate">{f.zone}</span>
                        </div>
                        <span className="text-[11px] text-copper-500 font-semibold">{f.cat}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-warm-300 shrink-0 group-hover:text-copper-500 transition-colors" />
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter CTA ── */}
      <NewsletterCta
        subscriberCount={config.subscriberCount}
        cityName={config.cityName}
      />

      {/* ── Trust Strip ── */}
      <section className="container-padres pt-12 pb-14 text-center">
        <p className="text-xs text-warm-400 uppercase tracking-widest font-bold mb-4">Confian en nosotros</p>
        <div className="flex justify-center flex-wrap gap-x-7 gap-y-2 opacity-40">
          {TRUST_PARTNERS.map((name) => (
            <span key={name} className="font-display text-sm font-bold text-ocean-900">{name}</span>
          ))}
        </div>
      </section>
    </>
  );
}
