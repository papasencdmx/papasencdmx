"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FeatureGroupsEditor } from "@/components/admin/FeatureGroupsEditor";
import {
    Search,
    X,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Save,
    ExternalLink,
    CalendarDays,
    Check,
    Edit3,
    Filter,
    Trash2,
    AlertTriangle,
    Plus,
    Clock,
    MapPin,
    Tag,
    Ticket,
    Star,
    Megaphone,
    ChevronDown,
} from "lucide-react";

interface EventCategory { id: string; name: string; slug: string }
interface ListingOption { id: string; name: string; slug: string }
interface OccurrenceRow {
    id: string;
    event_id: string;
    occurrence_date: string;
    date_end: string | null;
    time_start: string | null;
    time_end: string | null;
    location_name: string | null;
    street_address: string | null;
    ticket_url: string | null;
    availability: string;
    notes: string | null;
    pack_name: string | null;
    pack_description: string | null;
    price_override: number | null;
    ticket_quantity: number | null;
    max_per_purchase: number | null;
    is_visible: boolean;
}
interface EventRow {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    short_description: string | null;
    image_url: string | null;
    gallery_urls: string[] | null;
    event_category_id: string | null;
    listing_id: string | null;
    price_min: number | null;
    price_max: number | null;
    is_free: boolean;
    age_min: number | null;
    age_max: number | null;
    duration_minutes: number | null;
    location_name: string | null;
    street_address: string | null;
    latitude: number | null;
    longitude: number | null;
    external_url: string | null;
    affiliate_params: string | null;
    source: string;
    source_id: string | null;
    source_url: string | null;
    status: string;
    is_featured: boolean;
    is_promoted: boolean;
    use_mollie: boolean;
    created_at: string;
    event_category?: EventCategory;
    occurrences?: OccurrenceRow[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pendiente" },
    approved: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Aprobado" },
    rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rechazado" },
};

const AVAILABILITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    available: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Disponible" },
    few_left: { bg: "bg-amber-50", text: "text-amber-700", label: "Pocas plazas" },
    sold_out: { bg: "bg-red-50", text: "text-red-700", label: "Agotado" },
    cancelled: { bg: "bg-gray-100", text: "text-gray-500", label: "Cancelado" },
};

function formatDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("es-MX", {
        weekday: "short", day: "numeric", month: "short",
    });
}

type SectionKey = "actividades" | "colegios" | "campamentos";
const SECTION_LABELS: Record<SectionKey, { plural: string; singular: string; createCta: string }> = {
    actividades: { plural: "Eventos", singular: "Evento", createCta: "Crear Evento" },
    colegios: { plural: "Colegios", singular: "Colegio", createCta: "Crear Colegio" },
    campamentos: { plural: "Campamentos", singular: "Campamento", createCta: "Crear Campamento" },
};

export default function AdminEventsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-sm text-gray-400">Cargando…</div>}>
            <AdminEventsPageInner />
        </Suspense>
    );
}

