"use client";

import { useState, useEffect, useRef } from "react";
import { CalendarDays, Users, Lock, Loader2, Flag, Check } from "lucide-react";
import { trackEventInteraction } from "@/components/tracking/PageViewTracker";

interface Occ {
  id: string;
  occurrence_date: string;
  date_end?: string | null;
  time_start: string | null;
  time_end: string | null;
  location_name: string | null;
  pack_name?: string | null;
  pack_description?: string | null;
  price_override?: number | null;
  ticket_quantity: number | null;
  max_per_purchase: number | null;
  available: number;
}

interface Props {
  event: {
    id: string;
    title: string;
    slug: string;
    price_min: number | null;
    is_free: boolean;
  };
  occurrences: Occ[];
  discountPercent?: number | null;
  discountLabel?: string | null;
  depositPercent?: number | null;
}

function formatShort(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPill(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

export function CampamentoBookingCard({ event, occurrences, discountPercent, discountLabel, depositPercent }: Props) {
  const hasDeposit = !!depositPercent && depositPercent >= 5 && depositPercent <= 95;
  const [isDepositMode, setIsDepositMode] = useState(false);
  const hasDiscount = !!discountPercent && discountPercent > 0 && discountPercent <= 80;
  const applyDiscount = (price: number) => (hasDiscount ? Math.round(price * (1 - discountPercent! / 100) * 100) / 100 : price);
  const [selectedId, setSelectedId] = useState<string>(occurrences[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [attendeeNames, setAttendeeNames] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    setAttendeeNames((prev) => {
      if (prev.length === quantity) return prev;
      if (prev.length < quantity) return [...prev, ...Array(quantity - prev.length).fill("")];
      return prev.slice(0, quantity);
    });
  }, [quantity]);

  // Track abandoned checkouts: debounced upsert once the buyer has typed a
  // valid name + email. Removed server-side when the order is paid.
  useEffect(() => {
    const email = buyerEmail.trim();
    const name = buyerName.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk || !name || !selectedId) return;
    const t = setTimeout(() => {
      fetch("/api/abandoned-checkouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          occurrence_id: selectedId,
          buyer_name: name,
          buyer_email: email,
          buyer_phone: buyerPhone.trim() || null,
          attendee_names: attendeeNames.map((n) => n.trim()).filter(Boolean),
          quantity,
          notes: notes.trim() || null,
          pack_name: selected?.pack_name || null,
          stage: "form_fill",
        }),
        keepalive: true,
      }).catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerName, buyerEmail, buyerPhone, attendeeNames, notes, quantity, selectedId]);

  const selected = occurrences.find((o) => o.id === selectedId);
  const originalUnit = Number(selected?.price_override ?? event.price_min ?? 0);
  const unitPrice = applyDiscount(originalUnit);
  const subtotalOriginal = originalUnit * quantity;
  const subtotal = unitPrice * quantity;
  const discountAmount = subtotalOriginal - subtotal;
  const maxQty = selected ? Math.min(selected.max_per_purchase || 5, selected.available) : 1;

  const handleReserve = () => {
    if (!selected) return;
    if (!showForm) {
      trackEventInteraction(event.id, "reserve_click");
      setShowForm(true);
      setTimeout(() => {
        document.getElementById("booking-form-start")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
      return;
    }
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    trackEventInteraction(event.id, "pay_start");

    // Upgrade the abandoned-checkout row to stage=pay_click so we know they
    // actually tried to pay (more valuable lead than someone who only filled
    // the form).
    fetch("/api/abandoned-checkouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: event.id,
        occurrence_id: selectedId,
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim(),
        buyer_phone: buyerPhone.trim(),
        attendee_names: attendeeNames.map((n) => n.trim()),
        quantity,
        notes: notes.trim() || null,
        pack_name: selected?.pack_name || null,
        stage: "pay_click",
      }),
      keepalive: true,
    }).catch(() => {});

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occurrence_id: selectedId,
          quantity,
          buyer_name: buyerName.trim(),
          buyer_email: buyerEmail.trim(),
          buyer_phone: buyerPhone.trim(),
          attendee_names: attendeeNames.map((n) => n.trim()),
          notes: notes.trim() || undefined,
          is_deposit: hasDeposit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.details ? `${data.error}: ${data.details}` : data.error || "Error al procesar el pago");
        // Bump stage to pay_failed so admins know it's a hot recovery lead.
        fetch("/api/abandoned-checkouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: event.id,
            occurrence_id: selectedId,
            buyer_name: buyerName.trim(),
            buyer_email: buyerEmail.trim(),
            buyer_phone: buyerPhone.trim(),
            attendee_names: attendeeNames.map((n) => n.trim()),
            quantity,
            notes: notes.trim() || null,
            pack_name: selected?.pack_name || null,
            stage: "pay_failed",
          }),
          keepalive: true,
        }).catch(() => {});
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const canSubmit =
    showForm &&
    !!buyerName.trim() &&
    !!buyerEmail.trim() &&
    !!buyerPhone.trim() &&
    attendeeNames.every((n) => n.trim()) &&
    termsAccepted;

  const subtitleRange = selected
    ? selected.date_end
      ? `${formatShort(selected.occurrence_date)} – ${formatShort(selected.date_end)}`
      : formatShort(selected.occurrence_date)
    : "";

  const packLabel = selected?.pack_name || "Pack";

  return (
    <div className="rounded-3xl border border-warm-200 bg-white p-6 shadow-card">
      {/* Price header */}
      <div>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-3xl font-extrabold text-warm-900 leading-none tracking-tight">
            {event.is_free ? "Gratis" : `$$ {unitPrice}`}
          </span>
          {!event.is_free && hasDiscount && (
            <span className="text-base text-warm-400 line-through font-medium">
              $ {originalUnit}
            </span>
          )}
          {!event.is_free && (
            <span className="text-base font-medium text-warm-500">/ pack</span>
          )}
        </div>
        {hasDiscount && !event.is_free && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-red-500 text-white px-2 py-0.5 text-[11px] font-extrabold tracking-wide shadow-sm">
              −{discountPercent}%
            </span>
            {discountLabel && (
              <span className="inline-flex items-center rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-bold">
                {discountLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Title + date subtitle */}
      <div className="mt-4">
        <p className="text-[15px] font-bold text-warm-900 leading-tight">
          {packLabel} en {event.title}
        </p>
        {subtitleRange && (
          <p className="text-sm text-warm-500 mt-0.5 capitalize">{subtitleRange}</p>
        )}
      </div>

      {/* Pack selector — square cards, tap to select (hidden label when only 1 pack) */}
      <div className="mt-5">
        {occurrences.length > 1 && (
          <label className="block text-sm font-bold text-warm-900 mb-2.5">Elige tu pack</label>
        )}
        <div className="grid grid-cols-1 gap-2.5">
          {occurrences.map((o) => {
            const originalPrice = Number(o.price_override ?? event.price_min ?? 0);
            const price = applyDiscount(originalPrice);
            const startLabel = formatPill(o.occurrence_date);
            const endLabel = formatPill(o.date_end || o.occurrence_date);
            const range = o.date_end ? `${startLabel} – ${endLabel}` : startLabel;
            const isSoldOut = o.available <= 0;
            const active = o.id === selectedId;
            const isOnlyOne = occurrences.length === 1;
            return (
              <button
                key={o.id}
                type="button"
                disabled={isSoldOut || isOnlyOne}
                onClick={() => {
                  if (isOnlyOne) return;
                  setSelectedId(o.id);
                  setQuantity(1);
                }}
                aria-pressed={active}
                className={`relative w-full text-left rounded-2xl border-2 bg-white px-4 py-3.5 transition-all ${
                  isOnlyOne
                    ? "border-warm-200 cursor-default"
                    : active
                      ? "border-ocean-600 ring-4 ring-ocean-600/10 shadow-sm"
                      : "border-warm-200 hover:border-warm-300"
                } ${isSoldOut ? "opacity-40 cursor-not-allowed" : isOnlyOne ? "" : "cursor-pointer"}`}
              >
                {active && !isOnlyOne && (
                  <span
                    aria-hidden="true"
                    className="absolute top-3 right-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ocean-600 text-white shadow-sm"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warm-50 border border-warm-100">
                    <CalendarDays className="h-4 w-4 text-warm-600" />
                  </div>
                  <div className="min-w-0 flex-1 pr-7">
                    <p className="text-[15px] font-bold text-warm-900 leading-tight truncate">
                      {o.pack_name || "Pack"}
                    </p>
                    <p className="text-[13px] text-warm-500 mt-0.5 capitalize">{range}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-extrabold text-warm-900">$ {price}</span>
                      {hasDiscount && (
                        <>
                          <span className="text-[12px] text-warm-400 line-through">
                            $ {originalPrice}
                          </span>
                          <span className="inline-flex items-center rounded-md bg-red-500 text-white px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide">
                            −{discountPercent}%
                          </span>
                        </>
                      )}
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isSoldOut
                            ? "bg-red-50 text-red-600"
                            : o.available <= 4
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {isSoldOut
                          ? "Agotado"
                          : o.available <= 4
                            ? `Quedan ${o.available}`
                            : "Disponible"}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guest count */}
      {selected && (
        <div className="mt-4">
          <p className="text-[12px] font-bold text-warm-900 mb-1.5">Asistentes</p>
          <div className="flex items-center gap-2 rounded-full border border-warm-300 bg-white pl-4 pr-2 py-2">
            <Users className="h-4 w-4 text-warm-500 shrink-0" />
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              aria-label="Quitar asistente"
              className="h-10 w-10 rounded-full border border-warm-300 flex items-center justify-center text-warm-700 disabled:opacity-30 hover:bg-warm-100 active:scale-95 transition-all text-lg font-medium"
            >
              −
            </button>
            <span className="flex-1 text-center text-[15px] font-semibold text-warm-900 min-w-0 truncate">
              {quantity} asistente{quantity === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
              disabled={quantity >= maxQty}
              aria-label="Añadir asistente"
              className="h-10 w-10 rounded-full border border-warm-300 flex items-center justify-center text-warm-700 disabled:opacity-30 hover:bg-warm-100 active:scale-95 transition-all text-lg font-medium"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Reserve CTA */}
      {selected && !showForm && (
        <>
          {hasDeposit && selected.available > 0 ? (
            <div className="mt-5">
              {/* Deposit summary — single clear path */}
              <div className="rounded-2xl border border-warm-200 bg-white px-4 py-3.5 shadow-sm">
                <div className="flex items-baseline justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-warm-500">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    Pagas hoy para reservar
                  </span>
                  <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-extrabold text-red-600">
                    {depositPercent}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="font-display text-[26px] font-extrabold text-warm-900 leading-none tabular-nums">
                    $ {Math.round(subtotal * (depositPercent! / 100))}
                  </span>
                  <span className="text-[12px] text-warm-500">
                    de $ {subtotal}
                  </span>
                </div>
                <p className="mt-2.5 text-[12px] text-warm-600 leading-snug">
                  Apartas tu plaza al instante. Te contactamos en{" "}
                  <strong className="text-warm-800">24-48h</strong> para gestionar el resto del pago y resolver tus dudas.
                </p>
              </div>

              {/* Primary CTA */}
              <button
                type="button"
                onClick={() => {
                  setIsDepositMode(true);
                  handleReserve();
                }}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full bg-ocean-600 py-3.5 text-base font-bold text-white transition-all duration-200 shadow-[0_16px_32px_-10px_rgba(37,99,235,0.45)] hover:bg-ocean-700 hover:shadow-[0_22px_44px_-10px_rgba(37,99,235,0.6)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean-600/30"
              >
                <Lock className="h-4 w-4" />
                Reservar plaza · $ {Math.round(subtotal * (depositPercent! / 100))}
              </button>
              <p className="mt-2 text-center text-[12px] text-warm-500">
                No se te cobrará hasta confirmar tus datos
              </p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReserve}
                disabled={selected.available <= 0}
                className="mt-5 w-full rounded-full bg-ocean-600 py-3.5 text-base font-bold text-white transition-all duration-300 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.55)] hover:bg-ocean-700 hover:shadow-[0_25px_55px_-10px_rgba(37,99,235,0.7)] active:scale-[0.98] active:shadow-[0_10px_25px_-8px_rgba(37,99,235,0.4)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean-600/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {selected.available <= 0 ? "Agotado" : "Reservar"}
              </button>
              <p className="text-center text-[13px] text-warm-500 mt-3">No se te cobrará todavía</p>
            </>
          )}
        </>
      )}

      {/* Savings encouragement banner */}
      {selected && !event.is_free && hasDiscount && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/60 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-extrabold text-[12px] shadow-sm">
              −{discountPercent}%
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-extrabold text-emerald-900 leading-tight">
                ¡Ahorras $ {discountAmount.toFixed(2).replace(/\.00$/, "")} al reservar ahora!
              </p>
              {discountLabel && (
                <p className="text-[12px] text-emerald-700 mt-0.5">{discountLabel}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Breakdown */}
      {selected && !event.is_free && (
        <div className="mt-5 space-y-2.5 text-sm">
          <div className="flex items-center justify-between text-warm-700">
            <span className="underline underline-offset-2 decoration-warm-300">
              $ {originalUnit} × {quantity} asistente{quantity === 1 ? "" : "s"}
            </span>
            <span className="text-warm-900">$ {subtotalOriginal}</span>
          </div>
          {hasDiscount && (
            <div className="flex items-center justify-between text-emerald-700 font-semibold">
              <span>
                Descuento {discountLabel ? `(${discountLabel})` : ""} −{discountPercent}%
              </span>
              <span>−$ {discountAmount.toFixed(2).replace(".00", "")}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-warm-700">
            <span className="underline underline-offset-2 decoration-warm-300">Servicio</span>
            <span className="text-warm-900">0$</span>
          </div>
          <div className="rounded-2xl bg-warm-100 px-4 py-3 mt-3 flex items-center justify-between">
            <span className="text-[15px] font-semibold text-warm-900">Total antes de impuestos</span>
            <span className="text-[15px] font-extrabold text-warm-900">$ {subtotal}</span>
          </div>
        </div>
      )}

      {/* Expanded buyer form after clicking Reserve */}
      {showForm && selected && (
        <div id="booking-form-start" className="mt-6 pt-6 border-t border-warm-200 space-y-4">
          <div>
            <p className="text-sm font-bold text-warm-900 mb-2">Datos del comprador</p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nombre completo"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full rounded-full border border-warm-300 bg-white px-4 py-2.5 text-sm placeholder-warm-400 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 focus:outline-none transition-colors"
              />
              <input
                type="email"
                placeholder="Email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="w-full rounded-full border border-warm-300 bg-white px-4 py-2.5 text-sm placeholder-warm-400 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 focus:outline-none transition-colors"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className="w-full rounded-full border border-warm-300 bg-white px-4 py-2.5 text-sm placeholder-warm-400 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-warm-900 mb-2">Nombre de asistentes</p>
            <div className="space-y-2">
              {attendeeNames.map((name, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Asistente ${i + 1}`}
                  value={name}
                  onChange={(e) => {
                    const copy = [...attendeeNames];
                    copy[i] = e.target.value;
                    setAttendeeNames(copy);
                  }}
                  className="w-full rounded-full border border-warm-300 bg-white px-4 py-2.5 text-sm placeholder-warm-400 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 focus:outline-none transition-colors"
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-warm-900 mb-2">
              Notas <span className="font-normal text-warm-400">(opcional)</span>
            </p>
            <textarea
              placeholder="Alguna petición especial..."
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 300))}
              rows={2}
              className="w-full rounded-2xl border border-warm-300 bg-white px-4 py-2.5 text-sm placeholder-warm-400 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 focus:outline-none transition-colors resize-none"
            />
            <p className="text-[11px] text-warm-400 mt-1 text-right">{notes.length}/300</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          {/* Reassurance before paying */}
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
            <p className="text-[13px] font-bold text-emerald-900 leading-snug">
              Después del pago nos pondremos en contacto contigo para confirmar todos los detalles.
            </p>
            <p className="text-[12px] text-emerald-800/90 mt-1.5 leading-relaxed">
              Usaremos el <strong>email</strong> y el <strong>teléfono</strong> que nos facilitas
              arriba para contactarte por WhatsApp o por llamada. Revísalos antes de pagar para
              asegurar que los recibes bien.
            </p>
          </div>

          {/* Terms acceptance — required */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-warm-300 text-ocean-600 focus:ring-2 focus:ring-ocean-200 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[13px] text-warm-700 leading-snug">
              He leído y acepto los{" "}
              <a
                href="/terminos-compra"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ocean-700 hover:text-ocean-800 underline decoration-ocean-200 underline-offset-2"
              >
                Términos de compra
              </a>
              {" "}y la{" "}
              <a
                href="/politica-privacidad"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ocean-700 hover:text-ocean-800 underline decoration-ocean-200 underline-offset-2"
              >
                Política de privacidad
              </a>
              . Confirmo ser el padre, madre o tutor legal del asistente.
            </span>
          </label>

          {hasDeposit && (
            <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 px-3.5 py-2.5 flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Pagas hoy para reservar
                </p>
                <p className="text-[12px] text-emerald-800/80 mt-0.5">
                  Resto: $ {(subtotal - Math.round(subtotal * (depositPercent! / 100))).toFixed(2).replace(/\.00$/, "")} — te contactamos en 24-48h
                </p>
              </div>
              <span className="shrink-0 font-display text-[18px] font-extrabold text-emerald-700 tabular-nums">
                $ {Math.round(subtotal * (depositPercent! / 100))}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-ocean-600 py-3.5 text-base font-bold text-white transition-all duration-300 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.55)] hover:bg-ocean-700 hover:shadow-[0_25px_55px_-10px_rgba(37,99,235,0.7)] active:scale-[0.98] active:shadow-[0_10px_25px_-8px_rgba(37,99,235,0.4)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ocean-600/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {submitting
              ? "Procesando..."
              : hasDeposit
                ? `Reservar plaza · $$ {Math.round(subtotal * (depositPercent! / 100))}`
                : `Pagar $$ {subtotal}`}
          </button>

          <p className="text-[11px] text-warm-500 text-center leading-relaxed px-2">
            Al pagar aceptas que la cancelación y el reembolso se rigen por la{" "}
            <strong className="text-warm-700">política del organizador</strong>
            . Papás en CDMX actúa como plataforma y procesador de pagos.
            Servicio con fecha programada: el reembolso se rige por la política
            de cancelación del organizador.{" "}
            <a
              href="/terminos-compra#cancelacion"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-warm-300 underline-offset-2 hover:text-warm-800"
            >
              Ver términos
            </a>
            .
          </p>

          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="block w-full text-center text-[13px] text-warm-500 hover:text-warm-800 transition-colors"
          >
            Volver
          </button>
        </div>
      )}

      {/* Report */}
      <div className="mt-5 pt-5 border-t border-warm-100 flex items-center justify-center">
        <a
          href={`mailto:hola@papasencdmx.com?subject=${encodeURIComponent("Reportar anuncio: " + event.title)}`}
          className="inline-flex items-center gap-2 text-sm text-warm-600 hover:text-warm-900 transition-colors"
        >
          <Flag className="h-4 w-4" /> Reportar este anuncio
        </a>
      </div>

      {/* Mobile sticky CTA — reflects selected pack, hidden when form is open */}
      {selected && !showForm && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/98 backdrop-blur-sm border-t border-warm-200 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
          <button
            type="button"
            onClick={() => {
              trackEventInteraction(event.id, "reserve_click");
              document.getElementById("purchase-widget")?.scrollIntoView({ behavior: "smooth", block: "start" });
              setTimeout(() => setShowForm(true), 350);
            }}
            className="w-full flex items-center justify-between gap-3 rounded-full bg-ocean-600 pl-5 pr-2 py-2 shadow-[0_15px_35px_-10px_rgba(37,99,235,0.6)] active:scale-[0.99] transition-transform"
          >
            <div className="text-left min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[17px] font-extrabold text-white leading-none">
                  {event.is_free ? "Gratis" : `$$ {unitPrice}`}
                </span>
                {!event.is_free && hasDiscount && (
                  <span className="text-[12px] text-white/60 line-through leading-none">
                    $ {originalUnit}
                  </span>
                )}
                {hasDiscount && (
                  <span className="inline-flex items-center rounded-md bg-red-500 text-white px-1.5 py-0.5 text-[10px] font-extrabold leading-none">
                    −{discountPercent}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/80 mt-1 truncate capitalize">
                {(selected.pack_name ? selected.pack_name + " · " : "") + subtitleRange}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white text-ocean-700 px-4 py-2.5 text-[13px] font-bold shrink-0">
              Siguiente
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
