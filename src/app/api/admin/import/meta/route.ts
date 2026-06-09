import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const citySlug = process.env.NEXT_PUBLIC_CITY_SLUG || "madrid";

/** GET: Return categories, zones, and cityId for the import form */
export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();

    // Get city
    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

    if (!city) {
        return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    // Get categories + zones + subcategories in parallel
    const [catRes, zoneRes, subRes] = await Promise.all([
        supabase.from("categories").select("id, name, slug").eq("is_active", true).order("sort_order"),
        supabase.from("zones").select("id, name, slug").eq("city_id", city.id).eq("is_active", true).order("name"),
        supabase.from("subcategories").select("id, name, slug, category_id").eq("is_active", true).order("sort_order"),
    ]);

    return NextResponse.json({
        cityId: city.id,
        categories: catRes.data || [],
        zones: zoneRes.data || [],
        subcategories: subRes.data || [],
    });
}
