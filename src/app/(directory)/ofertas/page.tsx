import Link from "next/link";
import { CalendarDays, GraduationCap, Sun, ArrowRight, Sparkles } from "lucide-react";
import { eventosMetadata } from "@/lib/seo";
import { getCityConfig } from "@/config/city";
import { getEventCount } from "@/lib/data";

export const metadata = eventosMetadata();
export const revalidate = 3600;

const config = getCityConfig();

type Tile = {
  href: string;
  title: string;
  subtitle: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  count?: number;
  countLabel: string;
  accent: string;
  iconBg: string;
  iconColor: string;
};

export default async function EventosHubPage() {
  const [eventsCount, colegiosCount, campamentosCount] = await Promise.all([
    getEventCount({ section: "actividades" }),
    getEventCount({ section: "colegios" }),
    getEventCount({ section: "campamentos" }),
  ]);

  const tiles: Tile[] = [
    {
      href: "/ofertas/actividades",
      title: "Eventos",
      subtitle: "Planes y actividades",
      description: "Talleres, teatro, conciertos y actividades al aire libre para disfrutar con tus hijos.",
      Icon: CalendarDays,
      count: eventsCount,
      countLabel: "eventos próximos",
      accent: "from-brand-500 to-brand-600",
      iconBg: "bg-brand-50",
      iconColor: "text-brand-500",
    },
    {
      href: "/ofertas/colegios",
      title: "Colegios",
      subtitle: "Centros educativos",
      description: "Colegios públicos, privados y bilingües verificados. Filtra por zona, idioma y etapa.",
      Icon: GraduationCap,
      count: colegiosCount,
      countLabel: "próximas fechas",
      accent: "from-ocean-700 to-ocean-900",
      iconBg: "bg-ocean-50",
      iconColor: "text-ocean-700",
    },
    {
      href: "/ofertas/campamentos",
      title: "Campamentos",
      subtitle: "De verano y temporada",
      description: "Campamentos urbanos, de naturaleza, deportivos y en inglés. Encuentra el ideal para cada edad.",
      Icon: Sun,
      count: campamentosCount,
      countLabel: "próximos campamentos",
      accent: "from-copper-500 to-copper-600",
      iconBg: "bg-copper-50",
      iconColor: "text-copper-500",
    },
  ];

  return (
    <>
      {/* ── HERO BANNER ── */}
      <div className="relative bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-ocean-400 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="container-padres relative py-12 sm:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium text-white/90 mb-6">
              <Sparkles className="h-4 w-4 text-brand-400" aria-hidden="true" />
              Planes familiares en {config.cityName}
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-display-xl text-white font-extrabold leading-[1.1] tracking-tight">
              ¿Qué quieres planear{" "}
              <span className="text-brand-400">hoy?</span>
            </h1>

            <p className="mt-5 text-lg sm:text-xl text-ocean-200 leading-relaxed max-w-xl">
              Eventos, colegios y campamentos verificados — elige por dónde empezar.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-6 bg-warm-50 rounded-t-[2rem]" aria-hidden="true" />
      </div>

      {/* ── TILES ── */}
      <div className="container-padres py-10 sm:py-14">
        <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => {
            const { Icon } = tile;
            return (
              <Link
                key={tile.href}
                href={tile.href}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-warm-200 bg-white p-6 sm:p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-xl hover:border-warm-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${tile.iconBg} mb-5 transition-transform group-hover:scale-110`}
                  aria-hidden="true"
                >
                  <Icon className={`h-8 w-8 ${tile.iconColor}`} />
                </div>

                <p className="text-xs font-semibold uppercase tracking-widest text-warm-400">
                  {tile.subtitle}
                </p>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-warm-900">
                  {tile.title}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-warm-600 leading-relaxed flex-1">
                  {tile.description}
                </p>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-warm-100">
                  {typeof tile.count === "number" && tile.count > 0 ? (
                    <span className="text-sm font-semibold text-warm-700">
                      <span className="text-warm-900 font-bold">{tile.count}</span>{" "}
                      <span className="text-warm-500 font-normal">{tile.countLabel}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-warm-400">{tile.countLabel}</span>
                  )}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warm-50 text-warm-600 transition-all group-hover:bg-brand-500 group-hover:text-white">
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>

                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tile.accent} opacity-0 transition-opacity group-hover:opacity-100`}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>

        {/* ── Helper strip ── */}
        <div className="mt-10 sm:mt-14 rounded-3xl border border-warm-200 bg-warm-50/60 p-6 sm:p-8 text-center">
          <p className="text-sm sm:text-base text-warm-600 max-w-2xl mx-auto">
            Todo verificado por familias reales de {config.cityName}. ¿Echas algo en falta?{" "}
            <Link href="/contacto" className="font-semibold text-brand-500 hover:text-brand-600 underline underline-offset-2">
              Cuéntanoslo
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
