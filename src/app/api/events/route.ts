import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const citySlug = process.env.NEXT_PUBLIC_CITY_SLUG || "madrid";

/** GET: Public event listing with filters — no auth required */
export async function GET(req: NextRequest) {
    const supabase = createServerClient();
    const url = new URL(req.url);

    const categorySlug = url.searchParams.get("category") || "";
    const dateFrom = url.searchParams.get("dateFrom") || "";
    const dateTo = url.searchParams.get("dateTo") || "";
    const free = url.searchParams.get("free");
    const sectionParam = url.searchParams.get("section") || "";
    const section = ["actividades", "colegios", "campamentos"].includes(sectionParam)
        ? sectionParam
        : null;
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "24");

    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

    if (!city) return NextResponse.json({ error: "City not found" }, { status: 404 });

    // Resolve category slug → ID
    let eventCategoryId: string | null = null;
    if (categorySlug) {
        const { data: cat } = await supabase
            .from("event_categories")
            .select("id")
            .eq("slug", categorySlug)
            .single();
        eventCategoryId = cat?.id || null;
    }

    const today = new Date().toISOString().split("T")[0];

    // Fetch approved events with occurrences
    let query = supabase
        .from("events")
        .select("*, event_category:event_categories(id,name,slug,icon), occurrences:event_occurrences(*)")
        .eq("city_id", city.id)
        .eq("status", "approved");

    if (eventCategoryId) query = query.eq("event_category_id", eventCategoryId);
    if (free === "true") query = query.eq("is_free", true);
    if (free === "false") query = query.eq("is_free", false);
    if (section) query = query.eq("section", section);

    const { data } = await query;

    if (!data) return NextResponse.json({ events: [], total: 0, page });

    // Filter by occurrences in date range
    const effectiveDateFrom = dateFrom || today;
    const effectiveDateTo = dateTo || null;

    interface OccRow { occurrence_date: string; availability: string; [key: string]: unknown }
    type EventRow = typeof data[number] & {
        occurrences: OccRow[];
        next_occurrence_date?: string;
        occurrence_count?: number;
        is_featured?: boolean;
    };

    const filtered = (data as EventRow[])
        .map((event) => {
            const futureOcc = (event.occurrences || []).filter((occ: OccRow) => {
                if (occ.occurrence_date < effectiveDateFrom) return false;
                if (effectiveDateTo && occ.occurrence_date > effectiveDateTo) return false;
                if (occ.availability === "cancelled") return false;
                if (occ.is_visible === false) return false;
                return true;
            });
            if (futureOcc.length === 0) return null;
            futureOcc.sort((a: OccRow, b: OccRow) => a.occurrence_date.localeCompare(b.occurrence_date));
            return {
                ...event,
                occurrences: futureOcc,
                next_occurrence_date: futureOcc[0].occurrence_date,
                occurrence_count: futureOcc.length,
            };
        })
        .filter(Boolean) as EventRow[];

    // Sort: featured first, then by next occurrence
    filtered.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return (a.next_occurrence_date || "").localeCompare(b.next_occurrence_date || "");
    });

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const events = filtered.slice(offset, offset + limit);

    return NextResponse.json({ events, total, page });
}
