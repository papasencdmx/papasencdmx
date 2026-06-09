import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Users,
  CalendarDays,
  Share2,
  Heart,
  MoreHorizontal,
  Map as MapIcon,
  ShieldCheck,
  Award,
  BadgeCheck,
  ChevronRight,
  ExternalLink,
  Ticket,
  Clock,
  Star,
} from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageViewTracker } from "@/components/tracking/PageViewTracker";
import { CampamentoCard } from "@/components/events/CampamentoCard";
import { CampamentoBookingCard } from "@/components/events/CampamentoBookingCard";
import { Gallery } from "./Gallery";
import { FeatureGroups } from "./FeatureGroups";
import type { Event, EventOccurrence, JsonLdSchema } from "@/types";

interface CampamentoDetailProps {
  event: Event;
  futureOccurrences: EventOccurrence[];
  occurrencesForWidget: Array<{
    id: string;
    occurrence_date: string;
    date_end: string | null;
    time_start: string | null;
    time_end: string | null;
    location_name: string | null;
    pack_name: string | null;
    pack_description: string | null;
    price_override: number | null;
    ticket_quantity: number | null;
    max_per_purchase: number | null;
    available: number;
  }>;
  paymentsEnabled: boolean;
  mainTicketUrl: string | null;
  relatedEvents: Event[];
  schemas: JsonLdSchema[];
  breadcrumbSchema: JsonLdSchema;
  breadcrumbs: Array<{ name: string; href: string }>;
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

function getTicketUrl(
  event: { external_url: string | null; affiliate_params: string | null },
  occurrence?: EventOccurrence
): string | null {
  const url = occurrence?.ticket_url || event.external_url;
  if (!url) return null;
  if (event.affiliate_params) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${event.affiliate_params}`;
  }
  return url;
}

const DEFAULT_HIGHLIGHTS = [
  {
    icon: Award,
    title: "Monitores titulados",
    description: "Equipo profesional con amplia experiencia en ocio educativo.",
  },
  {
    icon: BadgeCheck,
    title: "Plazas garantizadas",
    description: "Reserva tu pack al instante con confirmación inmediata.",
  },
  {
    icon: ShieldCheck,
    title: "Pago seguro",
    description: "Transacciones cifradas y cancelación flexible.",
  },
];

export function CampamentoDetail({
  event,
  futureOccurrences,
  occurrencesForWidget,
  paymentsEnabled,
  mainTicketUrl,
  relatedEvents,
  schemas,
  breadcrumbSchema,
  breadcrumbs,
}: CampamentoDetailProps) {
  const images = [event.image_url, ...(event.gallery_urls || [])].filter(Boolean) as string[];
  const hasPacks = futureOccurrences.some((o) => o.pack_name);

  const ageDisplay =
    event.age_min != null && event.age_max != null
      ? `${event.age_min}–${event.age_max} años`
      : event.age_min != null
        ? `Desde ${event.age_min} años`
        : event.age_max != null
          ? `Hasta ${event.age_max} años`
          : null;

  const firstOcc = futureOccurrences[0];
  const lastOcc = futureOccurrences[futureOccurrences.length - 1];
  const dateRangeLabel = firstOcc
    ? (() => {
        if (hasPacks) {
          const start = firstOcc.occurrence_date;
          const end = lastOcc?.date_end || lastOcc?.occurrence_date || start;
          return `${formatShortDate(start)} – ${formatShortDate(end)}`;
        }
        if (futureOccurrences.length === 1) return formatShortDate(firstOcc.occurrence_date);
        return `${formatShortDate(firstOcc.occurrence_date)} – ${formatShortDate(lastOcc!.occurrence_date)}`;
      })()
    : null;

  return (
    <>
      <JsonLd data={[...schemas, breadcrumbSchema]} />
      <PageViewTracker
        eventId={event.id}
        cityId={event.city_id}
        pagePath={`/ofertas/${event.slug}`}
        pageType="event"
      />

      <div className="bg-warm-50 min-h-screen pb-28 lg:pb-12">
        {/* Breadcrumbs */}
        <nav aria-label="Migas de pan" className="container-padres pt-4 pb-2">
          <ol className="flex items-center gap-1.5 text-[13px] text-warm-500 flex-wrap">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.href + i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3 text-warm-300" aria-hidden="true" />}
                {i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.href} className="hover:text-warm-900 transition-colors">
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="text-warm-900 font-medium truncate max-w-[240px]">{crumb.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="container-padres pt-2">
          {/* Title row + action icons */}
          <header className="mb-5 flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="font-display text-[28px] sm:text-[38px] lg:text-[52px] font-extrabold text-warm-900 leading-[1.08] sm:leading-[1.04] tracking-tight">
                {event.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] text-warm-600">
                <span className="inline-flex items-center rounded-full border border-emerald-300 bg-white px-3 py-1 text-[12px] font-semibold text-emerald-700">
                  Campamentos
                </span>
                {event.location_name && (
                  <span className="inline-flex items-center gap-1 text-warm-600">
                    <MapPin className="h-3.5 w-3.5 text-warm-400" aria-hidden="true" />
                    {event.location_name}
                  </span>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {event.latitude != null && event.longitude != null && (
                <a
                  href="#map"
                  aria-label="Ver en el mapa"
                  className="h-10 w-10 rounded-full border border-warm-200 bg-white flex items-center justify-center text-warm-700 hover:bg-warm-100 transition-colors"
                >
                  <MapIcon className="h-4 w-4" />
                </a>
              )}
              <button
                type="button"
                aria-label="Compartir"
                className="h-10 w-10 rounded-full border border-warm-200 bg-white flex items-center justify-center text-warm-700 hover:bg-warm-100 transition-colors"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Guardar"
                className="h-10 w-10 rounded-full border border-warm-200 bg-white flex items-center justify-center text-warm-700 hover:bg-warm-100 transition-colors"
              >
                <Heart className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Más opciones"
                className="h-10 w-10 rounded-full border border-warm-200 bg-white flex items-center justify-center text-warm-700 hover:bg-warm-100 transition-colors"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Gallery */}
          <Gallery title={event.title} images={images} />

          {/* Body two-column */}
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
            {/* LEFT */}
            <div className="min-w-0">
              {/* Summary header block — scale like Airbnb */}
              <section className="pb-8 border-b border-warm-200">
                <h2 className="font-display text-[24px] sm:text-[32px] lg:text-[38px] font-extrabold text-warm-900 leading-[1.1] sm:leading-[1.08] tracking-tight">
                  {hasPacks ? "Experiencia completa" : "Campamento completo"}
                </h2>
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[17px] text-warm-700">
                  {ageDisplay && (
                    <span className="inline-flex items-center gap-2">
                      <Users className="h-5 w-5 text-warm-500" aria-hidden="true" />
                      <span className="font-medium">{ageDisplay}</span>
                    </span>
                  )}
                  {dateRangeLabel && (
                    <>
                      <span className="text-warm-300" aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-2 capitalize">
                        <CalendarDays className="h-5 w-5 text-warm-500" aria-hidden="true" />
                        <span className="font-medium">{dateRangeLabel}</span>
                      </span>
                    </>
                  )}
                  {hasPacks && (
                    <>
                      <span className="text-warm-300" aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-2">
                        <Ticket className="h-5 w-5 text-warm-500" aria-hidden="true" />
                        <span className="font-medium">
                          {futureOccurrences.length} pack
                          {futureOccurrences.length === 1 ? "" : "s"} disponibles
                        </span>
                      </span>
                    </>
                  )}
                </div>

                {/* Organizer — data entered per-event in admin */}
                {event.organizer_name && (
                  <div className="mt-7">
                    <p className="text-[15px] text-warm-500 mb-2.5">Organizado por:</p>
                    <div className="flex items-center gap-3.5">
                      <div className="h-14 w-14 shrink-0 rounded-full overflow-hidden bg-warm-100 border border-warm-200 flex items-center justify-center">
                        {event.organizer_logo_url ? (
                          <Image
                            src={event.organizer_logo_url}
                            alt={event.organizer_name}
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-warm-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[17px] font-bold text-warm-900 truncate">
                            {event.organizer_name}
                          </span>
                          {event.organizer_is_verified && (
                            <span
                              title="Organizador verificado"
                              className="inline-flex items-center text-verified-600"
                            >
                              <BadgeCheck className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                        <p className="text-[14px] text-warm-500 mt-0.5">
                          {event.organizer_founded_year
                            ? `Organizando desde ${event.organizer_founded_year}`
                            : event.organizer_is_verified
                              ? "Organizador verificado"
                              : "Organizador oficial"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Mobile-only quick book strip — above-the-fold conversion CTA */}
              {(paymentsEnabled || mainTicketUrl) && (
                <a
                  href={paymentsEnabled ? "#purchase-widget" : (mainTicketUrl || "#")}
                  target={!paymentsEnabled && mainTicketUrl ? "_blank" : undefined}
                  rel={!paymentsEnabled && mainTicketUrl ? "noopener noreferrer" : undefined}
                  className="lg:hidden flex items-center justify-between gap-3 mt-6 rounded-2xl border border-warm-200 bg-white px-5 py-4 shadow-sm active:scale-[0.99] transition-transform"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-warm-500">
                      {hasPacks ? "Desde" : "Precio"}
                    </p>
                    <p className="text-2xl font-extrabold text-warm-900 leading-none mt-0.5">
                      {event.is_free
                        ? "Gratis"
                        : event.price_min != null
                          ? `$$ {event.price_min}`
                          : "Consultar"}
                      {!event.is_free && hasPacks && (
                        <span className="text-sm font-medium text-warm-500"> / pack</span>
                      )}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-600 text-white px-5 py-3 text-sm font-bold shadow-[0_10px_25px_-8px_rgba(37,99,235,0.5)]">
                    {paymentsEnabled ? (hasPacks ? "Elegir pack" : "Reservar") : "Reservar"}
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </a>
              )}

              {/* 3-col highlights */}
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-7 py-8 sm:py-9 border-b border-warm-200">
                {DEFAULT_HIGHLIGHTS.map((h, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <h.icon className="h-[22px] w-[22px]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-warm-900 text-[17px] leading-tight">{h.title}</p>
                      <p className="text-[15px] text-warm-500 leading-relaxed mt-1">
                        {h.description}
                      </p>
                    </div>
                  </div>
                ))}
              </section>

              {/* Tab pill strip */}
              <div className="flex items-center gap-2 py-6">
                <span className="inline-flex items-center rounded-full bg-warm-900 text-white px-4 py-1.5 text-sm font-semibold">
                  Descripción
                </span>
                {event.features && event.features.length > 0 && (
                  <a
                    href="#features"
                    className="inline-flex items-center rounded-full text-warm-500 px-4 py-1.5 text-sm font-medium hover:text-warm-900 transition-colors"
                  >
                    ¿Qué incluye? ({event.features.length})
                  </a>
                )}
                {event.latitude != null && event.longitude != null && (
                  <a
                    href="#map"
                    className="inline-flex items-center rounded-full text-warm-500 px-4 py-1.5 text-sm font-medium hover:text-warm-900 transition-colors"
                  >
                    Ubicación
                  </a>
                )}
              </div>

              {/* Description */}
              {(event.description || event.short_description) && (
                <section className="pb-10 border-b border-warm-200">
                  {event.short_description && (
                    <p className="text-[18px] sm:text-[19px] text-warm-900 leading-[1.55] font-medium mb-5">
                      {event.short_description}
                    </p>
                  )}
                  {event.description && (
                    <div className="text-[16px] sm:text-[17px] text-warm-700 leading-[1.7] whitespace-pre-wrap">
                      {event.description}
                    </div>
                  )}
                </section>
              )}

              {/* What this place offers (feature groups) */}
              {event.features && event.features.length > 0 && (
                <div id="features" className="pt-8">
                  <FeatureGroups features={event.features} />
                </div>
              )}

              {/* External-ticket fallback pack list */}
              {!paymentsEnabled && futureOccurrences.length > 0 && (
                <section className="pt-8 mt-8 border-t border-warm-200">
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-warm-900 mb-5">
                    {hasPacks ? "Packs disponibles" : "Fechas disponibles"}
                  </h2>
                  <div className="grid gap-2.5">
                    {futureOccurrences.map((occ) => {
                      const ticketUrl = getTicketUrl(event, occ);
                      return (
                        <div
                          key={occ.id}
                          className="rounded-2xl border border-warm-200 bg-white p-4 flex items-center gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            {occ.pack_name ? (
                              <>
                                <p className="font-bold text-warm-900">{occ.pack_name}</p>
                                <p className="text-sm text-warm-600 mt-0.5 capitalize">
                                  {formatShortDate(occ.occurrence_date)}
                                  {occ.date_end ? ` – ${formatShortDate(occ.date_end)}` : ""}
                                  {occ.time_start
                                    ? ` · ${occ.time_start}${occ.time_end ? `–${occ.time_end}` : ""}`
                                    : ""}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold text-warm-900 capitalize">
                                  {new Date(occ.occurrence_date + "T00:00:00").toLocaleDateString(
                                    "es-MX",
                                    { weekday: "long", day: "numeric", month: "long" }
                                  )}
                                </p>
                                {occ.time_start && (
                                  <p className="text-sm text-warm-500 flex items-center gap-1 mt-0.5">
                                    <Clock className="h-3 w-3" /> {occ.time_start}
                                    {occ.time_end ? ` – ${occ.time_end}` : ""}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {occ.price_override != null && (
                              <span className="text-sm font-bold text-warm-900">
                                $ {Number(occ.price_override)}
                              </span>
                            )}
                            {ticketUrl && (
                              <a
                                href={ticketUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-3.5 py-1.5 text-[12px] font-semibold hover:bg-emerald-700 transition-colors"
                              >
                                <Ticket className="h-3 w-3" /> Reservar
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Map */}
              {event.latitude != null && event.longitude != null && (
                <section id="map" className="pt-8 mt-8 border-t border-warm-200">
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-warm-900 mb-3">
                    Dónde encontrarnos
                  </h2>
                  <p className="text-warm-600 mb-4 flex items-center gap-1.5 text-sm">
                    <MapPin className="h-4 w-4 text-warm-400" />
                    {[event.location_name, event.street_address].filter(Boolean).join(" — ") || "Ciudad de México"}
                  </p>
                  <div className="rounded-2xl overflow-hidden border border-warm-200 aspect-[16/9]">
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""}&q=${event.latitude},${event.longitude}&zoom=14`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Mapa"
                    />
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT — sticky booking */}
            <aside className="lg:sticky lg:top-24 self-start">
              {paymentsEnabled && occurrencesForWidget.length > 0 ? (
                <div id="purchase-widget">
                  <CampamentoBookingCard
                    event={{
                      id: event.id,
                      title: event.title,
                      slug: event.slug,
                      price_min: event.price_min,
                      is_free: event.is_free,
                    }}
                    occurrences={occurrencesForWidget}
                    discountPercent={event.discount_percent ?? null}
                    discountLabel={event.discount_label ?? null}
                    depositPercent={event.deposit_percent ?? null}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-card">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-500">
                    {hasPacks ? "Desde" : "Precio"}
                  </p>
                  <p className="mt-1 text-3xl font-extrabold text-warm-900 leading-none">
                    {event.is_free
                      ? "Gratis"
                      : event.price_min != null
                        ? `$$ {event.price_min}`
                        : "Consultar"}
                    {!event.is_free && hasPacks && (
                      <span className="text-base font-semibold text-warm-500"> / pack</span>
                    )}
                  </p>
                  {mainTicketUrl ? (
                    <a
                      href={mainTicketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-bold text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20"
                    >
                      Reservar
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <p className="mt-5 text-sm text-warm-500">
                      Consulta directamente con el organizador para reservar.
                    </p>
                  )}
                  <div className="mt-5 pt-4 border-t border-warm-100 flex items-center justify-center gap-1.5 text-xs text-warm-500">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Cancelación flexible · Pago seguro
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Related camps */}
          {relatedEvents.length > 0 && (
            <section className="mt-16 border-t border-warm-200 pt-10">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-warm-900 mb-6">
                Otros campamentos
              </h2>
              <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedEvents.slice(0, 3).map((ev) => (
                  <CampamentoCard key={ev.id} event={ev} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Mobile sticky CTA is rendered inside CampamentoBookingCard so it can
            reflect the selected pack, discount, and hide once the buyer form is
            open. This section stays empty as a fallback for external-ticket camps. */}
        {!paymentsEnabled && mainTicketUrl && (
          <div className="fixed bottom-0 inset-x-0 z-40 bg-white/98 backdrop-blur-sm border-t border-warm-200 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
            <a
              href={mainTicketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-full bg-ocean-600 px-5 py-3.5 shadow-[0_15px_35px_-10px_rgba(37,99,235,0.6)] active:scale-[0.98] transition-transform"
            >
              <div className="text-left min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 leading-none">
                  {hasPacks ? "Desde" : "Precio"}
                </p>
                <p className="text-[17px] font-extrabold text-white leading-tight mt-1 truncate">
                  {event.is_free
                    ? "Gratis"
                    : event.price_min != null
                      ? `$$ {event.price_min} ${hasPacks ? "/ pack" : ""}`
                      : "Consultar"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-ocean-700 px-4 py-2 text-[14px] font-bold shrink-0">
                Reservar
                <ChevronRight className="h-4 w-4" />
              </span>
            </a>
          </div>
        )}
      </div>
    </>
  );
}
