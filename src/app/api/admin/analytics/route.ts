import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const citySlug = process.env.NEXT_PUBLIC_CITY_SLUG || "madrid";

export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) return NextResponse.json({ error: "Missing from/to params" }, { status: 400 });

    const supabase = createServerClient();

    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

    if (!city) return NextResponse.json({ error: "City not found" }, { status: 404 });

    // Overview totals for current period
    const [viewsRes, clicksRes, leadsRes] = await Promise.all([
        supabase
            .from("page_views")
            .select("id", { count: "exact", head: true })
            .eq("city_id", city.id)
            .gte("created_at", from)
            .lte("created_at", to),
        supabase
            .from("click_events")
            .select("id", { count: "exact", head: true })
            .eq("city_id", city.id)
            .gte("created_at", from)
            .lte("created_at", to),
        supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("city_id", city.id)
            .gte("created_at", from)
            .lte("created_at", to),
    ]);

    const totalViews = viewsRes.count || 0;
    const totalClicks = clicksRes.count || 0;
    const totalLeads = leadsRes.count || 0;
    const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;

    // Previous period for comparison
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const periodMs = toDate.getTime() - fromDate.getTime();
    const prevFrom = new Date(fromDate.getTime() - periodMs).toISOString();
    const prevTo = from;

    const [prevViewsRes, prevClicksRes, prevLeadsRes] = await Promise.all([
        supabase
            .from("page_views")
            .select("id", { count: "exact", head: true })
            .eq("city_id", city.id)
            .gte("created_at", prevFrom)
            .lt("created_at", prevTo),
        supabase
            .from("click_events")
            .select("id", { count: "exact", head: true })
            .eq("city_id", city.id)
            .gte("created_at", prevFrom)
            .lt("created_at", prevTo),
        supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("city_id", city.id)
            .gte("created_at", prevFrom)
            .lt("created_at", prevTo),
    ]);

    // Time series: fetch timestamps and bucket by day in JS
    const [viewDates, clickDates, leadDates] = await Promise.all([
        supabase
            .from("page_views")
            .select("created_at")
            .eq("city_id", city.id)
            .gte("created_at", from)
            .lte("created_at", to)
            .order("created_at"),
        supabase
            .from("click_events")
            .select("created_at")
            .eq("city_id", city.id)
            .gte("created_at", from)
            .lte("created_at", to)
            .order("created_at"),
        supabase
            .from("leads")
            .select("created_at")
            .eq("city_id", city.id)
            .gte("created_at", from)
            .lte("created_at", to)
            .order("created_at"),
    ]);

    // Generate day buckets
    const dayMap = new Map<string, { views: number; clicks: number; leads: number }>();
    const current = new Date(from);
    const end = new Date(to);
    while (current <= end) {
        const key = current.toISOString().slice(0, 10);
        dayMap.set(key, { views: 0, clicks: 0, leads: 0 });
        current.setDate(current.getDate() + 1);
    }

    for (const row of viewDates.data || []) {
        const key = row.created_at.slice(0, 10);
        const entry = dayMap.get(key);
        if (entry) entry.views++;
    }
    for (const row of clickDates.data || []) {
        const key = row.created_at.slice(0, 10);
        const entry = dayMap.get(key);
        if (entry) entry.clicks++;
    }
    for (const row of leadDates.data || []) {
        const key = row.created_at.slice(0, 10);
        const entry = dayMap.get(key);
        if (entry) entry.leads++;
    }

    const timeSeries = Array.from(dayMap.entries()).map(([date, data]) => ({
        date,
        ...data,
    }));

    // Click breakdown by event_type
    const { data: clickEvents } = await supabase
        .from("click_events")
        .select("event_type")
        .eq("city_id", city.id)
        .gte("created_at", from)
        .lte("created_at", to);

    const breakdownMap = new Map<string, number>();
    for (const row of clickEvents || []) {
        breakdownMap.set(row.event_type, (breakdownMap.get(row.event_type) || 0) + 1);
    }
    const clickBreakdown = Array.from(breakdownMap.entries())
        .map(([event_type, count]) => ({ event_type, count }))
        .sort((a, b) => b.count - a.count);

    // Top listings by views+clicks
    const [viewsByListing, clicksByListing] = await Promise.all([
        supabase
            .from("page_views")
            .select("listing_id")
            .eq("city_id", city.id)
            .not("listing_id", "is", null)
            .gte("created_at", from)
            .lte("created_at", to),
        supabase
            .from("click_events")
            .select("listing_id")
            .eq("city_id", city.id)
            .gte("created_at", from)
            .lte("created_at", to),
    ]);

    const listingScores = new Map<string, { views: number; clicks: number }>();
    for (const row of viewsByListing.data || []) {
        if (!row.listing_id) continue;
        const e = listingScores.get(row.listing_id) || { views: 0, clicks: 0 };
        e.views++;
        listingScores.set(row.listing_id, e);
    }
    for (const row of clicksByListing.data || []) {
        if (!row.listing_id) continue;
        const e = listingScores.get(row.listing_id) || { views: 0, clicks: 0 };
        e.clicks++;
        listingScores.set(row.listing_id, e);
    }

    // Get listing names for top 20
    const topIds = Array.from(listingScores.entries())
        .sort((a, b) => (b[1].views + b[1].clicks) - (a[1].views + a[1].clicks))
        .slice(0, 20)
        .map(([id]) => id);

    let topListings: Array<{ id: string; name: string; slug: string; category_slug: string; views: number; clicks: number }> = [];
    if (topIds.length > 0) {
        const { data: listings } = await supabase
            .from("listings")
            .select("id, name, slug, category:categories(slug)")
            .in("id", topIds);

        topListings = (listings || []).map((l: any) => {
            const scores = listingScores.get(l.id) || { views: 0, clicks: 0 };
            return {
                id: l.id,
                name: l.name,
                slug: l.slug,
                category_slug: l.category?.slug || "",
                views: scores.views,
                clicks: scores.clicks,
            };
        }).sort((a, b) => (b.views + b.clicks) - (a.views + a.clicks));
    }

    // Unique sessions
    const { data: sessions } = await supabase
        .from("page_views")
        .select("session_id")
        .eq("city_id", city.id)
        .not("session_id", "is", null)
        .gte("created_at", from)
        .lte("created_at", to);

    const uniqueSessions = new Set((sessions || []).map((s: any) => s.session_id)).size;

    return NextResponse.json({
        overview: {
            totalViews,
            totalClicks,
            totalLeads,
            conversionRate: Math.round(conversionRate * 100) / 100,
            uniqueSessions,
        },
        previous: {
            views: prevViewsRes.count || 0,
            clicks: prevClicksRes.count || 0,
            leads: prevLeadsRes.count || 0,
        },
        timeSeries,
        topListings,
        clickBreakdown,
    });
}
