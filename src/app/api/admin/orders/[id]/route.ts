import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { getUsernameFromToken, logActivity, type ActivityAction } from "@/lib/activityLog";

const VALID_STATUSES = ["pending", "paid", "failed", "expired", "refunded", "cancelled"];
const ALLOWED_FIELDS = ["payment_status", "admin_notes", "refund_amount"] as const;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get("authorization");
  if (!getUsernameFromToken(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, event:events(id, title, slug, section, image_url, event_category:event_categories(name, slug)), occurrence:event_occurrences(id, occurrence_date, time_start, time_end, location_name, street_address)"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order: data });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get("authorization");
  const username = getUsernameFromToken(auth);
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const supabase = createServerClient();

  const { data: current } = await supabase
    .from("orders")
    .select("id, order_number, payment_status, admin_notes, refund_amount")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (!(key in body)) continue;
    if (key === "payment_status") {
      if (!VALID_STATUSES.includes(body.payment_status)) {
        return NextResponse.json({ error: "Invalid payment_status" }, { status: 400 });
      }
      updates.payment_status = body.payment_status;
    } else {
      updates[key] = body[key] === "" ? null : body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Derived timestamps when status changes
  if (updates.payment_status === "refunded" && !body.refunded_at_preserve) {
    updates.refunded_at = new Date().toISOString();
  }
  if (updates.payment_status === "paid" && current.payment_status !== "paid") {
    updates.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[admin/orders PATCH] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  const action: ActivityAction =
    updates.payment_status === "refunded"
      ? "order_refund"
      : updates.payment_status === "cancelled"
      ? "order_cancel"
      : "order_update";

  const changes = Object.keys(updates)
    .filter((k) => k !== "refunded_at" && k !== "paid_at")
    .map((k) => ({
      field: k,
      label: k,
      from: String((current as Record<string, unknown>)[k] ?? "vacío"),
      to: String(updates[k] ?? "vacío"),
    }));

  if (changes.length > 0) {
    logActivity(username, {
      action,
      entityType: "order",
      entityId: id,
      entityName: current.order_number || id.slice(0, 8),
      details: { changes },
    });
  }

  revalidatePath("/admin/orders");
  return NextResponse.json({ order: data });
}
