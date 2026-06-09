import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/** GET: List all tracked links. POST: Create a new tracked link. */
export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const url = new URL(req.url);
    const campaign = url.searchParams.get("campaign") || "";
    const search = url.searchParams.get("search") || "";

    let query = supabase
        .from("tracked_links")
        .select("*, listing:listings(id, name, slug)")
        .order("created_at", { ascending: false });

    if (campaign) query = query.eq("campaign", campaign);
    if (search) query = query.or(`label.ilike.%${search}%,slug.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ links: data || [] });
}

export async function POST(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const body = await req.json();

    if (!body.slug || !body.destination_url || !body.label) {
        return NextResponse.json({ error: "slug, destination_url, and label are required" }, { status: 400 });
    }

    // Sanitize slug
    const slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

    const { data, error } = await supabase
        .from("tracked_links")
        .insert({
            slug,
            destination_url: body.destination_url,
            label: body.label,
            listing_id: body.listing_id && body.listing_id !== "" ? body.listing_id : null,
            campaign: body.campaign || null,
            utm_source: body.utm_source || null,
            utm_medium: body.utm_medium || null,
            utm_campaign: body.utm_campaign || null,
            utm_content: body.utm_content || null,
            is_active: body.is_active ?? true,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "Este slug ya existe" }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ link: data }, { status: 201 });
}
