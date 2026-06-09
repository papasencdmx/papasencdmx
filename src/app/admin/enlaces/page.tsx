"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link2, Plus, Copy, ExternalLink, Trash2, Search, BarChart3, MousePointerClick, Users, Pencil, Check, X, RotateCcw, Calendar, Download, ArrowUpDown, Monitor, Smartphone, Tablet, Globe, TrendingUp } from "lucide-react";

interface TrackedLink {
    id: string;
    slug: string;
    destination_url: string;
    label: string;
    listing_id: string | null;
    campaign: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_content: string | null;
    total_clicks: number;
    unique_clicks: number;
    is_active: boolean;
    created_at: string;
    listing?: { id: string; name: string; slug: string } | null;
}

interface StatsData {
    daily: { date: string; total: number; unique: number }[];
    summary: { total: number; unique: number };
    devices: { device: string; count: number }[];
    referrers: { source: string; count: number }[];
}

const DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || "papasencdmx.com";

export default function EnlacesPage() {
    const [links, setLinks] = useState<TrackedLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [campaignFilter, setCampaignFilter] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [sortField, setSortField] = useState<"created_at" | "total_clicks" | "unique_clicks">("created_at");
    const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
    const [resetId, setResetId] = useState<string | null>(null);
    const [resetConfirmText, setResetConfirmText] = useState("");
    const [resetStep, setResetStep] = useState<1 | 2>(1);

    // Stats modal state
    const [statsLink, setStatsLink] = useState<TrackedLink | null>(null);
    const [statsData, setStatsData] = useState<StatsData | null>(null);
    const [statsDateFrom, setStatsDateFrom] = useState("");
    const [statsDateTo, setStatsDateTo] = useState("");
    const [statsLoading, setStatsLoading] = useState(false);

    // Form state
    const [form, setForm] = useState({ slug: "", destination_url: "", label: "", campaign: "", listing_id: "", utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const fetchLinks = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (campaignFilter) params.set("campaign", campaignFilter);
        const res = await fetch(`/api/admin/enlaces?${params}`, { headers });
        if (res.ok) {
            const data = await res.json();
            setLinks(data.links);
        }
        setLoading(false);
    }, [search, campaignFilter]);

    useEffect(() => { fetchLinks(); }, [fetchLinks]);

    // Get unique campaigns for filter
    const campaigns = Array.from(new Set(links.map(l => l.campaign).filter(Boolean))) as string[];

    // Client-side date filter + sort
    const filteredLinks = useMemo(() => {
        let result = links;
        if (dateFrom) {
            const from = new Date(dateFrom);
            result = result.filter(l => new Date(l.created_at) >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter(l => new Date(l.created_at) <= to);
        }
        result = [...result].sort((a, b) => {
            const av = sortField === "created_at" ? new Date(a.created_at).getTime() : a[sortField];
            const bv = sortField === "created_at" ? new Date(b.created_at).getTime() : b[sortField];
            return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number);
        });
        return result;
    }, [links, dateFrom, dateTo, sortField, sortDir]);

    const toggleSort = (field: "created_at" | "total_clicks" | "unique_clicks") => {
        if (sortField === field) {
            setSortDir(d => d === "desc" ? "asc" : "desc");
        } else {
            setSortField(field);
            setSortDir("desc");
        }
    };

    const exportCsv = () => {
        const rows = [["Nombre", "Slug", "URL Destino", "Campana", "Clicks", "Unicos", "UTM Source", "UTM Medium", "UTM Campaign", "UTM Content", "Creado"]];
        for (const l of filteredLinks) {
            rows.push([l.label, `/go/${l.slug}`, l.destination_url, l.campaign || "", String(l.total_clicks), String(l.unique_clicks), l.utm_source || "", l.utm_medium || "", l.utm_campaign || "", l.utm_content || "", new Date(l.created_at).toLocaleDateString("es-MX")]);
        }
        const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `enlaces-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const resetForm = () => {
        setForm({ slug: "", destination_url: "", label: "", campaign: "", listing_id: "", utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "" });
        setError("");
    };

    const autoSlug = (label: string) => {
        return label.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    };

    const handleCreate = async () => {
        if (!form.slug || !form.destination_url || !form.label) {
            setError("Slug, URL destino y nombre son obligatorios");
            return;
        }
        setSaving(true);
        setError("");
        const res = await fetch("/api/admin/enlaces", {
            method: "POST",
            headers,
            body: JSON.stringify(form),
        });
        if (res.ok) {
            setShowCreate(false);
            resetForm();
            fetchLinks();
        } else {
            const data = await res.json();
            setError(data.error || "Error al crear");
        }
        setSaving(false);
    };

    const handleUpdate = async (id: string) => {
        setSaving(true);
        setError("");
        const res = await fetch(`/api/admin/enlaces/${id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(form),
        });
        if (res.ok) {
            setEditingId(null);
            resetForm();
            fetchLinks();
        } else {
            const data = await res.json();
            setError(data.error || "Error al actualizar");
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Eliminar este enlace y todos sus clicks?")) return;
        await fetch(`/api/admin/enlaces/${id}`, { method: "DELETE", headers });
        fetchLinks();
    };

    const toggleActive = async (link: TrackedLink) => {
        await fetch(`/api/admin/enlaces/${link.id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ is_active: !link.is_active }),
        });
        fetchLinks();
    };

    const startReset = (id: string) => {
        setResetId(id);
        setResetStep(1);
        setResetConfirmText("");
    };

    const cancelReset = () => {
        setResetId(null);
        setResetStep(1);
        setResetConfirmText("");
    };

    const handleReset = async (id: string) => {
        if (resetConfirmText !== "CONFIRM") return;
        await fetch(`/api/admin/enlaces/${id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ reset_stats: true }),
        });
        cancelReset();
        fetchLinks();
    };

    const buildFullUrl = (link: TrackedLink) => {
        const base = `https://${DOMAIN}/go/${link.slug}`;
        const params = new URLSearchParams();
        if (link.utm_source) params.set("utm_source", link.utm_source);
        if (link.utm_medium) params.set("utm_medium", link.utm_medium);
        if (link.utm_campaign) params.set("utm_campaign", link.utm_campaign);
        if (link.utm_content) params.set("utm_content", link.utm_content);
        const qs = params.toString();
        return qs ? `${base}?${qs}` : base;
    };

    const hasUtm = (link: TrackedLink) => !!(link.utm_source || link.utm_medium || link.utm_campaign || link.utm_content);

    const copyUrl = (text: string, id: string, suffix?: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id + (suffix || ""));
        setTimeout(() => setCopiedId(null), 2000);
    };



    const statsAbortRef = useRef<AbortController | null>(null);

    const fetchStats = async (linkId: string, from?: string, to?: string) => {
        statsAbortRef.current?.abort();
        const controller = new AbortController();
        statsAbortRef.current = controller;
        setStatsLoading(true);
        try {
            const params = new URLSearchParams();
            if (from) params.set("dateFrom", from);
            if (to) params.set("dateTo", to);
            const t = localStorage.getItem("admin_token");
            const res = await fetch(`/api/admin/enlaces/${linkId}/stats?${params}`, {
                headers: { Authorization: `Bearer ${t}` },
                signal: controller.signal,
            });
            if (res.ok && !controller.signal.aborted) {
                setStatsData(await res.json());
            }
        } catch (e: unknown) {
            if (e instanceof Error && e.name !== "AbortError") console.error(e);
        } finally {
            if (!controller.signal.aborted) setStatsLoading(false);
        }
    };

    const openStats = (link: TrackedLink) => {
        setStatsLink(link);
        setStatsDateFrom("");
        setStatsDateTo("");
        setStatsData(null);
        fetchStats(link.id);
    };

    const closeStats = () => {
        statsAbortRef.current?.abort();
        setStatsLink(null);
        setStatsData(null);
    };

    const startEdit = (link: TrackedLink) => {
        setEditingId(link.id);
        setForm({
            slug: link.slug,
            destination_url: link.destination_url,
            label: link.label,
            campaign: link.campaign || "",
            listing_id: link.listing_id || "",
            utm_source: link.utm_source || "",
            utm_medium: link.utm_medium || "",
            utm_campaign: link.utm_campaign || "",
            utm_content: link.utm_content || "",
        });
        setShowCreate(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Link2 className="w-6 h-6 text-blue-600" />
                        Track Enlaces
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Crea enlaces cortos /go/... para trackear clicks desde guias, newsletters y redes
                    </p>
                </div>
                <button
                    onClick={() => { setShowCreate(!showCreate); setEditingId(null); resetForm(); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Nuevo enlace
                </button>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Link2 className="w-4 h-4" /> Enlaces activos
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{links.filter(l => l.is_active).length}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <MousePointerClick className="w-4 h-4" /> Total clicks
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{links.reduce((s, l) => s + l.total_clicks, 0).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Users className="w-4 h-4" /> Clicks unicos
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{links.reduce((s, l) => s + l.unique_clicks, 0).toLocaleString()}</p>
                </div>
            </div>

            {/* Create / Edit form */}
            {(showCreate || editingId) && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <h3 className="font-bold text-gray-900">
                        {editingId ? "Editar enlace" : "Nuevo enlace"}
                    </h3>
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                            <input
                                type="text"
                                value={form.label}
                                onChange={(e) => {
                                    const label = e.target.value;
                                    setForm(f => ({
                                        ...f,
                                        label,
                                        slug: !editingId && !f.slug ? autoSlug(label) : f.slug,
                                    }));
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                placeholder="SEK Ciudalcampo - Guia Verano"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Slug</label>
                            <div className="flex items-center">
                                <span className="text-sm text-gray-400 mr-1">/go/</span>
                                <input
                                    type="text"
                                    value={form.slug}
                                    onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    placeholder="sek-ciudalcampo-verano"
                                />
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">URL destino</label>
                            <input
                                type="url"
                                value={form.destination_url}
                                onChange={(e) => setForm(f => ({ ...f, destination_url: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                placeholder="https://www.papasencdmx.com/colegios/sek-ciudalcampo"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Campana (opcional)</label>
                            <input
                                type="text"
                                value={form.campaign}
                                onChange={(e) => setForm(f => ({ ...f, campaign: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                placeholder="guia-verano-2026"
                            />
                        </div>

                        {/* UTM params */}
                        <div className="col-span-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 mt-1">UTM Parameters (opcional)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">utm_source</label>
                            <input type="text" value={form.utm_source}
                                onChange={(e) => setForm(f => ({ ...f, utm_source: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                placeholder="guia-campamentos" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">utm_medium</label>
                            <input type="text" value={form.utm_medium}
                                onChange={(e) => setForm(f => ({ ...f, utm_medium: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                placeholder="pdf" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">utm_campaign</label>
                            <input type="text" value={form.utm_campaign}
                                onChange={(e) => setForm(f => ({ ...f, utm_campaign: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                placeholder="verano2026" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">utm_content</label>
                            <input type="text" value={form.utm_content}
                                onChange={(e) => setForm(f => ({ ...f, utm_content: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                placeholder="recomendado-realmadrid" />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                            disabled={saving}
                            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear enlace"}
                        </button>
                        <button
                            onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar enlaces..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                </div>
                {campaigns.length > 0 && (
                    <select
                        value={campaignFilter}
                        onChange={(e) => setCampaignFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 focus:outline-none"
                    >
                        <option value="">Todas las campanas</option>
                        {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                )}
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    <span className="text-gray-400 text-xs">—</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    {(dateFrom || dateTo) && (
                        <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Limpiar fechas">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <button
                    onClick={exportCsv}
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    title="Exportar CSV"
                >
                    <Download className="w-3.5 h-3.5" /> Exportar
                </button>
            </div>

            {/* Links table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400 text-sm">Cargando...</div>
                ) : filteredLinks.length === 0 ? (
                    <div className="p-12 text-center">
                        <Link2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No hay enlaces todavia</p>
                        <button
                            onClick={() => { setShowCreate(true); resetForm(); }}
                            className="mt-3 text-sm text-blue-600 font-semibold hover:text-blue-700"
                        >
                            Crear el primero
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                <th className="text-left px-4 py-3 font-semibold text-gray-500">Enlace</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500">Destino</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500">Campana</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500">
                                    <button onClick={() => toggleSort("total_clicks")} className="inline-flex items-center gap-1 hover:text-gray-700">
                                        Clicks <ArrowUpDown className={`w-3 h-3 ${sortField === "total_clicks" ? "text-blue-600" : ""}`} />
                                    </button>
                                </th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500">
                                    <button onClick={() => toggleSort("unique_clicks")} className="inline-flex items-center gap-1 hover:text-gray-700">
                                        Unicos <ArrowUpDown className={`w-3 h-3 ${sortField === "unique_clicks" ? "text-blue-600" : ""}`} />
                                    </button>
                                </th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500">Estado</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-500">
                                    <button onClick={() => toggleSort("created_at")} className="inline-flex items-center gap-1 hover:text-gray-700">
                                        Creado <ArrowUpDown className={`w-3 h-3 ${sortField === "created_at" ? "text-blue-600" : ""}`} />
                                    </button>
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLinks.map((link) => (
                                <React.Fragment key={link.id}>
                                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-semibold text-gray-900">{link.label}</p>
                                            <p className="text-xs text-blue-600 mt-0.5">/go/{link.slug}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <a href={link.destination_url} target="_blank" rel="noopener noreferrer"
                                            className="text-gray-500 hover:text-gray-700 text-xs truncate block max-w-[200px]">
                                            {link.destination_url.replace(/^https?:\/\/(www\.)?/, "")}
                                        </a>
                                    </td>
                                    <td className="px-4 py-3">
                                        {link.campaign ? (
                                            <span className="inline-flex px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100 text-purple-700 text-xs font-medium">
                                                {link.campaign}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="font-bold text-gray-900">{link.total_clicks.toLocaleString()}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-gray-600">{link.unique_clicks.toLocaleString()}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => toggleActive(link)}
                                            className={`relative w-9 h-5 rounded-full transition-colors ${link.is_active ? "bg-emerald-500" : "bg-gray-300"}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${link.is_active ? "translate-x-4" : ""}`} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-xs text-gray-500">{new Date(link.created_at).toLocaleDateString("es-MX")}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {/* Copy short URL */}
                                            <button
                                                onClick={() => copyUrl(`https://${DOMAIN}/go/${link.slug}`, link.id, "-short")}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                title="Copiar URL corta"
                                            >
                                                {copiedId === link.id + "-short" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Link2 className="w-3.5 h-3.5" />}
                                            </button>
                                            {/* Copy full URL with UTMs */}
                                            {hasUtm(link) && (
                                                <button
                                                    onClick={() => copyUrl(buildFullUrl(link), link.id, "-utm")}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                                    title="Copiar URL con UTMs"
                                                >
                                                    {copiedId === link.id + "-utm" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            )}
                                            <a
                                                href={`/go/${link.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                title="Probar enlace"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                            <button
                                                onClick={() => openStats(link)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                title="Estadisticas"
                                            >
                                                <BarChart3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => startEdit(link)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => startReset(link.id)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                title="Reset estadisticas"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(link.id)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {/* Reset confirmation row */}
                                {resetId === link.id && (
                                    <tr className="bg-amber-50/50">
                                        <td colSpan={8} className="px-4 py-3">
                                            {resetStep === 1 ? (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-amber-800 font-medium">
                                                        Resetear estadisticas de &quot;{link.label}&quot;? Esto eliminara todos los clicks.
                                                    </span>
                                                    <button
                                                        onClick={() => setResetStep(2)}
                                                        className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors"
                                                    >
                                                        Si, continuar
                                                    </button>
                                                    <button
                                                        onClick={cancelReset}
                                                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-white transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-amber-800 font-medium">
                                                        Escribe <strong>CONFIRM</strong> para resetear:
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={resetConfirmText}
                                                        onChange={(e) => setResetConfirmText(e.target.value)}
                                                        className="w-32 px-3 py-1.5 rounded-lg border border-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                                        placeholder="CONFIRM"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleReset(link.id)}
                                                        disabled={resetConfirmText !== "CONFIRM"}
                                                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        Resetear
                                                    </button>
                                                    <button
                                                        onClick={cancelReset}
                                                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-white transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Stats Modal */}
            {statsLink && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeStats}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className="shrink-0 border-b border-gray-100">
                            <div className="px-8 pt-6 pb-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                            <BarChart3 className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-xl font-bold text-gray-900 leading-tight">{statsLink.label || statsLink.slug}</h3>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md px-2 py-0.5">
                                                    <Link2 className="w-3 h-3" />
                                                    /go/{statsLink.slug}
                                                </span>
                                                {statsLink.campaign && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 rounded-md px-2 py-0.5">
                                                        {statsLink.campaign}
                                                    </span>
                                                )}
                                                {statsLink.is_active ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-md px-2 py-0.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md px-2 py-0.5">
                                                        Inactivo
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1.5 text-xs text-gray-400 truncate max-w-lg flex items-center gap-1">
                                                <ExternalLink className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{statsLink.destination_url}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={closeStats} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors -mt-1 -mr-1">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Date filter bar */}
                            <div className="px-8 py-3 flex items-center gap-3 bg-gray-50/80 border-t border-gray-100/60">
                                <div className="flex items-center gap-2 flex-1">
                                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                    <button
                                        onClick={() => {
                                            const now = new Date();
                                            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                                            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
                                            const pad = (n: number) => String(n).padStart(2, "0");
                                            const fromStr = `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`;
                                            const toStr = `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`;
                                            setStatsDateFrom(fromStr); setStatsDateTo(toStr);
                                            fetchStats(statsLink.id, fromStr, toStr);
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 transition-all whitespace-nowrap"
                                    >
                                        Mes anterior
                                    </button>
                                    <input type="date" value={statsDateFrom}
                                        onChange={(e) => { setStatsDateFrom(e.target.value); fetchStats(statsLink.id, e.target.value, statsDateTo); }}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 w-[140px]" />
                                    <span className="text-gray-300">—</span>
                                    <input type="date" value={statsDateTo}
                                        onChange={(e) => { setStatsDateTo(e.target.value); fetchStats(statsLink.id, statsDateFrom, e.target.value); }}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 w-[140px]" />
                                    {(statsDateFrom || statsDateTo) && (
                                        <button onClick={() => { setStatsDateFrom(""); setStatsDateTo(""); fetchStats(statsLink.id); }}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-colors" title="Limpiar">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    {[{ label: "7d", days: 7 }, { label: "30d", days: 30 }, { label: "90d", days: 90 }, { label: "Todo", days: 0 }].map(({ label, days }) => (
                                        <button key={label}
                                            onClick={() => {
                                                if (days === 0) {
                                                    setStatsDateFrom(""); setStatsDateTo(""); fetchStats(statsLink.id);
                                                } else {
                                                    const from = new Date(); from.setDate(from.getDate() - days);
                                                    const fromStr = from.toISOString().split("T")[0];
                                                    setStatsDateFrom(fromStr); setStatsDateTo("");
                                                    fetchStats(statsLink.id, fromStr, "");
                                                }
                                            }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-white hover:text-gray-800 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-6 overflow-y-auto flex-1 space-y-8">
                            {statsLoading ? (
                                /* Shimmer skeleton */
                                <div className="space-y-8 animate-pulse">
                                    <div className="grid grid-cols-4 gap-4">
                                        {[0, 1, 2, 3].map(i => (
                                            <div key={i} className="rounded-2xl bg-gray-100 h-[100px]" />
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-5 bg-gray-100 rounded w-36" />
                                        {[0, 1, 2, 3, 4].map(i => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="h-3 bg-gray-100 rounded w-16" />
                                                <div className="flex-1 h-8 bg-gray-100 rounded-full" />
                                                <div className="h-3 bg-gray-100 rounded w-20" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="h-32 bg-gray-100 rounded-2xl" />
                                        <div className="h-32 bg-gray-100 rounded-2xl" />
                                    </div>
                                </div>
                            ) : statsData ? (() => {
                                const maxTotal = statsData.daily.reduce((max, x) => Math.max(max, x.total), 1);
                                const conversionRate = statsData.summary.total > 0
                                    ? Math.round((statsData.summary.unique / statsData.summary.total) * 100)
                                    : 0;
                                const avgDaily = statsData.daily.length > 0
                                    ? Math.round(statsData.summary.total / statsData.daily.length * 10) / 10
                                    : 0;
                                const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
                                const deviceIcon = (d: string) => d === "mobile" ? <Smartphone className="w-4 h-4" /> : d === "tablet" ? <Tablet className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;
                                const totalForPct = statsData.summary.total || 1;
                                return (
                                    <>
                                        {/* Summary cards */}
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="rounded-2xl border border-blue-100 p-5 bg-gradient-to-br from-blue-50/80 to-white">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <MousePointerClick className="w-4 h-4" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-blue-600/80 uppercase tracking-wide">Clicks totales</p>
                                                </div>
                                                <p className="text-3xl font-extrabold text-gray-900 leading-none tracking-tight">{statsData.summary.total.toLocaleString()}</p>
                                                <p className="text-[11px] text-gray-400 mt-1.5">Historico: {statsLink.total_clicks.toLocaleString()}</p>
                                            </div>
                                            <div className="rounded-2xl border border-emerald-100 p-5 bg-gradient-to-br from-emerald-50/80 to-white">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                        <Users className="w-4 h-4" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-emerald-600/80 uppercase tracking-wide">Visitantes unicos</p>
                                                </div>
                                                <p className="text-3xl font-extrabold text-gray-900 leading-none tracking-tight">{statsData.summary.unique.toLocaleString()}</p>
                                                <p className="text-[11px] text-gray-400 mt-1.5">Historico: {statsLink.unique_clicks.toLocaleString()}</p>
                                            </div>
                                            <div className="rounded-2xl border border-amber-100 p-5 bg-gradient-to-br from-amber-50/80 to-white">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                                        <TrendingUp className="w-4 h-4" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-amber-600/80 uppercase tracking-wide">Media diaria</p>
                                                </div>
                                                <p className="text-3xl font-extrabold text-gray-900 leading-none tracking-tight">{avgDaily}</p>
                                                <p className="text-[11px] text-gray-400 mt-1.5">{statsData.daily.length} dias con actividad</p>
                                            </div>
                                            <div className="rounded-2xl border border-purple-100 p-5 bg-gradient-to-br from-purple-50/80 to-white">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                                        <BarChart3 className="w-4 h-4" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-purple-600/80 uppercase tracking-wide">Tasa de unicos</p>
                                                </div>
                                                <p className="text-3xl font-extrabold text-gray-900 leading-none tracking-tight">{conversionRate}%</p>
                                                <p className="text-[11px] text-gray-400 mt-1.5">Visitantes / Clicks</p>
                                            </div>
                                        </div>

                                        {/* Daily chart */}
                                        {statsData.daily.length > 0 ? (
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-sm font-bold text-gray-800">Clicks por dia</h4>
                                                    <span className="text-xs text-gray-400 font-medium">
                                                        {fmtDate(statsData.daily[0].date)} — {fmtDate(statsData.daily[statsData.daily.length - 1].date)}
                                                    </span>
                                                </div>
                                                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
                                                    {statsData.daily.map((d) => (
                                                        <div key={d.date} className="flex items-center gap-4 group hover:bg-gray-50/50 rounded-lg -mx-2 px-2 py-0.5 transition-colors">
                                                            <span className="text-gray-500 text-[13px] font-medium w-[64px] shrink-0 tabular-nums">
                                                                {fmtDate(d.date)}
                                                            </span>
                                                            <div className="flex-1 bg-gray-100/80 rounded-full h-8 relative overflow-hidden">
                                                                <div
                                                                    className="bg-gradient-to-r from-indigo-500 to-blue-400 h-full rounded-full transition-all duration-500"
                                                                    style={{ width: `${Math.max((d.total / maxTotal) * 100, 3)}%` }}
                                                                />
                                                            </div>
                                                            <div className="flex items-baseline gap-3 shrink-0 min-w-[130px] justify-end">
                                                                <span className="text-[15px] font-bold text-gray-900 tabular-nums">{d.total}</span>
                                                                <span className="text-xs text-gray-400 tabular-nums">{d.unique} unicos</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-gray-50/80 rounded-2xl border border-gray-100">
                                                <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                                <p className="text-sm font-medium text-gray-400">Sin clicks en este periodo</p>
                                                <p className="text-xs text-gray-300 mt-1">Prueba con otro rango de fechas</p>
                                            </div>
                                        )}

                                        {/* Device + Referrer breakdown */}
                                        <div className="grid grid-cols-2 gap-6">
                                            {[
                                                {
                                                    title: "Dispositivos",
                                                    items: statsData.devices.map(d => ({ key: d.device, label: d.device, sublabel: "", count: d.count, icon: deviceIcon(d.device) })),
                                                    barColor: "bg-indigo-500",
                                                    capitalize: true,
                                                },
                                                {
                                                    title: "Origen del trafico",
                                                    items: statsData.referrers.map(r => {
                                                        let label = r.source;
                                                        let sublabel = "";
                                                        if (r.source === "direct") {
                                                            label = "PDF / Compartido";
                                                            sublabel = "Email, PDF, WhatsApp, enlace directo";
                                                        } else if (!r.source.includes(".")) {
                                                            // Own-domain page path (e.g. "guia-campamentos-verano-2026")
                                                            label = "/" + r.source;
                                                            sublabel = "Pagina en papasencdmx.com";
                                                        }
                                                        return { key: r.source, label, sublabel, count: r.count, icon: <Globe className="w-4 h-4" /> };
                                                    }),
                                                    barColor: "bg-amber-500",
                                                    capitalize: false,
                                                },
                                            ].map((section) => (
                                                <div key={section.title} className="rounded-2xl border border-gray-100 p-5">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{section.title}</h4>
                                                    {section.items.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {section.items.map((item) => {
                                                                const pct = Math.round((item.count / totalForPct) * 100);
                                                                return (
                                                                    <div key={item.key} className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                                                            {item.icon}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between mb-1.5">
                                                                                <div className="min-w-0">
                                                                                    <span className={`text-sm font-medium text-gray-700 ${section.capitalize ? "capitalize" : "truncate"} block`}>{item.label}</span>
                                                                                    {item.sublabel && <span className="text-[11px] text-gray-400 block leading-tight">{item.sublabel}</span>}
                                                                                </div>
                                                                                <div className="flex items-baseline gap-2 shrink-0 ml-2">
                                                                                    <span className="text-sm font-bold text-gray-900 tabular-nums">{item.count}</span>
                                                                                    <span className="text-xs text-gray-400 tabular-nums w-[36px] text-right">{pct}%</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                                <div className={`h-full ${section.barColor} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-300 text-center py-6">Sin datos disponibles</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })() : null}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
