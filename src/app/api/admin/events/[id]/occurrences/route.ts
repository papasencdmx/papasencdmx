import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { getUsernameFromToken, logActivity } from "@/lib/activityLog";

/** GET: List occurrences for an event */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from("event_occurrences")
        .select("*")
        .eq("event_id", id)
        .order("occurrence_date")
        .order("time_start");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ occurrences: data || [] });
}

/** POST: Create one or more occurrences */
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();
    const body = await req.json();

    // Support single or bulk creation
    const occurrences: Array<Record<string, unknown>> = Array.isArray(body) ? body : [body];

    const rows = occurrences.map((occ) => ({
        event_id: id,
        occurrence_date: occ.occurrence_date,
        date_end: occ.date_end || null,
        time_start: occ.time_start || null,
        time_end: occ.time_end || null,
        location_name: occ.location_name || null,
        street_address: occ.street_address || null,
        latitude: occ.latitude || null,
        longitude: occ.longitude || null,
        ticket_url: occ.ticket_url || null,
        availability: occ.availability || "available",
        notes: occ.notes || null,
        pack_name: occ.pack_name || null,
        pack_description: occ.pack_description || null,
        price_override:
            occ.price_override != null && occ.price_override !== ""
                ? Number(occ.price_override)
                : null,
        ticket_quantity: occ.ticket_quantity != null ? Number(occ.ticket_quantity) : null,
        max_per_purchase: occ.max_per_purchase != null ? Number(occ.max_per_purchase) : 5,
        is_visible: occ.is_visible !== false,
    }));

    const { data, error } = await supabase
        .from("event_occurrences")
        .insert(rows)
        .select();

    if (error) {
        console.error("[admin/events/occurrences POST] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const adminUser = getUsernameFromToken(auth);
    if (adminUser) {
        // Get event title for log
        const { data: event } = await supabase
            .from("events")
            .select("title")
            .eq("id", id)
            .single();

        logActivity(adminUser, {
            action: "occurrence_create",
            entityType: "occurrence",
            entityId: id,
            entityName: event?.title || id,
            details: { count: rows.length },
        });
    }

    revalidatePath("/ofertas");

    return NextResponse.json({ occurrences: data || [] });
}

/** PATCH: Update a single occurrence by ID */
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();
    const body = await req.json() as { occId: string } & Record<string, unknown>;

    const { occId, ...fields } = body;
    if (!occId) {
        return NextResponse.json({ error: "Missing occId" }, { status: 400 });
    }

    // Whitelist of fields clients may update. Anything else is dropped.
    const allowed: Record<string, unknown> = {};
    const whitelist = [
        "occurrence_date", "date_end",
        "time_start", "time_end",
        "location_name", "street_address", "latitude", "longitude",
        "ticket_url", "availability", "notes",
        "pack_name", "pack_description", "price_override",
        "ticket_quantity", "max_per_purchase", "is_visible",
    ];
    for (const key of whitelist) {
        if (!(key in fields)) continue;
        const v = fields[key];
        if (key === "price_override") {
            allowed[key] = v != null && v !== "" ? Number(v) : null;
        } else if (key === "ticket_quantity" || key === "max_per_purchase") {
            allowed[key] = v != null && v !== "" ? Number(v) : null;
        } else if (v === "") {
            allowed[key] = null;
        } else {
            allowed[key] = v;
        }
    }

    const { data, error } = await supabase
        .from("event_occurrences")
        .update(allowed)
        .eq("id", occId)
        .eq("event_id", id)
        .select()
        .single();

    if (error) {
        console.error("[admin/events/occurrences PATCH] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const adminUser = getUsernameFromToken(auth);
    if (adminUser) {
        const { data: event } = await supabase
            .from("events")
            .select("title")
            .eq("id", id)
            .single();

        logActivity(adminUser, {
            action: "occurrence_update",
            entityType: "occurrence",
            entityId: id,
            entityName: event?.title || id,
            details: { occId, fields: Object.keys(allowed) },
        });
    }

    revalidatePath("/ofertas");

    return NextResponse.json({ occurrence: data });
}

/** DELETE: Remove occurrences by IDs */
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const supabase = createServerClient();
    const { ids } = await req.json() as { ids: string[] };

    if (!ids?.length) {
        return NextResponse.json({ error: "Missing occurrence IDs" }, { status: 400 });
    }

    const { error } = await supabase
        .from("event_occurrences")
        .delete()
        .in("id", ids)
        .eq("event_id", id);

    if (error) {
        console.error("[admin/events/occurrences DELETE] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const adminUser = getUsernameFromToken(auth);
    if (adminUser) {
        const { data: event } = await supabase
            .from("events")
            .select("title")
            .eq("id", id)
            .single();

        logActivity(adminUser, {
            action: "occurrence_delete",
            entityType: "occurrence",
            entityId: id,
            entityName: event?.title || id,
            details: { count: ids.length },
        });
    }

    revalidatePath("/ofertas");

    return NextResponse.json({ success: true, deleted: ids.length });
}
