import Link from "next/link";
import { MapPin, Star, ShieldCheck, Award, Users, Globe, ArrowRight } from "lucide-react";
import type { Listing } from "@/types";
import clsx from "clsx";
import { getListingImage, isListingImageFallback } from "@/lib/listingImage";

interface ListingCardProps {
  listing: Listing;
  categorySlug?: string;
  hidePhoto?: boolean;
}

function getOptimizedUrl(url: string, width: number): string {
  if (url.includes("lh3.googleusercontent.com") || url.includes("googleusercontent.com")) {
    const cleaned = url.replace(/=(?:s|w|h)\d+(?:-[a-z]\d+)*$/i, "");
    return `${cleaned}=w${width}`;
  }
  return url;
}

function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return "Excelente";
  if (rating >= 4.0) return "Muy bueno";
  if (rating >= 3.5) return "Bueno";
  return "";
}

export function ListingCard({ listing, categorySlug, hidePhoto }: ListingCardProps) {
  const catSlug = categorySlug || listing.category?.slug || "listing";
  const href = `/${catSlug}/${listing.slug}`;

  const ageRange =
    listing.age_min != null && listing.age_max != null
      ? `${listing.age_min}–${listing.age_max} anos`
      : listing.age_min != null
        ? `Desde ${listing.age_min} anos`
        : null;

  const resolvedPhoto = hidePhoto ? null : getListingImage(listing);
  const photoUrl = resolvedPhoto;
  const isFallbackPhoto = isListingImageFallback(listing, resolvedPhoto);
  const ratingLabel = listing.google_rating ? getRatingLabel(listing.google_rating) : "";
  const isFeatured = listing.is_featured;
  const isVerified = listing.is_verified;

  return (
    <Link href={href} className="group block">
      <article
        className={clsx(
          "relative overflow-hidden transition-all duration-300 flex flex-col sm:flex-row rounded-2xl",
          isFeatured
            ? "bg-gradient-to-r from-featured-50/80 via-white to-white border-2 border-featured-500/30 shadow-card hover:shadow-card-hover hover:border-featured-500/50"
            : "bg-white border border-warm-200 shadow-card hover:shadow-card-hover hover:border-warm-300"
        )}
      >
        {/* ── Mobile photo ── */}
        {photoUrl && (
          <div className="relative w-full overflow-hidden bg-warm-100 sm:hidden" style={{ paddingBottom: "56.25%" }}>
            <img
              src={getOptimizedUrl(photoUrl, 800)}
              alt={listing.name}
              width={800}
              height={450}
              className={clsx(
                "absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105",
                !isVerified && !isFallbackPhoto && "grayscale opacity-80"
              )}
              loading="lazy"
            />
            {/* Bottom gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
            {/* Badges on photo */}
            {isFeatured && (
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide shadow-lg"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "white" }}>
                  <Award className="h-3 w-3" /> Destacado
                </span>
              </div>
            )}
            {isVerified && (
              <div className="absolute bottom-2.5 left-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/95 backdrop-blur-sm text-verified-700 shadow-sm">
                  <ShieldCheck className="h-3 w-3 text-verified-500" /> Verificado
                </span>
              </div>
            )}
            {/* Rating pill on photo */}
            {listing.google_rating && (
              <div className="absolute bottom-2.5 right-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-warm-900/80 backdrop-blur-sm text-white shadow-sm">
                  <Star className="h-3 w-3 text-featured-400 fill-featured-400" />
                  {listing.google_rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Content ── */}
        <div className="flex-1 p-4 sm:py-4 sm:px-5 min-w-0 flex flex-col">
          {/* Top: Featured + Rating row */}
          <div className="flex items-center flex-wrap gap-2 mb-1">
            {isFeatured && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm"
                style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", color: "#92400E", border: "1px solid #FCD34D" }}>
                <Award className="h-2.5 w-2.5" /> Destacado
              </span>
            )}
            {listing.google_rating && (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold bg-featured-50 text-featured-700">
                  <Star className="h-3 w-3 text-featured-500 fill-featured-500" />
                  {listing.google_rating.toFixed(1)}
                </span>
                {ratingLabel && (
                  <span className="text-xs font-semibold text-warm-600">{ratingLabel}</span>
                )}
                {listing.google_review_count != null && listing.google_review_count > 0 && (
                  <span className="text-[11px] text-warm-400">· {listing.google_review_count} resenas</span>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="font-display text-[17px] sm:text-lg font-bold text-warm-900 group-hover:text-brand-600 transition-colors line-clamp-1 flex items-center gap-1.5">
            {listing.name}
            {isVerified && (
              <ShieldCheck className="hidden sm:block h-[18px] w-[18px] text-verified-500 shrink-0" />
            )}
          </h3>

          {/* Location */}
          {listing.zone && (
            <div className="mt-0.5 flex items-center gap-1 text-[13px] text-warm-500">
              <MapPin className="h-3 w-3 text-brand-400 shrink-0" />
              <span>{listing.zone.name}</span>
              {listing.subcategory && (
                <>
                  <span className="text-warm-300 mx-0.5">·</span>
                  <span className="text-warm-400">{listing.subcategory.name}</span>
                </>
              )}
            </div>
          )}

          {/* Description */}
          {(listing.short_description || listing.description) && (
            <p className="mt-2 text-[13px] text-warm-500 line-clamp-2 leading-relaxed">
              {listing.short_description || listing.description}
            </p>
          )}

          {/* Bottom: Tags + CTA */}
          <div className="mt-auto pt-3 flex items-end justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {ageRange && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium bg-ocean-50 text-ocean-700 border border-ocean-100/80">
                  <Users className="h-2.5 w-2.5 text-ocean-500" />
                  {ageRange}
                </span>
              )}
              {listing.price_range && (
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-verified-50 text-verified-700 border border-verified-100/80">
                  {listing.price_range}
                </span>
              )}
              {listing.languages && listing.languages.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium bg-brand-50 text-brand-700 border border-brand-100/80">
                  <Globe className="h-2.5 w-2.5 text-brand-500" />
                  {listing.languages
                    .map((lang) =>
                      lang === "es" ? "ES" : lang === "en" ? "EN" : lang === "fr" ? "FR" : lang.toUpperCase()
                    )
                    .join(" · ")}
                </span>
              )}
            </div>

            {/* CTA */}
            <span className="hidden sm:inline-flex items-center gap-1 shrink-0 text-[12px] font-semibold text-brand-500 group-hover:text-brand-600 transition-all group-hover:gap-1.5">
              Ver detalles
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>

        {/* ── Desktop photo ── */}
        {photoUrl && (
          <div className="hidden sm:block w-[200px] lg:w-[240px] shrink-0 overflow-hidden relative bg-warm-100">
            <img
              src={getOptimizedUrl(photoUrl, 480)}
              alt={listing.name}
              className={clsx(
                "h-full w-full object-cover transition-all duration-500 group-hover:scale-105",
                !isVerified && !isFallbackPhoto && "grayscale opacity-80"
              )}
              loading="lazy"
            />
            {/* Dark gradient from bottom */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
            {/* Verified badge on photo */}
            {isVerified && (
              <div className="absolute bottom-2.5 left-2.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/95 backdrop-blur-sm text-verified-700 shadow-sm">
                  <ShieldCheck className="h-3 w-3 text-verified-500" /> Verificado
                </span>
              </div>
            )}
            {/* Featured badge on photo — desktop */}
            {isFeatured && (
              <div className="absolute top-2.5 right-2.5">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-md"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "white" }}>
                  <Award className="h-2.5 w-2.5" /> Top
                </span>
              </div>
            )}
          </div>
        )}
      </article>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-card overflow-hidden flex flex-col sm:flex-row">
      <div className="skeleton relative w-full sm:hidden" style={{ paddingBottom: "56.25%" }} />
      <div className="flex-1 p-4 sm:p-5 space-y-3">
        <div className="flex gap-2">
          <div className="skeleton h-5 w-12 rounded-md" />
          <div className="skeleton h-5 w-20 rounded-md" />
        </div>
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="flex gap-2 mt-2">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-6 w-12 rounded-full" />
        </div>
      </div>
      <div className="hidden sm:block w-[200px] lg:w-[240px] shrink-0">
        <div className="skeleton h-full w-full" />
      </div>
    </div>
  );
}
