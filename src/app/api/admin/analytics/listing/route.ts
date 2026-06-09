import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const citySlug = process.env.NEXT_PUBLIC_CITY_SLUG || "madrid";

export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!listingId || !from || !to)
        return NextResponse.json({ error: "Missing params" }, { status: 400 });

    const supabase = createServerClient();

    const { data: city } = await supabase
        .from("cities").select("id").eq("slug", citySlug).single();
    if (!city) return NextResponse.json({ error: "City not found" }, { status: 404 });

    // Listing info
    const { data: listing } = await supabase
        .from("listings")
        .select("id, name, slug, category:categories(name, slug)")
        .eq("id", listingId)
        .single();

    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    // Counts
    const [viewsRes, clicksRes, leadsRes] = await Promise.all([
        supabase.from("page_views")
            .select("id", { count: "exact", head: true })
            .eq("listing_id", listingId)
            .gte("created_at", from).lte("created_at", to),
        supabase.from("click_events")
            .select("id", { count: "exact", head: true })
            .eq("listing_id", listingId)
            .gte("created_at", from).lte("created_at", to),
        supabase.from("leads")
            .select("id", { count: "exact", head: true })
            .eq("listing_id", listingId)
            .gte("created_at", from).lte("created_at", to),
    ]);

    const totalViews = viewsRes.count || 0;
    const totalClicks = clicksRes.count || 0;
    const totalLeads = leadsRes.count || 0;

    // Time series
    const [viewDates, clickDates] = await Promise.all([
        supabase.from("page_views")
            .select("created_at")
            .eq("listing_id", listingId)
            .gte("created_at", from).lte("created_at", to),
        supabase.from("click_events")
            .select("created_at")
            .eq("listing_id", listingId)
            .gte("created_at", from).lte("created_at", to),
    ]);

    const dayMap = new Map<string, { views: number; clicks: number }>();
    const current = new Date(from);
    const end = new Date(to);
    while (current <= end) {
        dayMap.set(current.toISOString().slice(0, 10), { views: 0, clicks: 0 });
        current.setDate(current.getDate() + 1);
    }
    for (const row of viewDates.data || []) {
        const key = row.created_at.slice(0, 10);
        const e = dayMap.get(key);
        if (e) e.views++;
    }
    for (const row of clickDates.data || []) {
        const key = row.created_at.slice(0, 10);
        const e = dayMap.get(key);
        if (e) e.clicks++;
    }
    const timeSeries = Array.from(dayMap.entries()).map(([date, data]) => ({ date, ...data }));

    // Click breakdown
    const { data: clickEvents } = await supabase
        .from("click_events")
        .select("event_type")
        .eq("listing_id", listingId)
        .gte("created_at", from).lte("created_at", to);

    const breakdownMap = new Map<string, number>();
    for (const row of clickEvents || []) {
        breakdownMap.set(row.event_type, (breakdownMap.get(row.event_type) || 0) + 1);
    }
    const clickBreakdown = Array.from(breakdownMap.entries())
        .map(([event_type, count]) => ({ event_type, count }))
        .sort((a, b) => b.count - a.count);

    // Recent leads
    const { data: recentLeads } = await supabase
        .from("leads")
        .select("id, parent_name, email, phone, message, created_at, status")
        .eq("listing_id", listingId)
        .gte("created_at", from).lte("created_at", to)
        .order("created_at", { ascending: false })
        .limit(20);

    // Unique sessions
    const { data: sessions } = await supabase
        .from("page_views")
        .select("session_id")
        .eq("listing_id", listingId)
        .not("session_id", "is", null)
        .gte("created_at", from).lte("created_at", to);

    const uniqueSessions = new Set((sessions || []).map((s: any) => s.session_id)).size;

    return NextResponse.json({
        listing: {
            id: listing.id,
            name: listing.name,
            slug: listing.slug,
            category: (listing as any).category?.name || "",
            category_slug: (listing as any).category?.slug || "",
        },
        overview: {
            totalViews,
            totalClicks,
            totalLeads,
            conversionRate: totalViews > 0 ? Math.round((totalLeads / totalViews) * 10000) / 100 : 0,
            uniqueSessions,
        },
        timeSeries,
        clickBreakdown,
        recentLeads: recentLeads || [],
    });
}
