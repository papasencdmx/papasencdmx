import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/** POST: Create a new zone */
export async function POST(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServerClient();
    const body = await req.json();

    const name = (body.name || "").trim();
    if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Get city
    const citySlug = process.env.NEXT_PUBLIC_CITY_SLUG || "madrid";
    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .single();

    if (!city) {
        return NextResponse.json({ error: "City not found" }, { status: 500 });
    }

    const slug = name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Check if already exists
    const { data: existing } = await supabase
        .from("zones")
        .select("id, name")
        .eq("city_id", city.id)
        .eq("slug", slug)
        .single();

    if (existing) {
        return NextResponse.json({ zone: existing });
    }

    const { data, error } = await supabase
        .from("zones")
        .insert({
            city_id: city.id,
            name,
            slug,
            type: body.type || "municipio",
            priority: 3,
            is_active: true,
        })
        .select("id, name, slug")
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ zone: data });
}
