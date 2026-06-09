import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/** Check which slugs already exist */
export async function POST(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { slugs, categoryId, cityId, placeIds } = await req.json();

        if (!slugs?.length || !categoryId || !cityId) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        const supabase = createServerClient();

        // Check by slug
        const { data: bySlug } = await supabase
            .from("listings")
            .select("slug")
            .eq("city_id", cityId)
            .eq("category_id", categoryId)
            .in("slug", slugs);

        const existingSlugs = new Set(bySlug?.map((l) => l.slug) || []);

        // Check by google_place_id across ALL categories (same business = same place_id)
        const placeIdToSlug = new Map<string, string>();
        if (placeIds?.length) {
            const validPlaceIds = placeIds.filter((p: string) => p);
            if (validPlaceIds.length > 0) {
                const { data: byPlaceId } = await supabase
                    .from("listings")
                    .select("slug, google_place_id")
                    .eq("city_id", cityId)
                    .in("google_place_id", validPlaceIds);

                byPlaceId?.forEach((l) => {
                    if (l.google_place_id) {
                        placeIdToSlug.set(l.google_place_id, l.slug);
                    }
                });
            }
        }

        return NextResponse.json({
            existingSlugs: Array.from(existingSlugs),
            existingPlaceIds: Object.fromEntries(placeIdToSlug),
        });
    } catch {
        return NextResponse.json({ error: "Check failed" }, { status: 500 });
    }
}
