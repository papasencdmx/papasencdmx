"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarDays,
  MapPin,
  Ticket,
  ArrowLeft,
  Copy,
  Check,
  MessageCircle,
  Mail,
  CalendarPlus,
  Printer,
  AlertTriangle,
} from "lucide-react";

interface OrderData {
  id: string;
  order_number: string | null;
  access_token: string | null;
  buyer_name: string;
  buyer_email: string;
  quantity: number;
  total_amount: number;
  attendee_names: string[];
  payment_status: string;
  payment_provider: string | null;
  pack_name: string | null;
  event?: { title: string; slug: string; image_url?: string | null; price_min: number | null; section?: string | null };
  occurrence?: { occurrence_date: string; date_end?: string | null; time_start: string | null; location_name: string | null; pack_name?: string | null };
}

// Pulled from public env so client can render without extra API call.
const SUPPORT_PHONE_E164 = process.env.NEXT_PUBLIC_SUPPORT_PHONE_E164 || "+525555555555";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hola@papasencdmx.com";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPhoneDisplay(e164: string): string {
  const digits = e164.replace(/^\+/, "");
  if (digits.startsWith("52") && digits.length === 12) {
    const rest = digits.slice(2);
    return `+52 ${rest.slice(0, 2)} ${rest.slice(2, 6)} ${rest.slice(6)}`;
  }
  return e164;
}

