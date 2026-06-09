import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, event:events(title, slug, image_url, price_min, section), occurrence:event_occurrences(occurrence_date, date_end, pack_name, time_start, time_end, location_name)"
    )
    .eq("id", orderId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order: data });
}
