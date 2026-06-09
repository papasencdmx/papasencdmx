import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const citySlug = process.env.NEXT_PUBLIC_CITY_SLUG || "madrid";

/** Dashboard stats: real counts from Supabase */
export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    // Get city ID
    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

    if (!city) return NextResponse.json({ error: "City not found" }, { status: 404 });

    // Fetch all counts in parallel
    const [listingsRes, leadsRes, reviewsRes, clicksRes, categoriesRes] = await Promise.all([
        supabase
            .from("listings")
            .select("id", { count: "exact", head: true })
            .eq("city_id", city.id)
            .eq("is_active", true),
        supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("city_id", city.id),
        supabase
            .from("reviews")
            .select("id", { count: "exact", head: true }),
        supabase
            .from("click_events")
            .select("id", { count: "exact", head: true })
            .eq("city_id", city.id),
        supabase
            .from("categories")
            .select("id, name, slug")
            .eq("is_active", true)
            .order("sort_order"),
    ]);

    // Recent leads (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentLeads } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("city_id", city.id)
        .gte("created_at", sevenDaysAgo);

    // Recent clicks (last 7 days)
    const { count: recentClicks } = await supabase
        .from("click_events")
        .select("id", { count: "exact", head: true })
        .eq("city_id", city.id)
        .gte("created_at", sevenDaysAgo);

    // Listings by category
    const listingsByCat: Array<{ category: string; count: number }> = [];
    if (categoriesRes.data) {
        for (const cat of categoriesRes.data) {
            const { count } = await supabase
                .from("listings")
                .select("id", { count: "exact", head: true })
                .eq("city_id", city.id)
                .eq("category_id", cat.id)
                .eq("is_active", true);
            listingsByCat.push({ category: cat.name, count: count || 0 });
        }
    }

    // Recent activity: last 5 listings created
    const { data: recentListings } = await supabase
        .from("listings")
        .select("name, slug, created_at, category_id")
        .eq("city_id", city.id)
        .order("created_at", { ascending: false })
        .limit(5);

    // Recent admin activity logs
    const { data: activityLogs } = await supabase
        .from("admin_activity_log")
        .select("*")
        .not("action", "in", "(password_change,import_csv)")
        .order("created_at", { ascending: false })
        .limit(8);

    // Incomplete listings (missing description or phone)
    const { count: incomplete } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("city_id", city.id)
        .eq("is_active", true)
        .or("description.is.null,phone.is.null");

    // Map category IDs to names for recent listings
    const catMap = new Map<string, string>();
    if (categoriesRes.data) {
        categoriesRes.data.forEach((c) => catMap.set(c.id, c.name));
    }

    const recentActivity = (recentListings || []).map((l) => ({
        name: l.name,
        slug: l.slug,
        category: catMap.get(l.category_id) || "—",
        createdAt: l.created_at,
    }));

    return NextResponse.json({
        listings: listingsRes.count || 0,
        leads: leadsRes.count || 0,
        reviews: reviewsRes.count || 0,
        clicks: clicksRes.count || 0,
        recentLeads: recentLeads || 0,
        recentClicks: recentClicks || 0,
        listingsByCategory: listingsByCat,
        recentActivity,
        activityLogs: activityLogs || [],
        incomplete: incomplete || 0,
    });
}
