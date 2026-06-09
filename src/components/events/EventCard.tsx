import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Clock, Users, Tag, Megaphone } from "lucide-react";
import type { Event } from "@/types";

interface EventCardProps {
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
    const first = formatSingleDate(occs[0].occurrence_date);
    const last = formatSingleDate(occs[occs.length - 1].occurrence_date);
    return `${first} — ${last}`;
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
  if (event.is_free) return "Gratis";
  if (event.price_min != null && event.price_max != null && event.price_min !== event.price_max) {
    return `$$ {event.price_min} — $$ {event.price_max}`;
  }
  if (event.price_min != null) return `Desde $$ {event.price_min}`;
  if (event.price_max != null) return `Hasta $$ {event.price_max}`;
  return null;
}

export function EventCard({ event }: EventCardProps) {
  const href = `/ofertas/${event.slug}`;
  const dateRange = formatDateRange(event);
  const price = formatPrice(event);
  const occCount = event.occurrence_count || event.occurrences?.length || 0;

  const ageRange =
    event.age_min != null && event.age_max != null
      ? `${event.age_min}–${event.age_max} años`
      : event.age_min != null
        ? `Desde ${event.age_min} años`
        : null;

  return (
    <Link href={href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 rounded-2xl">
      <article className="relative overflow-hidden rounded-2xl border border-warm-200 bg-white shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-warm-300">
        {/* Image */}
        {event.image_url && (
          <div className="relative aspect-[16/9] overflow-hidden bg-warm-100">
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-105"
              loading="lazy"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" aria-hidden="true" />

            {/* Category badge — top left */}
            {event.event_category && (
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 text-warm-800 shadow-sm">
                  <Tag className="h-3 w-3 text-brand-500" aria-hidden="true" />
                  {event.event_category.name}
                </span>
              </div>
            )}

            {/* Promoted badge — top right */}
            {event.is_promoted && (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-gradient-to-br from-featured-500 to-brand-600 text-white shadow-lg">
                  <Megaphone className="h-3 w-3" aria-hidden="true" /> Promoción
                </span>
              </div>
            )}

            {/* Free badge — bottom left */}
            {event.is_free && (
              <div className="absolute bottom-2.5 left-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-verified-500 text-white shadow-sm">
                  Gratis
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-5">
          {/* Title */}
          <h3 className="font-display text-base font-bold text-warm-900 group-hover:text-brand-600 transition-colors line-clamp-2">
            {event.title}
          </h3>

          {/* Description */}
          {event.short_description && (
            <p className="mt-1.5 text-sm text-warm-600 line-clamp-2 leading-relaxed">
              {event.short_description}
            </p>
          )}

          {/* Meta info */}
          <div className="mt-3 space-y-1.5">
            {dateRange && (
              <p className="flex items-center gap-2 text-sm text-warm-700">
                <CalendarDays className="h-3.5 w-3.5 text-brand-500 shrink-0" aria-hidden="true" />
                {dateRange}
                {occCount > 1 && (
                  <span className="text-xs text-warm-500">· {occCount} fechas</span>
                )}
              </p>
            )}

            {event.location_name && (
              <p className="flex items-center gap-2 text-sm text-warm-600">
                <MapPin className="h-3.5 w-3.5 text-brand-400 shrink-0" aria-hidden="true" />
                {event.location_name}
              </p>
            )}

            {event.duration_minutes && (
              <p className="flex items-center gap-2 text-sm text-warm-600">
                <Clock className="h-3.5 w-3.5 text-warm-500 shrink-0" aria-hidden="true" />
                {event.duration_minutes} min
              </p>
            )}
          </div>

          {/* Bottom pills */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {price && !event.is_free && (
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100/80">
                {price}
              </span>
            )}
            {ageRange && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-ocean-50 text-ocean-700 border border-ocean-100/80">
                <Users className="h-2.5 w-2.5 text-ocean-500" aria-hidden="true" />
                {ageRange}
              </span>
            )}
            {event.event_category && !event.image_url && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100/80">
                {event.event_category.name}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-card overflow-hidden">
      <div className="skeleton aspect-[16/9]" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="flex gap-2 mt-2">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
