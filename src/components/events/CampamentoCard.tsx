import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Wallet, Users, Sun, Sparkles } from "lucide-react";
import type { Event } from "@/types";

interface CampamentoCardProps {
  event: Event;
}

function formatDateRange(event: Event): string {
  const occs = event.occurrences || [];
  if (occs.length === 0 && event.next_occurrence_date) {
    return formatSingleDate(event.next_occurrence_date);
  }
  if (occs.length === 1) {
    return formatSingleDate(occs[0].occurrence_date);
  }
  if (occs.length > 1) {
    return `${formatSingleDate(occs[0].occurrence_date)} — ${formatSingleDate(occs[occs.length - 1].occurrence_date)}`;
  }
  return "";
}

function formatSingleDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

function formatPrice(event: Event): string | null {
  if (event.is_free) return null;
  if (event.price_min != null && event.price_max != null && event.price_min !== event.price_max) {
    return `$$ {event.price_min} – $$ {event.price_max}`;
  }
  if (event.price_min != null) return `$$ {event.price_min}`;
  if (event.price_max != null) return `$$ {event.price_max}`;
  return null;
}

function formatAgeRange(event: Event): string | null {
  if (event.age_min != null && event.age_max != null) return `${event.age_min}–${event.age_max} años`;
  if (event.age_min != null) return `Desde ${event.age_min} años`;
  if (event.age_max != null) return `Hasta ${event.age_max} años`;
  return null;
}

export function CampamentoCard({ event }: CampamentoCardProps) {
  const href = `/ofertas/${event.slug}`;
  const dateRange = formatDateRange(event);
  const price = formatPrice(event);
  const ageRange = formatAgeRange(event);
  const location = event.location_name || event.occurrences?.[0]?.location_name || null;
  const occCount = event.occurrence_count || event.occurrences?.length || 0;

  return (
    <article className="group">
      <Link
        href={href}
        className="block rounded-3xl bg-white border border-warm-200 p-2.5 transition-all duration-300 hover:border-warm-300 hover:shadow-lg hover:shadow-warm-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        {/* Image frame */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-warm-100">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 will-change-transform group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-copper-100 via-warm-100 to-copper-50 flex items-center justify-center">
              <Sun className="h-14 w-14 text-copper-400/50" aria-hidden="true" />
            </div>
          )}

          {/* Corner meta overlays */}
          {!!event.discount_percent && event.discount_percent > 0 && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-red-600 to-rose-700 px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wider text-white shadow-lg shadow-red-900/40 ring-1 ring-white/20 animate-badge-pulse">
                −{event.discount_percent}%
              </span>
            </div>
          )}
          {event.is_promoted && (
            <div
              className={`absolute left-3 ${
                !!event.discount_percent && event.discount_percent > 0 ? "top-12" : "top-3"
              }`}
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-copper-700 shadow-sm">
                <Sparkles className="h-3 w-3 text-copper-500" aria-hidden="true" />
                Destacado
              </span>
            </div>
          )}
          {ageRange && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                <Users className="h-3 w-3 text-white/85" aria-hidden="true" />
                {ageRange}
              </span>
            </div>
          )}
          {event.is_free && (
            <div className="absolute bottom-3 left-3">
              <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                Gratis
              </span>
            </div>
          )}
        </div>

        {/* Meta row — location + dates */}
        <div className="mt-4 px-1.5 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="h-[15px] w-[15px] text-warm-400 shrink-0" aria-hidden="true" />
            <span className="text-[13px] text-warm-600 truncate">
              {location || "Ciudad de México"}
            </span>
          </div>
          <div className="flex items-center justify-end gap-1.5 min-w-0">
            <CalendarDays className="h-[15px] w-[15px] text-warm-400 shrink-0" aria-hidden="true" />
            <span className="text-[13px] text-warm-600 truncate">
              {dateRange || "Por determinar"}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3 px-1.5 font-display text-xl sm:text-[22px] font-extrabold text-warm-900 leading-[1.18] line-clamp-2">
          {event.title}
        </h3>

        {/* Price */}
        <div className="mt-3 px-1.5">
          {event.is_free ? (
            <div className="flex items-center gap-1.5">
              <Wallet className="h-[15px] w-[15px] text-warm-400 shrink-0" aria-hidden="true" />
              <span className="text-[14px] font-medium text-emerald-700">Gratis para familias</span>
            </div>
          ) : !!event.discount_percent && event.discount_percent > 0 && event.price_min != null ? (
            <div className="flex items-end gap-2.5 flex-wrap">
              <div className="flex flex-col">
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wider text-warm-400">
                  <span className="line-through decoration-[1.5px] decoration-red-400/70">
                    $ {event.price_min}
                  </span>
                  <span className="ml-1.5 text-warm-300 normal-case tracking-normal">Desde</span>
                </span>
                <span className="mt-0.5 font-display text-[22px] font-extrabold leading-none text-warm-900 tabular-nums">
                  {Math.round(event.price_min * (1 - event.discount_percent / 100))}
                  <span className="text-[15px] font-bold align-top ml-0.5">$</span>
                </span>
              </div>
              <span className="relative inline-flex items-center gap-1 rounded-md bg-gradient-to-br from-red-600 to-rose-700 px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-md shadow-red-900/30 ring-1 ring-white/10 -translate-y-0.5">
                −{event.discount_percent}%
                <span
                  aria-hidden="true"
                  className="absolute -left-[5px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rotate-45 bg-red-600 ring-1 ring-white/10"
                />
              </span>
            </div>
          ) : price ? (
            <div className="flex items-center gap-1.5">
              <Wallet className="h-[15px] w-[15px] text-warm-400 shrink-0" aria-hidden="true" />
              <span className="text-[14px] text-warm-700">
                Desde <span className="font-semibold text-warm-900">{price}</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Wallet className="h-[15px] w-[15px] text-warm-400 shrink-0" aria-hidden="true" />
              <span className="text-[14px] text-warm-500">Consultar precio</span>
            </div>
          )}
          {!!event.discount_percent && event.discount_percent > 0 && event.price_min != null && (
            <p className="mt-1.5 text-[11px] font-semibold text-red-600 tracking-wide">
              Ahorras{" "}
              $ {Math.round(
                event.price_min * (event.discount_percent / 100)
              )} con Papás en CDMX
            </p>
          )}
        </div>

        {/* CTA — outlined emerald, fills on hover */}
        <div className="mt-4 rounded-full border border-emerald-600 px-4 py-3 text-center text-[14px] font-medium text-emerald-700 transition-colors duration-200 group-hover:bg-emerald-600 group-hover:text-white">
          Ver campamento
        </div>
      </Link>

      {/* Social-proof strip outside the card */}
      {occCount > 0 && (
        <p className="mt-3 text-center text-[12px] font-medium text-warm-500">
          {occCount === 1
            ? "1 fecha disponible"
            : `${occCount} fechas disponibles`}
          {event.event_category?.name ? <span className="text-warm-300 mx-1.5">·</span> : null}
          {event.event_category?.name && (
            <span className="text-warm-600">{event.event_category.name}</span>
          )}
        </p>
      )}
    </article>
  );
}

export function CampamentoCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white border border-warm-200 p-2.5">
      <div className="skeleton aspect-[4/3] rounded-2xl" />
      <div className="mt-4 px-1.5 grid grid-cols-2 gap-3">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-4 w-20 ml-auto" />
      </div>
      <div className="skeleton h-6 w-3/4 mt-3 mx-1.5" />
      <div className="skeleton h-4 w-1/3 mt-3 mx-1.5" />
      <div className="skeleton h-11 mt-4 rounded-full" />
    </div>
  );
}
