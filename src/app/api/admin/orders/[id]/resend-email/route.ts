import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUsernameFromToken, logActivity } from "@/lib/activityLog";
import { sendOrderEmail } from "@/lib/orderEmails";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get("authorization");
  const username = getUsernameFromToken(auth);
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = createServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, payment_status")
    .eq("id", id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const kind = order.payment_status === "paid" ? "confirmed" : "failed";
  const result = await sendOrderEmail(id, kind, { force: true });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Send failed" }, { status: 500 });
  }

  logActivity(username, {
    action: "order_resend_email",
    entityType: "order",
    entityId: id,
    entityName: order.order_number || id.slice(0, 8),
    details: { kind },
  });

  return NextResponse.json({ ok: true });
}
