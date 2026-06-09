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

    if (!from || !to) return NextResponse.json({ error: "Missing params" }, { status: 400 });

    const supabase = createServerClient();

    const { data: city } = await supabase
        .from("cities").select("id").eq("slug", citySlug).single();
    if (!city) return NextResponse.json({ error: "City not found" }, { status: 404 });

    // Build date range
    const dayMap = new Map<string, { views: number; website: number; whatsapp: number; phone: number; directions: number; email: number; leads: number }>();
    const current = new Date(from);
    const end = new Date(to);
    while (current <= end) {
        dayMap.set(current.toISOString().slice(0, 10), { views: 0, website: 0, whatsapp: 0, phone: 0, directions: 0, email: 0, leads: 0 });
        current.setDate(current.getDate() + 1);
    }

    // Queries scoped by listing or global
    const viewQuery = supabase.from("page_views").select("created_at").eq("city_id", city.id).gte("created_at", from).lte("created_at", to);
    const clickQuery = supabase.from("click_events").select("created_at, event_type").eq("city_id", city.id).gte("created_at", from).lte("created_at", to);
    const leadQuery = supabase.from("leads").select("created_at").eq("city_id", city.id).gte("created_at", from).lte("created_at", to);

    if (listingId) {
        viewQuery.eq("listing_id", listingId);
        clickQuery.eq("listing_id", listingId);
        leadQuery.eq("listing_id", listingId);
    }

    const [views, clicks, leads] = await Promise.all([viewQuery, clickQuery, leadQuery]);

    for (const row of views.data || []) {
        const key = row.created_at.slice(0, 10);
        const e = dayMap.get(key);
        if (e) e.views++;
    }

    const eventToField: Record<string, keyof typeof dayMap extends never ? never : string> = {
        website_click: "website",
        whatsapp_click: "whatsapp",
        phone_reveal: "phone",
        directions_click: "directions",
        email_reveal: "email",
    };

    for (const row of clicks.data || []) {
        const key = row.created_at.slice(0, 10);
        const e = dayMap.get(key);
        if (!e) continue;
        const field = eventToField[row.event_type];
        if (field) (e as any)[field]++;
    }

    for (const row of leads.data || []) {
        const key = row.created_at.slice(0, 10);
        const e = dayMap.get(key);
        if (e) e.leads++;
    }

    // Build CSV
    const headers = ["Fecha", "Visitas", "Clics Web", "Clics WhatsApp", "Clics Teléfono", "Clics Dirección", "Clics Email", "Leads"];
    const rows = Array.from(dayMap.entries()).map(([date, d]) =>
        [date, d.views, d.website, d.whatsapp, d.phone, d.directions, d.email, d.leads].join(",")
    );

    // Totals row
    const totals = Array.from(dayMap.values()).reduce(
        (acc, d) => {
            acc.views += d.views; acc.website += d.website; acc.whatsapp += d.whatsapp;
            acc.phone += d.phone; acc.directions += d.directions; acc.email += d.email; acc.leads += d.leads;
            return acc;
        },
        { views: 0, website: 0, whatsapp: 0, phone: 0, directions: 0, email: 0, leads: 0 }
    );
    rows.push(["TOTAL", totals.views, totals.website, totals.whatsapp, totals.phone, totals.directions, totals.email, totals.leads].join(","));

    const csv = [headers.join(","), ...rows].join("\n");

    const filename = listingId
        ? `analytics-listing-${from}-${to}.csv`
        : `analytics-global-${from}-${to}.csv`;

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
