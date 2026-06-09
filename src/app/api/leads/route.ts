import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("leads")
      .insert({
        listing_id: body.listing_id,
        city_id: body.city_id,
        parent_name: body.parent_name,
        parent_email: body.parent_email,
        parent_phone: body.parent_phone || null,
        message: body.message || null,
        children_ages: body.children_ages || null,
        source_page: body.source_page || null,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("Lead insert error:", error);
      return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
    }

    // TODO: Send email notification to business owner via Resend
    // const listing = await supabase.from("listings").select("name, email").eq("id", body.listing_id).single();
    // if (listing.data?.email) { await sendLeadNotification(...) }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Lead API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
