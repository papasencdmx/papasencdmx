import Papa from "papaparse";

/** Generate URL-friendly slug from text */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

/** Parse CSV file to typed rows */
export function parseCSVFile<T>(file: File): Promise<T[]> {
    return new Promise((resolve, reject) => {
        Papa.parse<T>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error),
        });
    });
}

/** Title case for Spanish names */
export function toTitleCase(text: string): string {
    const small = ["de", "del", "la", "las", "los", "el", "y", "en"];
    return text
        .toLowerCase()
        .split(" ")
        .map((w, i) =>
            i === 0 || !small.includes(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
        )
        .join(" ");
}

/** Clean and validate website URL */
export function cleanWebsite(url: string | undefined | null): string | null {
    if (!url || url.trim() === "") return null;
    let cleaned = url.trim();
    if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
        cleaned = `https://${cleaned}`;
    }
    return cleaned;
}

/** Format Mexican phone number */
export function formatPhone(phone: string | undefined | null): string | null {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length !== 10) return phone;
    return `+52 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
}

/** Parse tier string from CSV (e.g. "Tier 1 — Premium") to DB enum */
function parseTier(raw: string | undefined | null): string {
    if (!raw) return "standard";
    const lower = raw.toLowerCase().trim();
    if (["free", "standard", "presencia_anual", "presencia_total"].includes(lower)) return lower;
    return "standard";
}

/** CSV column → listing field mapping */
export interface CSVColumnMapping {
    [csvHeader: string]: string; // csvHeader → listing field name
}

/**
 * Map a raw CSV row to a listing insert payload.
 * Accepts any shape of row and maps known fields.
 * Supports both legacy format and Google Maps export format.
 */
export function mapCSVRowToListing(
    row: Record<string, string>,
    cityId: string,
    categoryId: string,
    zoneMap: Map<string, string>,
    subcategoryId?: string,
    subcategoryMap?: Map<string, string>
): Record<string, unknown> {
    const name = row.business_name || row.name || row.nombre || row.centro_nombre || "";
    const slug = row.slug || generateSlug(name);

    // Zone lookup: by slug, or by name (normalized)
    const zoneSlug = row.zone_slug || row.zona || "";
    const zoneName = row.zone || row.zone_name || "";
    let zoneId = zoneMap.get(zoneSlug) || null;
    if (!zoneId && zoneName) {
        // Try lookup by name (case-insensitive)
        zoneMap.forEach((val, key) => {
            if (!zoneId && key.toLowerCase() === zoneName.toLowerCase()) {
                zoneId = val;
            }
        });
    }

    // Collect gallery photos from photo_2..photo_5
    const galleryUrls: string[] = [];
    for (let i = 2; i <= 5; i++) {
        const url = row[`photo_${i}`];
        if (url && url.trim()) galleryUrls.push(url.trim());
    }

    // Build section_content with Google Maps extras
    const sectionContent: Record<string, unknown> = {};
    if (row.payment_options) sectionContent.payment_options = row.payment_options;
    if (row.parking) sectionContent.parking = row.parking;
    if (row.accessibility) sectionContent.accessibility = row.accessibility;

    // Collect Google reviews
    const googleReviews: Array<Record<string, string>> = [];
    for (let i = 1; i <= 3; i++) {
        const author = row[`review_${i}_author`];
        const text = row[`review_${i}_text`];
        const rating = row[`review_${i}_rating`];
        if (author || text) {
            googleReviews.push({
                author: author || "",
                text: text || "",
                rating: rating || "",
            });
        }
    }
    if (googleReviews.length > 0) sectionContent.google_reviews = googleReviews;

    // Hidden fields (populated later by field-select step)
    // sectionContent.hidden_fields will be set by the import page

    // Resolve subcategory: dropdown selection → CSV column → null
    let resolvedSubcategoryId: string | null = subcategoryId || null;
    if (!resolvedSubcategoryId && subcategoryMap) {
        const csvSubcategory = row.subcategory_id || row.subcategory || row.subcategoria || "";
        if (csvSubcategory) {
            // Normalize: lowercase + strip accents for matching
            const normalized = csvSubcategory.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            resolvedSubcategoryId = subcategoryMap.get(normalized) || null;
        }
    }

    const coverImage = row.photo_1 || row.cover_image_url || null;
    const existingGallery = row.gallery_urls ? row.gallery_urls.split(",").map((u: string) => u.trim()).filter(Boolean) : [];
    const allGallery = [...existingGallery, ...galleryUrls];

    return {
        name: toTitleCase(name),
        slug,
        city_id: cityId,
        category_id: categoryId,
        subcategory_id: resolvedSubcategoryId,
        zone_id: zoneId,
        description: row.description || row.descripcion || null,
        short_description: row.short_description || null,
        phone: formatPhone(row.international_phone || row.phone || row.telefono),
        email: row.emails_found || row.email || null,
        website: cleanWebsite(row.website || row.web),
        whatsapp: row.whatsapp || null,
        street_address: row.address || row.street_address || row.direccion || null,
        postal_code: row.postal_code || row.codigo_postal || null,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        age_min: row.age_min ? parseInt(row.age_min) : null,
        age_max: row.age_max ? parseInt(row.age_max) : null,
        price_range: row.price_range || null,
        languages: row.languages ? row.languages.split(",").map((l: string) => l.trim()) : [],
        schedule: row.opening_hours || row.schedule || row.horario || null,
        logo_url: row.logo_url || null,
        cover_image_url: coverImage,
        gallery_urls: allGallery.length > 0 ? allGallery : null,
        google_rating: row.rating ? parseFloat(row.rating) : (row.google_rating ? parseFloat(row.google_rating) : null),
        google_review_count: row.review_count ? parseInt(row.review_count) : (row.google_review_count ? parseInt(row.google_review_count) : null),
        google_place_id: row.place_id || row.google_place_id || null,
        is_verified: row.is_verified === "true" || row.is_verified === "1",
        is_featured: row.is_featured === "true" || row.is_featured === "1",
        is_active: row.is_active !== "false" && row.is_active !== "0",
        tier: parseTier(row.tier),
        section_content: Object.keys(sectionContent).length > 0 ? sectionContent : null,
    };
}

/** Get all detected CSV column names */
export function getCSVColumns(rows: Record<string, string>[]): string[] {
    if (rows.length === 0) return [];
    return Object.keys(rows[0]);
}

/** Default field mapping: CSV column → DB field label */
export const CSV_FIELD_MAP: Record<string, string> = {
    business_name: "name",
    name: "name",
    nombre: "name",
    address: "street_address",
    street_address: "street_address",
    direccion: "street_address",
    international_phone: "phone",
    phone: "phone",
    telefono: "phone",
    emails_found: "email",
    email: "email",
    website: "website",
    web: "website",
    rating: "google_rating",
    google_rating: "google_rating",
    review_count: "google_review_count",
    google_review_count: "google_review_count",
    opening_hours: "schedule",
    schedule: "schedule",
    horario: "schedule",
    latitude: "latitude",
    longitude: "longitude",
    photo_1: "cover_image_url",
    cover_image_url: "cover_image_url",
    photo_2: "gallery_urls",
    photo_3: "gallery_urls",
    photo_4: "gallery_urls",
    photo_5: "gallery_urls",
    place_id: "google_place_id",
    google_place_id: "google_place_id",
    tier: "tier",
    zone: "zone_id",
    zone_slug: "zone_id",
    zona: "zone_id",
    subcategory_id: "subcategory_id",
    subcategory: "subcategory_id",
    subcategoria: "subcategory_id",
    payment_options: "payment_options (JSON)",
    parking: "parking (JSON)",
    accessibility: "accessibility (JSON)",
    description: "description",
    descripcion: "description",
    whatsapp: "whatsapp",
    logo_url: "logo_url",
    postal_code: "postal_code",
};

/** Core fields that should be visible by default */
export const CORE_VISIBLE_FIELDS = new Set([
    "name", "street_address", "phone", "email", "website",
    "schedule", "latitude", "longitude", "google_rating",
    "google_review_count", "cover_image_url", "tier", "zone_id",
    "description", "google_place_id",
]);
