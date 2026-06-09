"use client";

import { useEffect, useState } from "react";
import { Flame, Timer, Sparkles } from "lucide-react";

/**
 * Marketing-only count-up ticker: climbs 5% → 30%, pauses at the top,
 * resets, and loops forever. Values are decorative — the real discount
 * per event is displayed on each card.
 */
const MIN = 5;
const MAX = 30;

export function DiscountTicker() {
  const [value, setValue] = useState(MIN);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      setValue((v) => {
        if (v >= MAX) {
          // Pause at MAX, then reset to MIN
          timer = setTimeout(tick, 1200);
          return MIN;
        }
        const next = v + 1;
        // Pause briefly at each round number (10, 15, 20, 25)
        const isMilestone = next % 5 === 0 && next !== MAX;
        timer = setTimeout(tick, isMilestone ? 380 : 110);
        return next;
      });
    };

    timer = setTimeout(tick, 110);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {/* Main count-up pill */}
      <div
        className="relative inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 shadow-[0_8px_32px_-8px_rgba(220,38,38,0.55)] ring-1 ring-white/20 overflow-hidden"
        style={{
          background:
            "linear-gradient(110deg, #b91c1c 0%, #e11d48 45%, #dc2626 55%, #b91c1c 100%)",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer"
          style={{ backgroundSize: "220% 100%" }}
        />
        <Flame
          className="relative h-4 w-4 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)] animate-pulse"
          aria-hidden="true"
        />
        <span className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-white/90">
          Hasta
        </span>
        <span
          className="relative font-extrabold text-white tabular-nums leading-none"
          style={{
            fontSize: "26px",
            textShadow: "0 1px 0 rgba(0,0,0,0.15)",
            minWidth: "70px",
          }}
        >
          −{value}%
        </span>
      </div>

      {/* Social proof chip */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-2 text-[12px] font-semibold text-white/90">
        <Timer className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
        Ofertas nuevas cada semana
      </div>

      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-amber-300">
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        Solo comunidad
      </span>
    </div>
  );
}
