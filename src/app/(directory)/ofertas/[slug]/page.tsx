import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Timer,
  ArrowLeft,
  Ticket,
  Shield,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { getEventBySlug, getRelatedEvents, getOccurrenceStock } from "@/lib/data";
import { eventDetailMetadata, eventSchema, eventsBreadcrumbs, breadcrumbSchema } from "@/lib/seo";
import { EventCard } from "@/components/events/EventCard";
import { PurchaseWidget } from "@/components/events/PurchaseWidget";
import { JsonLd } from "@/components/seo/JsonLd";
import { CampamentoDetail } from "./CampamentoDetail";
import { PageViewTracker } from "@/components/tracking/PageViewTracker";
import type { Metadata } from "next";
import type { EventOccurrence } from "@/types";

export const revalidate = 1800;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  return eventDetailMetadata(event);
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(priceMin: number | null, priceMax: number | null, isFree: boolean): string {
  if (isFree) return "Gratis";
  if (priceMin != null && priceMax != null && priceMin !== priceMax) return `$$ {priceMin} – $$ {priceMax}`;
  if (priceMin != null) return `Desde $$ {priceMin}`;
  if (priceMax != null) return `Hasta $$ {priceMax}`;
  return "Consultar precio";
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

const SECTION_LABEL: Record<"actividades" | "colegios" | "campamentos", string> = {
  actividades: "Eventos",
  colegios: "Colegios",
  campamentos: "Campamentos",
};

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const relatedEvents = await getRelatedEvents(event.id, event.event_category_id, 4, event.section);

  const today = new Date().toISOString().split("T")[0];
  const futureOccurrences = (event.occurrences || []).filter((occ) => {
    if (occ.availability === "cancelled") return false;
    const end = occ.date_end || occ.occurrence_date;
    return end >= today;
  });

  let occurrenceStock: Record<string, number> = {};
  const paymentsEnabled = event.use_mollie || event.payment_provider === "stripe";
  if (paymentsEnabled) {
    occurrenceStock = await getOccurrenceStock(event.id);
  }

  const occurrencesForWidget = paymentsEnabled
    ? futureOccurrences.map((occ) => ({
        id: occ.id,
        occurrence_date: occ.occurrence_date,
        date_end: occ.date_end,
        time_start: occ.time_start,
        time_end: occ.time_end,
        location_name: occ.location_name || event.location_name,
        pack_name: occ.pack_name,
        pack_description: occ.pack_description,
        price_override: occ.price_override,
        ticket_quantity: occ.ticket_quantity,
        max_per_purchase: occ.max_per_purchase,
        available:
          occ.ticket_quantity != null ? occ.ticket_quantity - (occurrenceStock[occ.id] || 0) : 999,
      }))
    : [];

  const mainTicketUrl = getTicketUrl(event);
  const breadcrumbs = eventsBreadcrumbs(event.title, event.event_category?.name, event.section);
  const schemas = eventSchema(event);

  // Campamentos get the Airbnb-style layout.
  if (event.section === "campamentos") {
    return (
      <CampamentoDetail
        event={event}
        futureOccurrences={futureOccurrences}
        occurrencesForWidget={occurrencesForWidget}
        paymentsEnabled={paymentsEnabled}
        mainTicketUrl={mainTicketUrl}
        relatedEvents={relatedEvents}
        schemas={schemas}
        breadcrumbSchema={breadcrumbSchema(breadcrumbs)}
        breadcrumbs={breadcrumbs}
      />
    );
  }

  // Default layout — actividades & colegios keep the simpler previous design.
  const priceDisplay = formatPrice(event.price_min, event.price_max, event.is_free);
  const ageDisplay =
    event.age_min != null && event.age_max != null
      ? `${event.age_min}–${event.age_max} años`
      : event.age_min != null
        ? `Desde ${event.age_min} años`
        : event.age_max != null
          ? `Hasta ${event.age_max} años`
          : null;

  const sectionLabel = SECTION_LABEL[event.section] || "Eventos";
  const sectionAccent =
    event.section === "colegios"
      ? { text: "text-ocean-700", border: "border-ocean-200", bg: "bg-ocean-50" }
      : { text: "text-brand-700", border: "border-brand-200", bg: "bg-brand-50" };

  return (
    <>
      <JsonLd data={[...schemas, breadcrumbSchema(breadcrumbs)]} />
      <PageViewTracker
        eventId={event.id}
        cityId={event.city_id}
        pagePath={`/ofertas/${event.slug}`}
        pageType="event"
      />

      <div className="bg-warm-50 min-h-screen">
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

        <div className="container-padres pb-8 pt-2">
          {/* Hero image */}
          {event.image_url && (
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden rounded-3xl mb-6">
              <Image
                src={event.image_url}
                alt={event.title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}

          {/* Title */}
          <header className="mb-6">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-warm-900 leading-[1.08] tracking-tight">
              {event.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] text-warm-600">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold ${sectionAccent.bg} ${sectionAccent.text} ${sectionAccent.border}`}
              >
                {sectionLabel}
                {event.event_category?.name ? ` · ${event.event_category.name}` : ""}
              </span>
              {event.location_name && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-warm-400" aria-hidden="true" />
                  {event.location_name}
                </span>
              )}
            </div>
          </header>

          {/* Body two-column */}
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* Left column */}
            <div className="min-w-0 space-y-8">
              {/* Quick facts */}
              <section className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-6 border-b border-warm-200">
                {ageDisplay && (
                  <div className="flex items-center gap-2 text-sm text-warm-700">
                    <Users className="h-4 w-4 text-warm-400" aria-hidden="true" />
                    <span className="font-medium">{ageDisplay}</span>
                  </div>
                )}
                {event.duration_minutes && (
                  <div className="flex items-center gap-2 text-sm text-warm-700">
                    <Timer className="h-4 w-4 text-warm-400" aria-hidden="true" />
                    <span className="font-medium">{event.duration_minutes} min</span>
                  </div>
                )}
                {event.location_name && (
                  <div className="flex items-center gap-2 text-sm text-warm-700">
                    <MapPin className="h-4 w-4 text-warm-400" aria-hidden="true" />
                    <span className="font-medium truncate max-w-[260px]">{event.location_name}</span>
                  </div>
                )}
              </section>

              {/* Description */}
              {(event.description || event.short_description) && (
                <section>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-warm-900 mb-4">
                    Descripción
                  </h2>
                  {event.short_description && (
                    <p className="text-lg text-warm-800 leading-relaxed font-medium mb-3">
                      {event.short_description}
                    </p>
                  )}
                  {event.description && (
                    <div className="text-warm-700 leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </div>
                  )}
                </section>
              )}

              {/* Upcoming dates — external tickets */}
              {!paymentsEnabled && futureOccurrences.length > 0 && (
                <section className="border-t border-warm-200 pt-8">
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-warm-900 mb-5">
                    Próximas fechas
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
                            <p className="font-semibold text-warm-900 capitalize">
                              {formatFullDate(occ.occurrence_date)}
                            </p>
                            {occ.time_start && (
                              <p className="text-sm text-warm-500 flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" /> {occ.time_start}
                                {occ.time_end ? ` – ${occ.time_end}` : ""}
                              </p>
                            )}
                            {occ.location_name && (
                              <p className="text-[12px] text-warm-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" /> {occ.location_name}
                              </p>
                            )}
                          </div>
                          {ticketUrl && (
                            <a
                              href={ticketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-warm-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-warm-700 hover:border-warm-400 transition-colors shrink-0"
                            >
                              <Ticket className="h-3 w-3" /> Comprar
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Map */}
              {event.latitude != null && event.longitude != null && (
                <section className="border-t border-warm-200 pt-8">
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-warm-900 mb-4">
                    Dónde encontrarnos
                  </h2>
                  <p className="text-warm-600 mb-4 flex items-center gap-1.5">
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

            {/* Right sticky booking */}
            <aside className="lg:sticky lg:top-24 self-start">
              {paymentsEnabled && occurrencesForWidget.length > 0 ? (
                <div id="purchase-widget">
                  <PurchaseWidget
                    event={{
                      id: event.id,
                      title: event.title,
                      slug: event.slug,
                      price_min: event.price_min,
                      is_free: event.is_free,
                    }}
                    occurrences={occurrencesForWidget}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-card">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-500">
                    Precio
                  </p>
                  <p className="mt-1 text-3xl font-extrabold text-warm-900 leading-none">{priceDisplay}</p>
                  {mainTicketUrl ? (
                    <a
                      href={mainTicketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white hover:bg-brand-600 transition-all shadow-md shadow-brand-500/20"
                    >
                      Comprar entradas
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <p className="mt-5 text-sm text-warm-500">
                      Consulta directamente con el organizador para reservar.
                    </p>
                  )}
                  <div className="mt-4 pt-4 border-t border-warm-100 flex items-center justify-center gap-1.5 text-xs text-warm-500">
                    <Shield className="h-3.5 w-3.5" />
                    Cancelación flexible · Pago seguro
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Related */}
          {relatedEvents.length > 0 && (
            <section className="mt-16 border-t border-warm-200 pt-10">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-warm-900 mb-6">
                {event.section === "colegios" ? "Otros colegios" : "Otros eventos"}
              </h2>
              <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedEvents.slice(0, 3).map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            </section>
          )}

          {/* Back link */}
          <div className="mt-12 text-center">
            <Link
              href={`/ofertas/${event.section}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-500 hover:text-brand-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Volver a {sectionLabel.toLowerCase()}
            </Link>
          </div>
        </div>

        {/* Mobile sticky CTA */}
        {(paymentsEnabled || mainTicketUrl) && (
          <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-warm-200 p-3 lg:hidden safe-area-bottom">
            <a
              href={paymentsEnabled ? "#purchase-widget" : (mainTicketUrl || "#")}
              target={!paymentsEnabled && mainTicketUrl ? "_blank" : undefined}
              rel={!paymentsEnabled && mainTicketUrl ? "noopener noreferrer" : undefined}
              className="flex items-center justify-between gap-3 rounded-xl bg-brand-500 px-5 py-3 shadow-lg"
            >
              <div className="text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Precio</p>
                <p className="text-base font-extrabold text-white leading-none mt-0.5">{priceDisplay}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
                {paymentsEnabled ? "Reservar" : "Comprar"}
                <ChevronRight className="h-4 w-4" />
              </span>
            </a>
          </div>
        )}
      </div>
    </>
  );
}