function whatsappUrl(message: string): string {
  const phone = SUPPORT_PHONE_E164.replace(/^\+/, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function ConfirmacionPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) { setError(true); setLoading(false); return; }
    try {
      const res = await fetch(`/api/payments/${orderId}`);
      if (!res.ok) { setError(true); setLoading(false); return; }
      const data = await res.json();
      setOrder(data.order);
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Poll for pending status (max 5 min)
  const [pollCount, setPollCount] = useState(0);
  const [pollTimedOut, setPollTimedOut] = useState(false);

  useEffect(() => {
    if (!order || order.payment_status !== "pending" || pollTimedOut) return;
    const interval = setInterval(async () => {
      setPollCount((c) => {
        if (c >= 100) { setPollTimedOut(true); clearInterval(interval); return c; }
        return c + 1;
      });
      try {
        const res = await fetch(`/api/payments/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
          if (data.order.payment_status !== "pending") clearInterval(interval);
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [order, orderId, pollTimedOut]);

  const orderRef = order?.order_number || (order ? `#${order.id.slice(0, 8).toUpperCase()}` : "");
  const copyOrderRef = () => {
    if (!orderRef) return;
    navigator.clipboard.writeText(orderRef).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ── Loading ─────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="bg-warm-50 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin mb-4" />
        <p className="text-warm-700 font-medium">Cargando tu pedido…</p>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────────────── */
  if (error || !order) {
    return (
      <div className="bg-warm-50 min-h-screen">
        <div className="container-padres py-16 text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-warm-900">Pedido no encontrado</h1>
          <p className="text-warm-500 mt-2">No hemos podido encontrar este pedido.</p>
          <Link href="/ofertas" className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-brand-500 hover:text-brand-600">
            <ArrowLeft className="h-4 w-4" /> Volver a eventos
          </Link>
        </div>
      </div>
    );
  }

  const slug = order.event?.slug || "";
  const isCamp = order.event?.section === "campamentos";
  const terms = isCamp
    ? {
        backToSection: "Volver a campamentos",
        backToSectionUrl: "/ofertas/campamentos",
        backToItem: "Volver al campamento",
        eventNotFound: "No hemos podido encontrar esta reserva.",
        ticketNoun: (n: number) => `${n} plaza${n > 1 ? "s" : ""}`,
        attendeesHeader: (n: number) => `Asistente${n > 1 ? "s" : ""}`,
        ticketsCta: "Ver mi reserva",
        notFoundBack: "Volver a campamentos",
        notFoundBackUrl: "/ofertas/campamentos",
      }
    : {
        backToSection: "Volver a eventos",
        backToSectionUrl: "/ofertas",
        backToItem: "Volver al evento",
        eventNotFound: "No hemos podido encontrar este pedido.",
        ticketNoun: (n: number) => `${n} entrada${n > 1 ? "s" : ""}`,
        attendeesHeader: (n: number) => `Asistente${n > 1 ? "s" : ""}`,
        ticketsCta: "Ver mis entradas",
        notFoundBack: "Volver a eventos",
        notFoundBackUrl: "/ofertas",
      };

  /* ── Pending ─────────────────────────────────────────────────────── */
  if (order.payment_status === "pending") {
    return (
      <div className="bg-warm-50 min-h-screen">
        <div className="container-padres py-16 max-w-lg mx-auto">
          <div className="rounded-3xl border border-warm-200 bg-white p-8 text-center shadow-card">
            {pollTimedOut ? (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
                <h1 className="font-display text-2xl font-bold text-warm-900">El pago está tardando más de lo esperado</h1>
                <p className="text-warm-500 mt-3 leading-relaxed">
                  Si has completado el pago, recibirás la confirmación por email en breve. Si no, puedes intentarlo de nuevo.
                </p>
                <Link href={`/ofertas/${slug}`} className="inline-flex items-center gap-2 mt-6 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-all shadow-md shadow-brand-500/20">
                  {terms.backToItem}
                </Link>
              </>
            ) : (
              <>
                <Loader2 className="h-14 w-14 text-brand-500 animate-spin mx-auto mb-6" />
                <h1 className="font-display text-2xl font-bold text-warm-900">Estamos confirmando tu pago…</h1>
                <p className="text-warm-500 mt-3 leading-relaxed">
                  Esto puede tardar unos segundos. No cierres esta página.
                </p>
                <p className="text-xs text-warm-400 mt-6">Intento {pollCount + 1}</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Failed / Expired ────────────────────────────────────────────── */
  if (order.payment_status === "failed" || order.payment_status === "expired" || order.payment_status === "cancelled") {
    const failureReason =
      order.payment_status === "expired"
        ? "El tiempo para completar el pago ha expirado."
        : order.payment_status === "cancelled"
          ? "El pedido ha sido cancelado."
          : "Tu banco ha rechazado el cargo. Esto suele ser por fondos insuficientes o una tarjeta bloqueada.";

    const waMessage = `Hola, mi pedido ${orderRef} no se pudo procesar. ¿Podéis ayudarme?`;

    return (
      <div className="bg-warm-50 min-h-screen">
        <div className="container-padres py-10 sm:py-16 max-w-xl mx-auto">
          <div className="rounded-3xl border border-red-200 bg-white overflow-hidden shadow-card">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-4">
                <XCircle className="h-9 w-9 text-white" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {isCamp ? "Tu reserva no se completó" : "El pago no se completó"}
              </h1>
              <p className="text-white/90 mt-3 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                {failureReason} <strong>No te hemos cobrado nada.</strong>
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              <div className="rounded-xl bg-warm-50 border border-warm-200 p-4 text-center">
                <p className="text-[11px] font-semibold text-warm-500 uppercase tracking-widest mb-1">Pedido</p>
                <p className="text-lg font-mono font-bold text-warm-900">{orderRef}</p>
              </div>

              <div className="grid gap-2">
                <Link
                  href={`/ofertas/${slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white hover:bg-brand-600 transition-all shadow-md shadow-brand-500/20"
                >
                  {isCamp ? "Reintentar la reserva" : "Reintentar el pago"}
                </Link>
                <a
                  href={whatsappUrl(waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  Hablar con soporte por WhatsApp
                </a>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-warm-500">O escríbenos a</p>
                <a href={`mailto:${SUPPORT_EMAIL}?subject=Pedido ${orderRef}`} className="inline-flex items-center gap-1.5 mt-1 text-sm font-semibold text-brand-500 hover:text-brand-600">
                  <Mail className="h-3.5 w-3.5" /> {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/ofertas" className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-500 hover:text-brand-500">
              <ArrowLeft className="h-4 w-4" /> Volver a Planes familiares
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Success ─────────────────────────────────────────────────────── */
  const ticketsUrl =
    order.order_number && order.access_token
      ? `/mis-entradas/${order.order_number}?t=${order.access_token}`
      : null;
  const waMessage = `Hola, tengo una pregunta sobre mi pedido ${orderRef}`;

  return (
    <div className="bg-warm-50 min-h-screen">
      <div className="container-padres py-10 sm:py-14 max-w-2xl mx-auto">
        {/* Hero success card */}
        <div className="rounded-3xl overflow-hidden shadow-card border border-warm-200 mb-6">
          <div className="relative bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-900 text-white p-8 sm:p-10 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10" aria-hidden="true">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-400 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-400 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
            </div>

            <div className="relative">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-9 w-9 text-white" strokeWidth={2.5} />
              </div>
              <p className="text-[11px] font-semibold text-brand-300 uppercase tracking-widest mb-2">Reserva confirmada</p>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight">
                ¡Gracias, {order.buyer_name.split(" ")[0]}!
              </h1>
              <p className="text-ocean-200 mt-3 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                Te hemos enviado los detalles a <strong className="text-white">{order.buyer_email}</strong>.
                {isCamp && (
                  <>
                    {" "}Te llamaremos en las <strong className="text-white">próximas 24h</strong> para
                    confirmar todos los detalles del campamento.
                  </>
                )}
              </p>

              <button
                onClick={copyOrderRef}
                className="group mt-6 inline-flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/20 px-5 py-3 hover:bg-white/20 transition-all"
                title="Copiar número de pedido"
              >
                <span className="text-[11px] font-semibold text-ocean-200 uppercase tracking-widest">Pedido</span>
                <span className="font-mono font-bold tracking-wider text-white">{orderRef}</span>
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/60 group-hover:text-white/90" />}
              </button>
            </div>
          </div>

          {/* Event summary */}
          <div className="bg-white p-6 sm:p-7 space-y-5">
            {order.event?.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.event.image_url} alt="" className="w-full aspect-[16/9] rounded-xl object-cover" />
            )}
            <div>
              <h2 className="font-display text-xl font-bold text-warm-900 leading-tight">
                {order.event?.title}
              </h2>
              {(order.pack_name || order.occurrence?.pack_name) && (
                <p className="mt-1 text-[12px] font-bold uppercase tracking-widest text-brand-500">
                  Pack: {order.pack_name || order.occurrence?.pack_name}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              {order.occurrence?.occurrence_date && (
                <p className="flex items-start gap-2.5 text-sm text-warm-700">
                  <CalendarDays className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                  <span>
                    <span className="capitalize">{formatDate(order.occurrence.occurrence_date)}</span>
                    {order.occurrence.date_end && (
                      <span> – <span className="capitalize">{formatDate(order.occurrence.date_end)}</span></span>
                    )}
                    {order.occurrence.time_start && <span className="text-warm-500"> · {order.occurrence.time_start}</span>}
                  </span>
                </p>
              )}
              {order.occurrence?.location_name && (
                <p className="flex items-start gap-2.5 text-sm text-warm-700">
                  <MapPin className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                  {order.occurrence.location_name}
                </p>
              )}
              <p className="flex items-start gap-2.5 text-sm text-warm-700">
                <Ticket className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                {terms.ticketNoun(order.quantity)} · $ {Number(order.total_amount).toFixed(2).replace(".", ",")}
              </p>
            </div>

            {order.attendee_names?.length > 0 && (
              <div className="rounded-xl bg-warm-50 border border-warm-100 p-4">
                <p className="text-[11px] font-semibold text-warm-500 uppercase tracking-widest mb-2">
                  Asistente{order.quantity > 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {order.attendee_names.map((name, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-warm-200 text-[13px] text-warm-800">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cancellation info — always visible after paying */}
        <div className="mb-6 rounded-2xl border border-warm-200 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-warm-500">
            ¿Necesitas cambiar tu reserva?
          </p>
          <p className="mt-1.5 text-[14px] text-warm-800 leading-relaxed">
            La política de cancelación y reembolso la establece el{" "}
            <strong>organizador</strong> de la actividad. Escríbenos y
            gestionamos tu solicitud con ellos.
          </p>
          <p className="mt-2 text-[14px] text-warm-800 leading-relaxed">
            Escribe a{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Cambio/cancelación pedido ${orderRef}`}
              className="font-semibold text-brand-600 hover:text-brand-500 underline decoration-brand-200 underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            con tu número de pedido (<strong>{orderRef}</strong>) y el motivo
            de la solicitud.
          </p>
          <Link
            href="/terminos-compra#cancelacion"
            className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-warm-600 hover:text-warm-900 underline decoration-warm-300 underline-offset-2"
          >
            Ver cómo funciona →
          </Link>
        </div>

        {/* Next steps — campamentos only */}
        {isCamp && (
          <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
              Próximos pasos
            </p>
            <p className="mt-1.5 text-[15px] font-bold text-warm-900 leading-snug">
              Te llamaremos en las próximas 24 horas.
            </p>
            <p className="mt-2 text-sm text-warm-700 leading-relaxed">
              Un miembro de nuestro equipo se pondrá en contacto contigo por{" "}
              <strong>WhatsApp</strong> o por teléfono al número que nos has
              facilitado, para confirmar todos los detalles del campamento
              (hora de llegada, comidas, alergias, equipación, emergencia y
              cualquier otra información importante sobre tu hijo/a).
            </p>
            <p className="mt-2 text-[13px] text-warm-600">
              Tu plaza está{" "}
              <strong className="text-emerald-700">reservada y garantizada</strong>.
              Esta llamada es solo para asegurar que todo salga perfecto el primer día.
            </p>
          </div>
        )}

        {/* CTA grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
          {ticketsUrl && (
            <Link
              href={ticketsUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-all shadow-md shadow-brand-500/20"
            >
              <Printer className="h-4 w-4" /> {terms.ticketsCta}
            </Link>
          )}
          <a
            href={`/api/ics/${order.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-warm-200 px-4 py-3 text-sm font-semibold text-warm-800 hover:bg-warm-50 hover:border-warm-300 transition-all"
          >
            <CalendarPlus className="h-4 w-4" /> Añadir al calendario
          </a>
          <Link
            href={terms.backToSectionUrl}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-warm-200 px-4 py-3 text-sm font-semibold text-warm-600 hover:bg-warm-50 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> {terms.backToSection}
          </Link>
        </div>

        {/* Support strip */}
        <div className="rounded-2xl bg-emerald-50/80 border border-emerald-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">¿Necesitas ayuda?</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {formatPhoneDisplay(SUPPORT_PHONE_E164)} · {SUPPORT_EMAIL}
              </p>
            </div>
          </div>
          <a
            href={whatsappUrl(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 transition-all shrink-0"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
