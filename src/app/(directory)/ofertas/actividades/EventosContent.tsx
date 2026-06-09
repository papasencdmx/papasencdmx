"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Loader2, X, SlidersHorizontal } from "lucide-react";
import { EventCard, EventCardSkeleton } from "@/components/events/EventCard";
import { CampamentoCard, CampamentoCardSkeleton } from "@/components/events/CampamentoCard";
import type { Event, EventCategory } from "@/types";

type Section = "actividades" | "colegios" | "campamentos";

interface EventosContentProps {
  initialEvents: Event[];
  initialTotal: number;
  eventCategories: EventCategory[];
  section?: Section;
}

const CATEGORY_CONFIG: Record<string, { icon: string; bg: string; bgActive: string; border: string }> = {
  teatro: { icon: "\uD83C\uDFAD", bg: "bg-rose-50", bgActive: "bg-rose-600", border: "border-rose-200 hover:border-rose-300" },
  musica: { icon: "\uD83C\uDFB5", bg: "bg-violet-50", bgActive: "bg-violet-600", border: "border-violet-200 hover:border-violet-300" },
  talleres: { icon: "\uD83C\uDFA8", bg: "bg-amber-50", bgActive: "bg-amber-600", border: "border-amber-200 hover:border-amber-300" },
  "aire-libre": { icon: "\u2600\uFE0F", bg: "bg-emerald-50", bgActive: "bg-emerald-600", border: "border-emerald-200 hover:border-emerald-300" },
  espectaculos: { icon: "\u2728", bg: "bg-purple-50", bgActive: "bg-purple-600", border: "border-purple-200 hover:border-purple-300" },
  deportes: { icon: "\u26BD", bg: "bg-sky-50", bgActive: "bg-sky-600", border: "border-sky-200 hover:border-sky-300" },
  cine: { icon: "\uD83C\uDFAC", bg: "bg-slate-50", bgActive: "bg-slate-600", border: "border-slate-200 hover:border-slate-300" },
  "ferias-y-mercados": { icon: "\uD83C\uDFAA", bg: "bg-orange-50", bgActive: "bg-orange-600", border: "border-orange-200 hover:border-orange-300" },
};
const DEFAULT_CAT = { icon: "\uD83C\uDFAF", bg: "bg-warm-50", bgActive: "bg-warm-600", border: "border-warm-200 hover:border-warm-300" };

function getDateShortcuts() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const dayOfWeek = today.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + daysUntilSunday);
  const weekendEnd = sunday.toISOString().split("T")[0];

  const daysUntilSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday);
  const weekendStart = saturday.toISOString().split("T")[0];

  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

  return [
    { label: "Hoy", dateFrom: todayStr, dateTo: todayStr },
    { label: "Este fin de semana", dateFrom: weekendStart, dateTo: weekendEnd },
    { label: "Esta semana", dateFrom: todayStr, dateTo: weekendEnd },
    { label: "Este mes", dateFrom: todayStr, dateTo: monthEnd },
  ];
}

