import type { Metadata } from "next";
import type { Listing, Category, Zone, Event as EventType, BreadcrumbItem, JsonLdSchema } from "@/types";
import { getCityConfig } from "@/config/city";

const config = getCityConfig();
const baseUrl = `https://${config.domain}`;

// ── Page Metadata Generators ──

export function homeMetadata(): Metadata {
  const title = `Papás en ${config.cityName} — Directorio Familiar Verificado de ${config.cityName}`;
  const description = `El directorio de confianza para familias en ${config.cityName}. Encuentra campamentos, colegios, extraescolares, ocio y mas. Todo verificado y recomendado por ${config.subscriberCount.toLocaleString("es-MX")} familias.`;

  return buildMetadata({ title, description, path: "/" });
}

export function categoryMetadata(category: { name_long: string; slug: string }, count: number): Metadata {
  const title = `${category.name_long} en ${config.cityName} — Los Mejores ${count}+ Verificados | Papás en ${config.cityName}`;
  const description = `Encuentra los mejores ${category.name_long.toLowerCase()} en ${config.cityName}. ${count}+ opciones verificadas por familias reales. Filtros por zona, edad y precio. Actualizado ${currentMonth()}.`;

  return buildMetadata({ title, description, path: `/${category.slug}` });
}

export function categoryZoneMetadata(
  category: { name_long: string; slug: string },
  zone: { name: string; slug: string },
  count: number
): Metadata {
  const title = `${category.name_long} en ${zone.name}, ${config.cityName} — ${count} Opciones Verificadas | Papás en ${config.cityName}`;
  const description = `Descubre ${count} ${category.name_long.toLowerCase()} en ${zone.name}, ${config.cityName}. Verificados por familias reales. Compara precios, edades y horarios. Actualizado ${currentMonth()}.`;

  return buildMetadata({ title, description, path: `/${category.slug}/${zone.slug}` });
}

export function listingMetadata(listing: Listing, category: Category, zone?: Zone): Metadata {
  const zoneName = zone?.name || config.cityName;
  const title = listing.meta_title || `${listing.name} — ${category.name_long} en ${zoneName}, ${config.cityName} | Papás en ${config.cityName}`;
  const desc = listing.meta_description || listing.short_description || `${listing.name}: ${category.name_long.toLowerCase()} en ${zoneName}. Verificado por Papás en ${config.cityName}. Consulta precios, edades, horarios y opiniones de otras familias.`;

  return buildMetadata({
    title,
    description: desc,
    path: `/${category.slug}/${listing.slug}`,
    image: listing.cover_image_url || undefined,
  });
}

export function subcategoryMetadata(
  category: { name_long: string; slug: string },
  subcategory: { name_long: string; slug: string },
  count: number
): Metadata {
  const title = `${subcategory.name_long} en ${config.cityName} — ${count}+ Opciones Verificadas | Papás en ${config.cityName}`;
  const description = `Encuentra los mejores ${subcategory.name_long.toLowerCase()} en ${config.cityName}. ${count}+ opciones verificadas por familias reales. Actualizado ${currentMonth()}.`;

  return buildMetadata({ title, description, path: `/${category.slug}/tipo/${subcategory.slug}` });
}

export function zoneMetadata(zone: Zone): Metadata {
  const title = `${zone.name} para Familias — Directorio Verificado | Papás en ${config.cityName}`;
  const description = `Todo lo que necesitas para tu familia en ${zone.name}: campamentos, colegios, extraescolares, ocio y mas. Verificado por familias reales de ${config.cityName}.`;

  return buildMetadata({ title, description, path: `/zonas/${zone.slug}` });
}

export function eventosMetadata(): Metadata {
  const title = `Planes Familiares en ${config.cityName} — Eventos, Colegios y Campamentos | Papás en ${config.cityName}`;
  const description = `Encuentra eventos, colegios y campamentos para familias en ${config.cityName}. Todo lo que necesitas para planificar con tus hijos.`;

  return buildMetadata({ title, description, path: "/ofertas" });
}

export function actividadesMetadata(): Metadata {
  const title = `Eventos para Familias en ${config.cityName} — Agenda Actualizada | Papás en ${config.cityName}`;
  const description = `Descubre los mejores eventos para familias y ninos en ${config.cityName}. Talleres, espectaculos, actividades al aire libre y mas. Actualizado ${currentMonth()}.`;

  return buildMetadata({ title, description, path: "/ofertas/actividades" });
}

