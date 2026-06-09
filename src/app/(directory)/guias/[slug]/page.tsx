import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TrendingUp, MapPin, Sparkles } from "lucide-react";
import { getPageBySlug, getListingsByPage } from "@/lib/data";
import { getCityConfig } from "@/config/city";
import { FilteredListingsGrid } from "@/components/listings/FilteredListingsGrid";
import { PageViewTracker } from "@/components/tracking/PageViewTracker";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 1800;

const cityConfig = getCityConfig();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return {};

  const cfg = getCityConfig();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `https://${cfg.domain}`).replace(/\/$/, "");

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || page.hero_subheadline || undefined,
    alternates: { canonical: `/guias/${page.slug}` },
    openGraph: {
      title: page.meta_title || page.title,
      description: page.meta_description || page.hero_subheadline || undefined,
      url: `${siteUrl}/guias/${page.slug}`,
      siteName: `Papás en ${cfg.cityName}`,
      type: "website",
      locale: "es_ES",
      images: [
        {
          url: `${siteUrl}/api/og?title=${encodeURIComponent(page.hero_headline || page.title)}&subtitle=${encodeURIComponent(page.hero_subheadline || "")}`,
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.meta_title || page.title,
      description: page.meta_description || page.hero_subheadline || undefined,
    },
  };
}

export default async function FilteredPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  const listings = await getListingsByPage(page);
  const featuredIds = new Set(page.featured_listing_ids);
  const featured = listings.filter((l) => featuredIds.has(l.id));
  const organic = listings.filter((l) => !featuredIds.has(l.id));

  const cfg = getCityConfig();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `https://${cfg.domain}`).replace(/\/$/, "");
  const pageUrl = `${siteUrl}/guias/${page.slug}`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.meta_title || page.title,
    description: page.meta_description || page.hero_subheadline || undefined,
    url: pageUrl,
    inLanguage: "es-MX",
    isPartOf: {
      "@type": "WebSite",
      name: `Papás en ${cfg.cityName}`,
      url: siteUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: listings.length,
      itemListElement: listings.slice(0, 30).map((l, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "LocalBusiness",
          name: l.name,
          url: l.booking_url || `${siteUrl}/${l.category?.slug || "listing"}/${l.slug}`,
          image: l.cover_image_url || undefined,
          description: l.short_description || undefined,
          ...(l.zone?.name && {
            address: { "@type": "PostalAddress", addressLocality: l.zone.name, addressRegion: cfg.cityName },
          }),
        },
      })),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: `Papás en ${cfg.cityName}`, item: siteUrl },
      { "@type": "ListItem", position: 2, name: page.title, item: pageUrl },
    ],
  };

  return (
    <>
      <JsonLd data={[collectionSchema, breadcrumbSchema]} />
      <PageViewTracker
        cityId={page.city_id}
        pagePath={`/guias/${page.slug}`}
        pageType="other"
      />

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-ocean-400 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="container-padres relative py-10 sm:py-12 lg:py-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium text-white/90 mb-5">
              <TrendingUp className="h-4 w-4 text-brand-400" aria-hidden="true" />
              {page.page_type === "ofertas"
                ? "Ofertas exclusivas para nuestra comunidad"
                : "Curado por Papás en " + cityConfig.cityName}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white font-extrabold leading-[1.1] tracking-tight">
              {page.hero_headline || page.title}
            </h1>

            {page.hero_subheadline && (
              <p className="mt-4 text-lg text-ocean-200 leading-relaxed max-w-2xl">
                {page.hero_subheadline}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 border border-white/15 text-sm font-semibold text-white/90">
                <Sparkles className="h-4 w-4 text-brand-400" aria-hidden="true" />
                {listings.length}{" "}
                {listings.length === 1 ? "opción disponible" : "opciones disponibles"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 border border-white/15 text-sm font-semibold text-white/90">
                <MapPin className="h-4 w-4 text-brand-400" aria-hidden="true" />
                {cityConfig.cityName} y alrededores
              </span>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-0 inset-x-0 h-6 bg-warm-50 rounded-t-[2rem]"
          aria-hidden="true"
        />
      </div>

      {/* ── Content ── */}
      <div className="container-padres py-8 sm:py-10">
        {listings.length === 0 ? (
          <div className="rounded-3xl border border-warm-200 bg-white px-6 py-16 sm:py-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-copper-50 text-copper-600">
              <Sparkles className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="font-display text-2xl font-extrabold text-warm-900">
              Todavía estamos curando esta selección
            </p>
            <p className="mt-3 text-warm-600 max-w-md mx-auto leading-relaxed">
              Vuelve pronto — los mejores planes para tu familia se están añadiendo aquí
              mientras hablas con nuestro equipo.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
              <Link
                href="/colaborar"
                className="inline-flex items-center justify-center rounded-xl bg-copper-600 px-5 py-3 text-sm font-bold text-white hover:bg-copper-700 transition"
              >
                ¿Organizas una actividad? Únete gratis →
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-warm-200 bg-white px-5 py-3 text-sm font-semibold text-warm-700 hover:bg-warm-50 transition"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        ) : (
          <FilteredListingsGrid
            listings={organic}
            featured={featured}
            filterConfig={page.filter_config}
          />
        )}

        {/* Footer CTA — partner acquisition */}
        {listings.length > 0 && (
          <div className="mt-12 rounded-3xl bg-gradient-to-r from-ocean-900 to-ocean-800 px-6 py-8 sm:px-10 sm:py-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-display text-xl font-extrabold text-white">
                ¿Organizas un campamento o actividad?
              </p>
              <p className="text-ocean-200 mt-1 text-sm">
                Únete gratis a Papás en {cityConfig.cityName} y llega a miles de
                familias.
              </p>
            </div>
            <Link
              href="/colaborar"
              className="shrink-0 inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600 transition"
            >
              Enviar mi propuesta →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
