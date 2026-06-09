"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal, X, Sparkles, ArrowUpDown } from "lucide-react";
import type { Listing, PageFilterConfig } from "@/types";
import { ListingCardUnified } from "./ListingCardUnified";

type PriceRange = "lt200" | "200-500" | "gt500" | null;
type SortKey = "featured" | "price_asc" | "price_desc" | "recent";

const PRICE_LABELS: Record<NonNullable<PriceRange>, string> = {
    lt200: "Menos de 200$",
    "200-500": "200$ – 500$",
    gt500: "Más de 500$",
};

const SORT_LABELS: Record<SortKey, string> = {
    featured: "Destacados",
    price_asc: "Precio: menor primero",
    price_desc: "Precio: mayor primero",
    recent: "Más recientes",
};

const PAGE_SIZE = 12;

export function FilteredListingsGrid({
    listings,
    featured,
    filterConfig,
}: {
    listings: Listing[];
    featured: Listing[];
    filterConfig: PageFilterConfig;
}) {
    const showZone = filterConfig.show_zone_filter !== false;
    const showAge = filterConfig.show_age_filter !== false;
    const showType = filterConfig.show_type_filter !== false;
    const showPrice = filterConfig.show_price_filter !== false;

    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [age, setAge] = useState<number | null>(null);
    const [ageInput, setAgeInput] = useState("");
    const [priceRange, setPriceRange] = useState<PriceRange>(null);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>(
        (filterConfig.default_sort === "price_asc" && "price_asc") ||
            (filterConfig.default_sort === "price_desc" && "price_desc") ||
            (filterConfig.default_sort === "recent" && "recent") ||
            "featured"
    );
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // Lock body scroll while bottom sheet is open
    useEffect(() => {
        if (!mobileSheetOpen) return;
        const orig = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = orig;
        };
    }, [mobileSheetOpen]);

    /* ── Derive options from data ───────────────────────────── */
    const zoneOptions = useMemo(() => {
        const seen = new Set<string>();
        const opts: { value: string; label: string }[] = [];
        for (const l of listings) {
            if (l.zone?.slug && l.zone.name && !seen.has(l.zone.slug)) {
                seen.add(l.zone.slug);
                opts.push({ value: l.zone.slug, label: l.zone.name });
            }
        }
        return opts.sort((a, b) => a.label.localeCompare(b.label));
    }, [listings]);

    const typeOptions = useMemo(() => {
        const counts = new Map<string, number>();
        for (const l of listings) {
            for (const t of l.tags || []) {
                // Skip the membership tags (page_category) — they're how listings
                // are matched to pages, not what users want to filter by
                if (t.tag_type === "page_category") continue;
                counts.set(t.tag_value, (counts.get(t.tag_value) || 0) + 1);
            }
        }
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 14)
            .map(([value]) => value);
    }, [listings]);

    /* ── Apply filters ──────────────────────────────────────── */
    const filtered = useMemo(() => {
        const result = listings.filter((l) => {
            if (selectedZone && l.zone?.slug !== selectedZone) return false;
            if (age != null) {
                const min = l.age_min ?? 0;
                const max = l.age_max ?? 99;
                if (age < min || age > max) return false;
            }
            if (priceRange) {
                const p = l.price_min ?? 0;
                if (priceRange === "lt200" && p >= 200) return false;
                if (priceRange === "200-500" && (p < 200 || p > 500)) return false;
                if (priceRange === "gt500" && p <= 500) return false;
            }
            if (selectedTypes.length > 0) {
                const tags = (l.tags || []).map((t) => t.tag_value);
                if (!selectedTypes.some((t) => tags.includes(t))) return false;
            }
            return true;
        });

        // Apply sort
        const sorted = [...result];
        if (sortKey === "price_asc") {
            sorted.sort((a, b) => (a.price_min ?? Infinity) - (b.price_min ?? Infinity));
        } else if (sortKey === "price_desc") {
            sorted.sort((a, b) => (b.price_min ?? -Infinity) - (a.price_min ?? -Infinity));
        } else if (sortKey === "recent") {
            sorted.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
        }
        return sorted;
    }, [listings, selectedZone, age, priceRange, selectedTypes, sortKey]);

    // Reset pagination when filters/sort change
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [selectedZone, age, priceRange, selectedTypes, sortKey]);

    const visible = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    const activeCount =
        (selectedZone ? 1 : 0) +
        (age != null ? 1 : 0) +
        (priceRange ? 1 : 0) +
        selectedTypes.length;

    const clearAll = () => {
        setSelectedTypes([]);
        setSelectedZone(null);
        setAge(null);
        setAgeInput("");
        setPriceRange(null);
    };

    const toggleType = (t: string) =>
        setSelectedTypes((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
        );

    /* ── Render ─────────────────────────────────────────────── */
    return (
        <>
            {/* Sticky filter bar */}
            <div className="sticky top-0 z-30 -mx-4 sm:mx-0 bg-warm-50/95 backdrop-blur-md border-b border-warm-200 mb-6">
                <div className="px-4 sm:px-0 py-3">
                    {/* Mobile: single Filtros button */}
                    <div className="sm:hidden flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileSheetOpen(true)}
                            className="inline-flex items-center gap-2 rounded-full bg-white border border-warm-200 px-4 py-2 text-[13px] font-bold text-warm-800 shadow-sm"
                        >
                            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                            Filtros
                            {activeCount > 0 && (
                                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-copper-600 px-1.5 text-[11px] font-bold text-white">
                                    {activeCount}
                                </span>
                            )}
                        </button>
                        <span className="text-[13px] font-semibold text-warm-700">
                            {filtered.length}{" "}
                            {filtered.length === 1 ? "resultado" : "resultados"}
                        </span>
                    </div>

                    {/* Desktop: horizontal pills + dropdowns */}
                    <div className="hidden sm:flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        {showType &&
                            typeOptions.map((t) => {
                                const active = selectedTypes.includes(t);
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => toggleType(t)}
                                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                                            active
                                                ? "bg-copper-600 text-white"
                                                : "bg-white border border-warm-200 text-warm-700 hover:border-warm-300"
                                        }`}
                                    >
                                        {t}
                                    </button>
                                );
                            })}

                        {showZone && zoneOptions.length > 0 && (
                            <DropdownPill
                                label={
                                    selectedZone
                                        ? zoneOptions.find((o) => o.value === selectedZone)?.label || "Zona"
                                        : "Zona"
                                }
                                active={!!selectedZone}
                                onClear={() => setSelectedZone(null)}
                            >
                                <div className="max-h-72 overflow-y-auto py-1">
                                    {zoneOptions.map((z) => (
                                        <button
                                            key={z.value}
                                            type="button"
                                            onClick={() => setSelectedZone(z.value)}
                                            className={`w-full text-left px-4 py-2 text-[13px] hover:bg-warm-50 ${
                                                selectedZone === z.value
                                                    ? "font-bold text-copper-700"
                                                    : "text-warm-700"
                                            }`}
                                        >
                                            {z.label}
                                        </button>
                                    ))}
                                </div>
                            </DropdownPill>
                        )}

                        {showAge && (
                            <DropdownPill
                                label={age != null ? `Edad: ${age} años` : "Edad"}
                                active={age != null}
                                onClear={() => {
                                    setAge(null);
                                    setAgeInput("");
                                }}
                            >
                                <div className="p-3 w-56">
                                    <label className="block text-[12px] font-semibold text-warm-700 mb-1.5">
                                        Mi hijo tiene
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            max={18}
                                            value={ageInput}
                                            onChange={(e) => {
                                                setAgeInput(e.target.value);
                                                const n = Number(e.target.value);
                                                setAge(
                                                    e.target.value === "" || !Number.isFinite(n) ? null : n
                                                );
                                            }}
                                            placeholder="6"
                                            className="w-16 rounded-lg border border-warm-200 px-2 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-copper-200"
                                        />
                                        <span className="text-[13px] text-warm-700">años</span>
                                    </div>
                                </div>
                            </DropdownPill>
                        )}

                        {showPrice && (
                            <DropdownPill
                                label={priceRange ? PRICE_LABELS[priceRange] : "Precio"}
                                active={!!priceRange}
                                onClear={() => setPriceRange(null)}
                            >
                                <div className="py-1 w-52">
                                    {(Object.entries(PRICE_LABELS) as [PriceRange, string][]).map(
                                        ([key, label]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setPriceRange(key)}
                                                className={`w-full text-left px-4 py-2 text-[13px] hover:bg-warm-50 ${
                                                    priceRange === key
                                                        ? "font-bold text-copper-700"
                                                        : "text-warm-700"
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        )
                                    )}
                                </div>
                            </DropdownPill>
                        )}

                        <div className="ml-auto shrink-0 flex items-center gap-3">
                            {activeCount > 0 && (
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="text-[12px] font-semibold text-warm-500 hover:text-warm-700 underline-offset-2 hover:underline"
                                >
                                    Borrar filtros
                                </button>
                            )}
                            <span className="text-[13px] font-semibold text-warm-700 whitespace-nowrap">
                                {filtered.length}{" "}
                                {filtered.length === 1 ? "resultado" : "resultados"}
                            </span>
                            <DropdownPill
                                label={SORT_LABELS[sortKey]}
                                active={false}
                                onClear={() => setSortKey("featured")}
                                icon={<ArrowUpDown className="h-3.5 w-3.5" />}
                            >
                                <div className="py-1 w-56">
                                    {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(
                                        ([key, label]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setSortKey(key)}
                                                className={`w-full text-left px-4 py-2 text-[13px] hover:bg-warm-50 ${
                                                    sortKey === key
                                                        ? "font-bold text-copper-700"
                                                        : "text-warm-700"
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        )
                                    )}
                                </div>
                            </DropdownPill>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured (always shown, never filtered) */}
            {featured.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                        <Sparkles className="h-4 w-4 text-copper-500" aria-hidden="true" />
                        <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-warm-600">
                            Destacados
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {featured.map((listing) => (
                            <ListingCardUnified
                                key={listing.id}
                                listing={listing}
                                variant="featured"
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Filtered organic grid */}
            {filtered.length > 0 ? (
                <section>
                    {featured.length > 0 && (
                        <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-warm-600 mb-5">
                            Más opciones
                        </h2>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {visible.map((listing) => (
                            <ListingCardUnified key={listing.id} listing={listing} />
                        ))}
                    </div>
                    {hasMore && (
                        <div className="mt-8 flex justify-center">
                            <button
                                type="button"
                                onClick={() =>
                                    setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))
                                }
                                className="inline-flex items-center justify-center rounded-full border-2 border-copper-600 bg-white px-6 py-3 text-[14px] font-bold text-copper-700 hover:bg-copper-50 active:scale-[0.98] transition-all"
                            >
                                Cargar más ({filtered.length - visibleCount} restantes)
                            </button>
                        </div>
                    )}
                </section>
            ) : (
                <div className="rounded-3xl border border-warm-200 bg-white px-6 py-14 text-center">
                    <p className="font-display text-xl font-bold text-warm-900">
                        No encontramos resultados con estos filtros
                    </p>
                    <p className="mt-2 text-warm-600">
                        Prueba a ajustar los filtros para ver más opciones.
                    </p>
                    {activeCount > 0 && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="mt-5 inline-flex items-center justify-center rounded-xl bg-copper-600 px-5 py-3 text-sm font-bold text-white hover:bg-copper-700 transition"
                        >
                            Borrar filtros
                        </button>
                    )}
                </div>
            )}

            {/* Mobile bottom sheet */}
            {mobileSheetOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Filtros"
                    className="fixed inset-0 z-50 sm:hidden"
                >
                    <button
                        aria-label="Cerrar filtros"
                        onClick={() => setMobileSheetOpen(false)}
                        className="absolute inset-0 bg-warm-900/45 backdrop-blur-[2px]"
                    />
                    <div className="absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col rounded-t-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-warm-100">
                            <h3 className="font-display text-lg font-bold text-warm-900">
                                Filtros
                            </h3>
                            <button
                                type="button"
                                onClick={() => setMobileSheetOpen(false)}
                                aria-label="Cerrar"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-warm-500 hover:bg-warm-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                            {showType && typeOptions.length > 0 && (
                                <div>
                                    <h4 className="text-[12px] font-bold uppercase tracking-wider text-warm-500 mb-2">
                                        Tipo de actividad
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {typeOptions.map((t) => {
                                            const active = selectedTypes.includes(t);
                                            return (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => toggleType(t)}
                                                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                                                        active
                                                            ? "bg-copper-600 text-white"
                                                            : "bg-warm-100 text-warm-700"
                                                    }`}
                                                >
                                                    {t}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {showZone && zoneOptions.length > 0 && (
                                <div>
                                    <h4 className="text-[12px] font-bold uppercase tracking-wider text-warm-500 mb-2">
                                        Zona
                                    </h4>
                                    <select
                                        value={selectedZone || ""}
                                        onChange={(e) =>
                                            setSelectedZone(e.target.value || null)
                                        }
                                        className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-copper-200"
                                    >
                                        <option value="">Cualquier zona</option>
                                        {zoneOptions.map((z) => (
                                            <option key={z.value} value={z.value}>
                                                {z.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {showAge && (
                                <div>
                                    <h4 className="text-[12px] font-bold uppercase tracking-wider text-warm-500 mb-2">
                                        Edad de tu hijo/a
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            max={18}
                                            value={ageInput}
                                            onChange={(e) => {
                                                setAgeInput(e.target.value);
                                                const n = Number(e.target.value);
                                                setAge(
                                                    e.target.value === "" || !Number.isFinite(n) ? null : n
                                                );
                                            }}
                                            placeholder="Ej. 6"
                                            className="w-24 rounded-xl border border-warm-200 px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-copper-200"
                                        />
                                        <span className="text-[13px] text-warm-700">años</span>
                                    </div>
                                </div>
                            )}

                            {showPrice && (
                                <div>
                                    <h4 className="text-[12px] font-bold uppercase tracking-wider text-warm-500 mb-2">
                                        Precio
                                    </h4>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {(Object.entries(PRICE_LABELS) as [PriceRange, string][]).map(
                                            ([key, label]) => (
                                                <label
                                                    key={key}
                                                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                                                        priceRange === key
                                                            ? "border-copper-500 bg-copper-50/50 text-copper-700 font-bold"
                                                            : "border-warm-200 text-warm-700"
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="price"
                                                        checked={priceRange === key}
                                                        onChange={() => setPriceRange(key)}
                                                        className="accent-copper-600"
                                                    />
                                                    <span className="text-[14px]">{label}</span>
                                                </label>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-warm-100 px-4 py-3 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={clearAll}
                                disabled={activeCount === 0}
                                className="text-[13px] font-semibold text-warm-600 disabled:text-warm-300 disabled:cursor-not-allowed underline-offset-2 hover:underline"
                            >
                                Borrar filtros
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileSheetOpen(false)}
                                className="rounded-full bg-copper-600 px-5 py-3 text-[14px] font-bold text-white hover:bg-copper-700 transition"
                            >
                                Ver {filtered.length}{" "}
                                {filtered.length === 1 ? "resultado" : "resultados"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ── Reusable dropdown pill (desktop only) ─────────────────── */
function DropdownPill({
    label,
    active,
    onClear,
    icon,
    children,
}: {
    label: string;
    active: boolean;
    onClear: () => void;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest("[data-dropdown-pill]")) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [open]);

    return (
        <div className="relative shrink-0" data-dropdown-pill>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    active
                        ? "bg-copper-600 text-white"
                        : "bg-white border border-warm-200 text-warm-700 hover:border-warm-300"
                }`}
            >
                {icon}
                {label}
                {active ? (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClear();
                            setOpen(false);
                        }}
                        className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/20"
                        aria-label="Quitar filtro"
                    >
                        <X className="h-3 w-3" />
                    </span>
                ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                )}
            </button>
            {open && (
                <div className="absolute left-0 mt-2 rounded-xl bg-white shadow-lg border border-warm-200 z-40 overflow-hidden">
                    {children}
                </div>
            )}
        </div>
    );
}
