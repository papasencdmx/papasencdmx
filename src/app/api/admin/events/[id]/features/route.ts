import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { getUsernameFromToken, logActivity } from "@/lib/activityLog";

function parseItems(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

/** GET: List feature groups for an event */
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
    .from("event_features")
    .select("*")
    .eq("event_id", id)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ features: data || [] });
}

/** POST: Create a feature group */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get("authorization");
  const username = getUsernameFromToken(auth);
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();
  const supabase = createServerClient();

  const groupName = String(body.group_name || "").trim();
  const iconName = String(body.icon_name || "").trim();
  if (!groupName || !iconName) {
    return NextResponse.json({ error: "group_name and icon_name are required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("event_features")
    .select("sort_order")
    .eq("event_id", id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSort = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("event_features")
    .insert({
      event_id: id,
      group_name: groupName,
      icon_name: iconName,
      items: parseItems(body.items),
      sort_order: typeof body.sort_order === "number" ? body.sort_order : nextSort,
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/events/features POST] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity(username, {
    action: "feature_create",
    entityType: "feature",
    entityId: data.id,
    entityName: groupName,
  });

  revalidatePath("/ofertas");
  return NextResponse.json({ feature: data });
}

/** PATCH: Update a feature group */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get("authorization");
  const username = getUsernameFromToken(auth);
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();
  const featureId = String(body.id || "");
  if (!featureId) {
    return NextResponse.json({ error: "feature id required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const updates: Record<string, unknown> = {};
  if ("group_name" in body) updates.group_name = String(body.group_name).trim();
  if ("icon_name" in body) updates.icon_name = String(body.icon_name).trim();
  if ("items" in body) updates.items = parseItems(body.items);
  if ("sort_order" in body && typeof body.sort_order === "number") updates.sort_order = body.sort_order;

  const { data, error } = await supabase
    .from("event_features")
    .update(updates)
    .eq("id", featureId)
    .eq("event_id", id)
    .select()
    .single();

  if (error) {
    console.error("[admin/events/features PATCH] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity(username, {
    action: "feature_update",
    entityType: "feature",
    entityId: featureId,
    entityName: data?.group_name || featureId,
  });

  revalidatePath("/ofertas");
  return NextResponse.json({ feature: data });
}

/** DELETE: Remove a feature group */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get("authorization");
  const username = getUsernameFromToken(auth);
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const { searchParams } = req.nextUrl;
  const featureId = searchParams.get("featureId");
  if (!featureId) {
    return NextResponse.json({ error: "featureId required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("event_features")
    .delete()
    .eq("id", featureId)
    .eq("event_id", id);

  if (error) {
    console.error("[admin/events/features DELETE] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity(username, {
    action: "feature_delete",
    entityType: "feature",
    entityId: featureId,
  });

  revalidatePath("/ofertas");
  return NextResponse.json({ success: true });
}
