import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    await supabase.from("click_events").insert({
      listing_id: body.listing_id,
      city_id: body.city_id,
      event_type: body.event_type,
      source_page: body.source_page || null,
      user_agent: request.headers.get("user-agent") || null,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // Silent fail
  }
}
