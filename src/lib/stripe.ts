import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  cached = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  return cached;
}

export async function createStripeCheckoutSession(params: {
  orderId: string;
  eventTitle: string;
  eventId: string;
  occurrenceId: string;
  amountCents: number;
  quantity: number;
  buyerEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    locale: "es",
    customer_email: params.buyerEmail,
    line_items: [
      {
        price_data: {
          currency: "mxn",
          product_data: {
            name: params.eventTitle,
            description: `${params.quantity} entrada${params.quantity > 1 ? "s" : ""}`,
          },
          unit_amount: Math.round(params.amountCents / params.quantity),
        },
        quantity: params.quantity,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      order_id: params.orderId,
      event_id: params.eventId,
      occurrence_id: params.occurrenceId,
    },
    payment_intent_data: {
      metadata: {
        order_id: params.orderId,
        event_id: params.eventId,
        occurrence_id: params.occurrenceId,
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe session missing checkout URL");
  }

  return { sessionId: session.id, url: session.url };
}
