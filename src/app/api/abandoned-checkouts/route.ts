import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * Upsert an abandoned-checkout row. Called from the booking card as the user
 * types (debounced) and again when they click Pay. If a valid email is not
 * provided, the request is silently dropped — no row created.
 *
 * Row is deleted automatically when the matching order is paid (see webhook
 * handlers for stripe).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.buyer_email || "").trim().toLowerCase();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk || !body.event_id) {
      return NextResponse.json({ ok: true }); // silent no-op
    }

    const stage: string = ["form_fill", "pay_click", "pay_failed"].includes(body.stage)
      ? body.stage
      : "form_fill";

    const supabase = createServerClient();

    await supabase
      .from("abandoned_checkouts")
      .upsert(
        {
          event_id: body.event_id,
          occurrence_id: body.occurrence_id || null,
          buyer_name: body.buyer_name || null,
          buyer_email: email,
          buyer_phone: body.buyer_phone || null,
          attendee_names: Array.isArray(body.attendee_names) ? body.attendee_names : null,
          quantity: typeof body.quantity === "number" ? body.quantity : null,
          notes: body.notes || null,
          pack_name: body.pack_name || null,
          stage,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "event_id,buyer_email" }
      );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
