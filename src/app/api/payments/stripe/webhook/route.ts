import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { getStripeClient } from "@/lib/stripe";
import { sendOrderEmail } from "@/lib/orderEmails";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: `Invalid signature: ${msg}` }, { status: 400 });
  }

  const supabase = createServerClient();

  const updateOrder = async (
    orderId: string,
    updates: Record<string, unknown>
  ) => {
    const { error } = await supabase.from("orders").update(updates).eq("id", orderId);
    if (error) {
      console.error("[stripe-webhook] DB update error:", error);
      throw new Error(error.message);
    }
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        if (!orderId) {
          console.error("[stripe-webhook] checkout.session.completed missing order_id");
          break;
        }
        const paid = session.payment_status === "paid";
        const { data: orderInfo } = await supabase
          .from("orders")
          .select("is_deposit")
          .eq("id", orderId)
          .single();
        const finalStatus = paid
          ? orderInfo?.is_deposit
            ? "deposit_paid"
            : "paid"
          : "pending";
        await updateOrder(orderId, {
          payment_status: finalStatus,
          paid_at: paid ? new Date().toISOString() : null,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
        });
        if (paid) {
          await sendOrderEmail(
            orderId,
            orderInfo?.is_deposit ? "deposit_confirmed" : "confirmed"
          ).catch((err) =>
            console.error("[stripe-webhook] confirmation email failed:", err)
          );
          // Clear abandoned-checkout entry for this buyer+event
          const { data: paidOrder } = await supabase
            .from("orders")
            .select("event_id, buyer_email")
            .eq("id", orderId)
            .single();
          if (paidOrder?.event_id && paidOrder?.buyer_email) {
            await supabase
              .from("abandoned_checkouts")
              .delete()
              .eq("event_id", paidOrder.event_id)
              .eq("buyer_email", paidOrder.buyer_email.trim().toLowerCase());
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        if (orderId) await updateOrder(orderId, { payment_status: "expired" });
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.order_id;
        if (orderId) {
          await updateOrder(orderId, {
            payment_status: "failed",
            stripe_payment_intent_id: intent.id,
          });
          await sendOrderEmail(orderId, "failed").catch((err) =>
            console.error("[stripe-webhook] failure email failed:", err)
          );
        }
        break;
      }

      default:
        // Acknowledge unhandled events so Stripe stops retrying.
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] Handler error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  revalidatePath("/ofertas");
  return NextResponse.json({ received: true });
}
