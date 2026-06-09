import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const citySlug = process.env.NEXT_PUBLIC_CITY_SLUG || "madrid";

export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .maybeSingle();
    if (!city?.id) return NextResponse.json({ pages: [] });

    const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("city_id", city.id)
        .order("updated_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ pages: data || [] });
}

export async function POST(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const supabase = createServerClient();
    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .maybeSingle();
    if (!city?.id) return NextResponse.json({ error: "City not found" }, { status: 500 });

    const insert = {
        city_id: city.id,
        title: (body.title || "").trim(),
        slug: (body.slug || "").trim().toLowerCase(),
        page_type: body.page_type || "guide",
        hero_headline: body.hero_headline || null,
        hero_subheadline: body.hero_subheadline || null,
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
        filter_config: body.filter_config || {},
        featured_listing_ids: Array.isArray(body.featured_listing_ids)
            ? body.featured_listing_ids
            : [],
        status: body.status || "draft",
    };

    if (!insert.title || !insert.slug) {
        return NextResponse.json({ error: "Title and slug required" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("pages")
        .insert(insert)
        .select("*")
        .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ page: data });
}
