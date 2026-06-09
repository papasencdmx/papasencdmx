import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const VALID_KINDS = new Set(["reserve_click", "pay_start", "external_ticket_click"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.event_id || !VALID_KINDS.has(body.kind)) {
      return NextResponse.json({ success: true }); // silent fail on bad input
    }
    const supabase = createServerClient();

    await supabase.from("event_interactions").insert({
      event_id: body.event_id,
      kind: body.kind,
      session_id: body.session_id || null,
      referrer: body.referrer || null,
      user_agent: request.headers.get("user-agent") || null,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // silent fail
  }
}
