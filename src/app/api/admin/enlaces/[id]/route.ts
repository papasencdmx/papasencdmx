import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/** PATCH: Update a tracked link. DELETE: Remove a tracked link. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const body = await req.json();

    // Reset stats: delete all clicks and zero counters
    if (body.reset_stats) {
        await supabase.from("link_clicks").delete().eq("link_id", params.id);
        const { data, error } = await supabase
            .from("tracked_links")
            .update({ total_clicks: 0, unique_clicks: 0 })
            .eq("id", params.id)
            .select()
            .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ link: data });
    }

    const allowedFields = ["slug", "destination_url", "label", "listing_id", "campaign", "is_active", "utm_source", "utm_medium", "utm_campaign", "utm_content"];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
        if (key in body) {
            const val = body[key];
            updates[key] = val === "" ? null : val;
        }
    }

    if (updates.slug) {
        updates.slug = (updates.slug as string).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    }

    const { data, error } = await supabase
        .from("tracked_links")
        .update(updates)
        .eq("id", params.id)
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "Este slug ya existe" }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ link: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const { error } = await supabase
        .from("tracked_links")
        .delete()
        .eq("id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
