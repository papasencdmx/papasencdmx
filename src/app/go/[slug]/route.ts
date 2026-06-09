import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Hash IP using Web Crypto API (works in Edge + Node) */
async function hashIp(ip: string, salt: string): Promise<string> {
    const data = new TextEncoder().encode(ip + salt);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Public redirect route: /go/[slug] — logs click and redirects */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
    const supabase = createServerClient();

    // Find the tracked link
    const { data: link } = await supabase
        .from("tracked_links")
        .select("id, destination_url, is_active")
        .eq("slug", params.slug)
        .single();

    if (!link || !link.is_active) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // Parse request info
    const ua = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = await hashIp(ip, link.id);

    // Detect device type
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
    const isTablet = /tablet|ipad/i.test(ua);
    const deviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

    // Parse UTM params
    const url = new URL(req.url);
    const utmSource = url.searchParams.get("utm_source") || null;
    const utmMedium = url.searchParams.get("utm_medium") || null;
    const utmCampaign = url.searchParams.get("utm_campaign") || null;
    const utmContent = url.searchParams.get("utm_content") || null;

    // Log click — don't await, redirect immediately
    const clickPromise = supabase
        .from("link_clicks")
        .insert({
            link_id: link.id,
            referrer: referrer || null,
            user_agent: ua.slice(0, 500),
            device_type: deviceType,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            utm_content: utmContent,
            ip_hash: ipHash,
        });

    // Increment counters
    const counterPromise = supabase.rpc("increment_link_clicks", {
        link_id: link.id,
        ip_hash_val: ipHash,
    });

    // Wait for both before redirecting (fast — just DB inserts)
    await Promise.allSettled([clickPromise, counterPromise]);

    return NextResponse.redirect(link.destination_url, { status: 302 });
}
