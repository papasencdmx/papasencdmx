import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUsernameFromToken } from "@/lib/activityLog";

/** GET: Fetch activity logs with pagination and filters */
export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    const username = getUsernameFromToken(auth);
    if (!username) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const filterUser = searchParams.get("user") || "";
    const filterAction = searchParams.get("action") || "";
    const offset = (page - 1) * limit;

    const supabase = createServerClient();

    // Hide password_change and import_csv from activity feed
    const hiddenActions = ["password_change", "import_csv"];

    let query = supabase
        .from("admin_activity_log")
        .select("*", { count: "exact" })
        .not("action", "in", `(${hiddenActions.join(",")})`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (filterUser) {
        query = query.ilike("admin_username", filterUser);
    }
    if (filterAction) {
        query = query.eq("action", filterAction);
    }

    const { data, count, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        logs: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
    });
}
