import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { buildIcs } from "@/lib/ics";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;
  const supabase = createServerClient();

  const { data } = await supabase
    .from("orders")
    .select("id, order_number, event:events(title, description), occurrence:event_occurrences(occurrence_date, time_start, time_end, location_name, street_address)")
    .eq("id", orderId)
    .single();

  if (!data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const event = data.event as unknown as { title: string; description: string | null } | null;
  const occurrence = data.occurrence as unknown as { occurrence_date: string; time_start: string | null; time_end: string | null; location_name: string | null; street_address: string | null } | null;

  if (!event || !occurrence) {
    return NextResponse.json({ error: "Event/occurrence missing" }, { status: 404 });
  }

  const location = [occurrence.location_name, occurrence.street_address].filter(Boolean).join(" — ");
  const ics = buildIcs({
    uid: `${data.order_number || data.id}@papasencdmx.com`,
    title: event.title,
    description: event.description,
    location: location || null,
    date: occurrence.occurrence_date,
    timeStart: occurrence.time_start,
    timeEnd: occurrence.time_end,
  });

  const filename = `${data.order_number || "pedido"}.ics`;
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
