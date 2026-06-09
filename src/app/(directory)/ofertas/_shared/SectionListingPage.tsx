import Link from "next/link";
import { CalendarDays, GraduationCap, Sun, MapPin, Star, TrendingUp } from "lucide-react";
import { getUpcomingEvents, getEventCategories } from "@/lib/data";
import { getCityConfig } from "@/config/city";
import type { EventSection } from "@/types";
import EventosContent from "../actividades/EventosContent";
import { DiscountTicker } from "@/components/events/DiscountTicker";

const config = getCityConfig();

type Copy = {
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  description: string;
  heroIcon: React.ComponentType<{ className?: string }>;
  backLabel: string;
};

const SECTION_COPY: Record<EventSection, Copy> = {
  actividades: {
    eyebrow: "Actualizado diariamente con nuevos eventos",
    headline: "Eventos para familias",
    headlineAccent: `en ${config.cityName}`,
    description: "Descubre talleres, teatro, conciertos, ferias y actividades al aire libre para disfrutar con tus hijos.",
    heroIcon: CalendarDays,
    backLabel: "Eventos",
  },
  colegios: {
    eyebrow: "Jornadas de puertas abiertas, visitas y charlas",
    headline: "Descubre colegios",
    headlineAccent: `en ${config.cityName}`,
    description: "Reserva tu plaza en jornadas de puertas abiertas, visitas guiadas y charlas informativas de los mejores centros educativos.",
    heroIcon: GraduationCap,
    backLabel: "Colegios",
  },
  campamentos: {
    eyebrow: "Nuevas ofertas cada semana",
    headline: "Ofertas exclusivas",
    headlineAccent: "para nuestra comunidad",
    description: "Hemos negociado descuentos reales con los mejores campamentos, academias y centros infantiles de la CDMX. Solo para familias de Papás en CDMX.",
    heroIcon: Sun,
    backLabel: "Campamentos",
  },
};

export async function SectionListingPage({ section }: { section: EventSection }) {
  const [events, eventCategories] = await Promise.all([
    getUpcomingEvents({ section, limit: 24 }),
    getEventCategories(section),
  ]);

  const freeCount = events.filter((e) => e.is_free).length;
  const copy = SECTION_COPY[section];
  const HeroIcon = copy.heroIcon;

  return (
    <>
      {/* ── Back to hub strip ── */}
      <div className="bg-ocean-950 border-b border-white/5">
        <div className="container-padres py-3 flex items-center text-sm text-white/60">
          <Link href="/ofertas" className="hover:text-white/90 transition-colors">
            ← Volver a Planes familiares
          </Link>
          <span className="mx-2 text-white/30">/</span>
          <span className="text-white/80 font-medium">{copy.backLabel}</span>
        </div>
      </div>

      {/* ── HERO BANNER ── */}
      <div className="relative bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-ocean-400 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="container-padres relative py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium text-white/90 mb-6">
                <TrendingUp className="h-4 w-4 text-brand-400" aria-hidden="true" />
                {copy.eyebrow}
              </div>

              {section === "campamentos" && <DiscountTicker />}

              <h1 className="font-display text-4xl sm:text-5xl lg:text-display-xl text-white font-extrabold leading-[1.1] tracking-tight">
                {copy.headline}{" "}
                <span className="text-brand-400">{copy.headlineAccent}</span>
              </h1>

              <p className="mt-5 text-lg sm:text-xl text-ocean-200 leading-relaxed max-w-xl">
                {copy.description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#eventos"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white hover:bg-brand-600 active:scale-[0.98] transition-all shadow-lg shadow-brand-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-900"
                >
                  <HeroIcon className="h-5 w-5" aria-hidden="true" />
                  Explorar
                </a>
                {freeCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-sm font-semibold text-white/90">
                    <Star className="h-4 w-4 text-featured-400" aria-hidden="true" />
                    {freeCount} gratuitos
                  </span>
                )}
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-3 w-72">
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-5 text-center">
                <p className="text-3xl font-extrabold text-white leading-none">{events.length}+</p>
                <p className="text-xs text-ocean-300 font-medium mt-1.5">Próximos</p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-5 text-center">
                <p className="text-3xl font-extrabold text-white leading-none">{eventCategories.length}</p>
                <p className="text-xs text-ocean-300 font-medium mt-1.5">Categorías</p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-5 text-center col-span-2">
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-5 w-5 text-brand-400" aria-hidden="true" />
                  <p className="text-sm font-bold text-white">{config.cityName} y alrededores</p>
                </div>
                <p className="text-xs text-ocean-300 font-medium mt-1">Verificados manualmente</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-6 bg-warm-50 rounded-t-[2rem]" aria-hidden="true" />
      </div>

      {/* ── CONTENT ── */}
      <div id="eventos" className="container-padres py-8 sm:py-10">
        <EventosContent
          initialEvents={events}
          initialTotal={events.length}
          eventCategories={eventCategories}
          section={section}
        />
      </div>
    </>
  );
}
