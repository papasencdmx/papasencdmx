import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { getUsernameFromToken, logActivity } from "@/lib/activityLog";

/** GET: Single event with all occurrences */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from("events")
        .select("*, event_category:event_categories(*), listing:listings(id, name, slug), occurrences:event_occurrences(*)")
        .eq("id", id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });

    // Sort occurrences by date
    if (data.occurrences) {
        data.occurrences.sort((a: { occurrence_date: string }, b: { occurrence_date: string }) =>
            a.occurrence_date.localeCompare(b.occurrence_date)
        );
    }

    return NextResponse.json({ event: data });
}

/** PATCH: Update an event */
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();
    const body = await req.json();

    const allowedFields = [
        "title", "slug", "description", "short_description",
        "image_url", "gallery_urls", "event_category_id", "listing_id",
        "price_min", "price_max", "is_free",
        "age_min", "age_max", "duration_minutes",
        "location_name", "street_address", "latitude", "longitude",
        "external_url", "affiliate_params",
        "source", "source_id", "source_url",
        "status", "is_featured", "is_promoted",
        "use_mollie", "payment_provider", "section",
        "discount_percent", "discount_label", "deposit_percent",
        "organizer_name", "organizer_logo_url",
        "organizer_founded_year", "organizer_is_verified",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
        if (key in body) {
            let val = body[key];
            if (val === "" && !["title", "status", "source"].includes(key)) {
                val = null;
            }
            updates[key] = val;
        }
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Fetch current for change tracking
    const { data: current } = await supabase
        .from("events")
        .select(Object.keys(updates).join(", ") + ", title")
        .eq("id", id)
        .single() as { data: Record<string, unknown> | null };

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("[admin/events PATCH] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const adminUser = getUsernameFromToken(auth);
    if (adminUser && current) {
        const changes: Array<{ field: string; label: string; from: string; to: string }> = [];
        for (const key of Object.keys(updates)) {
            if (key === "updated_at") continue;
            const oldStr = JSON.stringify(current[key] ?? null);
            const newStr = JSON.stringify(updates[key] ?? null);
            if (oldStr !== newStr) {
                changes.push({ field: key, label: key, from: String(current[key] ?? "vacío"), to: String(updates[key] ?? "vacío") });
            }
        }
        if (changes.length > 0) {
            logActivity(adminUser, {
                action: "event_update",
                entityType: "event",
                entityId: id,
                entityName: (data?.title as string) || (current.title as string) || id,
                details: { changes },
            });
        }
    }

    revalidatePath("/ofertas");
    if (data?.slug) revalidatePath(`/ofertas/${data.slug}`);

    return NextResponse.json({ event: data });
}

/** DELETE: Remove an event (cascades to occurrences) */
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();

    const { data: event } = await supabase
        .from("events")
        .select("title, slug")
        .eq("id", id)
        .single();

    const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("[admin/events DELETE] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const adminUser = getUsernameFromToken(auth);
    if (adminUser) {
        logActivity(adminUser, {
            action: "event_delete",
            entityType: "event",
            entityId: id,
            entityName: event?.title || id,
        });
    }

    revalidatePath("/ofertas");
    if (event?.slug) revalidatePath(`/ofertas/${event.slug}`);

    return NextResponse.json({ success: true });
}
