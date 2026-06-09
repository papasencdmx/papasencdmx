"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    Trash2,
    Loader2,
    Search,
    GripVertical,
    X,
    Plus,
} from "lucide-react";
import type { Page, PageFilterConfig } from "@/types";

interface ListingOption {
    id: string;
    name: string;
    slug: string;
    cover_image_url: string | null;
}

const PAGE_TYPES = [
    { value: "guide", label: "Guide" },
    { value: "ofertas", label: "Ofertas" },
    { value: "events", label: "Events" },
    { value: "extraescolares", label: "Extraescolares" },
    { value: "planes", label: "Planes" },
];

const STATUSES = [
    { value: "draft", label: "Borrador" },
    { value: "published", label: "Publicada" },
    { value: "archived", label: "Archivada" },
];

export function PageForm({ initial, isNew }: { initial?: Page; isNew: boolean }) {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState(initial?.title || "");
    const [slug, setSlug] = useState(initial?.slug || "");
    const [pageType, setPageType] = useState(initial?.page_type || "guide");
    const [heroHeadline, setHeroHeadline] = useState(initial?.hero_headline || "");
    const [heroSubheadline, setHeroSubheadline] = useState(initial?.hero_subheadline || "");
    const [metaTitle, setMetaTitle] = useState(initial?.meta_title || "");
    const [metaDescription, setMetaDescription] = useState(initial?.meta_description || "");
    const [status, setStatus] = useState(initial?.status || "draft");

    const initialCfg = (initial?.filter_config || {}) as PageFilterConfig;
    const [showZone, setShowZone] = useState(initialCfg.show_zone_filter !== false);
    const [showAge, setShowAge] = useState(initialCfg.show_age_filter !== false);
    const [showType, setShowType] = useState(initialCfg.show_type_filter !== false);
    const [showPrice, setShowPrice] = useState(initialCfg.show_price_filter !== false);
    const [tagTypes, setTagTypes] = useState<string>(
        (initialCfg.tag_types || ["page_category"]).join(", ")
    );
    const [tagValues, setTagValues] = useState<string>(
        (initialCfg.tag_values || []).join(", ")
    );

    const [featuredIds, setFeaturedIds] = useState<string[]>(
        initial?.featured_listing_ids || []
    );
    const [featuredDetails, setFeaturedDetails] = useState<ListingOption[]>([]);

    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState<ListingOption[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        const t = localStorage.getItem("admin_token");
        if (!t) {
            window.location.href = "/admin/login";
            return;
        }
        setToken(t);
    }, []);

    /* ── Auto-slug from title (only when slug is empty AND new) ──── */
    useEffect(() => {
        if (!isNew || slug.length > 0) return;
        const auto = title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
        if (auto && auto !== slug) setSlug(auto);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title]);

    /* ── Load details for featured listings ──────────────────────── */
    useEffect(() => {
        if (!token || featuredIds.length === 0) {
            setFeaturedDetails([]);
            return;
        }
        const load = async () => {
            const res = await fetch(
                `/api/admin/listings?ids=${featuredIds.join(",")}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) return;
            const data = await res.json();
            const map = new Map<string, ListingOption>(
                (data.listings || []).map((l: ListingOption) => [l.id, l])
            );
            setFeaturedDetails(featuredIds.map((id) => map.get(id)).filter(Boolean) as ListingOption[]);
        };
        load();
    }, [featuredIds, token]);

    /* ── Search listings (debounced) ─────────────────────────────── */
    useEffect(() => {
        if (!token || search.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        const handle = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(
                    `/api/admin/listings?search=${encodeURIComponent(search.trim())}&limit=10`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) return;
                const data = await res.json();
                setSearchResults(data.listings || []);
            } finally {
                setSearching(false);
            }
        }, 250);
        return () => clearTimeout(handle);
    }, [search, token]);

    const addFeatured = useCallback((l: ListingOption) => {
        setFeaturedIds((prev) => (prev.includes(l.id) ? prev : [...prev, l.id]));
        setSearch("");
        setSearchResults([]);
    }, []);

    const removeFeatured = (id: string) => {
        setFeaturedIds((prev) => prev.filter((x) => x !== id));
    };

    const move = (id: string, dir: -1 | 1) => {
        setFeaturedIds((prev) => {
            const idx = prev.indexOf(id);
            if (idx < 0) return prev;
            const next = [...prev];
            const target = idx + dir;
            if (target < 0 || target >= next.length) return prev;
            [next[idx], next[target]] = [next[target], next[idx]];
            return next;
        });
    };

    const save = async () => {
        if (!token) return;
        if (!title.trim() || !slug.trim()) {
            setError("Título y slug son obligatorios");
            return;
        }
        setSaving(true);
        setError(null);

        const filter_config: PageFilterConfig = {
            show_zone_filter: showZone,
            show_age_filter: showAge,
            show_type_filter: showType,
            show_price_filter: showPrice,
            tag_types: tagTypes
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            tag_values: tagValues
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
        };

        const body = {
            title: title.trim(),
            slug: slug.trim(),
            page_type: pageType,
            hero_headline: heroHeadline.trim() || null,
            hero_subheadline: heroSubheadline.trim() || null,
            meta_title: metaTitle.trim() || null,
            meta_description: metaDescription.trim() || null,
            filter_config,
            featured_listing_ids: featuredIds,
            status,
        };

        const url = isNew ? "/api/admin/pages" : `/api/admin/pages/${initial!.id}`;
        const method = isNew ? "POST" : "PATCH";
        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || "Error al guardar");
            setSaving(false);
            return;
        }
        if (isNew) {
            router.push(`/admin/paginas/${data.page.id}`);
        } else {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!token || !initial) return;
        if (!confirm("¿Eliminar esta página?")) return;
        setDeleting(true);
        await fetch(`/api/admin/pages/${initial.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        router.push("/admin/paginas");
    };

    if (!token) return null;

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6 gap-3">
                <button
                    onClick={() => router.push("/admin/paginas")}
                    className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Volver
                </button>
                <div className="flex items-center gap-2">
                    {!isNew && (
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 text-red-600 px-3 py-2 text-[13px] font-semibold hover:bg-red-50 transition disabled:opacity-50"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                        </button>
                    )}
                    <button
                        onClick={save}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-copper-600 hover:bg-copper-700 text-white px-4 py-2 text-[13px] font-bold transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isNew ? "Crear página" : "Guardar"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] font-semibold text-red-700">
                    {error}
                </div>
            )}

            <h1 className="font-display text-[22px] font-extrabold text-gray-900 mb-1">
                {isNew ? "Nueva página" : title || "Sin título"}
            </h1>
            {!isNew && (
                <p className="text-[13px] text-gray-500 mb-6 font-mono">/guias/{slug}</p>
            )}

            <div className="space-y-5">
                {/* Basic */}
                <Card title="Datos básicos">
                    <Grid2>
                        <FormField label="Título" required>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={inputCls}
                                placeholder="Guía de Campamentos de Verano 2026"
                            />
                        </FormField>
                        <FormField label="Slug (URL)" required>
                            <div className="flex">
                                <span className="inline-flex items-center rounded-l-xl border border-r-0 border-warm-200 bg-warm-50 px-2.5 text-[13px] text-warm-500">
                                    /guias/
                                </span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) =>
                                        setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                                    }
                                    className={inputCls + " rounded-l-none"}
                                    placeholder="campamentos-verano-2026"
                                />
                            </div>
                        </FormField>
                    </Grid2>
                    <Grid2>
                        <FormField label="Tipo de página">
                            <select
                                value={pageType}
                                onChange={(e) => setPageType(e.target.value as Page["page_type"])}
                                className={inputCls}
                            >
                                {PAGE_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Estado">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as Page["status"])}
                                className={inputCls}
                            >
                                {STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </Grid2>
                </Card>

                {/* Hero */}
                <Card title="Hero (lo que se ve arriba en la página)">
                    <FormField label="Titular (H1)">
                        <input
                            type="text"
                            value={heroHeadline}
                            onChange={(e) => setHeroHeadline(e.target.value)}
                            className={inputCls}
                            placeholder="Los mejores campamentos de CDMX 2026"
                        />
                    </FormField>
                    <FormField label="Subtítulo">
                        <textarea
                            value={heroSubheadline}
                            onChange={(e) => setHeroSubheadline(e.target.value)}
                            rows={2}
                            className={inputCls + " resize-y"}
                            placeholder="Selección curada de campamentos verificados con descuentos para nuestra comunidad"
                        />
                    </FormField>
                </Card>

                {/* SEO */}
                <Card title="SEO">
                    <FormField label="Meta title (Google)">
                        <input
                            type="text"
                            value={metaTitle}
                            onChange={(e) => setMetaTitle(e.target.value)}
                            className={inputCls}
                            placeholder="Vacío usa el título"
                        />
                    </FormField>
                    <FormField label="Meta description">
                        <textarea
                            value={metaDescription}
                            onChange={(e) => setMetaDescription(e.target.value)}
                            rows={2}
                            className={inputCls + " resize-y"}
                            placeholder="Descripción que aparece en los resultados de Google (máx 160 caracteres)"
                        />
                    </FormField>
                </Card>

                {/* Filtering / membership */}
                <Card title="Filtros y membresía de listings">
                    <p className="text-[12px] text-gray-500 mb-3">
                        Una listing aparece en esta página si tiene al menos un{" "}
                        <code>listing_tags</code> con un <code>tag_value</code> que coincida.
                    </p>
                    <Grid2>
                        <FormField label="Tag types (CSV)">
                            <input
                                type="text"
                                value={tagTypes}
                                onChange={(e) => setTagTypes(e.target.value)}
                                className={inputCls}
                                placeholder="page_category"
                            />
                        </FormField>
                        <FormField label="Tag values (CSV)">
                            <input
                                type="text"
                                value={tagValues}
                                onChange={(e) => setTagValues(e.target.value)}
                                className={inputCls}
                                placeholder="campamento, campamento-verano"
                            />
                        </FormField>
                    </Grid2>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <ToggleRow label="Filtro Tipo" checked={showType} onChange={setShowType} />
                        <ToggleRow label="Filtro Zona" checked={showZone} onChange={setShowZone} />
                        <ToggleRow label="Filtro Edad" checked={showAge} onChange={setShowAge} />
                        <ToggleRow label="Filtro Precio" checked={showPrice} onChange={setShowPrice} />
                    </div>
                </Card>

                {/* Featured listings */}
                <Card
                    title={`Destacados (${featuredIds.length})`}
                    subtitle="Aparecen primero en la página, en el orden definido. Más de 5 destacados puede reducir la confianza."
                >
                    {/* Search */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar listing por nombre…"
                            className={inputCls + " pl-9"}
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 mt-2 w-full rounded-xl border border-warm-200 bg-white shadow-lg max-h-72 overflow-y-auto">
                                {searchResults.map((l) => (
                                    <button
                                        key={l.id}
                                        type="button"
                                        onClick={() => addFeatured(l)}
                                        disabled={featuredIds.includes(l.id)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-warm-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-4 h-4 text-copper-600 shrink-0" />
                                        <div className="min-w-0">
                                            <div className="text-[13px] font-semibold text-gray-900 truncate">
                                                {l.name}
                                            </div>
                                            <div className="text-[11px] text-gray-500 font-mono truncate">
                                                {l.slug}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {searching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-warm-400" />
                            </div>
                        )}
                    </div>

                    {/* Pinned list */}
                    {featuredDetails.length === 0 ? (
                        <p className="text-[13px] text-gray-500 italic">No hay destacados aún. Búscalos arriba.</p>
                    ) : (
                        <ul className="space-y-2">
                            {featuredDetails.map((l, idx) => (
                                <li
                                    key={l.id}
                                    className="flex items-center gap-3 rounded-xl border border-warm-200 bg-white px-3 py-2"
                                >
                                    <GripVertical className="w-4 h-4 text-warm-400 shrink-0" />
                                    <span className="text-[12px] font-bold text-warm-500 w-5 tabular-nums">
                                        #{idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] font-semibold text-gray-900 truncate">
                                            {l.name}
                                        </div>
                                        <div className="text-[11px] text-gray-500 font-mono truncate">
                                            {l.slug}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => move(l.id, -1)}
                                        disabled={idx === 0}
                                        className="text-warm-500 hover:text-warm-800 disabled:opacity-30"
                                        aria-label="Subir"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => move(l.id, 1)}
                                        disabled={idx === featuredDetails.length - 1}
                                        className="text-warm-500 hover:text-warm-800 disabled:opacity-30"
                                        aria-label="Bajar"
                                    >
                                        ↓
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeFeatured(l.id)}
                                        className="text-red-500 hover:text-red-700"
                                        aria-label="Quitar"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {featuredIds.length > 5 && (
                        <p className="mt-3 text-[12px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                            Más de 5 destacados puede reducir la confianza del usuario.
                        </p>
                    )}
                </Card>
            </div>
        </div>
    );
}

const inputCls =
    "w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-copper-200 focus:border-copper-400 transition";

function Card({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl bg-white border border-gray-100 p-5">
            <h2 className="font-display text-[15px] font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-[12px] text-gray-500 mt-0.5">{subtitle}</p>}
            <div className="mt-3 space-y-3">{children}</div>
        </section>
    );
}

function FormField({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="block text-[12px] font-semibold text-gray-700 mb-1">
                {label}
                {required && <span className="text-copper-600 ml-0.5">*</span>}
            </span>
            {children}
        </label>
    );
}

function Grid2({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function ToggleRow({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <label className="flex items-center gap-2 rounded-lg border border-warm-200 bg-white px-3 py-2 cursor-pointer hover:bg-warm-50">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="accent-copper-600"
            />
            <span className="text-[12.5px] font-semibold text-gray-700">{label}</span>
        </label>
    );
}
