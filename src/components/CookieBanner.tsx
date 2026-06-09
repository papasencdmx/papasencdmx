"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "pem_cookie_consent";

type Consent = "accepted" | "rejected";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable — do nothing
    }
  }, []);

  const decide = (consent: Consent) => {
    try {
      localStorage.setItem(STORAGE_KEY, consent);
      localStorage.setItem(`${STORAGE_KEY}_date`, new Date().toISOString());
      // Notify other parts of the app (e.g. GA loader) that consent changed
      window.dispatchEvent(new CustomEvent("pem:consent", { detail: consent }));
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-warm-200 bg-white shadow-2xl shadow-black/10 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          {/* Icon + text (inline on mobile + desktop) */}
          <div className="flex flex-1 items-start gap-3 sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 sm:h-11 sm:w-11">
              <Cookie className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="flex-1 text-sm text-warm-600 leading-relaxed">
              Usamos cookies para mejorar tu experiencia y analizar el uso del
              sitio. Puedes aceptarlas o rechazarlas. Más información en nuestra{" "}
              <Link
                href="/politica-privacidad"
                className="font-semibold text-brand-500 underline-offset-2 hover:underline"
              >
                política de privacidad
              </Link>
              .
            </p>
          </div>

          {/* Actions (full width on mobile, inline on desktop) */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => decide("rejected")}
              className="flex-1 sm:flex-none rounded-lg border border-warm-200 px-3 py-2 text-sm font-semibold text-warm-600 transition-colors hover:bg-warm-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-300"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => decide("accepted")}
              className="flex-1 sm:flex-none rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
            >
              Aceptar
            </button>
            <button
              type="button"
              onClick={() => decide("rejected")}
              aria-label="Cerrar aviso"
              className="ml-1 hidden h-8 w-8 items-center justify-center rounded-lg text-warm-400 transition-colors hover:bg-warm-50 hover:text-warm-600 sm:flex"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
