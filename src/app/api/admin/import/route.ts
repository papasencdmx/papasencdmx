import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";


export async function POST(req: NextRequest) {
    // Simple auth check
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { listings, categoryId, cityId } = await req.json();

        if (!listings?.length || !categoryId || !cityId) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        const supabase = createServerClient();
        const errors: Array<{ row: number; message: string }> = [];
        let created = 0;
        let updated = 0;

        // 1. Collect all slugs and place IDs from import
        const slugs = listings.map((l: Record<string, unknown>) => l.slug as string);
        const placeIds = listings
            .map((l: Record<string, unknown>) => l.google_place_id as string)
            .filter(Boolean);

        // 2. Find existing listings by slug (same category) — these will be updated
        const { data: sameCategoryBySlug } = await supabase
            .from("listings")
            .select("id, slug, google_place_id")
            .eq("city_id", cityId)
            .eq("category_id", categoryId)
            .in("slug", slugs);

        const slugToId = new Map<string, string>();
        sameCategoryBySlug?.forEach((l) => slugToId.set(l.slug, l.id));

        // 3. Find ALL existing listings by google_place_id (any category) — primary dedup key
        const existingPlaceIds = new Set<string>();
        if (placeIds.length > 0) {
            const { data: byPlaceId } = await supabase
                .from("listings")
                .select("google_place_id")
                .eq("city_id", cityId)
                .in("google_place_id", placeIds);

            byPlaceId?.forEach((l) => {
                if (l.google_place_id) existingPlaceIds.add(l.google_place_id);
            });
        }

        // 4. Separate into inserts, updates, or skipped
        const toInsert: Record<string, unknown>[] = [];
        const toUpdate: Array<{ id: string; data: Record<string, unknown> }> = [];
        let skipped = 0;

        for (const listing of listings) {
            const slug = listing.slug as string;
            const placeId = listing.google_place_id as string;
            const existingId = slugToId.get(slug);

            if (existingId) {
                // Same category + same slug — update existing
                const { slug: _s, city_id, category_id, ...updateData } = listing;
                toUpdate.push({ id: existingId, data: updateData });
            } else if (placeId && existingPlaceIds.has(placeId)) {
                // Same google_place_id already in DB (any category) — skip duplicate
                skipped++;
            } else {
                toInsert.push(listing);
            }
        }

        // 3. Deduplicate inserts by slug (keep first occurrence)
        const seenSlugs = new Set<string>();
        const dedupedInsert: Record<string, unknown>[] = [];
        for (const listing of toInsert) {
            const slug = listing.slug as string;
            if (seenSlugs.has(slug)) {
                errors.push({ row: -1, message: `Slug duplicado en CSV: ${slug}` });
                continue;
            }
            seenSlugs.add(slug);
            dedupedInsert.push(listing);
        }

        // 4. Batch insert with retry — if a batch fails, retry rows individually
        if (dedupedInsert.length > 0) {
            const batchSize = 50;
            for (let i = 0; i < dedupedInsert.length; i += batchSize) {
                const batch = dedupedInsert.slice(i, i + batchSize);
                const { data, error } = await supabase
                    .from("listings")
                    .insert(batch)
                    .select("id");

                if (error) {
                    // Batch failed — retry each row individually so one bad row doesn't kill the batch
                    for (let j = 0; j < batch.length; j++) {
                        const { data: singleData, error: singleError } = await supabase
                            .from("listings")
                            .insert(batch[j])
                            .select("id");

                        if (singleError) {
                            errors.push({ row: i + j, message: `${(batch[j].name as string) || "?"}: ${singleError.message}` });
                        } else {
                            created += singleData?.length || 0;
                        }
                    }
                } else {
                    created += data?.length || 0;
                }
            }
        }

        // 4. Batch update
        const updateBatchSize = 20;
        for (let i = 0; i < toUpdate.length; i += updateBatchSize) {
            const batch = toUpdate.slice(i, i + updateBatchSize);
            const results = await Promise.all(
                batch.map(({ id, data }) =>
                    supabase.from("listings").update(data).eq("id", id)
                )
            );
            results.forEach((result, idx) => {
                if (result.error) {
                    errors.push({ row: i + idx, message: result.error.message });
                } else {
                    updated++;
                }
            });
        }

        return NextResponse.json({ created, updated, skipped, errors, success: errors.length === 0 });
    } catch (err) {
        console.error("Import error:", err);
        return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
}
