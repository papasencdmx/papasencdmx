import { MetadataRoute } from "next";
import { getCategories, getZones, getAllListingSlugs, getCategoryZonePairs, getCategorySubcategoryPairs, getAllEventSlugs } from "@/lib/data";

const domain = process.env.NEXT_PUBLIC_SITE_DOMAIN || "papasencdmx.com";
const baseUrl = `https://${domain}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, zones, listings, categoryZonePairs, categorySubcategoryPairs, eventSlugs] = await Promise.all([
    getCategories(),
    getZones(),
    getAllListingSlugs(),
    getCategoryZonePairs(),
    getCategorySubcategoryPairs(),
    getAllEventSlugs(),
  ]);

  const routes: MetadataRoute.Sitemap = [
    // Homepage
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },

    // Static pages
    { url: `${baseUrl}/ofertas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/ofertas/actividades`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/ofertas/colegios`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75 },
    { url: `${baseUrl}/ofertas/campamentos`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75 },
    { url: `${baseUrl}/zonas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/quienes-somos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/contacto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/anunciate`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },

    // Category hubs
    ...categories.map((cat) => ({
      url: `${baseUrl}/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),

    // Category × Zone pages (MONEY PAGES)
    ...categoryZonePairs.map((pair) => ({
      url: `${baseUrl}/${pair.categorySlug}/${pair.zoneSlug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),

    // Category × Subcategory pages
    ...categorySubcategoryPairs.map((pair) => ({
      url: `${baseUrl}/${pair.categorySlug}/tipo/${pair.subcategorySlug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),

    // Zone hubs
    ...zones.map((zone) => ({
      url: `${baseUrl}/zonas/${zone.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),

    // Individual listings
    ...listings.map((listing) => ({
      url: `${baseUrl}/${listing.categorySlug}/${listing.listingSlug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),

    // Individual event pages
    ...eventSlugs.map(({ slug }) => ({
      url: `${baseUrl}/ofertas/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  return routes;
}
