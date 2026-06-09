import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { getUsernameFromToken, logActivity } from "@/lib/activityLog";

// Human-readable labels for field names
const FIELD_LABELS: Record<string, string> = {
    name: "Nombre",
    slug: "URL slug",
    description: "Descripcion",
    short_description: "Descripcion corta",
    phone: "Telefono",
    email: "Email",
    website: "Web",
    whatsapp: "WhatsApp",
    street_address: "Direccion",
    postal_code: "Codigo postal",
    latitude: "Latitud",
    longitude: "Longitud",
    age_min: "Edad minima",
    age_max: "Edad maxima",
    price_min: "Precio minimo",
    price_max: "Precio maximo",
    price_range: "Rango de precios",
    languages: "Idiomas",
    schedule: "Horario",
    tier: "Plan",
    is_active: "Estado activo",
    is_verified: "Verificado",
    is_featured: "Destacado",
    logo_url: "Logo",
    cover_image_url: "Imagen de portada",
    gallery_urls: "Galeria",
    zone_id: "Zona",
    category_id: "Categoria",
    meta_title: "Meta titulo",
    meta_description: "Meta descripcion",
    recommendation_reason: "Razon de recomendacion",
    google_rating: "Rating Google",
    google_review_count: "Reviews Google",
    google_place_id: "Google Place ID",
    active_expires_at: "Expiracion activo",
    verified_expires_at: "Expiracion verificado",
    featured_expires_at: "Expiracion destacado",
    section_content: "Contenido por secciones",
    social_links: "Redes sociales",
    founded_date: "Fecha fundacion",
    is_claimed: "Reclamado",
};

function summarizeValue(val: unknown): string {
    if (val === null || val === undefined) return "vacio";
    if (typeof val === "boolean") return val ? "si" : "no";
    if (typeof val === "string") {
        if (val.length > 50) return val.slice(0, 50) + "...";
        return val || "vacio";
    }
    if (Array.isArray(val)) return `${val.length} items`;
    return String(val);
}

/** PATCH: Update a listing by ID */
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const supabase = createServerClient();
    const body = await req.json();

    // Only allow updating these fields
    const allowedFields = [
        "name", "slug", "description", "short_description", "phone", "email", "website",
        "whatsapp", "street_address", "postal_code", "latitude", "longitude",
        "age_min", "age_max", "price_min", "price_max",
        "price_range", "languages", "schedule", "tier", "is_active", "is_verified",
        "is_featured", "logo_url", "cover_image_url", "gallery_urls",
        "zone_id", "category_id",
        "meta_title", "meta_description", "recommendation_reason",
        "google_rating", "google_review_count", "google_place_id",
        "active_expires_at", "verified_expires_at", "featured_expires_at",
        "section_content", "social_links", "founded_date", "is_claimed",
        "google_photos_enabled",
        "discount_percent", "discount_label",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
        if (key in body) {
            let val = body[key];
            if (val === "" && !["name", "tier"].includes(key)) {
                val = null;
            }
            updates[key] = val;
        }
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Fetch current values BEFORE updating to detect real changes
    const { data: current } = await supabase
        .from("listings")
        .select(Object.keys(updates).join(", ") + ", name")
        .eq("id", id)
        .single() as { data: Record<string, unknown> | null };

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from("listings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("[admin/listings PATCH] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Compare old vs new — only log fields that actually changed
    const adminUser = getUsernameFromToken(auth);
    if (adminUser && current) {
        const changes: Array<{ field: string; label: string; from: string; to: string }> = [];

        for (const key of Object.keys(updates)) {
            if (key === "updated_at") continue;
            const oldVal = current[key];
            const newVal = updates[key];
            // Deep compare for arrays/objects
            const oldStr = JSON.stringify(oldVal ?? null);
            const newStr = JSON.stringify(newVal ?? null);
            if (oldStr !== newStr) {
                changes.push({
                    field: key,
                    label: FIELD_LABELS[key] || key,
                    from: summarizeValue(oldVal),
                    to: summarizeValue(newVal),
                });
            }
        }

        if (changes.length > 0) {
            logActivity(adminUser, {
                action: "listing_update",
                entityType: "listing",
                entityId: id,
                entityName: data?.name || current.name || id,
                details: { changes },
            });
        }
    }

    // Purge cached pages so changes show instantly
    try {
        const slug = data?.slug || current?.slug;
        const catData = data?.category_id ? await supabase.from("categories").select("slug").eq("id", data.category_id).single() : null;
        const catSlug = catData?.data?.slug;
        if (catSlug) {
            revalidatePath(`/${catSlug}`); // category listing page
            if (slug) revalidatePath(`/${catSlug}/${slug}`); // detail page
        }
    } catch { /* ignore revalidation errors */ }

    return NextResponse.json({ listing: data });
}

/** DELETE: Remove a listing by ID */
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();

    // Fetch name before deleting for the log
    const { data: listing } = await supabase
        .from("listings")
        .select("name")
        .eq("id", id)
        .single();

    const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("[admin/listings DELETE] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const adminUser = getUsernameFromToken(auth);
    if (adminUser) {
        logActivity(adminUser, {
            action: "listing_delete",
            entityType: "listing",
            entityId: id,
            entityName: listing?.name || id,
        });
    }

    return NextResponse.json({ success: true });
}
