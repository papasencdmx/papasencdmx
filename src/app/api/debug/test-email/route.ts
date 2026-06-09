import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import OrderConfirmedEmail from "@/emails/OrderConfirmedEmail";
import OrderFailedEmail from "@/emails/OrderFailedEmail";
import { getCityConfig, buildWhatsAppUrl } from "@/config/city";

// Secret-gated endpoint to preview email templates with sample data.
// Hit: /api/debug/test-email?to=you@example.com&secret=<DEBUG_EMAIL_SECRET>
// Optional: &kind=camp_confirmed | camp_failed | event_confirmed | event_failed | all   (default: all)
//
// Guard: requires process.env.DEBUG_EMAIL_SECRET to be set and to match ?secret=.
// If the env var is missing, the endpoint is disabled entirely (safe by default).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");
  const kind = (searchParams.get("kind") || "all").toLowerCase();
  const secret = searchParams.get("secret") || "";

  const expected = process.env.DEBUG_EMAIL_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Disabled. Set DEBUG_EMAIL_SECRET env var to enable." },
      { status: 403 }
    );
  }
  // Constant-time-ish comparison.
  if (secret.length !== expected.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!to) {
    return NextResponse.json(
      { error: "Missing ?to=you@example.com" },
      { status: 400 }
    );
  }

  const config = getCityConfig();
  const whatsappUrl = buildWhatsAppUrl(
    "Hola, tengo una pregunta sobre mi pedido PCM-TEST",
    config.supportPhoneE164
  );

  const sentSummaries: Array<{ kind: string; ok: boolean; id?: string; error?: string }> = [];

  const variants: Array<{ key: string; run: () => Promise<void> }> = [
    {
      key: "camp_confirmed",
      run: async () => {
        const r = await sendEmail({
          to,
          subject: "¡Plaza confirmada en el campamento! PCM-TEST · Semana 1",
          react: OrderConfirmedEmail({
            orderNumber: "PCM-TEST",
            buyerName: "Sido Pérez",
            eventTitle: "Campamento de Alto Rendimiento Pumas",
            packName: "Semana 1",
            isCamp: true,
            eventImageUrl:
              "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&h=675&fit=crop",
            occurrenceDate: "domingo, 28 de junio de 2026 – sábado, 4 de julio de 2026",
            occurrenceTime: "09:30",
            venue: "Fundación Estudio Turismo y Deporte",
            attendees: ["Leo Pérez", "Marta Pérez"],
            quantity: 2,
            total: "2.500,00 $",
            eventUrl: "https://papasencdmx.com/ofertas/atletico-summer-camp",
            ticketsUrl: "https://papasencdmx.com/mis-entradas/PCM-TEST?t=xxx",
            supportEmail: config.supportEmail,
            supportPhoneDisplay: config.supportPhoneDisplay,
            whatsappUrl,
          }),
          replyTo: config.supportEmail,
        });
        sentSummaries.push({ kind: "camp_confirmed", ...r });
      },
    },
    {
      key: "camp_failed",
      run: async () => {
        const r = await sendEmail({
          to,
          subject: "Tu reserva del campamento no se pudo completar · PCM-TEST",
          react: OrderFailedEmail({
            orderNumber: "PCM-TEST",
            buyerName: "Sido Pérez",
            eventTitle: "Campamento de Alto Rendimiento Pumas",
            isCamp: true,
            retryUrl: "https://papasencdmx.com/ofertas/atletico-summer-camp",
            whatsappUrl,
            supportEmail: config.supportEmail,
            supportPhoneDisplay: config.supportPhoneDisplay,
          }),
          replyTo: config.supportEmail,
        });
        sentSummaries.push({ kind: "camp_failed", ...r });
      },
    },
    {
      key: "event_confirmed",
      run: async () => {
        const r = await sendEmail({
          to,
          subject: "¡Reserva confirmada! PCM-TEST · Cuentacuentos en el Retiro",
          react: OrderConfirmedEmail({
            orderNumber: "PCM-TEST",
            buyerName: "Sido Pérez",
            eventTitle: "Cuentacuentos en el Retiro",
            packName: null,
            isCamp: false,
            eventImageUrl:
              "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&h=675&fit=crop",
            occurrenceDate: "sábado, 18 de abril de 2026",
            occurrenceTime: "11:00",
            venue: "Parque del Retiro",
            attendees: ["Leo Pérez"],
            quantity: 1,
            total: "12,00 $",
            eventUrl: "https://papasencdmx.com/ofertas/cuentacuentos-retiro",
            ticketsUrl: "https://papasencdmx.com/mis-entradas/PCM-TEST?t=xxx",
            supportEmail: config.supportEmail,
            supportPhoneDisplay: config.supportPhoneDisplay,
            whatsappUrl,
          }),
          replyTo: config.supportEmail,
        });
        sentSummaries.push({ kind: "event_confirmed", ...r });
      },
    },
    {
      key: "event_failed",
      run: async () => {
        const r = await sendEmail({
          to,
          subject: "Tu pago no se pudo completar · PCM-TEST",
          react: OrderFailedEmail({
            orderNumber: "PCM-TEST",
            buyerName: "Sido Pérez",
            eventTitle: "Cuentacuentos en el Retiro",
            isCamp: false,
            retryUrl: "https://papasencdmx.com/ofertas/cuentacuentos-retiro",
            whatsappUrl,
            supportEmail: config.supportEmail,
            supportPhoneDisplay: config.supportPhoneDisplay,
          }),
          replyTo: config.supportEmail,
        });
        sentSummaries.push({ kind: "event_failed", ...r });
      },
    },
  ];

  const selected = kind === "all" ? variants : variants.filter((v) => v.key === kind);
  if (selected.length === 0) {
    return NextResponse.json(
      { error: `Unknown kind "${kind}". Use one of: ${variants.map((v) => v.key).join(", ")}, or "all"` },
      { status: 400 }
    );
  }

  for (const v of selected) await v.run();

  return NextResponse.json({ to, sent: sentSummaries });
}