function AdminEventsPageInner() {
    const searchParams = useSearchParams();
    const sectionParam = searchParams.get("section");
    const section: SectionKey = (["actividades", "colegios", "campamentos"].includes(sectionParam || "")
        ? sectionParam
        : "actividades") as SectionKey;
    const sectionLabels = SECTION_LABELS[section];

    const [events, setEvents] = useState<EventRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterSource, setFilterSource] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
    const [listings, setListings] = useState<ListingOption[]>([]);

    // Edit panel
    const [editEvent, setEditEvent] = useState<EventRow | null>(null);
    const [form, setForm] = useState<Record<string, unknown>>({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [stats, setStats] = useState<{
        views_total: number;
        views_unique: number;
        reserve_clicks: number;
        pay_starts: number;
        orders_paid: number;
        orders_total: number;
    } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const [usePayments, setUsePayments] = useState(false);

    // Occurrences
    const [occurrences, setOccurrences] = useState<OccurrenceRow[]>([]);
    const [newOcc, setNewOcc] = useState({ occurrence_date: "", date_end: "", pack_name: "", pack_description: "", price_override: "", time_start: "", time_end: "", ticket_url: "", availability: "available" });
    const [occTicketQuantity, setOccTicketQuantity] = useState("");
    const [occMaxPerPurchase, setOccMaxPerPurchase] = useState("5");
    const [editingOccId, setEditingOccId] = useState<string | null>(null);
    const [bulkDateFrom, setBulkDateFrom] = useState("");
    const [bulkDateTo, setBulkDateTo] = useState("");
    const [savingOcc, setSavingOcc] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const limit = 25;
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

    const fetchEvents = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(limit), section });
        if (search) params.set("search", search);
        if (filterCategory) params.set("category", filterCategory);
        if (filterStatus) params.set("status", filterStatus);
        if (filterSource) params.set("source", filterSource);

        const res = await fetch(`/api/admin/events?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setEvents(data.events || []);
        setTotal(data.total || 0);
        if (data.eventCategories) setEventCategories(data.eventCategories);
        if (data.listings) setListings(data.listings);
        setLoading(false);
    }, [token, page, search, filterCategory, filterStatus, filterSource, section]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    // Debounced search
    const [searchInput, setSearchInput] = useState("");
    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const openEdit = async (event: EventRow) => {
        setEditEvent(event);
        setDeleteConfirm(false);
        setStats(null);
        // Fetch stats in parallel with the event data
        fetch(`/api/admin/events/${event.id}/stats`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d?.stats && setStats(d.stats))
            .catch(() => { /* stats are non-critical */ });

        // Fetch full event with occurrences
        const res = await fetch(`/api/admin/events/${event.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const full = data.event;

        setForm({
            title: full.title || "",
            slug: full.slug || "",
            short_description: full.short_description || "",
            description: full.description || "",
            image_url: full.image_url || "",
            gallery_urls: full.gallery_urls || [],
            event_category_id: full.event_category_id || "",
            listing_id: full.listing_id || "",
            is_free: full.is_free ?? false,
            price_min: full.price_min ?? "",
            price_max: full.price_max ?? "",
            age_min: full.age_min ?? "",
            age_max: full.age_max ?? "",
            duration_minutes: full.duration_minutes ?? "",
            location_name: full.location_name || "",
            street_address: full.street_address || "",
            external_url: full.external_url || "",
            affiliate_params: full.affiliate_params || "",
            source: full.source || "manual",
            source_id: full.source_id || "",
            source_url: full.source_url || "",
            status: full.status || "pending",
            is_featured: full.is_featured ?? false,
            is_promoted: full.is_promoted ?? false,
            payment_provider: "stripe",
            section: full.section || "actividades",
            discount_percent: full.discount_percent ?? "",
            deposit_percent: full.deposit_percent ?? "",
            discount_label: full.discount_label || "",
            organizer_name: full.organizer_name || "",
            organizer_logo_url: full.organizer_logo_url || "",
            organizer_founded_year: full.organizer_founded_year ?? "",
            organizer_is_verified: full.organizer_is_verified ?? false,
        });
        setUsePayments(full.use_mollie || false);
        setOccurrences(full.occurrences || []);
        resetOccForm();
    };

    const openCreate = () => {
        setEditEvent({ id: "__new__" } as EventRow);
        setDeleteConfirm(false);
        setForm({
            title: "", slug: "", short_description: "", description: "",
            image_url: "", gallery_urls: [], event_category_id: "", listing_id: "",
            is_free: false, price_min: "", price_max: "",
            age_min: "", age_max: "", duration_minutes: "",
            location_name: "", street_address: "",
            external_url: "", affiliate_params: "",
            source: "manual", source_id: "", source_url: "",
            status: "pending", is_featured: false, is_promoted: false,
            payment_provider: "stripe",
            section,
            discount_percent: "", discount_label: "",
            deposit_percent: "",
            organizer_name: "", organizer_logo_url: "",
            organizer_founded_year: "", organizer_is_verified: false,
        });
        setUsePayments(false);
        setOccurrences([]);
        resetOccForm();
    };

    const handleSave = async () => {
        if (!token) return;
        setSaving(true);
        setSaveError("");
        setSaveSuccess(false);

        const isNew = editEvent?.id === "__new__";
        const url = isNew ? "/api/admin/events" : `/api/admin/events/${editEvent?.id}`;
        const method = isNew ? "POST" : "PATCH";

        try {
            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, use_mollie: usePayments }),
            });

            const data = await res.json();

            if (!res.ok) {
                setSaveError(data?.error || `Error al guardar (HTTP ${res.status})`);
                setSaving(false);
                return;
            }

            if (isNew && data.event) {
                setEditEvent(data.event);
            }
            setSaveSuccess(true);
            fetchEvents();
            setTimeout(() => setSaveSuccess(false), 2500);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Error de conexión");
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!token || !editEvent || editEvent.id === "__new__") return;
        setDeleting(true);
        await fetch(`/api/admin/events/${editEvent.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        setDeleting(false);
        setEditEvent(null);
        fetchEvents();
    };

    // Occurrence CRUD
    const resetOccForm = () => {
        setNewOcc({ occurrence_date: "", date_end: "", pack_name: "", pack_description: "", price_override: "", time_start: "", time_end: "", ticket_url: "", availability: "available" });
        setOccTicketQuantity("");
        setOccMaxPerPurchase("5");
        setEditingOccId(null);
    };

    const startEditOccurrence = (occ: OccurrenceRow) => {
        setEditingOccId(occ.id);
        setNewOcc({
            occurrence_date: occ.occurrence_date || "",
            date_end: occ.date_end || "",
            pack_name: occ.pack_name || "",
            pack_description: occ.pack_description || "",
            price_override: occ.price_override != null ? String(occ.price_override) : "",
            time_start: occ.time_start || "",
            time_end: occ.time_end || "",
            ticket_url: occ.ticket_url || "",
            availability: occ.availability || "available",
        });
        setOccTicketQuantity(occ.ticket_quantity != null ? String(occ.ticket_quantity) : "");
        setOccMaxPerPurchase(occ.max_per_purchase != null ? String(occ.max_per_purchase) : "5");
        // Scroll form into view so the user sees the pre-filled inputs.
        setTimeout(() => {
            document.getElementById("occ-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
    };

    const addOccurrence = async () => {
        if (!token || !editEvent || editEvent.id === "__new__" || !newOcc.occurrence_date) return;
        setSavingOcc(true);
        const occPayload = {
            ...newOcc,
            ticket_quantity: occTicketQuantity ? parseInt(occTicketQuantity) : null,
            max_per_purchase: occMaxPerPurchase ? parseInt(occMaxPerPurchase) : 5,
            is_visible: true,
        };

        if (editingOccId) {
            // PATCH existing
            const res = await fetch(`/api/admin/events/${editEvent.id}/occurrences`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ occId: editingOccId, ...occPayload }),
            });
            if (res.ok) {
                const data = await res.json();
                setOccurrences(occurrences.map((o) => (o.id === editingOccId ? data.occurrence : o)));
                resetOccForm();
            }
        } else {
            // POST new
            const res = await fetch(`/api/admin/events/${editEvent.id}/occurrences`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(occPayload),
            });
            if (res.ok) {
                const data = await res.json();
                setOccurrences([...occurrences, ...(data.occurrences || [])]);
                resetOccForm();
            }
        }
        setSavingOcc(false);
    };

    const bulkAddOccurrences = async () => {
        if (!token || !editEvent || editEvent.id === "__new__" || !bulkDateFrom || !bulkDateTo) return;
        setSavingOcc(true);

        // Generate daily dates in range
        const dates: string[] = [];
        const start = new Date(bulkDateFrom);
        const end = new Date(bulkDateTo);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split("T")[0]);
        }

        const bulk = dates.map((date) => ({
            occurrence_date: date,
            time_start: newOcc.time_start || null,
            time_end: newOcc.time_end || null,
            ticket_url: newOcc.ticket_url || null,
            availability: "available",
        }));

        const res = await fetch(`/api/admin/events/${editEvent.id}/occurrences`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(bulk),
        });
        if (res.ok) {
            const data = await res.json();
            setOccurrences([...occurrences, ...(data.occurrences || [])]);
            setBulkDateFrom("");
            setBulkDateTo("");
        }
        setSavingOcc(false);
    };

    const deleteOccurrence = async (occId: string) => {
        if (!token || !editEvent || editEvent.id === "__new__") return;
        await fetch(`/api/admin/events/${editEvent.id}/occurrences`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [occId] }),
        });
        setOccurrences(occurrences.filter((o) => o.id !== occId));
    };

    const totalPages = Math.ceil(total / limit);
    const isNew = editEvent?.id === "__new__";

    return (
        <div className="max-w-7xl">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[22px] font-bold" style={{ color: "#272E2F" }}>{sectionLabels.plural}</h1>
                    <p className="text-[13px] mt-1" style={{ color: "#777777" }}>{total} {sectionLabels.plural.toLowerCase()} en total</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-gray-800 transition-all"
                >
                    <Plus className="w-4 h-4" /> {sectionLabels.createCta}
                </button>
            </div>

            {/* Search + Filters */}
            <div className="bg-white rounded-2xl mb-5" style={{ border: "1px solid #E0E0E0" }}>
                <div className="flex items-center gap-3 px-5 py-3">
                    <Search className="w-4 h-4 shrink-0" style={{ color: "#999999" }} />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Buscar eventos por título..."
                        className="flex-1 text-[14px] bg-transparent focus:outline-none"
                        style={{ color: "#272E2F" }}
                    />
                    {searchInput && (
                        <button onClick={() => setSearchInput("")} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${showFilters ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                        <Filter className="w-3.5 h-3.5" /> Filtros
                    </button>
                </div>

                {showFilters && (
                    <div className="flex flex-wrap items-center gap-3 px-5 py-3" style={{ borderTop: "1px solid #EAEAEA" }}>
                        <select
                            value={filterCategory}
                            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                            className="text-[13px] rounded-lg border px-3 py-2 focus:outline-none"
                            style={{ borderColor: "#E0E0E0", color: "#454545" }}
                        >
                            <option value="">Todas las categorías</option>
                            {eventCategories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                            className="text-[13px] rounded-lg border px-3 py-2 focus:outline-none"
                            style={{ borderColor: "#E0E0E0", color: "#454545" }}
                        >
                            <option value="">Todos los estados</option>
                            <option value="pending">Pendiente</option>
                            <option value="approved">Aprobado</option>
                            <option value="rejected">Rechazado</option>
                        </select>
                        <select
                            value={filterSource}
                            onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
                            className="text-[13px] rounded-lg border px-3 py-2 focus:outline-none"
                            style={{ borderColor: "#E0E0E0", color: "#454545" }}
                        >
                            <option value="">Todas las fuentes</option>
                            <option value="manual">Manual</option>
                            <option value="entradas">Entradas.com</option>
                            <option value="fever">Fever</option>
                            <option value="groupon">Groupon</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Events list */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E0E0E0" }}>
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20">
                        <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: "#E0E0E0" }} />
                        <p className="text-[14px] font-medium" style={{ color: "#999999" }}>No hay eventos</p>
                    </div>
                ) : (
                    <>
                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_140px_100px_100px_80px] gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#999999", borderBottom: "1px solid #EAEAEA" }}>
                            <span>Evento</span>
                            <span>Categoría</span>
                            <span>Estado</span>
                            <span>Fechas</span>
                            <span></span>
                        </div>

                        {events.map((event) => {
                            const st = STATUS_COLORS[event.status] || STATUS_COLORS.pending;
                            const occCount = event.occurrences?.length || 0;
                            const nextOcc = event.occurrences?.sort((a, b) => a.occurrence_date.localeCompare(b.occurrence_date))[0];
                            return (
                                <div
                                    key={event.id}
                                    className="grid grid-cols-[1fr_140px_100px_100px_80px] gap-3 px-5 py-3 items-center hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                                    style={{ borderBottom: "1px solid #F0F0F0" }}
                                    onClick={() => openEdit(event)}
                                >
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-semibold truncate" style={{ color: "#272E2F" }}>{event.title}</p>
                                        {event.location_name && (
                                            <p className="text-[11px] truncate mt-0.5" style={{ color: "#999999" }}>
                                                <MapPin className="inline w-3 h-3 mr-0.5" />{event.location_name}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        {event.event_category ? (
                                            <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700">
                                                {event.event_category.name}
                                            </span>
                                        ) : (
                                            <span className="text-[11px]" style={{ color: "#CCCCCC" }}>—</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-lg ${st.bg} ${st.text}`}>
                                            {st.label}
                                        </span>
                                    </div>
                                    <div>
                                        {occCount > 0 ? (
                                            <div>
                                                <span className="text-[12px] font-medium" style={{ color: "#454545" }}>{occCount} fecha{occCount !== 1 ? "s" : ""}</span>
                                                {nextOcc && (
                                                    <p className="text-[10px]" style={{ color: "#999999" }}>{formatDate(nextOcc.occurrence_date)}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[11px]" style={{ color: "#CCCCCC" }}>Sin fechas</span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <button className="text-[12px] font-semibold" style={{ color: "#777777" }}>
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #EAEAEA" }}>
                                <span className="text-[12px]" style={{ color: "#999999" }}>
                                    Página {page} de {totalPages} ({total} resultados)
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page <= 1}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                                        style={{ backgroundColor: "#F0F0F0" }}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page >= totalPages}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                                        style={{ backgroundColor: "#F0F0F0" }}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>


            {/* ── Edit / Create Panel ── */}
            {editEvent && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setEditEvent(null)} />
                    <div className="relative ml-auto w-full max-w-[95vw] bg-white h-full flex flex-col shadow-2xl">

                        {/* ── 1. Panel Header with Status Pills ── */}
                        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #EAEAEA" }}>
                            <div className="flex items-center gap-4">
                                <h2 className="text-[16px] font-bold" style={{ color: "#272E2F" }}>
                                    {isNew ? sectionLabels.createCta : `Editar ${sectionLabels.singular}`}
                                </h2>
                                <div className="flex items-center gap-1.5">
                                    {(["pending", "approved", "rejected"] as const).map((s) => {
                                        const sc = STATUS_COLORS[s];
                                        return (
                                            <button
                                                key={s}
                                                onClick={() => setForm({ ...form, status: s })}
                                                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${form.status === s ? `${sc.bg} ${sc.text} ring-2 ring-offset-1 ring-gray-200` : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                                            >
                                                {form.status === s && <Check className="w-3 h-3 inline mr-0.5" />}
                                                {sc.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isNew && (
                                    <a
                                        href={`/ofertas/${form.slug || editEvent.slug}`}
                                        target="_blank"
                                        className="text-[12px] font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                        style={{ color: "#777777" }}
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" /> Ver
                                    </a>
                                )}
                                <button onClick={() => setEditEvent(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable content area */}
                        <div className="flex-1 overflow-y-auto p-6 pb-28">
                          <div className="max-w-5xl mx-auto space-y-6">

                            {/* ── Stats (skipped for new events) ── */}
                            {!isNew && stats && (
                                <section>
                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                                        <Megaphone className="w-4 h-4 text-gray-500" /> Estadísticas
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                        {[
                                            { label: "Vistas", value: stats.views_total, sub: `${stats.views_unique} únicas` },
                                            {
                                                label: "Clics en Reservar",
                                                value: stats.reserve_clicks,
                                                sub: stats.views_total > 0 ? `${Math.round((stats.reserve_clicks / stats.views_total) * 100)}%` : "—",
                                            },
                                            {
                                                label: "Pagos iniciados",
                                                value: stats.pay_starts,
                                                sub: stats.reserve_clicks > 0 ? `${Math.round((stats.pay_starts / stats.reserve_clicks) * 100)}%` : "—",
                                            },
                                            {
                                                label: "Reservas pagadas",
                                                value: stats.orders_paid,
                                                sub: stats.pay_starts > 0 ? `${Math.round((stats.orders_paid / stats.pay_starts) * 100)}%` : "—",
                                            },
                                            {
                                                label: "Conversión total",
                                                value: stats.views_total > 0 ? `${((stats.orders_paid / stats.views_total) * 100).toFixed(1)}%` : "—",
                                                sub: `${stats.orders_paid}/${stats.views_total}`,
                                            },
                                        ].map((s, i) => (
                                            <div key={i} className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{s.label}</p>
                                                <p className="text-[20px] font-extrabold text-gray-900 leading-tight mt-1">{s.value}</p>
                                                <p className="text-[11px] text-gray-500 mt-0.5">{s.sub}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* ── 2. Basic Info ── */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                                    <Edit3 className="w-4 h-4 text-gray-500" /> {"Información básica"}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">{"Título *"}</label>
                                        <input
                                            value={(form.title as string) || ""}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
                                            style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">Slug</label>
                                        <input
                                            value={(form.slug as string) || ""}
                                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                            className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
                                            style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                            placeholder="auto-generado"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">{"Descripción corta"}</label>
                                        <textarea
                                            value={(form.short_description as string) || ""}
                                            onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                                            rows={2}
                                            className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
                                            style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">{"Descripción completa"}</label>
                                        <textarea
                                            value={(form.description as string) || ""}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            rows={4}
                                            className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
                                            style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">URL de imagen principal</label>
                                        <input
                                            value={(form.image_url as string) || ""}
                                            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                                            className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-shadow"
                                            style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            La imagen que aparece grande arriba del listado y como portada de la página de detalle.
                                        </p>
                                    </div>

                                    {/* Gallery URLs — one URL per line */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">
                                            Galería de imágenes{" "}
                                            <span className="text-gray-400 font-normal">(2 más, opcional)</span>
                                        </label>
                                        <textarea
                                            value={((form.gallery_urls as string[] | null) || []).join("\n")}
                                            onChange={(e) => {
                                                const urls = e.target.value
                                                    .split("\n")
                                                    .map((u) => u.trim())
                                                    .filter(Boolean);
                                                setForm({ ...form, gallery_urls: urls });
                                            }}
                                            rows={3}
                                            placeholder="https://ejemplo.com/foto-2.jpg&#10;https://ejemplo.com/foto-3.jpg"
                                            className="mt-1 w-full text-[13px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-shadow font-mono"
                                            style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            Una URL por línea. La primera va arriba-derecha, la segunda abajo-derecha.
                                            Los campamentos usan portada grande + 2 miniaturas al estilo Airbnb.
                                        </p>

                                        {/* Preview thumbs */}
                                        {((form.gallery_urls as string[] | null) || []).length > 0 && (
                                            <div className="mt-3 flex gap-2 flex-wrap">
                                                {((form.gallery_urls as string[] | null) || []).map((url, i) => (
                                                    <div
                                                        key={i}
                                                        className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={url}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = "none";
                                                            }}
                                                        />
                                                        <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
                                                            {i + 1}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <div className="border-t border-gray-100" />

                            {/* ── Discount + Organizer (campamentos only) ── */}
                            {section === "campamentos" && (
                                <>
                                    <section>
                                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                                            <Star className="w-4 h-4 text-gray-500" /> Descuento y organizador
                                        </h3>

                                        {/* Discount block */}
                                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-3 mb-4">
                                            <div>
                                                <p className="text-[13px] font-bold text-emerald-900">Descuento automático</p>
                                                <p className="text-[11px] text-emerald-700/80 mt-0.5">
                                                    Se aplica a las reservas de este campamento. El cliente ve el precio
                                                    original tachado, el ahorro y el total final. La pasarela cobra
                                                    el importe ya descontado.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500">Descuento (%)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="80"
                                                        step="1"
                                                        value={(form.discount_percent as string | number | null) ?? ""}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setForm({
                                                                ...form,
                                                                discount_percent:
                                                                    v === "" ? null : Math.max(0, Math.min(80, Number(v))),
                                                            });
                                                        }}
                                                        placeholder="Ej. 15"
                                                        className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                        style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500">Etiqueta (opcional)</label>
                                                    <input
                                                        type="text"
                                                        maxLength={40}
                                                        value={(form.discount_label as string) || ""}
                                                        onChange={(e) => setForm({ ...form, discount_label: e.target.value })}
                                                        placeholder="Oferta de lanzamiento"
                                                        className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                        style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Organizer block */}
                                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                                            <div>
                                                <p className="text-[13px] font-bold text-gray-800">Datos del organizador</p>
                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    Aparecen en la sección &ldquo;Organizado por:&rdquo; de la página pública,
                                                    con avatar, nombre, año de inicio y badge verificado.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="col-span-2">
                                                    <label className="text-xs font-medium text-gray-500">Nombre del organizador</label>
                                                    <input
                                                        type="text"
                                                        value={(form.organizer_name as string) || ""}
                                                        onChange={(e) => setForm({ ...form, organizer_name: e.target.value })}
                                                        placeholder="Ej. Fundación Estudio Turismo y Deporte"
                                                        className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                        style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-xs font-medium text-gray-500">URL del logo / avatar</label>
                                                    <input
                                                        type="url"
                                                        value={(form.organizer_logo_url as string) || ""}
                                                        onChange={(e) => setForm({ ...form, organizer_logo_url: e.target.value })}
                                                        placeholder="https://ejemplo.com/logo.png"
                                                        className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                        style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500">Año de inicio</label>
                                                    <input
                                                        type="number"
                                                        min="1900"
                                                        max="2100"
                                                        value={(form.organizer_founded_year as string | number | null) ?? ""}
                                                        onChange={(e) =>
                                                            setForm({
                                                                ...form,
                                                                organizer_founded_year:
                                                                    e.target.value === "" ? null : Number(e.target.value),
                                                            })
                                                        }
                                                        placeholder="2020"
                                                        className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                        style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <label className="inline-flex items-center gap-2 text-[13px] cursor-pointer py-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!form.organizer_is_verified}
                                                            onChange={(e) =>
                                                                setForm({ ...form, organizer_is_verified: e.target.checked })
                                                            }
                                                            className="w-4 h-4 rounded"
                                                        />
                                                        <span className="text-gray-700 font-medium">Verificado</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="border-t border-gray-100" />
                                </>
                            )}

                            {/* ── 3. Pricing + Payment ── */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                                    <Ticket className="w-4 h-4 text-gray-500" /> Precio y pago
                                </h3>

                                {/* Payments toggle + provider */}
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-sm font-semibold text-blue-800">Vender entradas online</label>
                                            <p className="text-xs text-blue-600 mt-0.5">Activar pago directo en la web</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setUsePayments(!usePayments)}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${usePayments ? "bg-blue-600" : "bg-gray-300"}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${usePayments ? "translate-x-5" : ""}`} />
                                        </button>
                                    </div>
                                    {usePayments && (
                                        <div>
                                            <label className="text-xs font-semibold text-blue-800">Procesador de pago</label>
                                            <div className="mt-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 border border-indigo-500 ring-2 ring-indigo-200 bg-white text-[13px] font-semibold">
                                                <span className="inline-flex items-center gap-2">
                                                    <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                                                    Stripe
                                                </span>
                                                <span className="text-[9px] font-semibold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                                                    Activo
                                                </span>
                                            </div>
                                            <p className="text-xs text-blue-600 mt-2">
                                                El comprador será redirigido al checkout de Stripe.
                                            </p>
                                        </div>
                                    )}

                                    {/* Deposit / "Reserva tu plaza" */}
                                    {usePayments && (
                                        <div className="rounded-xl bg-white border border-blue-200 p-3">
                                            <label className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                Reserva con depósito (opcional)
                                            </label>
                                            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                                                Si lo activas, el comprador podrá pagar solo este % al reservar. El resto se gestiona después por contacto directo (24-48h). Deja vacío para pago completo solamente.
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={5}
                                                    max={95}
                                                    placeholder="Ej: 30"
                                                    value={(form.deposit_percent as string | number | null) ?? ""}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            deposit_percent: e.target.value === "" ? "" : e.target.value,
                                                        })
                                                    }
                                                    onBlur={(e) => {
                                                        if (e.target.value === "") return;
                                                        const n = Number(e.target.value);
                                                        if (!Number.isFinite(n)) {
                                                            setForm({ ...form, deposit_percent: "" });
                                                            return;
                                                        }
                                                        setForm({
                                                            ...form,
                                                            deposit_percent: Math.max(5, Math.min(95, Math.round(n))),
                                                        });
                                                    }}
                                                    className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-200"
                                                />
                                                <span className="text-[12px] font-semibold text-gray-700">% del total</span>
                                                {!!form.deposit_percent && (
                                                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                        Activo
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: "#454545" }}>
                                        <input
                                            type="checkbox"
                                            checked={!!form.is_free}
                                            onChange={(e) => setForm({ ...form, is_free: e.target.checked })}
                                            className="rounded"
                                        />
                                        Evento gratuito
                                    </label>
                                    {!form.is_free && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">{"Precio mín ($)"}</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={(form.price_min as string) || ""}
                                                    onChange={(e) => setForm({ ...form, price_min: e.target.value })}
                                                    className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">{"Precio máx ($)"}</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={(form.price_max as string) || ""}
                                                    onChange={(e) => setForm({ ...form, price_max: e.target.value })}
                                                    className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">{"Edad mín"}</label>
                                            <input
                                                type="number"
                                                value={(form.age_min as string) || ""}
                                                onChange={(e) => setForm({ ...form, age_min: e.target.value })}
                                                className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">{"Edad máx"}</label>
                                            <input
                                                type="number"
                                                value={(form.age_max as string) || ""}
                                                onChange={(e) => setForm({ ...form, age_max: e.target.value })}
                                                className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                            />
                                        </div>
                                        {section !== "campamentos" && (
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">{"Duración (min)"}</label>
                                                <input
                                                    type="number"
                                                    value={(form.duration_minutes as string) || ""}
                                                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                                                    className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <div className="border-t border-gray-100" />

                            {/* ── 4. Dates / Occurrences ── */}
                            {!isNew && (
                                <section>
                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                                        <CalendarDays className="w-4 h-4 text-gray-500" /> Fechas
                                        <span className="text-xs font-medium text-gray-400 ml-1">({occurrences.length})</span>
                                    </h3>

                                    {/* Existing occurrences */}
                                    {occurrences.length > 0 && (
                                        <div className="space-y-2 mb-4">
                                            {occurrences.map((occ) => {
                                                const av = AVAILABILITY_COLORS[occ.availability] || AVAILABILITY_COLORS.available;
                                                return (
                                                    <div key={occ.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 group">
                                                        <div className="flex-shrink-0 min-w-[140px]">
                                                            {occ.pack_name ? (
                                                                <div>
                                                                    <span className="text-[13px] font-bold block" style={{ color: "#272E2F" }}>
                                                                        {occ.pack_name}
                                                                    </span>
                                                                    <span className="text-[11px] text-gray-500">
                                                                        {formatDate(occ.occurrence_date)}
                                                                        {occ.date_end ? ` – ${formatDate(occ.date_end)}` : ""}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[14px] font-bold" style={{ color: "#272E2F" }}>
                                                                    {formatDate(occ.occurrence_date)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            {occ.time_start && (
                                                                <span className="text-[12px] flex items-center gap-1 text-gray-500 whitespace-nowrap">
                                                                    <Clock className="w-3 h-3" />
                                                                    {occ.time_start}{occ.time_end ? ` - ${occ.time_end}` : ""}
                                                                </span>
                                                            )}
                                                            {occ.price_override != null && (
                                                                <span className="text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
                                                                    $ {Number(occ.price_override).toFixed(0)}
                                                                </span>
                                                            )}
                                                            {occ.location_name && (
                                                                <span className="text-[11px] truncate max-w-[140px] flex items-center gap-1 text-gray-400">
                                                                    <MapPin className="w-3 h-3 shrink-0" />{occ.location_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${av.bg} ${av.text}`}>
                                                                {av.label}
                                                            </span>
                                                            {occ.ticket_url && (
                                                                <a href={occ.ticket_url} target="_blank" className="text-blue-400 hover:text-blue-600 transition-colors">
                                                                    <Ticket className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                            {usePayments && occ.ticket_quantity != null && (
                                                                <>
                                                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${occ.is_visible ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                                                                        {occ.is_visible ? "Visible" : "Oculto"}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400">{occ.ticket_quantity} entradas</span>
                                                                </>
                                                            )}
                                                            <button
                                                                onClick={() => startEditOccurrence(occ)}
                                                                title="Editar"
                                                                className={`transition-colors ${
                                                                    editingOccId === occ.id
                                                                        ? "text-blue-500"
                                                                        : "text-gray-300 hover:text-blue-500 opacity-0 group-hover:opacity-100"
                                                                }`}
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteOccurrence(occ.id)}
                                                                title="Eliminar"
                                                                className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Add / Edit single occurrence / pack */}
                                    <div
                                        id="occ-form"
                                        className={`rounded-2xl p-4 border transition-colors ${
                                            editingOccId
                                                ? "bg-blue-50 border-blue-200"
                                                : "bg-gray-50 border-gray-100"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <p className={`text-xs font-bold ${editingOccId ? "text-blue-700" : "text-gray-700"}`}>
                                                {editingOccId
                                                    ? section === "campamentos" ? "Editar pack" : "Editar fecha"
                                                    : section === "campamentos" ? "Añadir pack" : "Añadir fecha"}
                                            </p>
                                            {editingOccId && (
                                                <button
                                                    type="button"
                                                    onClick={resetOccForm}
                                                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    Cancelar edición
                                                </button>
                                            )}
                                        </div>
                                        {section === "campamentos" && (
                                            <div className="grid grid-cols-1 gap-2 mb-3">
                                                <input
                                                    value={newOcc.pack_name}
                                                    onChange={(e) => setNewOcc({ ...newOcc, pack_name: e.target.value })}
                                                    placeholder="Nombre del pack (ej. Semana 1, Mes completo)"
                                                    className="text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                />
                                                <input
                                                    value={newOcc.pack_description}
                                                    onChange={(e) => setNewOcc({ ...newOcc, pack_description: e.target.value })}
                                                    placeholder="Descripción corta (opcional, ej. Incluye comida y transporte)"
                                                    className="text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 mb-1 block">
                                                    {section === "campamentos" ? "Desde" : "Fecha"}
                                                </label>
                                                <input
                                                    type="date"
                                                    value={newOcc.occurrence_date}
                                                    onChange={(e) => setNewOcc({ ...newOcc, occurrence_date: e.target.value })}
                                                    className="w-full text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                />
                                            </div>
                                            {section === "campamentos" && (
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Hasta</label>
                                                    <input
                                                        type="date"
                                                        value={newOcc.date_end}
                                                        onChange={(e) => setNewOcc({ ...newOcc, date_end: e.target.value })}
                                                        className="w-full text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                        style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                    />
                                                </div>
                                            )}
                                            {section !== "campamentos" && (
                                                <>
                                                    <input
                                                        type="time"
                                                        value={newOcc.time_start}
                                                        onChange={(e) => setNewOcc({ ...newOcc, time_start: e.target.value })}
                                                        placeholder="Inicio"
                                                        className="text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                        style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                    />
                                                </>
                                            )}
                                        </div>
                                        {section === "campamentos" && (
                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Hora diaria (inicio)</label>
                                                    <input
                                                        type="time"
                                                        value={newOcc.time_start}
                                                        onChange={(e) => setNewOcc({ ...newOcc, time_start: e.target.value })}
                                                        className="w-full text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                        style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Hora diaria (fin)</label>
                                                    <input
                                                        type="time"
                                                        value={newOcc.time_end}
                                                        onChange={(e) => setNewOcc({ ...newOcc, time_end: e.target.value })}
                                                        className="w-full text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                        style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 mb-1 block">{"Precio del pack ($)"}</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={newOcc.price_override}
                                                        onChange={(e) => setNewOcc({ ...newOcc, price_override: e.target.value })}
                                                        placeholder="Ej: 150"
                                                        className="w-full text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                        style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {section !== "campamentos" && (
                                            <div className="mb-3">
                                                <input
                                                    type="time"
                                                    value={newOcc.time_end}
                                                    onChange={(e) => setNewOcc({ ...newOcc, time_end: e.target.value })}
                                                    placeholder="Fin"
                                                    className="w-full text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <input
                                                value={newOcc.ticket_url}
                                                onChange={(e) => setNewOcc({ ...newOcc, ticket_url: e.target.value })}
                                                placeholder="URL de entradas"
                                                className="text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                            />
                                            <select
                                                value={newOcc.availability}
                                                onChange={(e) => setNewOcc({ ...newOcc, availability: e.target.value })}
                                                className="text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                style={{ borderColor: "#E0E0E0", color: "#454545" }}
                                            >
                                                <option value="available">Disponible</option>
                                                <option value="few_left">Pocas plazas</option>
                                                <option value="sold_out">Agotado</option>
                                                <option value="cancelled">Cancelado</option>
                                            </select>
                                        </div>
                                        {usePayments && (
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Entradas disponibles</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-full text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                        style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                        placeholder="Ej: 10"
                                                        value={occTicketQuantity}
                                                        onChange={(e) => setOccTicketQuantity(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Max. por compra</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="20"
                                                        className="w-full text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                        style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                        placeholder="5"
                                                        value={occMaxPerPurchase}
                                                        onChange={(e) => setOccMaxPerPurchase(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <button
                                            onClick={addOccurrence}
                                            disabled={!newOcc.occurrence_date || savingOcc}
                                            className={`w-full flex items-center justify-center gap-2 rounded-xl text-white text-[13px] font-semibold py-2.5 disabled:opacity-40 transition-all ${
                                                editingOccId
                                                    ? "bg-blue-600 hover:bg-blue-700"
                                                    : "bg-gray-900 hover:bg-gray-800"
                                            }`}
                                        >
                                            {savingOcc ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : editingOccId ? (
                                                <Check className="w-3.5 h-3.5" />
                                            ) : (
                                                <Plus className="w-3.5 h-3.5" />
                                            )}
                                            {editingOccId
                                                ? "Guardar cambios"
                                                : section === "campamentos" ? "Añadir pack" : "Añadir fecha"}
                                        </button>
                                    </div>

                                    {/* Bulk add (not shown for camps — they use packs instead) */}
                                    {section !== "campamentos" && (
                                    <div className="rounded-2xl p-4 mt-3 bg-blue-50/50 border border-blue-100">
                                        <p className="text-xs font-bold text-gray-700 mb-3">{"Añadir rango de fechas"}</p>
                                        <div className="flex items-center gap-2 mb-3">
                                            <input
                                                type="date"
                                                value={bulkDateFrom}
                                                onChange={(e) => setBulkDateFrom(e.target.value)}
                                                className="flex-1 text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                style={{ borderColor: "#D0E0F0", color: "#272E2F" }}
                                            />
                                            <span className="text-[12px] text-gray-400 font-medium">a</span>
                                            <input
                                                type="date"
                                                value={bulkDateTo}
                                                onChange={(e) => setBulkDateTo(e.target.value)}
                                                className="flex-1 text-[13px] rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                style={{ borderColor: "#D0E0F0", color: "#272E2F" }}
                                            />
                                        </div>
                                        <button
                                            onClick={bulkAddOccurrences}
                                            disabled={!bulkDateFrom || !bulkDateTo || savingOcc}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white text-[13px] font-semibold py-2.5 disabled:opacity-40 hover:bg-blue-700 transition-all"
                                        >
                                            {savingOcc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarDays className="w-3.5 h-3.5" />}
                                            Crear fechas diarias
                                        </button>
                                    </div>
                                    )}
                                </section>
                            )}

                            <div className="border-t border-gray-100" />

                            {/* ── 5. Location + Category ── */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                                    <MapPin className="w-4 h-4 text-gray-500" /> {"Ubicación y categoría"}
                                </h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">{"Categoría"}</label>
                                            <select
                                                value={(form.event_category_id as string) || ""}
                                                onChange={(e) => setForm({ ...form, event_category_id: e.target.value })}
                                                className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                style={{ borderColor: "#E0E0E0", color: "#454545" }}
                                            >
                                                <option value="">{"Sin categoría"}</option>
                                                {eventCategories.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">
                                                Organizador{" "}
                                                <span className="text-gray-400 font-normal">(listing asociado)</span>
                                            </label>
                                            <select
                                                value={(form.listing_id as string) || ""}
                                                onChange={(e) => setForm({ ...form, listing_id: e.target.value })}
                                                className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                style={{ borderColor: "#E0E0E0", color: "#454545" }}
                                            >
                                                <option value="">Ninguno</option>
                                                {listings.map((l) => (
                                                    <option key={l.id} value={l.id}>{l.name}</option>
                                                ))}
                                            </select>
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                El negocio que organiza el campamento. Se muestra como
                                                &ldquo;Organizado por&rdquo; con su logo, verificación y año
                                                en la página pública. Los datos (logo, verificado, año, rating)
                                                se editan en <strong>Admin → Listings</strong>.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: "#454545" }}>
                                            <input
                                                type="checkbox"
                                                checked={!!form.is_featured}
                                                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                                                className="rounded"
                                            />
                                            <Star className="w-3.5 h-3.5 text-amber-500" /> Destacado
                                        </label>
                                        <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: "#454545" }}>
                                            <input
                                                type="checkbox"
                                                checked={!!form.is_promoted}
                                                onChange={(e) => setForm({ ...form, is_promoted: e.target.checked })}
                                                className="rounded"
                                            />
                                            <Megaphone className="w-3.5 h-3.5 text-purple-500" /> Promocionado
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">Nombre del lugar</label>
                                            <input
                                                value={(form.location_name as string) || ""}
                                                onChange={(e) => setForm({ ...form, location_name: e.target.value })}
                                                className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">{"Dirección"}</label>
                                            <input
                                                value={(form.street_address as string) || ""}
                                                onChange={(e) => setForm({ ...form, street_address: e.target.value })}
                                                className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ── 5b. Feature groups ("¿Qué incluye?") — only for existing events ── */}
                            {!isNew && editEvent?.id && token && (
                                <>
                                    <div className="border-t border-gray-100" />
                                    <FeatureGroupsEditor eventId={editEvent.id} token={token} />
                                </>
                            )}

                            <div className="border-t border-gray-100" />

                            {/* ── 6. Advanced (collapsed by default) ── */}
                            <section>
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="w-full flex items-center justify-between py-2 text-sm font-bold text-gray-800 hover:text-gray-600 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4 text-gray-500" /> Avanzado
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                                </button>

                                {showAdvanced && (
                                    <div className="space-y-3 mt-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">URL externa</label>
                                                <input
                                                    value={(form.external_url as string) || ""}
                                                    onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                                                    className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">{"Parámetros afiliado"}</label>
                                                <input
                                                    value={(form.affiliate_params as string) || ""}
                                                    onChange={(e) => setForm({ ...form, affiliate_params: e.target.value })}
                                                    className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                    placeholder="?ref=padres&utm_source=..."
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">Fuente</label>
                                                <select
                                                    value={(form.source as string) || "manual"}
                                                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                                                    className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    style={{ borderColor: "#E0E0E0", color: "#454545" }}
                                                >
                                                    <option value="manual">Manual</option>
                                                    <option value="entradas">Entradas.com</option>
                                                    <option value="fever">Fever</option>
                                                    <option value="groupon">Groupon</option>
                                                    <option value="taquilla">Taquilla.com</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">Source ID</label>
                                                <input
                                                    value={(form.source_id as string) || ""}
                                                    onChange={(e) => setForm({ ...form, source_id: e.target.value })}
                                                    className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">Source URL</label>
                                                <input
                                                    value={(form.source_url as string) || ""}
                                                    onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                                                    className="mt-1 w-full text-[14px] rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                                    style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                          </div>
                        </div>

                        {/* ── 7. Footer (sticky bottom) ── */}
                        <div className="sticky bottom-0 bg-white px-6 py-4 flex flex-col gap-3" style={{ borderTop: "1px solid #EAEAEA" }}>
                          {saveError && (
                            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-800 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold">No se pudo guardar</p>
                                <p className="text-red-700 mt-0.5 break-words">{saveError}</p>
                              </div>
                            </div>
                          )}
                          {saveSuccess && (
                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-[13px] text-emerald-800 flex items-center gap-2">
                              <Check className="w-4 h-4 shrink-0" />
                              <p className="font-semibold">Guardado correctamente</p>
                            </div>
                          )}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14px] font-semibold py-3 disabled:opacity-50 hover:bg-emerald-700 transition-all"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isNew ? sectionLabels.createCta : "Guardar Cambios"}
                            </button>
                            {!isNew && !deleteConfirm && (
                                <button
                                    onClick={() => setDeleteConfirm(true)}
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                            {!isNew && deleteConfirm && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 disabled:opacity-50 transition-all"
                                    >
                                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                        Eliminar
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(false)}
                                        className="text-[12px] font-medium px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                                        style={{ color: "#777777" }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
