import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/** GET: Click stats for a tracked link, grouped by date */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const url = new URL(req.url);
    const dateFrom = url.searchParams.get("dateFrom") || "";
    const dateTo = url.searchParams.get("dateTo") || "";

    // Fetch clicks with a safe upper limit
    let query = supabase
        .from("link_clicks")
        .select("clicked_at, ip_hash, device_type, referrer")
        .eq("link_id", params.id)
        .order("clicked_at", { ascending: true })
        .limit(10000);

    if (dateFrom) query = query.gte("clicked_at", `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte("clicked_at", `${dateTo}T23:59:59`);

    const { data: clicks, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Single-pass aggregation
    const byDate: Record<string, { total: number; uniqueIps: Set<string> }> = {};
    const deviceCounts: Record<string, number> = {};
    const referrerCounts: Record<string, number> = {};
    const globalUniqueIps = new Set<string>();

    for (const click of clicks || []) {
        const date = click.clicked_at.split("T")[0];

        if (!byDate[date]) byDate[date] = { total: 0, uniqueIps: new Set() };
        byDate[date].total++;
        if (click.ip_hash) {
            byDate[date].uniqueIps.add(click.ip_hash);
            globalUniqueIps.add(click.ip_hash);
        }

        const device = click.device_type || "unknown";
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;

        if (click.referrer) {
            try {
                const refUrl = new URL(click.referrer);
                const host = refUrl.hostname.replace("www.", "");
                // For own domain, show the page path so we know which page sent the click
                const OWN_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || "papasencdmx.com";
                const key = host === OWN_DOMAIN && refUrl.pathname !== "/"
                    ? refUrl.pathname.replace(/^\//, "").replace(/\/$/, "")
                    : host;
                referrerCounts[key] = (referrerCounts[key] || 0) + 1;
            } catch {
                referrerCounts["direct"] = (referrerCounts["direct"] || 0) + 1;
            }
        } else {
            referrerCounts["direct"] = (referrerCounts["direct"] || 0) + 1;
        }
    }

    const daily = Object.entries(byDate)
        .map(([date, data]) => ({
            date,
            total: data.total,
            unique: data.uniqueIps.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    const totalClicks = daily.reduce((s, d) => s + d.total, 0);

    return NextResponse.json({
        daily,
        summary: { total: totalClicks, unique: globalUniqueIps.size },
        devices: Object.entries(deviceCounts)
            .map(([device, count]) => ({ device, count }))
            .sort((a, b) => b.count - a.count),
        referrers: Object.entries(referrerCounts)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
    });
}
