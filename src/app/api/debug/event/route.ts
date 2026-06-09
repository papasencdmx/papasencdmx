import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Dump raw event row for a given slug. Secret-gated using DEBUG_EMAIL_SECRET.
// Hit: /api/debug/event?slug=<slug>&secret=<DEBUG_EMAIL_SECRET>
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const secret = searchParams.get("secret") || "";

  const expected = process.env.DEBUG_EMAIL_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Disabled. Set DEBUG_EMAIL_SECRET env var to enable." },
      { status: 403 }
    );
  }
  if (secret.length !== expected.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!slug) {
    return NextResponse.json({ error: "Missing ?slug=" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, slug, section, price_min, discount_percent, discount_label, organizer_name, organizer_logo_url, organizer_founded_year, organizer_is_verified, updated_at"
    )
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    event: data,
    diagnostics: {
      hasDiscountColumn: "discount_percent" in data,
      discountPercentIsSet: data.discount_percent != null,
      discountValue: data.discount_percent,
      discountLabel: data.discount_label,
      organizerNameIsSet: !!data.organizer_name,
    },
  });
}
