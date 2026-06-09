import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUsernameFromToken } from "@/lib/activityLog";

/** PATCH: edit submission fields, change tags, and/or change status (approve/reject). */
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json();
    const supabase = createServerClient();
    const username = getUsernameFromToken(auth);

    /* ── 1. Update editable listing fields ────────────────────── */
    const allowed = [
        "name",
        "short_description",
        "description",
        "phone",
        "email",
        "website",
        "street_address",
        "age_min",
        "age_max",
        "price_min",
        "price_max",
        "discount_percent",
        "cover_image_url",
        "booking_url",
        "contact_name",
        "category_id",
        "zone_id",
    ];
    const updates: Record<string, unknown> = {};
    for (const k of allowed) {
        if (k in body) {
            const v = body[k];
            updates[k] = v === "" ? null : v;
        }
    }

    /* ── 2. Tag assignment (replaces page_category tags) ──────── */
    if (Array.isArray(body.page_category_tags)) {
        await supabase
            .from("listing_tags")
            .delete()
            .eq("listing_id", id)
            .eq("tag_type", "page_category");
        if (body.page_category_tags.length > 0) {
            await supabase.from("listing_tags").insert(
                body.page_category_tags.map((t: string) => ({
                    listing_id: id,
                    tag_type: "page_category",
                    tag_value: t,
                }))
            );
        }
    }

    /* ── 3. Approve / reject ─────────────────────────────────── */
    if (body.action === "approve") {
        updates.submission_status = "approved";
        updates.approved_at = new Date().toISOString();
        updates.approved_by = username || "admin";
        updates.is_active = true;
    } else if (body.action === "reject") {
        updates.submission_status = "rejected";
        updates.is_active = false;
    }

    if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        const { error } = await supabase.from("listings").update(updates).eq("id", id);
        if (error) {
            console.error("[admin/submissions] update error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    /* ── 4. Auto-create /go/ tracked link on approval ────────── */
    let trackedLinkSlug: string | null = null;
    if (body.action === "approve") {
        const { data: l } = await supabase
            .from("listings")
            .select("name, slug, booking_url")
            .eq("id", id)
            .maybeSingle();
        if (l?.booking_url) {
            const linkSlug = (l.slug || `listing-${id.slice(0, 6)}`).slice(0, 60);
            const { data: existing } = await supabase
                .from("tracked_links")
                .select("slug")
                .eq("listing_id", id)
                .maybeSingle();
            if (!existing) {
                await supabase.from("tracked_links").insert({
                    slug: linkSlug,
                    destination_url: l.booking_url,
                    label: l.name,
                    listing_id: id,
                    is_active: true,
                });
                trackedLinkSlug = linkSlug;
            } else {
                trackedLinkSlug = existing.slug;
            }
        }
    }

    return NextResponse.json({ ok: true, trackedLinkSlug });
}
