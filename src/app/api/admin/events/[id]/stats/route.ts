import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/** GET: Analytics for a single event — view funnel + order totals. */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const supabase = createServerClient();

  // page_views (total + unique)
  const { count: viewsTotal } = await supabase
    .from("page_views")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);

  const { data: uniqueRows } = await supabase
    .from("page_views")
    .select("session_id")
    .eq("event_id", id)
    .not("session_id", "is", null);
  const viewsUnique = new Set(
    (uniqueRows || []).map((r: { session_id: string | null }) => r.session_id).filter(Boolean)
  ).size;

  // event_interactions counts
  const { count: reserveClicks } = await supabase
    .from("event_interactions")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id)
    .eq("kind", "reserve_click");

  const { count: payStarts } = await supabase
    .from("event_interactions")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id)
    .eq("kind", "pay_start");

  // orders (paid only and total)
  const { count: ordersPaid } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id)
    .eq("payment_status", "paid");

  const { count: ordersTotal } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);

  return NextResponse.json({
    stats: {
      views_total: viewsTotal || 0,
      views_unique: viewsUnique,
      reserve_clicks: reserveClicks || 0,
      pay_starts: payStarts || 0,
      orders_paid: ordersPaid || 0,
      orders_total: ordersTotal || 0,
    },
  });
}
