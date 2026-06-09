import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    await supabase.from("page_views").insert({
      listing_id: body.listing_id || null,
      event_id: body.event_id || null,
      city_id: body.city_id,
      page_path: body.page_path || null,
      page_type: body.page_type || "other",
      referrer: body.referrer || null,
      session_id: body.session_id || null,
      user_agent: request.headers.get("user-agent") || null,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // Silent fail
  }
}