export function guideMetadata(title: string, slug: string, description: string): Metadata {
  return buildMetadata({
    title: `${title} | Papás en ${config.cityName}`,
    description,
    path: `/guias/${slug}`,
  });
}

// ── JSON-LD Schema Generators ──

export function websiteSchema(): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `Papás en ${config.cityName}`,
    url: baseUrl,
    description: `Directorio familiar verificado de ${config.cityName}`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/buscar?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationSchema(): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: `Papás en ${config.cityName}`,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      `https://www.instagram.com/papasencdmx/`,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["Spanish", "English"],
    },
  };
}

export function localBusinessSchema(listing: Listing, category: Category, zone?: Zone): JsonLdSchema {
  const schema: JsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.name,
    description: listing.description || listing.short_description || "",
    url: `${baseUrl}/${category.slug}/${listing.slug}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.street_address || "",
      addressLocality: config.cityName,
      addressRegion: config.region,
      postalCode: listing.postal_code || "",
      addressCountry: "MX",
    },
    areaServed: {
      "@type": "City",
      name: config.cityName,
    },
  };

  if (listing.latitude && listing.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: listing.latitude,
      longitude: listing.longitude,
    };
  }

  if (listing.phone) schema.telephone = listing.phone;
  if (listing.website) schema.sameAs = [listing.website];
  if (listing.price_range) schema.priceRange = listing.price_range;
  if (listing.cover_image_url) schema.image = listing.cover_image_url;
  if (listing.google_rating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: listing.google_rating,
      reviewCount: listing.google_review_count || 1,
    };
  }

  return schema;
}

export function collectionPageSchema(name: string, path: string, items: Listing[]): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: `${baseUrl}${path}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.slice(0, 20).map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: `${baseUrl}/${item.category?.slug || "listing"}/${item.slug}`,
      })),
    },
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${baseUrl}${item.href}`,
    })),
  };
}

export function eventDetailMetadata(event: EventType): Metadata {
  const title = `${event.title} — Evento para Familias en ${config.cityName} | Papás en ${config.cityName}`;
  const description = event.short_description || event.description?.slice(0, 155) || `${event.title}: evento para familias en ${config.cityName}.`;

  return buildMetadata({
    title,
    description,
    path: `/ofertas/${event.slug}`,
    image: event.image_url || undefined,
  });
}

/** Generate one schema.org/Event per occurrence (or one for the parent if no occurrences) */
export function eventSchema(event: EventType): JsonLdSchema[] {
  const occurrences = event.occurrences || [];

  const AVAILABILITY_MAP: Record<string, string> = {
    available: "https://schema.org/InStock",
    few_left: "https://schema.org/LimitedAvailability",
    sold_out: "https://schema.org/SoldOut",
    cancelled: "https://schema.org/Discontinued",
  };

  function buildLocation(occ?: { location_name?: string | null; street_address?: string | null; latitude?: number | null; longitude?: number | null }) {
    const locName = occ?.location_name || event.location_name;
    if (!locName) return undefined;
    const loc: Record<string, unknown> = {
      "@type": "Place",
      name: locName,
      address: {
        "@type": "PostalAddress",
        addressLocality: config.cityName,
        streetAddress: occ?.street_address || event.street_address || "",
        addressCountry: "MX",
      },
    };
    const lat = occ?.latitude || event.latitude;
    const lng = occ?.longitude || event.longitude;
    if (lat && lng) {
      loc.geo = { "@type": "GeoCoordinates", latitude: lat, longitude: lng };
    }
    return loc;
  }

  function buildOffers(occ?: { ticket_url?: string | null; availability?: string }) {
    const offers: Record<string, unknown> = {
      "@type": "Offer",
      priceCurrency: "MXN",
      url: occ?.ticket_url || event.external_url || `${baseUrl}/ofertas/${event.slug}`,
    };
    if (event.is_free) {
      offers.price = 0;
    } else if (event.price_min != null) {
      offers.price = event.price_min;
      if (event.price_max != null && event.price_max !== event.price_min) {
        offers.highPrice = event.price_max;
      }
    }
    if (occ?.availability) {
      offers.availability = AVAILABILITY_MAP[occ.availability] || AVAILABILITY_MAP.available;
    }
    return offers;
  }

  if (occurrences.length === 0) {
    const schema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.description || "",
      url: `${baseUrl}/ofertas/${event.slug}`,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
    };
    if (event.is_free) schema.isAccessibleForFree = true;
    if (event.image_url) schema.image = event.image_url;
    const loc = buildLocation();
    if (loc) schema.location = loc;
    schema.offers = buildOffers();
    return [schema];
  }

  // One schema per occurrence
  return occurrences.map((occ) => {
    const schema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.description || "",
      startDate: occ.time_start ? `${occ.occurrence_date}T${occ.time_start}` : occ.occurrence_date,
      url: `${baseUrl}/ofertas/${event.slug}`,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: occ.availability === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    };
    if (occ.time_end) {
      schema.endDate = `${occ.occurrence_date}T${occ.time_end}`;
    }
    if (event.is_free) schema.isAccessibleForFree = true;
    if (event.image_url) schema.image = event.image_url;
    const loc = buildLocation(occ);
    if (loc) schema.location = loc;
    schema.offers = buildOffers(occ);
    return schema;
  });
}

// ── Breadcrumb helpers ──

export function homeBreadcrumb(): BreadcrumbItem[] {
  return [{ name: "Inicio", href: "/" }];
}

export function categoryBreadcrumbs(categoryName: string, categorySlug: string): BreadcrumbItem[] {
  return [
    { name: "Inicio", href: "/" },
    { name: config.cityName, href: "/" },
    { name: categoryName, href: `/${categorySlug}` },
  ];
}

export function categoryZoneBreadcrumbs(
  categoryName: string,
  categorySlug: string,
  zoneName: string,
  zoneSlug: string
): BreadcrumbItem[] {
  return [
    { name: "Inicio", href: "/" },
    { name: config.cityName, href: "/" },
    { name: categoryName, href: `/${categorySlug}` },
    { name: zoneName, href: `/${categorySlug}/${zoneSlug}` },
  ];
}

export function subcategoryBreadcrumbs(
  categoryName: string,
  categorySlug: string,
  subcategoryName: string,
  subcategorySlug: string
): BreadcrumbItem[] {
  return [
    { name: "Inicio", href: "/" },
    { name: config.cityName, href: "/" },
    { name: categoryName, href: `/${categorySlug}` },
    { name: subcategoryName, href: `/${categorySlug}/tipo/${subcategorySlug}` },
  ];
}

export function listingBreadcrumbs(
  categoryNameLong: string,
  categorySlug: string,
  listingName: string,
  listingSlug: string,
  zoneName?: string,
  zoneSlug?: string,
  subcategoryName?: string,
  subcategorySlug?: string
): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [
    { name: "Inicio", href: "/" },
    { name: config.cityName, href: "/" },
    { name: categoryNameLong, href: `/${categorySlug}` },
  ];
  if (subcategoryName && subcategorySlug) {
    crumbs.push({ name: subcategoryName, href: `/${categorySlug}/tipo/${subcategorySlug}` });
  }
  if (zoneName && zoneSlug) {
    crumbs.push({ name: zoneName, href: `/${categorySlug}/${zoneSlug}` });
  }
  crumbs.push({ name: listingName, href: `/${categorySlug}/${listingSlug}` });
  return crumbs;
}

export function eventsBreadcrumbs(
  title?: string,
  categoryName?: string,
  section?: "actividades" | "colegios" | "campamentos",
): BreadcrumbItem[] {
  const sectionLabels = {
    actividades: { name: "Eventos", href: "/ofertas/actividades" },
    colegios: { name: "Colegios", href: "/ofertas/colegios" },
    campamentos: { name: "Campamentos", href: "/ofertas/campamentos" },
  };
  const crumbs: BreadcrumbItem[] = [
    { name: "Inicio", href: "/" },
    { name: "Planes familiares", href: "/ofertas" },
  ];
  if (section && sectionLabels[section]) {
    crumbs.push(sectionLabels[section]);
  }
  if (categoryName) {
    crumbs.push({ name: categoryName, href: section ? sectionLabels[section].href : "/ofertas" });
  }
  if (title) {
    crumbs.push({ name: title, href: "#" });
  }
  return crumbs;
}

// ── Helpers ──

function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = `${baseUrl}${opts.path}`;
  const image = opts.image || `${baseUrl}/og-default.png`;

  return {
    title: truncate(opts.title, 65),
    description: truncate(opts.description, 155),
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: `Papás en ${config.cityName}`,
      locale: "es_ES",
      type: "website",
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.substring(0, max - 3) + "...";
}

function currentMonth(): string {
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}
