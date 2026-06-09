import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/** GET: list abandoned checkouts joined with event title. */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const url = new URL(req.url);
  const stage = url.searchParams.get("stage"); // optional filter

  let q = supabase
    .from("abandoned_checkouts")
    .select(
      "id, event_id, occurrence_id, buyer_name, buyer_email, buyer_phone, attendee_names, quantity, notes, pack_name, stage, created_at, updated_at, event:events(title, slug, section)"
    )
    .order("updated_at", { ascending: false })
    .limit(500);

  if (stage && ["form_fill", "pay_click", "pay_failed"].includes(stage)) {
    q = q.eq("stage", stage);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ rows: data || [] });
}
