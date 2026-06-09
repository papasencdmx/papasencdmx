/**
 * Resolve the best image URL for a listing.
 *
 * Priority:
 *   1. listing.cover_image_url (if set)
 *   2. Category-specific fallback image (from CATEGORY_FALLBACKS)
 *   3. null (no image — card hides the photo block)
 *
 * Add more category fallbacks below as we receive them.
 * Files must live in /public.
 */
const CATEGORY_FALLBACKS: Record<string, string> = {
    colegios: "/colegios_no_photos_lis.jpg",
    campamentos: "/campamentos_no_photos_lis.jpg",
    extraescolares: "/extraescolares_no_photos_lis.jpg",
    "ocio-familiar": "/ocio_familiar_no_photos_lis.jpg",
    deportes: "/deportes_no_photos_lis.jpg",
    salud: "/salud_no_photos_lis.jpg",
};

interface ListingShape {
    cover_image_url?: string | null;
    category?: { slug?: string | null } | null;
}

/**
 * URLs pointing to Google's CDN. We treat them as unavailable because the
 * project's Google API is disabled — those URLs return broken images.
 */
function isBrokenUrl(url: string): boolean {
    return (
        url.includes("googleusercontent.com") ||
        url.includes("maps.googleapis.com") ||
        url.includes("places.googleapis.com")
    );
}

export function getListingImage(listing: ListingShape): string | null {
    const raw = listing.cover_image_url;
    if (raw && !isBrokenUrl(raw)) return raw;
    const slug = listing.category?.slug;
    if (slug && CATEGORY_FALLBACKS[slug]) return CATEGORY_FALLBACKS[slug];
    return null;
}

/**
 * True when the resolved image is a fallback (not a real listing photo).
 * Used to skip "grayscale if unverified" effects on placeholder art.
 */
export function isListingImageFallback(
    listing: ListingShape,
    resolvedUrl: string | null
): boolean {
    if (!resolvedUrl) return false;
    if (listing.cover_image_url) return false;
    return Object.values(CATEGORY_FALLBACKS).includes(resolvedUrl);
}
