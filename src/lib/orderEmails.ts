import { createServerClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import OrderConfirmedEmail from "@/emails/OrderConfirmedEmail";
import OrderFailedEmail from "@/emails/OrderFailedEmail";
import OrderDepositConfirmedEmail from "@/emails/OrderDepositConfirmedEmail";
import { getCityConfig, buildWhatsAppUrl } from "@/config/city";

type EmailKind = "confirmed" | "failed" | "deposit_confirmed";

export type SendOrderEmailResult =
  | { ok: true; id?: string; skipped?: boolean }
  | { ok: false; error: string };

function formatOccurrenceDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatEuros(amount: number | string): string {
  // Mexican peso formatting, e.g. "$1,234.56"
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function sendOrderEmail(orderId: string, kind: EmailKind, opts?: { force?: boolean }): Promise<SendOrderEmailResult> {
  const supabase = createServerClient();
  const config = getCityConfig();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, access_token, buyer_name, buyer_email, attendee_names, quantity, total_amount, pack_name, is_deposit, deposit_percent, deposit_amount, remaining_amount, confirmation_email_sent_at, failure_email_sent_at, event:events(id, title, slug, image_url, section), occurrence:event_occurrences(occurrence_date, date_end, time_start, location_name, pack_name)"
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    console.error("[orderEmails] order not found:", orderId, error);
    return { ok: false, error: "Order not found" } as const;
  }

  // Idempotency: skip if already sent unless forced
  if (!opts?.force) {
    if ((kind === "confirmed" || kind === "deposit_confirmed") && order.confirmation_email_sent_at) {
      return { ok: true, skipped: true } as const;
    }
    if (kind === "failed" && order.failure_email_sent_at) {
      return { ok: true, skipped: true } as const;
    }
  }

  const event = order.event as unknown as { id: string; title: string; slug: string; image_url: string | null; section: string | null } | null;
  const occurrence = order.occurrence as unknown as {
    occurrence_date: string;
    date_end: string | null;
    time_start: string | null;
    location_name: string | null;
    pack_name: string | null;
  } | null;

  if (!event || !occurrence) {
    console.error("[orderEmails] missing event/occurrence join for order:", orderId);
    return { ok: false, error: "Event/occurrence missing" } as const;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `https://${config.domain}`).replace(/\/$/, "");
  const eventUrl = `${siteUrl}/ofertas/${event.slug}`;
  const ticketsUrl =
    order.order_number && order.access_token
      ? `${siteUrl}/mis-entradas/${order.order_number}?t=${order.access_token}`
      : eventUrl;
  const orderNum = order.order_number || order.id.slice(0, 8).toUpperCase();

  const packName = order.pack_name || occurrence.pack_name || null;
  const isCamp = event.section === "campamentos";
  const occurrenceDate = occurrence.date_end
    ? `${formatOccurrenceDate(occurrence.occurrence_date)} – ${formatOccurrenceDate(occurrence.date_end)}`
    : formatOccurrenceDate(occurrence.occurrence_date);

  if (kind === "deposit_confirmed") {
    const waMessage = `Hola, tengo una pregunta sobre mi reserva ${orderNum}`;
    const whatsappUrl = buildWhatsAppUrl(waMessage, config.supportPhoneE164);
    const depositPercent = (order as { deposit_percent: number | null }).deposit_percent || 0;
    const depositAmt = Number((order as { deposit_amount: number | string | null }).deposit_amount || 0);
    const remainingAmt = Number((order as { remaining_amount: number | string | null }).remaining_amount || 0);
    const subjectLabel = packName ? `${orderNum} · ${packName}` : `${orderNum} · ${event.title}`;

    const result = await sendEmail({
      to: order.buyer_email,
      subject: `¡Plaza reservada! ${subjectLabel} — pagaste ${formatEuros(depositAmt)}`,
      react: OrderDepositConfirmedEmail({
        orderNumber: orderNum,
        buyerName: order.buyer_name,
        eventTitle: event.title,
        packName,
        isCamp,
        eventImageUrl: event.image_url,
        occurrenceDate,
        occurrenceTime: occurrence.time_start,
        venue: occurrence.location_name,
        attendees: (order.attendee_names as string[]) || [],
        quantity: order.quantity,
        totalFull: formatEuros(order.total_amount),
        depositPaid: formatEuros(depositAmt),
        remaining: formatEuros(remainingAmt),
        depositPercent,
        eventUrl,
        ticketsUrl,
        supportEmail: config.supportEmail,
        supportPhoneDisplay: config.supportPhoneDisplay,
        whatsappUrl,
      }),
      replyTo: config.supportEmail,
    });

    if (result.ok) {
      await supabase
        .from("orders")
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq("id", orderId);
      return { ok: true, id: result.id } as const;
    }
    return { ok: false, error: result.error || "Send failed" } as const;
  }

  if (kind === "confirmed") {
    const waMessage = `Hola, tengo una pregunta sobre mi pedido ${orderNum}`;
    const whatsappUrl = buildWhatsAppUrl(waMessage, config.supportPhoneE164);
    const subjectLabel = packName ? `${orderNum} · ${packName}` : `${orderNum} · ${event.title}`;
    const subjectPrefix = isCamp ? "¡Plaza confirmada en el campamento!" : "¡Reserva confirmada!";

    const result = await sendEmail({
      to: order.buyer_email,
      subject: `${subjectPrefix} ${subjectLabel}`,
      react: OrderConfirmedEmail({
        orderNumber: orderNum,
        buyerName: order.buyer_name,
        eventTitle: event.title,
        packName,
        isCamp,
        eventImageUrl: event.image_url,
        occurrenceDate,
        occurrenceTime: occurrence.time_start,
        venue: occurrence.location_name,
        attendees: (order.attendee_names as string[]) || [],
        quantity: order.quantity,
        total: formatEuros(order.total_amount),
        eventUrl,
        ticketsUrl,
        supportEmail: config.supportEmail,
        supportPhoneDisplay: config.supportPhoneDisplay,
        whatsappUrl,
      }),
      replyTo: config.supportEmail,
    });

    if (result.ok) {
      await supabase
        .from("orders")
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq("id", orderId);
      return { ok: true, id: result.id } as const;
    }
    return { ok: false, error: result.error || "Send failed" } as const;
  }

  // failed
  const waMessage = `Hola, mi pedido ${orderNum} no se pudo procesar. ¿Podéis ayudarme?`;
  const whatsappUrl = buildWhatsAppUrl(waMessage, config.supportPhoneE164);

  const failedSubject = isCamp
    ? `Tu reserva del campamento no se pudo completar · ${orderNum}`
    : `Tu pago no se pudo completar · ${orderNum}`;

  const result = await sendEmail({
    to: order.buyer_email,
    subject: failedSubject,
    react: OrderFailedEmail({
      orderNumber: orderNum,
      buyerName: order.buyer_name,
      eventTitle: event.title,
      isCamp,
      retryUrl: eventUrl,
      whatsappUrl,
      supportEmail: config.supportEmail,
      supportPhoneDisplay: config.supportPhoneDisplay,
    }),
    replyTo: config.supportEmail,
  });

  if (result.ok) {
    await supabase
      .from("orders")
      .update({ failure_email_sent_at: new Date().toISOString() })
      .eq("id", orderId);
    return { ok: true, id: result.id } as const;
  }
  return { ok: false, error: result.error || "Send failed" } as const;
}
