import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUsernameFromToken } from "@/lib/activityLog";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = [
    "order_number",
    "created_at",
    "payment_status",
    "payment_provider",
    "buyer_name",
    "buyer_email",
    "buyer_phone",
    "quantity",
    "total_amount",
    "attendee_names",
    "event_title",
    "event_section",
    "occurrence_date",
    "occurrence_time",
    "notes",
    "admin_notes",
    "order_id",
  ];
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = Array.isArray(v) ? v.join(" | ") : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const username = getUsernameFromToken(auth);
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const eventId = searchParams.get("event_id");
  const status = searchParams.get("status");
  const section = searchParams.get("section");
  const provider = searchParams.get("provider");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const search = searchParams.get("search")?.trim();
  const format = searchParams.get("format");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "50", 10));
  const offset = (page - 1) * limit;

  const supabase = createServerClient();

  const baseSelect =
    "*, event:events(id, title, slug, section), occurrence:event_occurrences(occurrence_date, time_start, location_name)";

  let query = supabase
    .from("orders")
    .select(baseSelect, { count: "exact" })
    .order("created_at", { ascending: false });

  if (eventId) query = query.eq("event_id", eventId);
  if (status) query = query.eq("payment_status", status);
  if (provider) query = query.eq("payment_provider", provider);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);
  if (search) {
    const clean = search.replace(/[,()]/g, " ");
    query = query.or(
      `order_number.ilike.%${clean}%,buyer_name.ilike.%${clean}%,buyer_email.ilike.%${clean}%`
    );
  }

  // CSV export ignores pagination; UI paginates via range
  if (format !== "csv") {
    query = query.range(offset, offset + limit - 1);
  }

  const { data: orders, error, count } = await query;

  if (error) {
    console.error("[admin/orders GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Post-filter by section (section is on the joined event)
  type OrderRow = {
    order_number: string | null;
    created_at: string;
    payment_status: string;
    payment_provider: string | null;
    buyer_name: string;
    buyer_email: string;
    buyer_phone: string;
    quantity: number;
    total_amount: number;
    attendee_names: string[] | null;
    notes: string | null;
    admin_notes: string | null;
    id: string;
    event?: { title?: string; section?: string } | null;
    occurrence?: { occurrence_date?: string; time_start?: string | null } | null;
  };
  const filtered = section
    ? (orders as OrderRow[] || []).filter((o) => o.event?.section === section)
    : (orders as OrderRow[] || []);

  if (format === "csv") {
    const csvRows = filtered.map((o) => ({
      order_number: o.order_number,
      created_at: o.created_at,
      payment_status: o.payment_status,
      payment_provider: o.payment_provider,
      buyer_name: o.buyer_name,
      buyer_email: o.buyer_email,
      buyer_phone: o.buyer_phone,
      quantity: o.quantity,
      total_amount: o.total_amount,
      attendee_names: o.attendee_names,
      event_title: o.event?.title,
      event_section: o.event?.section,
      occurrence_date: o.occurrence?.occurrence_date,
      occurrence_time: o.occurrence?.time_start,
      notes: o.notes,
      admin_notes: o.admin_notes,
      order_id: o.id,
    }));
    const csv = toCsv(csvRows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pedidos-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({ orders: filtered, total: count, page });
}
