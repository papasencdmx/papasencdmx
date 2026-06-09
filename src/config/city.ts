import type { CityConfig, CategoryConfig } from "@/types";

// ── Shared categories (same across ALL cities) ──
export const CATEGORIES: CategoryConfig[] = [
  {
    slug: "campamentos",
    name: "Campamentos",
    nameLong: "Campamentos de Verano",
    icon: "sun",
  },
  {
    slug: "colegios",
    name: "Colegios",
    nameLong: "Colegios y Centros Educativos",
    icon: "graduation-cap",
  },
  {
    slug: "extraescolares",
    name: "Extraescolares",
    nameLong: "Actividades Extraescolares",
    icon: "palette",
  },
  {
    slug: "ocio-familiar",
    name: "Ocio Familiar",
    nameLong: "Planes y Ocio Familiar",
    icon: "ferris-wheel",
  },
  {
    slug: "deportes",
    name: "Deportes",
    nameLong: "Clubes y Academias Deportivas",
    icon: "trophy",
  },
  {
    slug: "salud",
    name: "Salud",
    nameLong: "Salud Infantil y Familiar",
    icon: "heart-pulse",
  },
];

// ── City config loaded from environment ──
export function getCityConfig(): CityConfig {
  const citySlug = process.env.NEXT_PUBLIC_CITY_SLUG || "cdmx";
  const domain = process.env.NEXT_PUBLIC_SITE_DOMAIN || "papasencdmx.com";
  const newsletterDomain =
    process.env.NEXT_PUBLIC_NEWSLETTER_DOMAIN || "newsletter.papasencdmx.com";

  // City-specific overrides
  const cityMap: Record<string, Partial<CityConfig>> = {
    cdmx: {
      cityName: "Ciudad de México",
      region: "CDMX",
      subscriberCount: 0,
    },
    guadalajara: {
      cityName: "Guadalajara",
      region: "Jalisco",
      subscriberCount: 0,
    },
    monterrey: {
      cityName: "Monterrey",
      region: "Nuevo León",
      subscriberCount: 0,
    },
    puebla: {
      cityName: "Puebla",
      region: "Puebla",
      subscriberCount: 0,
    },
    queretaro: {
      cityName: "Querétaro",
      region: "Querétaro",
      subscriberCount: 0,
    },
    merida: {
      cityName: "Mérida",
      region: "Yucatán",
      subscriberCount: 0,
    },
  };

  const cityOverride = cityMap[citySlug] || cityMap.cdmx;

  const supportPhoneE164 =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE_E164 || "+525555555555";
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hola@papasencdmx.com";
  const supportPhoneDisplay = formatPhoneDisplay(supportPhoneE164);

  return {
    citySlug,
    domain,
    newsletterDomain,
    cityName: cityOverride.cityName || "Ciudad de México",
    region: cityOverride.region || "CDMX",
    subscriberCount: cityOverride.subscriberCount || 0,
    categories: CATEGORIES,
    zones: [], // Loaded from database at runtime
    supportPhoneE164,
    supportPhoneDisplay,
    supportEmail,
  };
}

function formatPhoneDisplay(e164: string): string {
  // Mexico: "+525512345678" → "+52 55 1234 5678"
  const digits = e164.replace(/^\+/, "");
  if (digits.startsWith("52") && digits.length === 12) {
    const rest = digits.slice(2); // 10-digit national number
    return `+52 ${rest.slice(0, 2)} ${rest.slice(2, 6)} ${rest.slice(6)}`;
  }
  return e164;
}

export function buildWhatsAppUrl(message: string, phoneE164?: string): string {
  const phone = (phoneE164 || getCityConfig().supportPhoneE164).replace(/^\+/, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// Helper to get category by slug
export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

// All valid category slugs (for route validation)
export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
