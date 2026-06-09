import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * POST /api/admin/expire-check
 * Checks all listings for expired toggles and auto-unchecks them.
 */
export async function POST() {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Un-feature expired featured listings
    const { data: featuredData } = await supabase
        .from("listings")
        .update({
            is_featured: false,
            featured_expires_at: null,
            updated_at: now,
        })
        .eq("is_featured", true)
        .not("featured_expires_at", "is", null)
        .lt("featured_expires_at", now)
        .select("id");

    // Un-verify expired verified listings
    const { data: verifiedData } = await supabase
        .from("listings")
        .update({
            is_verified: false,
            verified_expires_at: null,
            updated_at: now,
        })
        .eq("is_verified", true)
        .not("verified_expires_at", "is", null)
        .lt("verified_expires_at", now)
        .select("id");

    // De-activate expired active listings
    const { data: activeData } = await supabase
        .from("listings")
        .update({
            is_active: false,
            active_expires_at: null,
            updated_at: now,
        })
        .eq("is_active", true)
        .not("active_expires_at", "is", null)
        .lt("active_expires_at", now)
        .select("id");

    return NextResponse.json({
        message: "Expiry check complete",
        expired: {
            featured: featuredData?.length || 0,
            verified: verifiedData?.length || 0,
            active: activeData?.length || 0,
        },
    });
}
