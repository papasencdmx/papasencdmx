import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUsernameFromToken, logActivity } from "@/lib/activityLog";

/** GET: Fetch all sections for a listing */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from("listing_sections")
        .select("*")
        .eq("listing_id", id)
        .order("sort_order");

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sections: data || [] });
}

/** POST: Create a new section */
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();
    const body = await req.json();

    const title = (body.title || "").trim();
    if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Generate slug from title
    const slug = title
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Get next sort_order
    const { data: existing } = await supabase
        .from("listing_sections")
        .select("sort_order")
        .eq("listing_id", id)
        .order("sort_order", { ascending: false })
        .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

    const { data, error } = await supabase
        .from("listing_sections")
        .insert({
            listing_id: id,
            title,
            slug,
            content: body.content || "",
            icon: body.icon || "FileText",
            sort_order: nextOrder,
            is_active: true,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const adminUser = getUsernameFromToken(auth);
    if (adminUser) {
        const { data: listing } = await supabase.from("listings").select("name").eq("id", id).single();
        logActivity(adminUser, {
            action: "section_create",
            entityType: "listing",
            entityId: id,
            entityName: listing?.name || id,
            details: { sectionTitle: title },
        });
    }

    return NextResponse.json({ section: data });
}

/** PATCH: Update sections (bulk update for reorder, content changes) */
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();
    const body = await req.json();

    // Single section update
    if (body.sectionId) {
        const updates: Record<string, unknown> = {};
        if (body.title !== undefined) updates.title = body.title;
        if (body.content !== undefined) updates.content = body.content;
        if (body.icon !== undefined) updates.icon = body.icon;
        if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
        if (body.is_active !== undefined) updates.is_active = body.is_active;
        if (body.title !== undefined) {
            updates.slug = body.title
                .toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
        }
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from("listing_sections")
            .update(updates)
            .eq("id", body.sectionId)
            .eq("listing_id", id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ section: data });
    }

    // Bulk reorder
    if (body.order && Array.isArray(body.order)) {
        for (let i = 0; i < body.order.length; i++) {
            await supabase
                .from("listing_sections")
                .update({ sort_order: i, updated_at: new Date().toISOString() })
                .eq("id", body.order[i])
                .eq("listing_id", id);
        }
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

/** DELETE: Remove a section */
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get("sectionId");

    if (!sectionId) {
        return NextResponse.json({ error: "sectionId required" }, { status: 400 });
    }

    // Get section title before deleting
    const { data: section } = await supabase
        .from("listing_sections")
        .select("title")
        .eq("id", sectionId)
        .single();

    const { error } = await supabase
        .from("listing_sections")
        .delete()
        .eq("id", sectionId)
        .eq("listing_id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const adminUser = getUsernameFromToken(auth);
    if (adminUser) {
        const { data: listing } = await supabase.from("listings").select("name").eq("id", id).single();
        logActivity(adminUser, {
            action: "section_delete",
            entityType: "listing",
            entityId: id,
            entityName: listing?.name || id,
            details: { sectionTitle: section?.title || sectionId },
        });
    }

    return NextResponse.json({ success: true });
}
