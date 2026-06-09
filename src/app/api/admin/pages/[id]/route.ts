import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("id", id)
        .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ page: data });
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json();

    const allowed = [
        "title",
        "slug",
        "page_type",
        "hero_headline",
        "hero_subheadline",
        "meta_title",
        "meta_description",
        "filter_config",
        "featured_listing_ids",
        "status",
    ];
    const updates: Record<string, unknown> = {};
    for (const k of allowed) if (k in body) updates[k] = body[k];
    updates.updated_at = new Date().toISOString();

    const supabase = createServerClient();
    const { data, error } = await supabase
        .from("pages")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ page: data });
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();
    const { error } = await supabase.from("pages").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