export default function EventosContent({ initialEvents, initialTotal, eventCategories, section }: EventosContentProps) {
  const Card = section === "campamentos" ? CampamentoCard : EventCard;
  const Skeleton = section === "campamentos" ? CampamentoCardSkeleton : EventCardSkeleton;
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState<{ dateFrom: string; dateTo: string } | null>(null);
  const [selectedDateLabel, setSelectedDateLabel] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");

  const dateShortcuts = getDateShortcuts();
  const limit = 24;

  const hasActiveFilters = selectedCategory || selectedDateLabel || priceFilter !== "all";

  const clearAllFilters = () => {
    setSelectedCategory("");
    setSelectedDate(null);
    setSelectedDateLabel("");
    setPriceFilter("all");
  };

  const fetchEvents = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    const params = new URLSearchParams({ page: String(pageNum), limit: String(limit) });
    if (section) params.set("section", section);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedDate) {
      params.set("dateFrom", selectedDate.dateFrom);
      params.set("dateTo", selectedDate.dateTo);
    }
    if (priceFilter === "free") params.set("free", "true");
    if (priceFilter === "paid") params.set("free", "false");

    const res = await fetch(`/api/events?${params}`);
    const data = await res.json();

    if (append) {
      setEvents((prev) => [...prev, ...(data.events || [])]);
    } else {
      setEvents(data.events || []);
    }
    setTotal(data.total || 0);
    setLoading(false);
    setLoadingMore(false);
  }, [selectedCategory, selectedDate, priceFilter, section]);

  useEffect(() => {
    setPage(1);
    fetchEvents(1);
  }, [fetchEvents]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEvents(nextPage, true);
  };

  const hasMore = events.length < total;

  const selectedCategoryName = eventCategories.find((c) => c.slug === selectedCategory)?.name;

  return (
    <div>
      {/* ── Category Grid ── */}
      <fieldset className={`border-0 p-0 m-0 mb-8 ${section === "campamentos" ? "hidden" : ""}`}>
        <legend className="sr-only">Filtros de eventos</legend>

        {/* Categories as colored visual tiles */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-2 sm:gap-3 mb-6" role="group" aria-label="Filtrar por categor\u00EDa">
          <button
            onClick={() => setSelectedCategory("")}
            aria-pressed={!selectedCategory}
            className={`group/cat flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
              !selectedCategory
                ? "bg-ocean-900 text-white shadow-lg shadow-ocean-900/20 ring-2 ring-ocean-500"
                : "bg-white border border-warm-200 text-warm-700 hover:border-brand-300 hover:shadow-card"
            }`}
          >
            <span className={`flex items-center justify-center w-10 h-10 rounded-xl text-xl transition-transform group-hover/cat:scale-110 ${
              !selectedCategory ? "bg-white/15" : "bg-brand-50"
            }`} aria-hidden="true">{"\uD83D\uDCCD"}</span>
            Todos
          </button>
          {eventCategories.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat.slug] || DEFAULT_CAT;
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isActive ? "" : cat.slug)}
                aria-pressed={isActive}
                className={`group/cat flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
                  isActive
                    ? `${cfg.bgActive} text-white shadow-lg ring-2 ring-offset-1`
                    : `bg-white border ${cfg.border} text-warm-700 hover:shadow-card`
                }`}
              >
                <span className={`flex items-center justify-center w-10 h-10 rounded-xl text-xl transition-transform group-hover/cat:scale-110 ${
                  isActive ? "bg-white/15" : cfg.bg
                }`} aria-hidden="true">{cfg.icon}</span>
                <span className="truncate w-full text-center">{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Date + price filters row */}
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-warm-400 shrink-0 mr-1" aria-hidden="true" />

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por fecha">
            {dateShortcuts.map((shortcut) => (
              <button
                key={shortcut.label}
                onClick={() => {
                  if (selectedDateLabel === shortcut.label) {
                    setSelectedDate(null);
                    setSelectedDateLabel("");
                  } else {
                    setSelectedDate({ dateFrom: shortcut.dateFrom, dateTo: shortcut.dateTo });
                    setSelectedDateLabel(shortcut.label);
                  }
                }}
                aria-pressed={selectedDateLabel === shortcut.label}
                className={`rounded-full px-3.5 py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
                  selectedDateLabel === shortcut.label
                    ? "bg-warm-800 text-white shadow-sm"
                    : "bg-white border border-warm-200 text-warm-700 hover:border-warm-300 hover:bg-warm-50"
                }`}
              >
                <CalendarDays className="inline h-3 w-3 mr-1" aria-hidden="true" />
                {shortcut.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-warm-200 mx-1" aria-hidden="true" />

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por precio">
            {(["all", "free", "paid"] as const).map((pf) => {
              const labels = { all: "Todos", free: "Gratis", paid: "De pago" };
              const icons = { all: null, free: "\u2705", paid: "\uD83C\uDFAB" };
              return (
                <button
                  key={pf}
                  onClick={() => setPriceFilter(pf)}
                  aria-pressed={priceFilter === pf}
                  className={`rounded-full px-3.5 py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
                    priceFilter === pf
                      ? "bg-warm-800 text-white shadow-sm"
                      : "bg-white border border-warm-200 text-warm-700 hover:border-warm-300 hover:bg-warm-50"
                  }`}
                >
                  {icons[pf] && <span className="mr-1" aria-hidden="true">{icons[pf]}</span>}
                  {labels[pf]}
                </button>
              );
            })}
          </div>
        </div>
      </fieldset>

      {/* ── Active filters + result count ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          {!loading && (
            <p className="text-sm text-warm-600">
              <span className="font-bold text-warm-900">{total}</span> evento{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedCategoryName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-700">
                {(CATEGORY_CONFIG[selectedCategory] || DEFAULT_CAT).icon} {selectedCategoryName}
                <button onClick={() => setSelectedCategory("")} aria-label={`Quitar filtro ${selectedCategoryName}`} className="ml-0.5 hover:text-brand-900 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedDateLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warm-100 border border-warm-200 px-3 py-1 text-xs font-semibold text-warm-700">
                <CalendarDays className="h-3 w-3" aria-hidden="true" /> {selectedDateLabel}
                <button onClick={() => { setSelectedDate(null); setSelectedDateLabel(""); }} aria-label={`Quitar filtro ${selectedDateLabel}`} className="ml-0.5 hover:text-warm-900 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {priceFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warm-100 border border-warm-200 px-3 py-1 text-xs font-semibold text-warm-700">
                {priceFilter === "free" ? "Gratis" : "De pago"}
                <button onClick={() => setPriceFilter("all")} aria-label="Quitar filtro de precio" className="ml-0.5 hover:text-warm-900 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-brand-500 hover:text-brand-700 transition-colors underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 rounded"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {/* ── Events Grid ── */}
      <div aria-live="polite" aria-atomic="true">
        {loading ? (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card key={event.id} event={event} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-xl bg-white border-2 border-warm-200 px-8 py-3.5 text-sm font-bold text-warm-800 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
                >
                  {loadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <CalendarDays className="w-4 h-4" aria-hidden="true" />
                  )}
                  Ver m&#225;s eventos
                </button>
                <p className="mt-3 text-xs text-warm-500">
                  Mostrando {events.length} de {total} eventos
                </p>
              </div>
            )}
          </>
        ) : (
          /* ── Empty state ── */
          <div className="py-16 sm:py-24 text-center">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-warm-100 flex items-center justify-center mb-6">
              <CalendarDays className="h-10 w-10 text-warm-300" aria-hidden="true" />
            </div>
            <h3 className="font-display text-xl text-warm-900 font-bold">No hay eventos con estos filtros</h3>
            <p className="mt-2 text-base text-warm-500 max-w-md mx-auto">
              Prueba con otra categor&#237;a, fecha o tipo de precio. Nuevos eventos se a&#241;aden cada d&#237;a.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Quitar todos los filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
