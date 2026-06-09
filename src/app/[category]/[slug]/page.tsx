import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Phone, Globe, MessageCircle, Mail, Clock, Users,
  Star, ShieldCheck, Award, ArrowRight, Navigation, Share2,
  GraduationCap, Palette, Building2, ClipboardList, HelpCircle, CalendarDays,
  BookOpen, Lightbulb, Dumbbell, Utensils, Monitor, Trophy,
  Euro, ExternalLink, AlertTriangle, Shield, Home, Heart, CheckCircle,
  Stethoscope, Smile, Scissors, Eye as EyeIcon, Ear, Baby, Syringe, Pill,
  Sparkles, Scan, HandMetal, Bone, Activity, Zap, Brush, Search,
  Wrench, Gem, ShieldPlus, HeartPulse, Brain, Droplets, Leaf
} from "lucide-react";
import {
  getCategoryBySlug, getZoneBySlug, getListings, getListingBySlug,
  getRelatedListings, getAdjacentZones, getListingCount, getListingSections
} from "@/lib/data";
import {
  categoryZoneMetadata, listingMetadata,
  collectionPageSchema, localBusinessSchema, faqSchema,
  categoryZoneBreadcrumbs, listingBreadcrumbs, breadcrumbSchema
} from "@/lib/seo";
import { getCityConfig } from "@/config/city";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ListingCard } from "@/components/listings/ListingCard";
import {
  LeadFormWrapper, ListingActions, StickyNavigation,
  FaqAccordion, GalleryGrid, ContactSidebar, MobileCtaBar
} from "./client-parts";
import { FileText } from "lucide-react";
import type { ColegioSectionContent, ListingSection, OfferTable } from "@/types";
import { OfferTableRenderer } from "@/components/listings/OfferTableRenderer";
import { PageViewTracker } from "@/components/tracking/PageViewTracker";
import { GooglePlacePhotos } from "@/components/GooglePlacePhotos";
import { getListingImage } from "@/lib/listingImage";

const config = getCityConfig();

/* Emoji map for extracurricular activities */
const emojiMap: Array<[RegExp, string]> = [
  [/fútbol|futbol|soccer/i, "⚽"],
  [/baloncesto|basket/i, "🏀"],
  [/tenis(?!.*mesa)/i, "🎾"],
  [/pádel|padel/i, "🏸"],
  [/natación|natacion|piscina|swim/i, "🏊"],
  [/atletismo|running|cross/i, "🏃"],
  [/gimnasia|gymnastics/i, "🤸"],
  [/judo|karate|taekwondo|artes marciales|martial/i, "🥋"],
  [/esgrima|fencing/i, "🤺"],
  [/golf/i, "⛳"],
  [/equitación|equitacion|hípica|hipica|horse/i, "🐴"],
  [/ajedrez|chess/i, "♟️"],
  [/ballet|danza|dance|baile/i, "💃"],
  [/teatro|drama|acting/i, "🎭"],
  [/música|musica|music|piano|guitarra|violin|orquesta|coro|choir/i, "🎵"],
  [/pintura|dibujo|art|arte|plástica|plastica/i, "🎨"],
  [/robótica|robotica|robot|programación|programacion|coding/i, "🤖"],
  [/ciencia|science|laboratorio|stem/i, "🔬"],
  [/cocina|cook|gastro/i, "👨‍🍳"],
  [/idioma|english|inglés|francés|alemán|chino|language/i, "🌍"],
  [/debate|oratoria|speech|model.?un/i, "🗣️"],
  [/voleibol|volleyball|voley/i, "🏐"],
  [/hockey/i, "🏑"],
  [/rugby/i, "🏉"],
  [/escalada|climb/i, "🧗"],
  [/yoga|mindfulness|meditación/i, "🧘"],
  [/campamento|camp|outdoor|adventure|aventura|excursion|senderismo/i, "🏕️"],
  [/vela|sailing|náutica|nautica|kayak|piragüismo/i, "⛵"],
  [/esquí|esqui|ski|snow/i, "⛷️"],
  [/bici|cycling|ciclismo/i, "🚴"],
  [/fotografía|fotografia|photo/i, "📸"],
  [/lectura|reading|libro|book|escritura|writing/i, "📚"],
  [/tecnología|tecnologia|tech|digital/i, "💻"],
  [/multideporte|multi.*sport/i, "🏅"],
  [/ping.?pong|tenis.*mesa|table.*tennis/i, "🏓"],
  [/waterpolo|water.?polo/i, "🤽"],
  [/patinaje|skating/i, "⛸️"],
  [/volunt|solidar|social/i, "🤝"],
  [/medio.*ambiente|ecolog|environment|garden|huerto|jardin/i, "🌱"],
  [/periódico|periodismo|journalism|newspaper/i, "📰"],
];
const activityEmoji = (name: string): string => {
  for (const [regex, emoji] of emojiMap) {
    if (regex.test(name)) return emoji;
  }
  return "⭐";
};

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { category: string; slug: string };
}) {
  const category = await getCategoryBySlug(params.category);
  if (!category) return {};

  // Check if slug is a zone
  const zone = await getZoneBySlug(params.slug);
  if (zone) {
    const count = await getListingCount(category.id, zone.id);
    return categoryZoneMetadata(category, zone, count);
  }

  // Otherwise it's a listing
  const listing = await getListingBySlug(params.slug);
  if (!listing) return {};
  return listingMetadata(listing, category, listing.zone as any);
}

