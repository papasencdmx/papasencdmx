import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/** Update descriptions for existing listings by google_place_id */
export async function POST(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { rows } = await req.json() as { rows: Array<{ place_id: string; description: string }> };

        if (!rows?.length) {
            return NextResponse.json({ error: "No data" }, { status: 400 });
        }

        const supabase = createServerClient();
        let updated = 0;
        let notFound = 0;
        const errors: Array<{ place_id: string; message: string }> = [];

        for (const row of rows) {
            if (!row.place_id || !row.description) continue;

            const { error, count } = await supabase
                .from("listings")
                .update({ description: row.description })
                .eq("google_place_id", row.place_id)
                .select("id");

            if (error) {
                errors.push({ place_id: row.place_id, message: error.message });
            } else if (count === 0) {
                notFound++;
            } else {
                updated++;
            }
        }

        return NextResponse.json({ updated, notFound, errors, success: errors.length === 0 });
    } catch (err) {
        console.error("Description import error:", err);
        return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
}
