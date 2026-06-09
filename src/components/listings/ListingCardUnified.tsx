import Link from "next/link";
import Image from "next/image";
import { MapPin, Sun } from "lucide-react";
import type { Listing } from "@/types";
import { ListingCardActions } from "./ListingCardActions";
import { getCityConfig } from "@/config/city";
import { getListingImage } from "@/lib/listingImage";

/**
 * Universal listing card used by /p/[slug] filtered pages.
 * Single component, two variants:
 *   - default
 *   - featured (copper left border + elevated shadow)
 *
 * Existing cards (ListingCard, EventCard, CampamentoCard) remain untouched.
 * This card is additive — only used by the new pages system.
 */

export interface ListingCardUnifiedProps {
  listing: Listing;
  variant?: "default" | "featured";
  /** Override CTA href. Defaults to internal listing detail page. */
  ctaHref?: string;
  /** Override CTA label. Defaults to "Ver más". */
  ctaLabel?: string;
}

function formatAgeRange(listing: Listing): string | null {
  if (listing.age_min != null && listing.age_max != null) {
    return `${listing.age_min}–${listing.age_max} años`;
  }
  if (listing.age_min != null) return `Desde ${listing.age_min} años`;
  if (listing.age_max != null) return `Hasta ${listing.age_max} años`;
  return null;
}

function formatPrice(listing: Listing): {
  display: string | null;
  original: number | null;
  final: number | null;
  discountPct: number | null;
  savings: number | null;
} {
  const min = listing.price_min;
  const max = listing.price_max;
  const dPct = listing.discount_percent;
  const hasDiscount = !!dPct && dPct > 0 && dPct <= 80 && min != null;

  if (hasDiscount) {
    const final = Math.round(min * (1 - dPct / 100));
    return {
      display: `$$ {final}`,
      original: min,
      final,
      discountPct: dPct,
      savings: Math.round(min - final),
    };
  }

  if (min != null && max != null && min !== max) {
    return {
      display: `$$ {min} – $$ {max}`,
      original: null,
      final: null,
      discountPct: null,
      savings: null,
    };
  }
  if (min != null) {
    return {
      display: `$$ {min}`,
      original: null,
      final: null,
      discountPct: null,
      savings: null,
    };
  }
  if (max != null) {
    return {
      display: `$$ {max}`,
      original: null,
      final: null,
      discountPct: null,
      savings: null,
    };
  }
  return { display: null, original: null, final: null, discountPct: null, savings: null };
}

export function ListingCardUnified({
  listing,
  variant = "default",
  ctaHref,
  ctaLabel,
}: ListingCardUnifiedProps) {
  const isFeatured = variant === "featured";
  const ageRange = formatAgeRange(listing);
  const price = formatPrice(listing);
  const location =
    listing.zone?.name ||
    (listing.street_address ? listing.street_address.split(",")[0] : null) ||
    "Ciudad de México";

  const href =
    ctaHref ||
    listing.booking_url ||
    `/${listing.category?.slug || "listing"}/${listing.slug}`;
  const label = ctaLabel || "Ver más";
  const isExternal = !!listing.booking_url && !ctaHref;
  const image = getListingImage(listing);

  const cfg = getCityConfig();
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || `https://${cfg.domain}`
  ).replace(/\/$/, "");
  const shareUrl =
    href.startsWith("http")
      ? href
      : `${siteUrl}${href.startsWith("/") ? href : `/${href}`}`;
  const whatsappMessage = `Mira esto en Papás en ${cfg.cityName}: ${listing.name}`;

  return (
    <article
      className={`group rounded-3xl bg-white p-2.5 transition-all duration-300 hover:shadow-lg hover:shadow-warm-900/5 ${
        isFeatured
          ? "border-l-[3px] border-l-copper-500 border border-warm-200 shadow-card"
          : "border border-warm-200 hover:border-warm-300"
      }`}
    >
      <Link
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-500 focus-visible:ring-offset-2 rounded-2xl"
      >
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-warm-100">
          {image ? (
            <Image
              src={image}
              alt={listing.name}
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

          {/* Top-left: discount badge (red, prominent) */}
          {price.discountPct != null && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center rounded-md bg-copper-600 px-2.5 py-1 text-[12px] font-extrabold text-white shadow-md">
                −{price.discountPct}%
              </span>
            </div>
          )}

          {/* Top-right: age range */}
          {ageRange && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-warm-800 shadow-sm border border-warm-100">
                {ageRange}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-2 pt-3.5 pb-2">
          {/* Title */}
          <h3 className="font-display text-[18px] font-bold text-ocean-900 leading-snug line-clamp-2">
            {listing.name}
          </h3>

          {/* Location */}
          <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-warm-600">
            <MapPin className="h-[14px] w-[14px] text-warm-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </div>

          {/* Tag pills (activity types via listing_tags join, if present) */}
          {listing.tags && listing.tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {listing.tags.slice(0, 3).map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center rounded-full bg-warm-100 px-2 py-0.5 text-[11px] font-semibold text-warm-700"
                >
                  {t.tag_value}
                </span>
              ))}
            </div>
          )}

          {/* Price block */}
          <div className="mt-3">
            {price.display === null ? (
              <span className="text-[13px] font-semibold text-copper-700">
                Consultar precio
              </span>
            ) : price.discountPct != null && price.original != null && price.final != null ? (
              <div className="flex flex-col">
                <span className="text-[11px] text-warm-400 line-through tabular-nums">
                  $ {price.original}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[20px] font-extrabold text-ocean-900 tabular-nums leading-none">
                    $ {price.final}
                  </span>
                </div>
                {price.savings != null && (
                  <span className="mt-1 text-[12px] font-semibold text-emerald-700">
                    Ahorras $ {price.savings} con Papás en CDMX
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[16px] font-bold text-ocean-900 tabular-nums">
                {price.display}
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="mt-3.5 rounded-lg bg-copper-600 px-4 py-2.5 text-center text-[14px] font-bold text-white transition-colors group-hover:bg-copper-700">
            {label}
          </div>
        </div>
      </Link>

      {/* Save + share — outside the Link so clicks don't navigate */}
      <div className="mt-2 flex items-center justify-between px-2">
        <ListingCardActions
          listingId={listing.id}
          title={listing.name}
          shareUrl={shareUrl}
          whatsappMessage={whatsappMessage}
        />
      </div>
    </article>
  );
}

export function ListingCardUnifiedSkeleton() {
  return (
    <div className="rounded-3xl bg-white border border-warm-200 p-2.5">
      <div className="skeleton aspect-[16/9] rounded-2xl" />
      <div className="px-2 pt-3.5 pb-2 space-y-2">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-6 w-1/3 mt-2" />
        <div className="skeleton h-10 w-full mt-2 rounded-lg" />
      </div>
    </div>
  );
}
