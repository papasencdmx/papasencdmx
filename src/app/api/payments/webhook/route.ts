import { NextResponse } from "next/server";
// Mollie was removed — Stripe is the only payment gateway.
export async function POST() {
  return NextResponse.json({ error: "Gateway removed" }, { status: 410 });
}
