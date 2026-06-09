import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { getUsernameFromToken, logActivity } from "@/lib/activityLog";

const citySlug = process.env.NEXT_PUBLIC_CITY_SLUG || "madrid";

/** GET: Fetch events with filters + pagination */
export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const url = new URL(req.url);

    const search = url.searchParams.get("search") || "";
    const categoryId = url.searchParams.get("category") || "";
    const status = url.searchParams.get("status") || "";
    const source = url.searchParams.get("source") || "";
    const sectionParam = url.searchParams.get("section") || "";
    const section = ["actividades", "colegios", "campamentos"].includes(sectionParam)
        ? sectionParam
        : null;
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "25");

    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

    if (!city) return NextResponse.json({ error: "City not found" }, { status: 404 });

    let query = supabase
        .from("events")
        .select("*, event_category:event_categories(id,name,slug), occurrences:event_occurrences(id,occurrence_date,time_start)", { count: "exact" })
        .eq("city_id", city.id);

    if (status) query = query.eq("status", status);
    if (categoryId) query = query.eq("event_category_id", categoryId);
    if (source) query = query.eq("source", source);
    if (section) query = query.eq("section", section);
    if (search) query = query.ilike("title", `%${search}%`);

    query = query.order("created_at", { ascending: false });
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, count, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch event categories for filter dropdown (filtered by section if present)
    let categoriesQuery = supabase
        .from("event_categories")
        .select("id, name, slug, section")
        .eq("is_active", true);
    if (section) categoriesQuery = categoriesQuery.eq("section", section);
    const { data: eventCategories } = await categoriesQuery.order("sort_order");

    // Fetch listings for dropdown (name + slug only)
    const { data: listings } = await supabase
        .from("listings")
        .select("id, name, slug")
        .eq("city_id", city.id)
        .eq("is_active", true)
        .order("name")
        .limit(500);

    return NextResponse.json({
        events: data || [],
        total: count || 0,
        page,
        limit,
        eventCategories: eventCategories || [],
        listings: listings || [],
    });
}

/** POST: Create a new event */
export async function POST(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const body = await req.json();

    const title = (body.title || "").trim();
    if (!title) {
        return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

    if (!city) return NextResponse.json({ error: "City not found" }, { status: 404 });

    // Generate slug
    const baseSlug = title
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("city_id", city.id)
        .eq("slug", baseSlug)
        .single();

    const slug = existing ? `${baseSlug}-${Date.now().toString(36).slice(-4)}` : baseSlug;

    const event = {
        city_id: city.id,
        title,
        slug,
        description: body.description || null,
        short_description: body.short_description || null,
        image_url: body.image_url || null,
        gallery_urls: body.gallery_urls || null,
        event_category_id: body.event_category_id || null,
        listing_id: body.listing_id || null,
        price_min: body.price_min || null,
        price_max: body.price_max || null,
        is_free: body.is_free ?? false,
        age_min: body.age_min || null,
        age_max: body.age_max || null,
        duration_minutes: body.duration_minutes || null,
        location_name: body.location_name || null,
        street_address: body.street_address || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        external_url: body.external_url || null,
        affiliate_params: body.affiliate_params || null,
        source: body.source || "manual",
        source_id: body.source_id || null,
        source_url: body.source_url || null,
        status: body.status || "pending",
        is_featured: body.is_featured ?? false,
        is_promoted: body.is_promoted ?? false,
        payment_provider: "stripe",
        section: ["actividades", "colegios", "campamentos"].includes(body.section)
            ? body.section
            : "actividades",
        discount_percent:
            body.discount_percent != null && body.discount_percent !== ""
                ? Math.max(0, Math.min(80, Number(body.discount_percent)))
                : null,
        discount_label: body.discount_label || null,
        deposit_percent:
            body.deposit_percent != null && body.deposit_percent !== ""
                ? Math.max(5, Math.min(95, Number(body.deposit_percent)))
                : null,
        organizer_name: body.organizer_name || null,
        organizer_logo_url: body.organizer_logo_url || null,
        organizer_founded_year:
            body.organizer_founded_year != null && body.organizer_founded_year !== ""
                ? Number(body.organizer_founded_year)
                : null,
        organizer_is_verified: body.organizer_is_verified ?? false,
    };

    const { data, error } = await supabase
        .from("events")
        .insert(event)
        .select()
        .single();

    if (error) {
        console.error("[admin/events POST] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const adminUser = getUsernameFromToken(auth);
    if (adminUser) {
        logActivity(adminUser, {
            action: "event_create",
            entityType: "event",
            entityId: data.id,
            entityName: title,
        });
    }

    revalidatePath("/ofertas");

    return NextResponse.json({ event: data });
}
