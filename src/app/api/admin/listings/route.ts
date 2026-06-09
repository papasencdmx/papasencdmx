import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { getUsernameFromToken, logActivity } from "@/lib/activityLog";

const citySlug = process.env.NEXT_PUBLIC_CITY_SLUG || "madrid";

/** GET: Fetch listings with filters. POST: Not used here. */
export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const url = new URL(req.url);

    const search = url.searchParams.get("search") || "";
    const categoryId = url.searchParams.get("category") || "";
    const zoneId = url.searchParams.get("zone") || "";
    const phone = url.searchParams.get("phone") || "";
    const activeOnly = url.searchParams.get("active") !== "false";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const sortBy = url.searchParams.get("sort") || "created_at";
    const sortDir = url.searchParams.get("dir") === "asc" ? true : false;

    // Get city
    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

    if (!city) return NextResponse.json({ error: "City not found" }, { status: 404 });

    // Build query
    let query = supabase
        .from("listings")
        .select("*, category:categories(id,name,slug), zone:zones(id,name,slug)", { count: "exact" })
        .eq("city_id", city.id);

    const idsParam = url.searchParams.get("ids");
    const ids = idsParam
        ? idsParam.split(",").map((s) => s.trim()).filter(Boolean)
        : null;
    const submissionStatus = url.searchParams.get("submission_status");
    const sourceFilter = url.searchParams.get("source");
    // Skip the active-only default if specific IDs are requested (admin needs
    // to see previously-pinned listings even if deactivated).
    if (activeOnly && !ids) query = query.eq("is_active", true);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (zoneId) query = query.eq("zone_id", zoneId);
    if (search) query = query.ilike("name", `%${search}%`);
    if (phone) query = query.ilike("phone", `%${phone}%`);
    if (ids && ids.length > 0) query = query.in("id", ids);
    if (submissionStatus && ["pending", "approved", "rejected"].includes(submissionStatus)) {
        query = query.eq("submission_status", submissionStatus);
    }
    if (sourceFilter && ["manual", "submission"].includes(sourceFilter)) {
        query = query.eq("source", sourceFilter);
    }

    // Sort & paginate
    query = query.order(sortBy, { ascending: sortDir });
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, count, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch categories, zones & subcategories for filter dropdowns
    const [cats, zones, subcats] = await Promise.all([
        supabase.from("categories").select("id, name, slug").eq("is_active", true).order("sort_order"),
        supabase.from("zones").select("id, name, slug").eq("city_id", city.id).eq("is_active", true).order("name"),
        supabase.from("subcategories").select("id, name, slug, category_id").eq("is_active", true).order("sort_order"),
    ]);

    return NextResponse.json({
        listings: data || [],
        total: count || 0,
        page,
        limit,
        categories: cats.data || [],
        zones: zones.data || [],
        subcategories: subcats.data || [],
    });
}

/** POST: Create a new listing */
export async function POST(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const body = await req.json();

    const name = (body.name || "").trim();
    if (!name) {
        return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    if (!body.category_id) {
        return NextResponse.json({ error: "La categoria es obligatoria" }, { status: 400 });
    }

    // Get city
    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

    if (!city) return NextResponse.json({ error: "City not found" }, { status: 404 });

    // Generate slug
    const baseSlug = name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Check slug uniqueness
    const { data: existing } = await supabase
        .from("listings")
        .select("id")
        .eq("city_id", city.id)
        .eq("slug", baseSlug)
        .single();

    const slug = existing ? `${baseSlug}-${Date.now().toString(36).slice(-4)}` : baseSlug;

    const listing = {
        city_id: city.id,
        name,
        slug,
        category_id: body.category_id,
        subcategory_id: body.subcategory_id || null,
        zone_id: body.zone_id || null,
        description: body.description || null,
        short_description: body.short_description || null,
        recommendation_reason: body.recommendation_reason || null,
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        whatsapp: body.whatsapp || null,
        street_address: body.street_address || null,
        postal_code: body.postal_code || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        age_min: body.age_min || null,
        age_max: body.age_max || null,
        price_min: body.price_min || null,
        price_max: body.price_max || null,
        price_range: body.price_range || null,
        languages: body.languages || [],
        schedule: body.schedule || null,
        tier: body.tier || "free",
        is_active: body.is_active ?? true,
        is_verified: body.is_verified ?? false,
        is_featured: body.is_featured ?? false,
        logo_url: body.logo_url || null,
        cover_image_url: body.cover_image_url || null,
        gallery_urls: body.gallery_urls || null,
        google_rating: body.google_rating || null,
        google_review_count: body.google_review_count || null,
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
        section_content: body.section_content || {},
        social_links: body.social_links || {},
        founded_date: body.founded_date || null,
        is_claimed: body.is_claimed ?? false,
        google_photos_enabled: body.google_photos_enabled ?? false,
    };

    const { data, error } = await supabase
        .from("listings")
        .insert(listing)
        .select()
        .single();

    if (error) {
        console.error("[admin/listings POST] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const adminUser = getUsernameFromToken(auth);
    if (adminUser) {
        logActivity(adminUser, {
            action: "listing_create",
            entityType: "listing",
            entityId: data.id,
            entityName: name,
        });
    }

    return NextResponse.json({ listing: data });
}

/** PATCH: Bulk update multiple listings */
export async function PATCH(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ids, updates } = await req.json() as { ids: string[]; updates: Record<string, unknown> };

    if (!ids?.length || !updates || Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "Missing ids or updates" }, { status: 400 });
    }

    // Only allow safe bulk fields
    const allowedBulkFields = ["tier", "is_verified", "is_featured", "is_active"];
    const safeUpdates: Record<string, unknown> = {};
    for (const key of allowedBulkFields) {
        if (key in updates) safeUpdates[key] = updates[key];
    }

    if (Object.keys(safeUpdates).length === 0) {
        return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { error } = await supabase
        .from("listings")
        .update(safeUpdates)
        .in("id", ids);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Revalidate all affected listing pages + their category pages
    try {
        const { data: affected } = await supabase
            .from("listings")
            .select("slug, category:categories(slug)")
            .in("id", ids);
        const revalidatedCats = new Set<string>();
        for (const item of affected || []) {
            const catSlug = (item as any).category?.slug;
            if (catSlug) {
                if (!revalidatedCats.has(catSlug)) {
                    revalidatePath(`/${catSlug}`);
                    revalidatedCats.add(catSlug);
                }
                if (item.slug) revalidatePath(`/${catSlug}/${item.slug}`);
            }
        }
    } catch { /* ignore revalidation errors */ }

    const adminUser = getUsernameFromToken(auth);
    if (adminUser) {
        logActivity(adminUser, {
            action: "listing_update",
            entityType: "listing",
            entityId: ids.length === 1 ? ids[0] : `${ids.length} listings`,
            entityName: `Bulk update (${ids.length})`,
            details: { changes: Object.entries(safeUpdates).map(([k, v]) => ({ field: k, label: k, from: "—", to: String(v) })) },
        });
    }

    return NextResponse.json({ success: true, updated: ids.length });
}
