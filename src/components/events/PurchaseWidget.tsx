"use client";

import { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  Ticket,
  Users,
  Minus,
  Plus,
  Lock,
  Loader2,
  Shield,
} from "lucide-react";

interface PurchaseWidgetProps {
  event: {
    id: string;
    title: string;
    slug: string;
    price_min: number | null;
    is_free: boolean;
  };
  occurrences: Array<{
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
  }>;
}

export function PurchaseWidget({
  event,
  occurrences,
}: PurchaseWidgetProps) {
  const [selectedOcc, setSelectedOcc] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [attendeeNames, setAttendeeNames] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync attendeeNames array length with quantity
  useEffect(() => {
    setAttendeeNames((prev) => {
      if (prev.length === quantity) return prev;
      if (prev.length < quantity)
        return [...prev, ...Array(quantity - prev.length).fill("")];
      return prev.slice(0, quantity);
    });
  }, [quantity]);

  // When selectedOcc changes, reset quantity if it exceeds the new occurrence's limits
  useEffect(() => {
    if (!selectedOcc) return;
    const occ = occurrences.find((o) => o.id === selectedOcc);
    if (!occ) return;
    const maxQty = Math.min(occ.max_per_purchase || 5, occ.available);
    if (quantity > maxQty) {
      setQuantity(1);
    }
  }, [selectedOcc, occurrences, quantity]);

  const submittingRef = useRef(false);

  const handleSubmit = async () => {
    // Guard against double-clicks (ref is synchronous, state is async)
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occurrence_id: selectedOcc,
          quantity,
          buyer_name: buyerName.trim(),
          buyer_email: buyerEmail.trim(),
          buyer_phone: buyerPhone.trim(),
          attendee_names: attendeeNames.map((n) => n.trim()),
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.details ? `${data.error}: ${data.details}` : data.error || "Error al procesar el pago");
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }
      // Do NOT reset submitting — page is redirecting to Stripe checkout
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-warm-200 bg-white shadow-card overflow-hidden">
      <div className="p-5 sm:p-6 space-y-5">
        {/* 1. PRICE HEADER — reflects selected pack price when available */}
        {(() => {
          const selected = occurrences.find((o) => o.id === selectedOcc);
          const unitPrice = selected?.price_override ?? event.price_min;
          const hasPacks = occurrences.some((o) => o.pack_name);
          return (
            <div className="pb-4 border-b border-warm-100">
              <p className="text-xs text-warm-400 font-medium uppercase tracking-wider">
                {hasPacks ? "Precio del pack" : "Precio por entrada"}
              </p>
              <p className="text-3xl font-extrabold text-warm-900 mt-1 leading-none">
                {unitPrice ? `$$ {unitPrice}` : "Gratis"}
              </p>
            </div>
          );
        })()}

        {/* 2. DATE / PACK SELECTOR */}
        <div>
          <label className="block text-sm font-semibold text-warm-800 mb-2">
            <CalendarDays className="inline h-4 w-4 text-brand-500 mr-1" />
            {occurrences.some((o) => o.pack_name) ? "Elige tu pack" : "Selecciona fecha"}
          </label>
          <div className="space-y-2">
            {occurrences.map((occ) => {
              const isSoldOut = occ.available <= 0;
              const isSelected = selectedOcc === occ.id;
              const isPack = !!occ.pack_name;
              const dateFormatted = new Date(
                occ.occurrence_date + "T00:00:00"
              ).toLocaleDateString("es-MX", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const endDateFormatted = occ.date_end
                ? new Date(occ.date_end + "T00:00:00").toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                  })
                : null;
              return (
                <button
                  key={occ.id}
                  onClick={() => !isSoldOut && setSelectedOcc(occ.id)}
                  disabled={isSoldOut}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                      : isSoldOut
                        ? "border-warm-100 bg-warm-50 opacity-60 cursor-not-allowed"
                        : "border-warm-200 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {isPack ? (
                        <>
                          <p className="text-sm font-bold text-warm-900 truncate">
                            {occ.pack_name}
                          </p>
                          <p className="text-xs text-warm-600 mt-0.5 capitalize">
                            {dateFormatted}{endDateFormatted ? ` – ${endDateFormatted}` : ""}
                          </p>
                          {occ.time_start && (
                            <p className="text-[11px] text-warm-500 mt-0.5">
                              Horario diario {occ.time_start}
                              {occ.time_end ? ` – ${occ.time_end}` : ""}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-warm-900 capitalize">
                            {dateFormatted}
                          </p>
                          {occ.time_start && (
                            <p className="text-xs text-warm-500 mt-0.5">
                              {occ.time_start}
                              {occ.time_end ? ` – ${occ.time_end}` : ""}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {occ.price_override != null && (
                        <span className="text-sm font-bold text-warm-900">
                          $ {Number(occ.price_override)}
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          isSoldOut
                            ? "bg-red-50 text-red-600"
                            : occ.available <= 4
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {isSoldOut
                          ? "Agotado"
                          : occ.available <= 4
                            ? `Quedan ${occ.available}`
                            : "Disponible"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. QUANTITY SELECTOR — only show when a date is selected */}
        {selectedOcc &&
          (() => {
            const occ = occurrences.find((o) => o.id === selectedOcc);
            const maxQty = occ
              ? Math.min(occ.max_per_purchase || 5, occ.available)
              : 1;
            return (
              <div className="pb-4 border-b border-warm-100">
                <label className="block text-sm font-semibold text-warm-800 mb-2">
                  <Ticket className="inline h-4 w-4 text-brand-500 mr-1" />
                  Cantidad
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 rounded-lg border border-warm-200 flex items-center justify-center text-warm-600 hover:bg-warm-50 disabled:opacity-40 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-lg font-bold text-warm-900 w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(maxQty, quantity + 1))
                    }
                    disabled={quantity >= maxQty}
                    className="w-9 h-9 rounded-lg border border-warm-200 flex items-center justify-center text-warm-600 hover:bg-warm-50 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-warm-400 ml-2">
                    Máx. {maxQty}
                  </span>
                </div>
              </div>
            );
          })()}

        {/* 4. BUYER FORM — only show when date selected */}
        {selectedOcc && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-warm-800">
              Datos del comprador
            </p>
            <input
              type="text"
              placeholder="Nombre completo"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="input-field text-sm py-2.5"
            />
            <input
              type="email"
              placeholder="Email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              className="input-field text-sm py-2.5"
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className="input-field text-sm py-2.5"
            />
          </div>
        )}

        {/* 5. ATTENDEE NAMES — one per ticket */}
        {selectedOcc && quantity > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-warm-800">
              <Users className="inline h-4 w-4 text-brand-500 mr-1" />
              Nombre de asistentes
            </p>
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
                className="input-field text-sm py-2.5"
              />
            ))}
          </div>
        )}

        {/* 6. NOTES */}
        {selectedOcc && (
          <div>
            <label className="block text-sm font-semibold text-warm-800 mb-1">
              Notas{" "}
              <span className="font-normal text-warm-400">(opcional)</span>
            </label>
            <textarea
              placeholder="Alguna petición especial..."
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 300))}
              rows={2}
              className="input-field text-sm py-2.5 resize-none"
            />
            <p className="text-xs text-warm-400 mt-1 text-right">
              {notes.length}/300
            </p>
          </div>
        )}

        {/* 7. ERROR */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 8. TOTAL + CTA */}
        {selectedOcc && (() => {
          const selected = occurrences.find((o) => o.id === selectedOcc);
          const unit = Number(selected?.price_override ?? event.price_min ?? 0);
          const total = unit * quantity;
          const isPack = !!selected?.pack_name;
          return (
          <div className="pt-4 border-t border-warm-100 space-y-3">
            {unit > 0 && quantity > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-warm-500">
                  {quantity} × $ {unit}
                </span>
                <span className="font-bold text-warm-900">
                  $ {total.toFixed(2)}
                </span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={
                submitting ||
                !buyerName ||
                !buyerEmail ||
                !buyerPhone ||
                attendeeNames.some((n) => !n.trim())
              }
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-ocean-600 px-6 py-3.5 text-base font-bold text-white hover:bg-ocean-700 active:scale-[0.98] transition-all shadow-md shadow-ocean-600/20 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400 focus-visible:ring-offset-2"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {submitting
                ? "Procesando..."
                : `${isPack ? "Reservar" : "Pagar"} $$ {total.toFixed(2)}`}
            </button>
          </div>
          );
        })()}

        {/* 9. TRUST INDICATORS */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-warm-400 pt-2">
          <Shield className="h-3.5 w-3.5" />
          <span>Pago seguro · Entrada en 1-5 horas</span>
        </div>
      </div>
    </div>
  );
}
