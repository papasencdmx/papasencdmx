import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { createServerClient } from "@/lib/supabase";
import { CalendarDays, MapPin, Ticket, ArrowLeft } from "lucide-react";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Mis entradas",
  robots: { index: false, follow: false },
};

interface OrderRow {
  id: string;
  order_number: string;
  access_token: string;
  quantity: number;
  attendee_names: string[] | null;
  buyer_name: string;
  total_amount: number;
  payment_status: string;
  pack_name: string | null;
  event: { title: string; slug: string; image_url: string | null } | null;
  occurrence: {
    occurrence_date: string;
    date_end: string | null;
    time_start: string | null;
    time_end: string | null;
    location_name: string | null;
    street_address: string | null;
    pack_name: string | null;
  } | null;
}

async function fetchOrder(orderNumber: string): Promise<OrderRow | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_number, access_token, quantity, attendee_names, buyer_name, total_amount, payment_status, pack_name, event:events(title, slug, image_url), occurrence:event_occurrences(occurrence_date, date_end, time_start, time_end, location_name, street_address, pack_name)"
    )
    .eq("order_number", orderNumber)
    .single();
  return data as unknown as OrderRow | null;
}

// Constant-time comparison to avoid timing attacks on token lookup.
function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function MisEntradasPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { orderNumber } = await params;
  const { t } = await searchParams;

  if (!t) notFound();

  const order = await fetchOrder(orderNumber);
  if (!order || !order.event || !order.occurrence) notFound();
  if (!order.access_token || !safeEq(order.access_token, t)) notFound();

  const paid = order.payment_status === "paid";
  const attendees = order.attendee_names || [];
  const tickets = attendees.length > 0 ? attendees : Array(order.quantity).fill(order.buyer_name);

  // QR codes are generated server-side from trusted data (our own order numbers).
  const qrSvgs = await Promise.all(
    tickets.map((_, i) =>
      QRCode.toString(`${order.order_number}-${i + 1}`, {
        type: "svg",
        margin: 1,
        width: 220,
        color: { dark: "#272E2F", light: "#FFFFFF" },
      })
    )
  );

  return (
    <div className="bg-warm-50 min-h-screen">
      <div className="print:hidden bg-white border-b border-warm-200 sticky top-0 z-10">
        <div className="container-padres py-3 flex items-center justify-between">
          <Link href={`/ofertas/${order.event.slug}/confirmacion?order=${order.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-600 hover:text-brand-500" rel="nofollow">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="container-padres py-8 print:py-0 max-w-2xl mx-auto">
        {!paid && (
          <div className="print:hidden mb-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            Este pedido aún no está pagado. Tus entradas se activarán cuando el pago esté confirmado.
          </div>
        )}

        {tickets.map((name, i) => (
          <div
            key={i}
            className="mb-5 rounded-2xl border border-warm-200 bg-white overflow-hidden shadow-card print:shadow-none print:border-warm-300 print:break-after-page"
          >
            <div className="flex flex-col sm:flex-row">
              <div className="flex-1 p-5 sm:p-6">
                <p className="text-[11px] font-semibold text-brand-500 uppercase tracking-widest">
                  Entrada {i + 1} de {tickets.length}
                </p>
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-warm-900 leading-tight mt-1">
                  {order.event!.title}
                </h1>
                {(order.pack_name || order.occurrence?.pack_name) && (
                  <p className="mt-1 text-[12px] font-bold uppercase tracking-widest text-brand-500">
                    Pack: {order.pack_name || order.occurrence?.pack_name}
                  </p>
                )}

                <div className="mt-4 space-y-2 text-sm">
                  <p className="flex items-start gap-2 text-warm-700">
                    <CalendarDays className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                    <span className="capitalize">
                      {formatDate(order.occurrence!.occurrence_date)}
                      {order.occurrence!.date_end ? ` – ${formatDate(order.occurrence!.date_end)}` : ""}
                      {order.occurrence!.time_start ? ` · ${order.occurrence!.time_start}` : ""}
                    </span>
                  </p>
                  {order.occurrence!.location_name && (
                    <p className="flex items-start gap-2 text-warm-700">
                      <MapPin className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                      <span>
                        {order.occurrence!.location_name}
                        {order.occurrence!.street_address ? (
                          <span className="block text-warm-500 text-xs">{order.occurrence!.street_address}</span>
                        ) : null}
                      </span>
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-warm-100">
                  <p className="text-[11px] font-semibold text-warm-500 uppercase tracking-widest">Asistente</p>
                  <p className="text-lg font-bold text-warm-900 mt-0.5">{name}</p>
                </div>
              </div>

              <div className="sm:w-[240px] bg-warm-50 p-5 sm:p-6 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-warm-200">
                <div
                  className="w-[200px] h-[200px] bg-white rounded-lg p-2 flex items-center justify-center"
                  // QR SVG is generated server-side by `qrcode` from trusted order data — safe to inject.
                  dangerouslySetInnerHTML={{ __html: qrSvgs[i] }}
                />
                <p className="text-[10px] text-warm-500 uppercase tracking-widest mt-3">Pedido</p>
                <p className="text-sm font-mono font-bold text-warm-900">{order.order_number}</p>
                <p className="text-[10px] text-warm-400 mt-0.5">{i + 1} / {tickets.length}</p>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-3 bg-warm-50 border-t border-warm-100 text-[11px] text-warm-500">
              <span className="inline-flex items-center gap-1.5">
                <Ticket className="w-3 h-3" /> Papás en CDMX
              </span>
              <span>Presenta esta entrada a la entrada del evento</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
