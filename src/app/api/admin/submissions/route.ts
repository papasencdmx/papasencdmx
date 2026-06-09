import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const citySlug = process.env.NEXT_PUBLIC_CITY_SLUG || "madrid";

export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "pending";

    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .maybeSingle();
    if (!city?.id) return NextResponse.json({ submissions: [] });

    let q = supabase
        .from("listings")
        .select(
            "id, name, slug, contact_name, email, phone, website, short_description, recommendation_reason, cover_image_url, booking_url, age_min, age_max, price_min, price_max, discount_percent, street_address, category_id, zone_id, source, submission_status, submitted_at, approved_at, approved_by, created_at"
        )
        .eq("city_id", city.id)
        .eq("source", "submission")
        .order("submitted_at", { ascending: false })
        .limit(500);

    if (status && ["pending", "approved", "rejected"].includes(status)) {
        q = q.eq("submission_status", status);
    }

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ submissions: data || [] });
}
