import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createStripeCheckoutSession } from "@/lib/stripe";

type PaymentProvider = "stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      occurrence_id,
      quantity,
      buyer_name,
      buyer_email,
      buyer_phone,
      attendee_names,
      notes,
      is_deposit: isDepositRequest,
    } = body;

    /* ── 1. Validate required fields ─────────────────────────── */
    if (
      !occurrence_id ||
      !quantity ||
      !buyer_name ||
      !buyer_email ||
      !buyer_phone ||
      !attendee_names
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(attendee_names) || attendee_names.length !== quantity) {
      return NextResponse.json(
        { error: "attendee_names must be an array with length equal to quantity" },
        { status: 400 }
      );
    }

    if (notes && typeof notes === "string" && notes.length > 300) {
      return NextResponse.json(
        { error: "Notes must be 300 characters or fewer" },
        { status: 400 }
      );
    }

    /* ── 2. Fetch occurrence + joined event ──────────────────── */
    const supabase = createServerClient();

    const { data: occurrence, error: occError } = await supabase
      .from("event_occurrences")
      .select(
        "id, ticket_quantity, max_per_purchase, is_visible, pack_name, price_override, event:events(id, title, slug, price_min, price_max, is_free, use_mollie, payment_provider, discount_percent, discount_label, deposit_percent)"
      )
      .eq("id", occurrence_id)
      .single();

    if (occError || !occurrence) {
      return NextResponse.json(
        { error: "Occurrence not found" },
        { status: 404 }
      );
    }

    // Supabase returns the joined row as an object (single FK)
    const event = occurrence.event as unknown as {
      id: string;
      title: string;
      slug: string;
      price_min: number;
      price_max: number;
      is_free: boolean;
      use_mollie: boolean;
      payment_provider: PaymentProvider | null;
      discount_percent: number | null;
      discount_label: string | null;
      deposit_percent: number | null;
    } | null;

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const paymentsEnabled =
      event.use_mollie ||
      event.payment_provider === "stripe";
    if (!paymentsEnabled) {
      return NextResponse.json(
        { error: "Online payments are not enabled for this event" },
        { status: 400 }
      );
    }

    if (!occurrence.is_visible) {
      return NextResponse.json(
        { error: "This occurrence is not available for purchase" },
        { status: 400 }
      );
    }

    /* ── 3. Validate quantity limits ─────────────────────────── */
    const maxPerPurchase = occurrence.max_per_purchase ?? 5;

    if (quantity < 1 || quantity > maxPerPurchase) {
      return NextResponse.json(
        { error: `Quantity must be between 1 and ${maxPerPurchase}` },
        { status: 400 }
      );
    }

    /* ── 4. Check available tickets (skip if ticket_quantity not configured) ── */
    if (occurrence.ticket_quantity != null) {
      // Count paid orders
      const { data: paidRows, error: paidError } = await supabase
        .from("orders")
        .select("quantity")
        .eq("occurrence_id", occurrence_id)
        .eq("payment_status", "paid");

      // Only count pending orders from last 30 min (older ones are abandoned)
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: pendingRows, error: pendingError } = await supabase
        .from("orders")
        .select("quantity")
        .eq("occurrence_id", occurrence_id)
        .eq("payment_status", "pending")
        .gte("created_at", thirtyMinAgo);

      if (paidError || pendingError) {
        console.error("Error fetching sold tickets:", paidError || pendingError);
        return NextResponse.json(
          { error: "Failed to check ticket availability" },
          { status: 500 }
        );
      }

      const totalSold = [...(paidRows || []), ...(pendingRows || [])].reduce(
        (sum: number, row: { quantity: number }) => sum + (row.quantity || 0),
        0
      );
      const available = occurrence.ticket_quantity - totalSold;

      if (quantity > available) {
        return NextResponse.json(
          { error: `Only ${available} ticket(s) remaining` },
          { status: 400 }
        );
      }
    }

    /* ── 5. Check for duplicate pending orders ─────────────── */
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: existingOrders } = await supabase
      .from("orders")
      .select("id, created_at")
      .eq("occurrence_id", occurrence_id)
      .eq("buyer_email", buyer_email.trim().toLowerCase())
      .eq("payment_status", "pending")
      .gte("created_at", tenMinutesAgo)
      .limit(1);

    if (existingOrders && existingOrders.length > 0) {
      return NextResponse.json(
        { error: "Ya tienes un pedido pendiente. Completa el pago anterior o espera unos minutos." },
        { status: 409 }
      );
    }

    /* ── 6. Calculate total (pack price wins, then apply listing discount) ──── */
    const packPrice = (occurrence as { price_override?: number | null }).price_override;
    const packName = (occurrence as { pack_name?: string | null }).pack_name;
    const originalUnitPrice = packPrice != null ? Number(packPrice) : Number(event.price_min);
    if (!originalUnitPrice || originalUnitPrice <= 0) {
      return NextResponse.json(
        { error: "Event price is not configured" },
        { status: 400 }
      );
    }

    // Apply event-level discount (0-80%). Server is the source of truth;
    // the client display is just a hint — the actual charge is computed here.
    const rawDiscount = event.discount_percent;
    const discountPercent =
      rawDiscount != null && rawDiscount > 0 && rawDiscount <= 80
        ? Math.round(rawDiscount)
        : null;
    const effectiveUnitPrice = discountPercent
      ? Math.round(originalUnitPrice * (100 - discountPercent)) / 100
      : originalUnitPrice;
    const fullTotalAmount = Math.round(effectiveUnitPrice * quantity * 100) / 100;
    const discountAmount = discountPercent
      ? Math.round((originalUnitPrice * quantity - fullTotalAmount) * 100) / 100
      : null;

    // Resolve deposit mode (only if event allows it AND buyer chose it)
    const allowedDepositPercent =
      event.deposit_percent != null &&
      event.deposit_percent >= 5 &&
      event.deposit_percent <= 95
        ? Math.round(event.deposit_percent)
        : null;
    const isDeposit = !!isDepositRequest && allowedDepositPercent != null;
    const depositPaidPercent = isDeposit ? allowedDepositPercent : null;
    const depositAmount = isDeposit
      ? Math.round(fullTotalAmount * (allowedDepositPercent! / 100) * 100) / 100
      : null;
    const remainingAmount = isDeposit
      ? Math.round((fullTotalAmount - depositAmount!) * 100) / 100
      : null;
    // What we actually charge through the payment gateway
    const totalAmount = isDeposit ? depositAmount! : fullTotalAmount;

    /* ── 7. Insert pending order ─────────────────────────────── */
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        event_id: event.id,
        occurrence_id,
        buyer_name,
        buyer_email,
        buyer_phone,
        quantity,
        total_amount: fullTotalAmount,
        attendee_names,
        notes: notes || null,
        pack_name: packName || null,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        is_deposit: isDeposit,
        deposit_percent: depositPaidPercent,
        deposit_amount: depositAmount,
        remaining_amount: remainingAmount,
        payment_status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    /* ── 8. Create provider payment session ──────────────────── */
    const baseUrl =
      (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, "");

    const provider: PaymentProvider = "stripe";
    const successUrl = `${baseUrl}/ofertas/${event.slug}/confirmacion?order=${order.id}`;
    const cancelUrl = `${baseUrl}/ofertas/${event.slug}?cancelled=1`;

    // Tag the order with the provider we're about to use
    await supabase.from("orders").update({ payment_provider: provider }).eq("id", order.id);

    const baseLabel = packName ? `${event.title} · ${packName}` : event.title;
    const productLabel = isDeposit
      ? `Reserva ${depositPaidPercent}% · ${baseLabel}`
      : baseLabel;

    try {
      const { sessionId, url } = await createStripeCheckoutSession({
        orderId: order.id,
        eventId: event.id,
        occurrenceId: occurrence_id,
        eventTitle: productLabel,
        amountCents: Math.round(totalAmount * 100),
        quantity,
        buyerEmail: buyer_email,
        successUrl,
        cancelUrl,
      });

      await supabase
        .from("orders")
        .update({ stripe_session_id: sessionId })
        .eq("id", order.id);

      return NextResponse.json({ checkoutUrl: url, orderId: order.id });
    } catch (providerError: unknown) {
      let errMessage = "Unknown error";
      if (providerError instanceof Error) {
        errMessage = providerError.message;
        const apiErr = providerError as Error & { statusCode?: number; field?: string };
        if (apiErr.statusCode) errMessage = `[${apiErr.statusCode}] ${errMessage}`;
        if (apiErr.field) errMessage += ` (field: ${apiErr.field})`;
      } else {
        errMessage = String(providerError);
      }
      console.error(`[payments] ${provider} error:`, errMessage);
      console.error(
        `[payments] ${provider} error full:`,
        JSON.stringify(providerError, Object.getOwnPropertyNames(providerError as object), 2)
      );

      // Clean up the pending order
      await supabase.from("orders").delete().eq("id", order.id);

      return NextResponse.json(
        { error: "Failed to create payment", details: errMessage },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Payment API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