export default async function CategorySlugPage({
  params,
}: {
  params: { category: string; slug: string };
}) {
  const category = await getCategoryBySlug(params.category);
  if (!category) notFound();

  // Try zone first
  const zone = await getZoneBySlug(params.slug);
  if (zone) {
    return <CategoryZonePage category={category} zone={zone} />;
  }

  // Try listing
  const listing = await getListingBySlug(params.slug);
  if (listing) {
    return <ListingPage listing={listing} category={category} />;
  }

  notFound();
}

// ── Category × Zone Page ──

async function CategoryZonePage({
  category,
  zone,
}: {
  category: any;
  zone: any;
}) {
  const [{ listings, count }, adjacentZones] = await Promise.all([
    getListings({ categoryId: category.id, zoneId: zone.id }),
    getAdjacentZones(zone.id),
  ]);

  const faqs = [
    {
      question: `¿Cuantos ${category.name.toLowerCase()} hay en ${zone.name}?`,
      answer: `Actualmente tenemos ${count} ${category.name.toLowerCase()} verificados en ${zone.name}, ${config.cityName}.`,
    },
    {
      question: `¿Como puedo contactar con un ${category.name.toLowerCase().replace(/s$/, "")} en ${zone.name}?`,
      answer: `Puedes solicitar informacion directamente desde la ficha de cada ${category.name.toLowerCase().replace(/s$/, "")}. Tu solicitud sera enviada al centro de forma inmediata.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          collectionPageSchema(
            `${category.name_long} en ${zone.name}`,
            `/${category.slug}/${zone.slug}`,
            listings
          ),
          faqSchema(faqs),
        ]}
      />

      <div className="container-padres py-8">
        <Breadcrumbs
          items={categoryZoneBreadcrumbs(
            category.name,
            category.slug,
            zone.name,
            zone.slug
          )}
        />

        <div className="max-w-3xl">
          <h1 className="font-display text-display-md sm:text-display-lg text-warm-900">
            {category.name_long} en {zone.name}
          </h1>
          <p className="mt-3 text-lg text-warm-600 leading-relaxed">
            {zone.snippet ||
              `En ${zone.name}, las familias cuentan con ${count} ${category.name_long.toLowerCase()} verificados.`}
          </p>
        </div>

        {/* Listings */}
        <section className="mt-10">
          <h2 className="font-display text-display-sm text-warm-900 mb-6">
            Los mejores {category.name.toLowerCase()} en {zone.name}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                categorySlug={category.slug}
              />
            ))}
          </div>

          {listings.length === 0 && (
            <div className="rounded-2xl border border-warm-200 bg-warm-50 p-12 text-center">
              <p className="text-warm-500">
                Todavia no hay {category.name.toLowerCase()} en {zone.name}. Vuelve pronto.
              </p>
            </div>
          )}
        </section>

        {/* Adjacent zones */}
        {adjacentZones.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-display-sm text-warm-900 mb-4">
              Otros {category.name.toLowerCase()} cerca de {zone.name}
            </h2>
            <div className="flex flex-wrap gap-3">
              {adjacentZones.map((adj) => (
                <Link
                  key={adj.slug}
                  href={`/${category.slug}/${adj.slug}`}
                  className="btn-secondary text-sm"
                >
                  <MapPin className="h-3.5 w-3.5" /> {adj.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mt-16 max-w-3xl">
          <h2 className="font-display text-display-sm text-warm-900 mb-6">
            Preguntas frecuentes sobre {category.name.toLowerCase()} en {zone.name}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-xl border border-warm-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-body font-semibold text-warm-800">
                  {faq.question}
                  <span className="text-warm-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="px-5 pb-5 text-warm-600 leading-relaxed">{faq.answer}</div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

// ── Individual Listing Page ──

function SectionCard({
  id,
  icon: Icon,
  title,
  accent = false,
  children,
}: {
  id?: string;
  icon: any;
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 sm:scroll-mt-32">
      <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
        <Icon className={`w-5 h-5 ${accent ? "text-orange-500" : "text-gray-400"}`} />
        <h2 className="font-display text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-6">{children}</div>
    </section>
  );
}

function LockedOverlay({ entityLabel }: { entityLabel: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[6px]" />
      <a
        href="/colaborar"
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-20 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] shadow-lg hover:shadow-xl transition-all"
      >
        <ShieldCheck className="w-5 h-5" />
        Verificar este {entityLabel}
      </a>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-3.5 border border-gray-100">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-orange-500 shrink-0" />
        <p className="text-[15px] font-bold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

/* Service icon map — used by ServiceGrid and admin editor */
const SERVICE_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  stethoscope: { icon: Stethoscope, label: "General" },
  smile: { icon: Smile, label: "Dental" },
  scissors: { icon: Scissors, label: "Cirugía" },
  eye: { icon: EyeIcon, label: "Oftalmología" },
  ear: { icon: Ear, label: "Otorrino" },
  baby: { icon: Baby, label: "Pediatría" },
  syringe: { icon: Syringe, label: "Inyección" },
  pill: { icon: Pill, label: "Farmacia" },
  sparkles: { icon: Sparkles, label: "Estética" },
  scan: { icon: Scan, label: "Diagnóstico" },
  bone: { icon: Bone, label: "Ortopedia" },
  activity: { icon: Activity, label: "Cardiología" },
  zap: { icon: Zap, label: "Láser" },
  brush: { icon: Brush, label: "Limpieza" },
  search: { icon: Search, label: "Revisión" },
  wrench: { icon: Wrench, label: "Reparación" },
  gem: { icon: Gem, label: "Premium" },
  shield_plus: { icon: ShieldPlus, label: "Protección" },
  heart_pulse: { icon: HeartPulse, label: "Salud" },
  brain: { icon: Brain, label: "Neurología" },
  droplets: { icon: Droplets, label: "Higiene" },
  leaf: { icon: Leaf, label: "Natural" },
  star: { icon: Star, label: "Destacado" },
  check: { icon: CheckCircle, label: "Verificado" },
};

function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const entry = SERVICE_ICONS[name];
  if (!entry) return <Star className={className} />;
  const Icon = entry.icon;
  return <Icon className={className} />;
}

function ServiceGrid({ services }: { services: Array<{ name: string; icon: string }> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {services.map((s, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all">
          <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
            <ServiceIcon name={s.icon} className="w-4 h-4 text-orange-500" />
          </div>
          <span className="text-[13px] sm:text-[14px] font-medium text-gray-700 leading-snug">{s.name}</span>
        </div>
      ))}
    </div>
  );
}

const DAY_NAMES_EN: Record<string, string> = {
  monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
  thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
};
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function ScheduleCard({ schedule }: { schedule: string }) {
  // Parse "Monday: 10:00 AM – 2:00 PM | Tuesday: ..." format
  const entries = schedule.split("|").map((s) => s.trim()).filter(Boolean);
  const days: Array<{ key: string; label: string; hours: string; isClosed: boolean }> = [];

  for (const entry of entries) {
    const colonIdx = entry.indexOf(":");
    if (colonIdx === -1) continue;
    const dayEn = entry.substring(0, colonIdx).trim().toLowerCase();
    const hours = entry.substring(colonIdx + 1).trim();
    const isClosed = hours.toLowerCase() === "closed" || hours.toLowerCase() === "cerrado";
    days.push({
      key: dayEn,
      label: DAY_NAMES_EN[dayEn] || entry.substring(0, colonIdx).trim(),
      hours: isClosed ? "Cerrado" : hours,
      isClosed,
    });
  }

  // If we couldn't parse structured days, show raw text
  if (days.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-[15px] text-gray-900">Horario</span>
        </div>
        <p className="text-[14px] text-gray-600">{schedule}</p>
      </div>
    );
  }

  // Determine today
  const todayIdx = new Date().getDay(); // 0=Sun, 1=Mon...
  const todayKey = DAY_ORDER[todayIdx === 0 ? 6 : todayIdx - 1];
  const todayEntry = days.find((d) => d.key === todayKey);
  const isOpenToday = todayEntry && !todayEntry.isClosed;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <span className="font-bold text-[15px] text-gray-900">Horario</span>
        </div>
        {todayEntry && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
            isOpenToday
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-red-50 text-red-500 border border-red-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOpenToday ? "bg-emerald-500" : "bg-red-400"}`} />
            {isOpenToday ? "Abierto hoy" : "Cerrado hoy"}
          </span>
        )}
      </div>
      {/* Days */}
      <div className="divide-y divide-gray-50">
        {days.map((day) => {
          const isToday = day.key === todayKey;
          return (
            <div
              key={day.key}
              className={`flex items-center justify-between px-4 sm:px-5 py-2.5 text-[13px] sm:text-[14px] ${
                isToday ? "bg-orange-50/40" : ""
              }`}
            >
              <span className={`font-medium ${isToday ? "text-orange-700 font-semibold" : "text-gray-700"}`}>
                {day.label}
                {isToday && <span className="ml-1.5 text-[10px] font-bold text-orange-500 uppercase">hoy</span>}
              </span>
              <span className={`${
                day.isClosed
                  ? "text-red-400 font-medium"
                  : isToday ? "text-gray-800 font-semibold" : "text-gray-500"
              }`}>
                {day.hours}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TagList({ items, color = "gray" }: { items: string[]; color?: "gray" | "orange" | "blue" | "green" }) {
  const colorMap = {
    gray: "bg-gray-50 border-gray-100 text-gray-700",
    orange: "bg-orange-50 border-orange-100 text-orange-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    green: "bg-emerald-50 border-emerald-100 text-emerald-700",
  };
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`px-3 py-1.5 rounded-lg border text-[13px] font-medium ${colorMap[color]}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

async function ListingPage({
  listing,
  category,
}: {
  listing: any;
  category: any;
}) {
  const [relatedListings, customSections] = await Promise.all([
    getRelatedListings(listing, 4),
    getListingSections(listing.id),
  ]);
  const zone = listing.zone;
  const isColegios = category.slug === "colegios";
  const sc = (listing.section_content || {}) as ColegioSectionContent;
  const socialLinks = listing.social_links as Record<string, string> | undefined;

  // Entity label for tooltips (singular from category name)
  const entityLabel = category.slug === "colegios" ? "colegio"
    : category.slug === "campamentos" ? "campamento"
    : category.slug === "extraescolares" ? "centro"
    : "negocio";

  // Verification status — gray or blue badge means verified
  const verificationBadge = (sc as Record<string, unknown>).verification_badge as string | undefined;
  const isVerified = verificationBadge === "gray" || verificationBadge === "blue";

  const ageRange =
    listing.age_min != null && listing.age_max != null
      ? `${listing.age_min} - ${listing.age_max} anos`
      : listing.age_min != null
        ? `Desde ${listing.age_min} anos`
        : null;

  const foundedYear = listing.founded_date
    ? new Date(listing.founded_date).getFullYear()
    : null;

  const formatLanguage = (l: string) =>
    l === "es" ? "Espanol" : l === "en" ? "English" : l === "fr" ? "Francais" : l === "de" ? "Deutsch" : l;

  // Generic services (works for any category)
  const genericServices = ((sc as Record<string, unknown>).services || []) as Array<{ name: string; icon: string }>;

  // Google reviews from section_content (only if toggled on in admin)
  const showGoogleReviews = Boolean((sc as Record<string, unknown>).show_google_reviews);
  const googleReviews = showGoogleReviews
    ? ((sc as Record<string, unknown>).google_reviews || []) as Array<{ author: string; text: string; rating: string }>
    : [];

  // Payment options & accessibility
  const paymentOptions = (sc as Record<string, unknown>).payment_options as string | undefined;
  const accessibility = (sc as Record<string, unknown>).accessibility as string | undefined;

  // Hidden fields check
  const hiddenFields = ((sc as Record<string, unknown>).hidden_fields || []) as string[];
  const isVisible = (field: string) => !hiddenFields.includes(field);

  // Build nav sections
  const hasTopGallery = listing.cover_image_url && listing.google_photos_enabled !== false && listing.gallery_urls?.length;
  const navSections: { id: string; label: string }[] = [];
  // Gallery first if it's the top element (cover photos)
  if (hasTopGallery) navSections.push({ id: "galeria", label: "Galeria" });
  navSections.push({ id: "sobre", label: "Sobre nosotros" });
  if (genericServices.length > 0 && isVisible("services")) {
    navSections.push({ id: "servicios-ofrecidos", label: "Servicios" });
  }
  if (googleReviews.length > 0 && isVisible("google_reviews")) {
    navSections.push({ id: "opiniones", label: "Opiniones" });
  }
  if (sc.modelo_educativo) navSections.push({ id: "modelo", label: "Modelo educativo" });
  if (sc.etapas?.length) navSections.push({ id: "etapas", label: "Etapas" });
  if (sc.extraescolares?.length) navSections.push({ id: "extraescolares", label: "Extraescolares" });
  if (sc.servicios?.length) navSections.push({ id: "servicios", label: "Servicios" });
  if (sc.instalaciones?.length) navSections.push({ id: "instalaciones", label: "Instalaciones" });
  if (sc.admisiones) navSections.push({ id: "admisiones", label: "Admisiones" });
  if (ageRange || listing.price_range || (listing.languages && listing.languages.length > 0)) {
    navSections.push({ id: "info", label: "Info practica" });
  }
  // Add dynamic custom sections to nav
  for (const cs of customSections) {
    navSections.push({ id: `section-${cs.slug}`, label: cs.title });
  }
  // Gallery at end only if it's NOT at the top (no cover image case)
  if (!hasTopGallery && listing.gallery_urls?.length) navSections.push({ id: "galeria", label: "Galeria" });
  const faqs = sc.faqs?.length ? sc.faqs : [];
  if (faqs.length > 0) navSections.push({ id: "faqs", label: "FAQ" });

  // Offer tables
  const offerTables = ((sc as Record<string, unknown>).offer_tables || []) as OfferTable[];
  const visibleOfferTables = offerTables.filter(t => t.visible);
  if (visibleOfferTables.length > 0) {
    navSections.push({ id: "tarifas", label: "Tarifas" });
  }

  // Section order from admin
  const sectionOrder = ((sc as Record<string, unknown>).section_order || []) as string[];

  // Tier badge — only show if listing is also marked as verified in admin
  const tierLabel = listing.is_verified
    ? (listing.tier === "presencia_total" ? "Premium" : listing.tier === "presencia_anual" ? "Verificado" : null)
    : null;

  return (
    <>
      <JsonLd
        data={[
          localBusinessSchema(listing, category, zone),
          breadcrumbSchema(
            listingBreadcrumbs(
              category.name,
              category.slug,
              listing.name,
              listing.slug,
              zone?.name,
              zone?.slug,
              listing.subcategory?.name_long,
              listing.subcategory?.slug
            )
          ),
          ...(faqs.length > 0 ? [faqSchema(faqs)] : []),
        ]}
      />

      {/* ── Header Section ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
          <div className="mb-3 sm:mb-4">
            <Breadcrumbs
              items={listingBreadcrumbs(
                listing.subcategory ? category.name : (category.name_long || category.name),
                category.slug,
                listing.name,
                listing.slug,
                zone?.name,
                zone?.slug,
                listing.subcategory?.name_long,
                listing.subcategory?.slug
              )}
            />
          </div>

          <div className="flex flex-row gap-4 sm:gap-6 items-start">
            {/* Logo + Info + Reclamar button on right */}
            {listing.logo_url ? (
              <div className="shrink-0 w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl border border-gray-100 shadow-md bg-white overflow-hidden p-1.5 sm:p-2 flex items-center justify-center">
                <img src={listing.logo_url} alt="" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="shrink-0 w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Tier badges */}
              {(tierLabel || listing.is_featured) && (
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                {tierLabel && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                    listing.tier === "presencia_total"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {listing.tier === "presencia_total" && <Star className="w-3 h-3" />}
                    {listing.tier === "presencia_anual" && <CheckCircle className="w-3 h-3" />}
                    {tierLabel}
                  </span>
                )}
                {listing.is_featured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-[11px] font-bold text-orange-700">
                    <Award className="w-3 h-3" /> Destacado
                  </span>
                )}
              </div>
              )}

              {/* Name */}
              <h1 className="font-display text-2xl sm:text-[32px] font-extrabold text-gray-900 leading-tight mb-1.5">
                {listing.name}
                {(sc as Record<string, unknown>).verification_badge === "gray" && (
                  <span className="inline-flex align-middle ml-2 group relative cursor-help">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#9CA3AF" />
                      <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 px-3 py-2 rounded-lg bg-gray-900 text-white text-[12px] leading-snug text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                      Informacion basica verificada por el {entityLabel}.
                    </span>
                  </span>
                )}
                {(sc as Record<string, unknown>).verification_badge === "blue" && (
                  <span className="inline-flex align-middle ml-2 group relative cursor-help">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#3B82F6" />
                      <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 px-3 py-2 rounded-lg bg-gray-900 text-white text-[12px] leading-snug text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                      {entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} verificado por Papás en CDMX. Toda la informacion ha sido confirmada y actualizada.
                    </span>
                  </span>
                )}
              </h1>


              {/* Star rating */}
              {listing.google_rating && (() => {
                const rating = listing.google_rating as number;
                const stars = Math.round(rating * 2) / 2;
                return (
                  <div className="flex items-center gap-1.5 mt-1 mb-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.floor(stars) ? "fill-amber-400 text-amber-400"
                          : i - 0.5 === stars ? "fill-amber-200 text-amber-400"
                            : "text-gray-200 fill-gray-200"
                          }`} />
                      ))}
                    </div>
                    <span className="text-[13px] font-bold text-gray-700">{rating.toFixed(1)}</span>
                    {listing.google_review_count && <span className="text-[12px] text-gray-400">&middot; {listing.google_review_count} opiniones</span>}
                  </div>
                );
              })()}

              {/* Address */}
              {listing.street_address && (
                <p className="text-[14px] text-gray-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  {listing.street_address}
                </p>
              )}

            </div>

            {/* Reclamar button — top right of header */}
            {!listing.is_claimed && !listing.is_verified && (
              <a
                href="/colaborar"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex shrink-0 items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-bold transition-colors shadow-sm"
              >
                <AlertTriangle className="w-4.5 h-4.5" /> Reclamar esta ficha
              </a>
            )}
          </div>

          {/* Quick info badges row — smart-packed for mobile */}
          {(() => {
            const customBadges = (sc as Record<string, unknown>)?.info_badges as Array<{ text: string; icon: string; style: string }> | undefined;
            const badgeStyleMap: Record<string, string> = {
              gray: "bg-gray-50 border-gray-100 text-gray-600",
              orange: "bg-orange-50 border-orange-100 text-orange-700 font-semibold",
              blue: "bg-blue-50 border-blue-100 text-blue-700",
              green: "bg-emerald-50 border-emerald-100 text-emerald-700",
            };
            const badgeIconMap: Record<string, React.ReactNode> = {
              globe: <Globe className="w-3.5 h-3.5 text-orange-500" />,
              clock: <Clock className="w-3.5 h-3.5 text-orange-500" />,
              star: <Euro className="w-3.5 h-3.5" />,
              map: <MapPin className="w-3.5 h-3.5 text-orange-500" />,
              phone: <Phone className="w-3.5 h-3.5 text-orange-500" />,
              mail: <Mail className="w-3.5 h-3.5 text-orange-500" />,
              check: <Shield className="w-3.5 h-3.5 text-orange-500" />,
              nav: <Lightbulb className="w-3.5 h-3.5 text-orange-500" />,
            };

            // Smart row-packing: reorder tags to minimize wasted space on mobile.
            // Estimates each tag's pixel width from its text length, then greedily
            // fills rows — when a tag doesn't fit, it looks ahead for a shorter one.
            type TagItem = { key: string; text: string; node: React.ReactNode; charLen: number };
            const GAP = 8; // gap-2
            const MOBILE_ROW_W = 340; // ~usable px on mobile
            const HAS_ICON_W = 20; // icon 14px + gap 6px
            const PADDING_W = 26; // px-3 both sides + border
            const CHAR_PX = 7.2; // avg char width at 13px DM Sans

            function estimateTagWidth(charLen: number, hasIcon: boolean) {
              return Math.ceil(charLen * CHAR_PX + PADDING_W + (hasIcon ? HAS_ICON_W : 0));
            }

            function packTags(tags: TagItem[]): TagItem[] {
              if (tags.length <= 1) return tags;
              const result: TagItem[] = [];
              const used = new Set<number>();

              while (used.size < tags.length) {
                let rowWidth = 0;
                let placedAny = false;

                for (let j = 0; j < tags.length; j++) {
                  if (used.has(j)) continue;
                  const hasIcon = tags[j].key !== "uniforme"; // uniforme has no icon
                  const tagW = estimateTagWidth(tags[j].charLen, hasIcon);
                  const needed = placedAny ? tagW + GAP : tagW;

                  if (rowWidth + needed <= MOBILE_ROW_W) {
                    result.push(tags[j]);
                    rowWidth += needed;
                    used.add(j);
                    placedAny = true;
                  }
                }

                // Safety: if nothing fit (tag wider than row), force the next unused
                if (!placedAny) {
                  for (let j = 0; j < tags.length; j++) {
                    if (!used.has(j)) { result.push(tags[j]); used.add(j); break; }
                  }
                }
              }
              return result;
            }

            // Build tag list
            let tags: TagItem[] = [];

            if (customBadges && customBadges.length > 0) {
              tags = customBadges.map((b, i) => ({
                key: `custom-${i}`,
                text: b.text,
                charLen: b.text.length,
                node: (
                  <span key={`custom-${i}`} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] border ${badgeStyleMap[b.style] || badgeStyleMap.gray}`}>
                    {badgeIconMap[b.icon]} {b.text}
                  </span>
                ),
              }));
            } else {
              // Auto-generated tags
              if (listing.languages && listing.languages.length > 0) {
                const langText = listing.languages.map(formatLanguage).join(", ");
                tags.push({
                  key: "languages", text: langText, charLen: langText.length,
                  node: (
                    <span key="languages" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] bg-gray-50 border border-gray-100 text-gray-600">
                      <Globe className="w-3.5 h-3.5 text-orange-500" /> {langText}
                    </span>
                  ),
                });
              }
              if (foundedYear) {
                const yearsActive = new Date().getFullYear() - foundedYear;
                if (yearsActive > 0) {
                  const yearText = `${yearsActive} años`;
                  tags.push({
                    key: "years", text: yearText, charLen: yearText.length,
                    node: (
                      <span key="years" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] bg-gray-50 border border-gray-100 text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-orange-500" /> {yearText}
                      </span>
                    ),
                  });
                }
              }
              if (listing.price_range) {
                const priceText = listing.price_range + (listing.price_min && listing.price_max ? ` (${listing.price_min}-$$ {listing.price_max})` : "");
                tags.push({
                  key: "price", text: priceText, charLen: priceText.length,
                  node: (
                    <span key="price" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-orange-50 border border-orange-100 text-orange-700">
                      <Euro className="w-3.5 h-3.5" /> {priceText}
                    </span>
                  ),
                });
              }
              if (sc.confesional) {
                tags.push({
                  key: "confesional", text: sc.confesional, charLen: sc.confesional.length,
                  node: (
                    <span key="confesional" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] bg-gray-50 border border-gray-100 text-gray-600">
                      <Shield className="w-3.5 h-3.5 text-orange-500" /> {sc.confesional}
                    </span>
                  ),
                });
              }
              if (sc.uniforme) {
                tags.push({
                  key: "uniforme", text: "Uniforme", charLen: 8,
                  node: (
                    <span key="uniforme" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] bg-gray-50 border border-gray-100 text-gray-600">
                      Uniforme
                    </span>
                  ),
                });
              }
            }

            if (tags.length === 0) return null;

            const packed = packTags(tags);

            return (
              <div className="flex flex-wrap gap-2 mt-4 sm:mt-6">
                {packed.map(t => t.node)}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Sticky Navigation */}
      {navSections.length > 2 && (
        <StickyNavigation sections={navSections} />
      )}

      {/* ── Main Content ── */}
      <div className="bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8 items-start">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">

            {/* Cover image + gallery — or Google Places UI Kit — or category fallback */}
            {(() => {
              const resolved = getListingImage(listing); // null for broken Google URLs
              const hasRealPhoto = !!listing.cover_image_url && resolved === listing.cover_image_url;
              if (hasRealPhoto && listing.google_photos_enabled !== false) {
                // Admin-uploaded gallery photos always show in full.
                // (Verification gate stays for the content sections below — that's the upsell.)
                return (
                  <div id="galeria" className="scroll-mt-28 sm:scroll-mt-32">
                    <GalleryGrid
                      images={[listing.cover_image_url!, ...(listing.gallery_urls || [])]}
                      alt={listing.name}
                    />
                  </div>
                );
              }
              if (listing.google_place_id && listing.google_photos_enabled !== false) {
                return (
                  <GooglePlacePhotos placeId={listing.google_place_id} alt={listing.name} singlePhoto={!isVerified} />
                );
              }
              return resolved ? (
                <div id="galeria" className="scroll-mt-28 sm:scroll-mt-32">
                  <GalleryGrid images={[resolved]} alt={listing.name} />
                </div>
              ) : null;
            })()}

            {/* ── Orderable sections ── */}
            {(() => {
              // Build a map of section id → JSX (only if section has content)
              const sectionMap: Record<string, React.ReactNode> = {};

              // About — editorial style, no card wrapper
              sectionMap["sobre"] = (
                <section key="sobre" id="sobre" className="scroll-mt-28 sm:scroll-mt-32">
                  <h2 className="font-display text-lg sm:text-xl font-bold text-gray-900 mb-3">Sobre nosotros</h2>
                  <p className="text-[15px] sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                    {listing.description || "Información no disponible todavía."}
                  </p>
                </section>
              );

              // Recommendation — distinct visual treatment
              if (listing.recommendation_reason) {
                sectionMap["recomendacion"] = (
                  <div key="recomendacion" className="rounded-xl sm:rounded-2xl border-l-4 border-emerald-500 bg-emerald-50/40 p-4 sm:p-6">
                    <h3 className="flex items-center gap-2 font-display font-bold text-base text-emerald-800 mb-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" /> Por qué lo recomendamos
                    </h3>
                    <p className="text-[15px] text-emerald-800/80 leading-relaxed">{listing.recommendation_reason}</p>
                  </div>
                );
              }

              // Services
              if (genericServices.length > 0 && isVisible("services")) {
                sectionMap["servicios-ofrecidos"] = (
                  <SectionCard key="servicios-ofrecidos" id="servicios-ofrecidos" icon={Stethoscope} title="Servicios" accent>
                    {isVerified ? (
                      <ServiceGrid services={genericServices} />
                    ) : (
                      <div className="relative">
                        <ServiceGrid services={genericServices.slice(0, 4)} />
                        {genericServices.length > 4 && (
                          <div className="mt-2.5">
                            <ServiceGrid services={genericServices.slice(4)} />
                          </div>
                        )}
                        <LockedOverlay entityLabel={entityLabel} />
                      </div>
                    )}
                  </SectionCard>
                );
              }

              // Offer tables
              if (visibleOfferTables.length > 0) {
                sectionMap["tarifas"] = (
                  <SectionCard key="tarifas" id="tarifas" icon={Euro} title="Tarifas y precios" accent>
                    <OfferTableRenderer tables={visibleOfferTables} />
                  </SectionCard>
                );
              }

              // Google Reviews
              if (googleReviews.length > 0 && isVisible("google_reviews")) {
                sectionMap["opiniones"] = (
                  <SectionCard key="opiniones" id="opiniones" icon={Star} title="Opiniones de Google">
                    <div className={`space-y-4 ${!isVerified ? "relative" : ""}`}>
                      {googleReviews.map((review, i) => (
                        <div key={i} className="bg-gray-50/80 rounded-xl border border-gray-100 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[14px] font-semibold text-gray-800">{review.author || "Usuario"}</span>
                            {review.rating && (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: parseInt(review.rating) || 0 }, (_, j) => (
                                  <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-[14px] text-gray-600 leading-relaxed">{review.text}</p>
                        </div>
                      ))}
                      {!isVerified && <LockedOverlay entityLabel={entityLabel} />}
                    </div>
                  </SectionCard>
                );
              }

              // Schedule
              if (listing.schedule) {
                sectionMap["horario"] = isVerified ? (
                  <ScheduleCard key="horario" schedule={listing.schedule} />
                ) : (
                  <div key="horario" className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100 bg-gray-50/60">
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="font-bold text-[15px] text-gray-900">Horario</span>
                    </div>
                    <div className="relative min-h-[120px]">
                      <div className="p-4 opacity-40">
                        <div className="space-y-2">
                          {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(d => (
                            <div key={d} className="flex justify-between text-[14px]">
                              <span className="text-gray-400">{d}</span>
                              <span className="text-gray-300">--:-- – --:--</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <LockedOverlay entityLabel={entityLabel} />
                    </div>
                  </div>
                );
              }

              // Info practica
              if (ageRange || listing.price_range || (listing.languages && listing.languages.length > 0) || foundedYear || sc.horario_ampliado || sc.alumnos_por_clase) {
                sectionMap["info"] = (
                  <div key="info" id="info" className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 scroll-mt-28 sm:scroll-mt-32">
                    {ageRange && <StatCard icon={Users} label="Edades" value={ageRange} />}
                    {listing.price_range && (
                      <StatCard
                        icon={Star}
                        label="Precio"
                        value={listing.price_min && listing.price_max ? `$$ {listing.price_min} - $$ {listing.price_max}` : listing.price_range}
                      />
                    )}
                    {listing.languages && listing.languages.length > 0 && (
                      <StatCard icon={Globe} label="Idiomas" value={listing.languages.map(formatLanguage).join(", ")} />
                    )}
                    {sc.horario_ampliado && <StatCard icon={Clock} label="Horario ampliado" value={sc.horario_ampliado} />}
                    {sc.alumnos_por_clase && <StatCard icon={Users} label="Alumnos/clase" value={`~${sc.alumnos_por_clase}`} />}
                    {foundedYear && <StatCard icon={CalendarDays} label="Fundado" value={`${foundedYear}`} />}
                  </div>
                );
              }

              // Payment + Accessibility
              if ((paymentOptions && isVisible("payment_options")) || (accessibility && isVisible("accessibility"))) {
                sectionMap["info-adicional"] = isVerified ? (
                  <div key="info-adicional" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paymentOptions && isVisible("payment_options") && (
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-2.5">
                          <Euro className="w-4 h-4 text-orange-500" />
                          <span className="font-bold text-[14px] text-gray-900">Metodos de pago</span>
                        </div>
                        <p className="text-[13px] text-gray-600 leading-relaxed">{paymentOptions}</p>
                      </div>
                    )}
                    {accessibility && isVisible("accessibility") && (
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-2.5">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span className="font-bold text-[14px] text-gray-900">Accesibilidad</span>
                        </div>
                        <p className="text-[13px] text-gray-600 leading-relaxed">{accessibility}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div key="info-adicional" className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/60">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                        <Euro className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                      </div>
                      <h2 className="font-bold text-[15px] sm:text-[17px] text-gray-900">Info adicional</h2>
                    </div>
                    <div className="relative min-h-[80px] p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-40">
                        <div className="rounded-lg bg-gray-50 h-12" />
                        <div className="rounded-lg bg-gray-50 h-12" />
                      </div>
                      <LockedOverlay entityLabel={entityLabel} />
                    </div>
                  </div>
                );
              }

              // Content sections (available for all categories)
              if (sc.modelo_educativo) {
                sectionMap["modelo"] = (
                  <SectionCard key="modelo" id="modelo" icon={Lightbulb} title="Modelo educativo" accent>
                    <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">{sc.modelo_educativo}</p>
                  </SectionCard>
                );
              }
              if (sc.etapas && sc.etapas.length > 0) {
                sectionMap["etapas"] = (
                  <SectionCard key="etapas" id="etapas" icon={GraduationCap} title="Etapas educativas">
                    <TagList items={sc.etapas} color="orange" />
                  </SectionCard>
                );
              }
              if (sc.extraescolares && sc.extraescolares.length > 0) {
                sectionMap["extraescolares"] = (
                  <SectionCard key="extraescolares" id="extraescolares" icon={Dumbbell} title="Actividades extraescolares">
                    <div className="flex flex-wrap gap-2">
                      {sc.extraescolares.map((a) => (
                        <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[13px] font-medium text-gray-700">
                          <span>{activityEmoji(a)}</span> {a}
                        </span>
                      ))}
                    </div>
                  </SectionCard>
                );
              }
              if (sc.servicios && sc.servicios.length > 0) {
                sectionMap["servicios"] = (
                  <SectionCard key="servicios" id="servicios" icon={Utensils} title="Servicios e instalaciones">
                    <TagList items={sc.servicios} color="green" />
                  </SectionCard>
                );
              }
              if (sc.instalaciones && sc.instalaciones.length > 0) {
                sectionMap["instalaciones"] = (
                  <SectionCard key="instalaciones" id="instalaciones" icon={Building2} title="Instalaciones">
                    <TagList items={sc.instalaciones} color="blue" />
                  </SectionCard>
                );
              }
              if (sc.admisiones) {
                sectionMap["admisiones"] = (
                  <SectionCard key="admisiones" id="admisiones" icon={ClipboardList} title="Proceso de admision" accent>
                    <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">{sc.admisiones}</p>
                  </SectionCard>
                );
              }
              if (sc.idiomas_ensenanza && sc.idiomas_ensenanza.length > 0) {
                sectionMap["idiomas"] = (
                  <SectionCard key="idiomas" id="idiomas" icon={Globe} title="Idiomas de ensenanza">
                    <TagList items={sc.idiomas_ensenanza} color="blue" />
                  </SectionCard>
                );
              }

              // Custom sections
              for (const cs of customSections) {
                sectionMap[`section-${cs.slug}`] = (
                  <SectionCard key={cs.id} id={`section-${cs.slug}`} icon={FileText} title={cs.title}>
                    <div className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
                      {cs.content}
                    </div>
                  </SectionCard>
                );
              }

              // Gallery (only if no cover)
              if (!listing.cover_image_url && listing.gallery_urls && listing.gallery_urls.length > 0) {
                sectionMap["galeria"] = (
                  <SectionCard key="galeria" id="galeria" icon={Star} title="Galeria">
                    <GalleryGrid images={listing.gallery_urls} alt={listing.name} />
                  </SectionCard>
                );
              }

              // FAQ
              if (faqs.length > 0) {
                sectionMap["faqs"] = (
                  <SectionCard key="faqs" id="faqs" icon={HelpCircle} title="Preguntas frecuentes">
                    <FaqAccordion faqs={faqs} />
                  </SectionCard>
                );
              }

              // Default order (used when no custom order is set)
              const defaultOrder = [
                "sobre", "recomendacion", "servicios-ofrecidos", "tarifas", "opiniones",
                "horario", "info", "info-adicional",
                "modelo", "etapas", "extraescolares", "servicios", "instalaciones", "admisiones", "idiomas",
                ...customSections.map(cs => `section-${cs.slug}`),
                "galeria", "faqs",
              ];

              // Merge: custom order first, then any remaining sections in default order
              const orderedIds = sectionOrder.length > 0
                ? [...sectionOrder, ...defaultOrder.filter(id => !sectionOrder.includes(id))]
                : defaultOrder;

              // Render only sections that exist
              return orderedIds.filter(id => sectionMap[id]).map(id => sectionMap[id]);
            })()}
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-1">
            <ContactSidebar
              listing={listing}
              category={category}
              socialLinks={socialLinks}
            />
          </div>
        </div>

        {/* Related listings */}
        {relatedListings.length > 0 && (
          <section className="mt-10 sm:mt-16">
            <h2 className="font-display text-display-sm text-warm-900 mb-4 sm:mb-6">
              Otros {category.name.toLowerCase()} {zone ? `en ${zone.name}` : `en ${config.cityName}`}
            </h2>
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedListings.map((related) => (
                <ListingCard
                  key={related.id}
                  listing={related}
                  categorySlug={category.slug}
                  hidePhoto
                />
              ))}
            </div>
          </section>
        )}
      </div>
      </div>

      {/* Page view tracking */}
      <PageViewTracker
        listingId={listing.id}
        cityId={listing.city_id}
        pagePath={`/${category.slug}/${listing.slug}`}
        pageType="listing"
      />

      {/* Mobile floating CTA bar + spacer */}
      <MobileCtaBar listing={listing} category={category} />
      <div className="h-[72px] lg:hidden" />
    </>
  );
}
