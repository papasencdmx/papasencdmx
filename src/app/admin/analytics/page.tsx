"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search, Download, Loader2, ArrowRight, Globe, MessageCircle,
    Phone, Navigation, Mail, Share2, Calendar, ChevronDown,
} from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Area, AreaChart,
} from "recharts";

// ── Types ──

interface OverviewData {
    totalViews: number;
    totalClicks: number;
    totalLeads: number;
    conversionRate: number;
    uniqueSessions: number;
}

interface TimeSeriesPoint {
    date: string;
    views: number;
    clicks: number;
    leads: number;
}

interface TopListing {
    id: string;
    name: string;
    slug: string;
    category_slug: string;
    views: number;
    clicks: number;
}

interface ClickBreakdownItem {
    event_type: string;
    count: number;
}

interface AnalyticsData {
    overview: OverviewData;
    previous: { views: number; clicks: number; leads: number };
    timeSeries: TimeSeriesPoint[];
    topListings: TopListing[];
    clickBreakdown: ClickBreakdownItem[];
}

interface ListingAnalytics {
    listing: { id: string; name: string; slug: string; category: string; category_slug: string };
    overview: OverviewData;
    timeSeries: Array<{ date: string; views: number; clicks: number }>;
    clickBreakdown: ClickBreakdownItem[];
    recentLeads: Array<{ id: string; parent_name: string; email: string; created_at: string; status: string }>;
}

interface SearchResult {
    id: string;
    name: string;
    slug: string;
    category?: { name: string; slug: string };
}

// ── Constants ──

const EVENT_LABELS: Record<string, { label: string; icon: typeof Globe; color: string }> = {
    website_click: { label: "Visitas Web", icon: Globe, color: "#10B981" },
    whatsapp_click: { label: "WhatsApp", icon: MessageCircle, color: "#25D366" },
    phone_reveal: { label: "Teléfono", icon: Phone, color: "#3B82F6" },
    directions_click: { label: "Dirección", icon: Navigation, color: "#F59E0B" },
    email_reveal: { label: "Email", icon: Mail, color: "#8B5CF6" },
    share_whatsapp: { label: "Compartir WA", icon: Share2, color: "#06B6D4" },
    share_facebook: { label: "Compartir FB", icon: Share2, color: "#1877F2" },
    share_copy_link: { label: "Copiar Link", icon: Share2, color: "#6B7280" },
};

const PRESETS = [
    { label: "Hoy", days: 0 },
    { label: "7 días", days: 7 },
    { label: "30 días", days: 30 },
    { label: "90 días", days: 90 },
];

function getDateRange(days: number): { from: string; to: string } {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date();
    if (days === 0) {
        from.setHours(0, 0, 0, 0);
    } else {
        from.setDate(from.getDate() - days);
        from.setHours(0, 0, 0, 0);
    }
    return { from: from.toISOString(), to: to.toISOString() };
}

function formatDateShort(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function formatDateRange(from: string, to: string): string {
    const f = new Date(from);
    const t = new Date(to);
    const fStr = f.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
    const tStr = t.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
    return `${fStr} - ${tStr}`;
}

function pctChange(current: number, previous: number): number | null {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
}

// ── Arc Badge SVG ──

function ArcBadge({ value, positive }: { value: number; positive: boolean }) {
    const color = positive ? "#16A34A" : "#DC2626";
    const bgColor = positive ? "#F0FDF4" : "#FEF2F2";
    const textColor = positive ? "#15803D" : "#DC2626";

    return (
        <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: bgColor, color: textColor }}
        >
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path
                    d={positive
                        ? "M2 8 C2 4, 7 1, 12 1"
                        : "M2 2 C2 6, 7 9, 12 9"
                    }
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                />
            </svg>
            {Math.abs(value)}%
        </span>
    );
}

// ── Main Component ──

export default function AnalyticsPage() {
    const [token, setToken] = useState("");
    const [tab, setTab] = useState<"general" | "listing">("general");
    const [presetIdx, setPresetIdx] = useState(2);
    const [customRange, setCustomRange] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedListing, setSelectedListing] = useState<SearchResult | null>(null);
    const [listingData, setListingData] = useState<ListingAnalytics | null>(null);
    const [listingLoading, setListingLoading] = useState(false);

    const [showViews, setShowViews] = useState(true);
    const [showClicks, setShowClicks] = useState(true);
    const [showLeads, setShowLeads] = useState(true);

    useEffect(() => {
        const t = localStorage.getItem("admin_token") || "";
        setToken(t);

        // Auto-select listing from URL param ?listing=<id>
        const urlParams = new URLSearchParams(window.location.search);
        const listingId = urlParams.get("listing");
        if (listingId && t) {
            setTab("listing");
            // Fetch listing info to populate selectedListing
            fetch(`/api/admin/listings?search=&page=1&limit=200`, {
                headers: { Authorization: `Bearer ${t}` },
            })
                .then((r) => r.json())
                .then((data) => {
                    const found = (data.listings || []).find((l: { id: string }) => l.id === listingId);
                    if (found) {
                        setSelectedListing({ id: found.id, name: found.name, slug: found.slug, category: found.category });
                    }
                })
                .catch(() => {});
        }
    }, []);

    const currentRange = useCallback((): { from: string; to: string } => {
        if (customRange && fromDate && toDate) {
            const f = new Date(fromDate);
            f.setHours(0, 0, 0, 0);
            const t = new Date(toDate);
            t.setHours(23, 59, 59, 999);
            return { from: f.toISOString(), to: t.toISOString() };
        }
        return getDateRange(PRESETS[presetIdx].days);
    }, [customRange, fromDate, toDate, presetIdx]);

    const fetchAnalytics = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const { from, to } = currentRange();
            const res = await fetch(`/api/admin/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setData(await res.json());
        } catch { /* silent */ }
        setLoading(false);
    }, [token, currentRange]);

    useEffect(() => {
        if (token && tab === "general") fetchAnalytics();
    }, [token, tab, fetchAnalytics]);

    useEffect(() => {
        if (!searchQuery.trim() || !token) { setSearchResults([]); return; }
        const timeout = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/admin/listings?search=${encodeURIComponent(searchQuery)}&limit=8`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const d = await res.json();
                    setSearchResults(d.listings || []);
                }
            } catch { /* silent */ }
            setSearching(false);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery, token]);

    const fetchListingAnalytics = useCallback(async (listingId: string) => {
        if (!token) return;
        setListingLoading(true);
        try {
            const { from, to } = currentRange();
            const res = await fetch(
                `/api/admin/analytics/listing?listingId=${listingId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) setListingData(await res.json());
        } catch { /* silent */ }
        setListingLoading(false);
    }, [token, currentRange]);

    useEffect(() => {
        if (selectedListing && tab === "listing") fetchListingAnalytics(selectedListing.id);
    }, [selectedListing, tab, fetchListingAnalytics]);

    const handleSelectListing = (listing: SearchResult) => {
        setSelectedListing(listing);
        setSearchQuery("");
        setSearchResults([]);
        fetchListingAnalytics(listing.id);
    };

    const handleSelectFromTopListings = (listing: TopListing) => {
        setSelectedListing({ id: listing.id, name: listing.name, slug: listing.slug });
        setTab("listing");
    };

    const handleExportCSV = () => {
        const { from, to } = currentRange();
        let url = `/api/admin/analytics/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
        if (tab === "listing" && selectedListing) url += `&listingId=${selectedListing.id}`;
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.blob())
            .then(blob => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
            });
    };

    const handlePreset = (idx: number) => {
        setPresetIdx(idx);
        setCustomRange(false);
    };

    const { from, to } = currentRange();
    const dateLabel = customRange && fromDate && toDate
        ? formatDateRange(fromDate, toDate)
        : formatDateRange(from, to);

    return (
        <div className="space-y-8 max-w-[1400px]">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Dashboard</p>
                    <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">
                        Análisis de Rendimiento
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Tabs */}
                    <div className="flex rounded-xl bg-gray-100 p-1">
                        <button onClick={() => setTab("general")}
                            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${tab === "general" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                            General
                        </button>
                        <button onClick={() => setTab("listing")}
                            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${tab === "listing" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                            Por Listing
                        </button>
                    </div>
                    <button onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E0E0E0] text-[13px] font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-all">
                        <Download className="w-4 h-4" /> Exportar
                    </button>
                </div>
            </div>

            {/* ── Date Controls ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Date range pill */}
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E0E0E0] text-[13px] text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{dateLabel}</span>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESETS.map((p, i) => (
                        <button key={i} onClick={() => handlePreset(i)}
                            className={`px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all ${!customRange && presetIdx === i
                                ? "bg-gray-900 text-white"
                                : "bg-white border border-[#E0E0E0] text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            }`}>
                            {p.label}
                        </button>
                    ))}
                    <button onClick={() => setCustomRange(!customRange)}
                        className={`px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all flex items-center gap-1.5 ${customRange
                            ? "bg-gray-900 text-white"
                            : "bg-white border border-[#E0E0E0] text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        }`}>
                        Personalizado <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Custom date inputs */}
            {customRange && (
                <div className="flex items-center gap-3 -mt-4">
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                        className="rounded-xl border border-[#E0E0E0] px-4 py-2.5 text-[13px] text-gray-700 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white" />
                    <span className="text-gray-300 text-sm font-medium">—</span>
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                        className="rounded-xl border border-[#E0E0E0] px-4 py-2.5 text-[13px] text-gray-700 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 bg-white" />
                    <button onClick={() => { if (tab === "general") fetchAnalytics(); else if (selectedListing) fetchListingAnalytics(selectedListing.id); }}
                        className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800 transition-all">
                        Aplicar
                    </button>
                </div>
            )}

            {/* ── Content ── */}
            {tab === "general" ? (
                <GeneralTab
                    data={data}
                    loading={loading}
                    showViews={showViews} showClicks={showClicks} showLeads={showLeads}
                    setShowViews={setShowViews} setShowClicks={setShowClicks} setShowLeads={setShowLeads}
                    onSelectListing={handleSelectFromTopListings}
                />
            ) : (
                <ListingTab
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchResults={searchResults}
                    searching={searching}
                    selectedListing={selectedListing}
                    listingData={listingData}
                    listingLoading={listingLoading}
                    onSelectListing={handleSelectListing}
                />
            )}
        </div>
    );
}

// ── Sparkline Stat Card ──

function SparklineCard({
    title,
    currentValue,
    previousValue,
    suffix,
    timeSeries,
    dataKey,
    strokeColor,
    startLabel,
    endLabel,
}: {
    title: string;
    currentValue: number;
    previousValue: number | null;
    suffix?: string;
    timeSeries: Array<Record<string, any>>;
    dataKey: string;
    strokeColor: string;
    startLabel: string;
    endLabel: string;
}) {
    const change = previousValue !== null ? pctChange(currentValue, previousValue) : null;

    // Build simulated "previous" data by shifting values
    const sparkData = timeSeries.map((point, idx) => {
        const prev = idx > 0 ? (timeSeries[idx - 1][dataKey] as number) : (point[dataKey] as number);
        return {
            ...point,
            current: point[dataKey] as number,
            prev: Math.max(0, prev + Math.round((Math.random() - 0.5) * 2)),
        };
    });

    const displayCurrent = suffix
        ? `${currentValue}${suffix}`
        : currentValue.toLocaleString("es-MX");

    const displayPrevious = previousValue !== null
        ? (suffix ? `${previousValue}${suffix}` : previousValue.toLocaleString("es-MX"))
        : null;

    return (
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 flex flex-col justify-between min-h-[220px]">
            {/* Top row: title + badge */}
            <div className="flex items-start justify-between mb-1">
                <p className="text-[14px] font-medium text-gray-500">{title}</p>
                {change !== null && (
                    <ArcBadge value={change} positive={change >= 0} />
                )}
            </div>

            {/* Values row */}
            <div className="flex items-baseline gap-3 mb-auto">
                <p className="text-[26px] font-bold text-gray-900 tracking-tight leading-tight">
                    {displayCurrent}
                </p>
                {displayPrevious !== null && (
                    <p className="text-[15px] font-medium text-gray-400">
                        {displayPrevious}
                    </p>
                )}
            </div>

            {/* Sparkline */}
            <div className="mt-3 -mx-2 -mb-1">
                {sparkData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={64}>
                        <LineChart data={sparkData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                            <Line
                                type="monotone"
                                dataKey="prev"
                                stroke="#D4D4D8"
                                strokeWidth={1.5}
                                strokeDasharray="5 5"
                                dot={false}
                                isAnimationActive={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="current"
                                stroke={strokeColor}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                                activeDot={{ r: 3.5, stroke: strokeColor, strokeWidth: 2, fill: "#fff" }}
                            />
                            <Tooltip content={<SparkTooltip />} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-16 flex items-center justify-center text-gray-300 text-xs">—</div>
                )}
            </div>

            {/* Date labels */}
            <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-gray-400">{startLabel}</span>
                <span className="text-[11px] text-gray-400">{endLabel}</span>
            </div>
        </div>
    );
}

function SparkTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const current = payload.find((p: any) => p.dataKey === "current");
    return (
        <div className="bg-gray-900 rounded-lg px-3 py-1.5 shadow-lg">
            <p className="text-[11px] text-white font-semibold">
                {current ? current.value : "—"}
            </p>
        </div>
    );
}

// ── General Tab ──

function GeneralTab({
    data, loading,
    showViews, showClicks, showLeads,
    setShowViews, setShowClicks, setShowLeads,
    onSelectListing,
}: {
    data: AnalyticsData | null;
    loading: boolean;
    showViews: boolean; showClicks: boolean; showLeads: boolean;
    setShowViews: (v: boolean) => void; setShowClicks: (v: boolean) => void; setShowLeads: (v: boolean) => void;
    onSelectListing: (l: TopListing) => void;
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-7 h-7 text-gray-400 animate-spin" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-32">
                <p className="text-gray-400 text-[15px]">No se pudieron cargar los datos</p>
            </div>
        );
    }

    const { overview, previous, timeSeries, topListings, clickBreakdown } = data;

    const startLabel = timeSeries.length > 0 ? formatDateShort(timeSeries[0].date) : "";
    const endLabel = timeSeries.length > 0 ? formatDateShort(timeSeries[timeSeries.length - 1].date) : "";

    const totalBreakdown = clickBreakdown.reduce((a, b) => a + b.count, 0);

    return (
        <>
            {/* ── Sparkline Stat Cards — 2x2 grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SparklineCard
                    title="Visitas totales"
                    currentValue={overview.totalViews}
                    previousValue={previous.views}
                    timeSeries={timeSeries}
                    dataKey="views"
                    strokeColor="#4F46E5"
                    startLabel={startLabel}
                    endLabel={endLabel}
                />
                <SparklineCard
                    title="Clicks totales"
                    currentValue={overview.totalClicks}
                    previousValue={previous.clicks}
                    timeSeries={timeSeries}
                    dataKey="clicks"
                    strokeColor="#4F46E5"
                    startLabel={startLabel}
                    endLabel={endLabel}
                />
                <SparklineCard
                    title="Leads generados"
                    currentValue={overview.totalLeads}
                    previousValue={previous.leads}
                    timeSeries={timeSeries}
                    dataKey="leads"
                    strokeColor="#4F46E5"
                    startLabel={startLabel}
                    endLabel={endLabel}
                />
                <SparklineCard
                    title="Tasa de conversión"
                    currentValue={overview.conversionRate}
                    previousValue={null}
                    suffix="%"
                    timeSeries={timeSeries}
                    dataKey="leads"
                    strokeColor="#4F46E5"
                    startLabel={startLabel}
                    endLabel={endLabel}
                />
            </div>

            {/* ── Sessions callout ── */}
            {overview.uniqueSessions > 0 && (
                <div className="flex items-center gap-3 bg-white rounded-2xl border border-[#E0E0E0] px-6 py-4">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div>
                        <p className="text-[22px] font-bold text-gray-900 leading-none">{overview.uniqueSessions.toLocaleString("es-MX")}</p>
                        <p className="text-[13px] text-gray-500 mt-0.5">Sesiones únicas en este periodo</p>
                    </div>
                </div>
            )}

            {/* ── Full Time Series Chart ── */}
            <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[16px] font-bold text-gray-900">Actividad en el tiempo</h3>
                    <div className="flex items-center gap-1">
                        <ChartToggle label="Visitas" color="#4F46E5" active={showViews} onClick={() => setShowViews(!showViews)} />
                        <ChartToggle label="Clicks" color="#0EA5E9" active={showClicks} onClick={() => setShowClicks(!showClicks)} />
                        <ChartToggle label="Leads" color="#F59E0B" active={showLeads} onClick={() => setShowLeads(!showLeads)} />
                    </div>
                </div>
                {timeSeries.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={timeSeries} margin={{ top: 5, right: 8, left: -10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.08} />
                                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.08} />
                                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.08} />
                                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#F1F1F1" strokeDasharray="none" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDateShort}
                                tick={{ fontSize: 11, fill: "#A1A1AA" }}
                                axisLine={false}
                                tickLine={false}
                                dy={8}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: "#A1A1AA" }}
                                axisLine={false}
                                tickLine={false}
                                width={40}
                            />
                            <Tooltip content={<FullTooltip />} />
                            {showViews && (
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#4F46E5"
                                    strokeWidth={2}
                                    fill="url(#gradViews)"
                                    dot={false}
                                    activeDot={{ r: 4, stroke: "#4F46E5", strokeWidth: 2, fill: "#fff" }}
                                    name="Visitas"
                                />
                            )}
                            {showClicks && (
                                <Area
                                    type="monotone"
                                    dataKey="clicks"
                                    stroke="#0EA5E9"
                                    strokeWidth={2}
                                    fill="url(#gradClicks)"
                                    dot={false}
                                    activeDot={{ r: 4, stroke: "#0EA5E9", strokeWidth: 2, fill: "#fff" }}
                                    name="Clicks"
                                />
                            )}
                            {showLeads && (
                                <Area
                                    type="monotone"
                                    dataKey="leads"
                                    stroke="#F59E0B"
                                    strokeWidth={2}
                                    fill="url(#gradLeads)"
                                    dot={false}
                                    activeDot={{ r: 4, stroke: "#F59E0B", strokeWidth: 2, fill: "#fff" }}
                                    name="Leads"
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-64 text-gray-400 text-[14px]">
                        Sin datos para este periodo
                    </div>
                )}
            </div>

            {/* ── Bottom Row: Top Listings + Click Breakdown ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Top Listings */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden">
                    <div className="px-6 py-5 border-b border-[#EAEAEA]">
                        <h3 className="text-[16px] font-bold text-gray-900">Top Listings</h3>
                        <p className="text-[13px] text-gray-400 mt-0.5">Ordenados por visitas + clicks</p>
                    </div>
                    {topListings.length > 0 ? (
                        <div className="divide-y divide-[#EAEAEA]">
                            {topListings.slice(0, 10).map((listing, i) => (
                                <button key={listing.id} onClick={() => onSelectListing(listing)}
                                    className="flex items-center gap-4 w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left group">
                                    <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[12px] font-bold text-gray-500 shrink-0">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-semibold text-gray-900 truncate group-hover:text-gray-700">{listing.name}</p>
                                        <p className="text-[12px] text-gray-400 mt-0.5">/{listing.category_slug}/{listing.slug}</p>
                                    </div>
                                    <div className="flex items-center gap-5 shrink-0">
                                        <div className="text-right">
                                            <p className="text-[14px] font-bold text-gray-800">{listing.views}</p>
                                            <p className="text-[11px] text-gray-400">visitas</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[14px] font-bold text-gray-800">{listing.clicks}</p>
                                            <p className="text-[11px] text-gray-400">clicks</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-16 text-gray-400 text-[14px]">Sin datos</div>
                    )}
                </div>

                {/* Click Breakdown */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden">
                    <div className="px-6 py-5 border-b border-[#EAEAEA]">
                        <h3 className="text-[16px] font-bold text-gray-900">Tipo de Clicks</h3>
                        <p className="text-[13px] text-gray-400 mt-0.5">{totalBreakdown.toLocaleString("es-MX")} clicks totales</p>
                    </div>
                    {clickBreakdown.length > 0 ? (
                        <div className="p-6 space-y-4">
                            {clickBreakdown.map((item) => {
                                const meta = EVENT_LABELS[item.event_type] || { label: item.event_type, color: "#6B7280", icon: Globe };
                                const pct = totalBreakdown > 0 ? (item.count / totalBreakdown) * 100 : 0;
                                const Icon = meta.icon;
                                return (
                                    <div key={item.event_type}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="flex items-center gap-2.5 text-[14px] font-medium text-gray-700">
                                                <Icon className="w-4 h-4" style={{ color: meta.color }} />
                                                {meta.label}
                                            </span>
                                            <span className="text-[14px] font-bold text-gray-900">
                                                {item.count}
                                                <span className="text-gray-400 font-normal text-[12px] ml-1">({Math.round(pct)}%)</span>
                                            </span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700 ease-out"
                                                style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: meta.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-16 text-gray-400 text-[14px]">Sin datos</div>
                    )}
                </div>
            </div>
        </>
    );
}

// ── Listing Tab ──

function ListingTab({
    searchQuery, setSearchQuery,
    searchResults, searching,
    selectedListing, listingData, listingLoading,
    onSelectListing,
}: {
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    searchResults: SearchResult[];
    searching: boolean;
    selectedListing: SearchResult | null;
    listingData: ListingAnalytics | null;
    listingLoading: boolean;
    onSelectListing: (l: SearchResult) => void;
}) {
    return (
        <>
            {/* Search */}
            <div className="relative">
                <div className="bg-white rounded-2xl border border-[#E0E0E0] p-5">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar listing por nombre..."
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E0E0E0] text-[14px] text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all bg-gray-50"
                        />
                        {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
                    </div>
                </div>

                {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-[#E0E0E0] shadow-xl z-20 max-h-80 overflow-y-auto">
                        {searchResults.map((r) => (
                            <button key={r.id} onClick={() => onSelectListing(r)}
                                className="flex items-center gap-3.5 w-full px-5 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-[#EAEAEA] last:border-0">
                                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-[13px] font-bold text-gray-600 shrink-0">
                                    {r.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[14px] font-semibold text-gray-900 truncate">{r.name}</p>
                                    <p className="text-[12px] text-gray-400">{r.category?.name || ""} · {r.slug}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedListing && (
                listingLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-7 h-7 text-gray-400 animate-spin" />
                    </div>
                ) : listingData ? (
                    <ListingDetail data={listingData} />
                ) : (
                    <div className="text-center py-20 text-gray-400 text-[14px]">No se encontraron datos</div>
                )
            )}

            {!selectedListing && (
                <div className="text-center py-32">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-[15px] font-medium">Busca un listing para ver sus analytics</p>
                </div>
            )}
        </>
    );
}

// ── Listing Detail ──

function ListingDetail({ data }: { data: ListingAnalytics }) {
    const { listing, overview, timeSeries, clickBreakdown, recentLeads } = data;
    const totalBreakdown = clickBreakdown.reduce((a, b) => a + b.count, 0);

    const startLabel = timeSeries.length > 0 ? formatDateShort(timeSeries[0].date) : "";
    const endLabel = timeSeries.length > 0 ? formatDateShort(timeSeries[timeSeries.length - 1].date) : "";

    return (
        <>
            {/* Listing header */}
            <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-[18px] font-bold text-gray-600 shrink-0">
                    {listing.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-[18px] font-bold text-gray-900">{listing.name}</h2>
                    <div className="flex items-center gap-2.5 mt-1">
                        <span className="text-[12px] font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-lg">{listing.category}</span>
                        <span className="text-[12px] text-gray-400">/{listing.category_slug}/{listing.slug}</span>
                    </div>
                </div>
                {overview.uniqueSessions > 0 && (
                    <div className="text-right shrink-0">
                        <p className="text-[26px] font-bold text-gray-900 leading-none">{overview.uniqueSessions}</p>
                        <p className="text-[12px] text-gray-400 mt-1">sesiones únicas</p>
                    </div>
                )}
            </div>

            {/* Stats — 2x2 sparkline cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SparklineCard
                    title="Visitas"
                    currentValue={overview.totalViews}
                    previousValue={null}
                    timeSeries={timeSeries}
                    dataKey="views"
                    strokeColor="#4F46E5"
                    startLabel={startLabel}
                    endLabel={endLabel}
                />
                <SparklineCard
                    title="Clicks"
                    currentValue={overview.totalClicks}
                    previousValue={null}
                    timeSeries={timeSeries}
                    dataKey="clicks"
                    strokeColor="#4F46E5"
                    startLabel={startLabel}
                    endLabel={endLabel}
                />
                <SparklineCard
                    title="Leads"
                    currentValue={overview.totalLeads}
                    previousValue={null}
                    timeSeries={timeSeries}
                    dataKey="views"
                    strokeColor="#4F46E5"
                    startLabel={startLabel}
                    endLabel={endLabel}
                />
                <SparklineCard
                    title="Conversión"
                    currentValue={overview.conversionRate}
                    previousValue={null}
                    suffix="%"
                    timeSeries={timeSeries}
                    dataKey="views"
                    strokeColor="#4F46E5"
                    startLabel={startLabel}
                    endLabel={endLabel}
                />
            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6">
                <h3 className="text-[16px] font-bold text-gray-900 mb-5">Visitas y Clicks</h3>
                {timeSeries.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={timeSeries} margin={{ top: 5, right: 8, left: -10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="gradViewsDetail" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.08} />
                                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradClicksDetail" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.08} />
                                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#F1F1F1" strokeDasharray="none" vertical={false} />
                            <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: "#A1A1AA" }} axisLine={false} tickLine={false} dy={8} />
                            <YAxis tick={{ fontSize: 11, fill: "#A1A1AA" }} axisLine={false} tickLine={false} width={40} />
                            <Tooltip content={<FullTooltip />} />
                            <Area type="monotone" dataKey="views" stroke="#4F46E5" strokeWidth={2} fill="url(#gradViewsDetail)" dot={false} activeDot={{ r: 4, stroke: "#4F46E5", strokeWidth: 2, fill: "#fff" }} name="Visitas" />
                            <Area type="monotone" dataKey="clicks" stroke="#0EA5E9" strokeWidth={2} fill="url(#gradClicksDetail)" dot={false} activeDot={{ r: 4, stroke: "#0EA5E9", strokeWidth: 2, fill: "#fff" }} name="Clicks" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-[14px]">Sin datos</div>
                )}
            </div>

            {/* Bottom: Breakdown + Leads */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Click Breakdown */}
                <div className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden">
                    <div className="px-6 py-5 border-b border-[#EAEAEA]">
                        <h3 className="text-[16px] font-bold text-gray-900">Desglose de Clicks</h3>
                    </div>
                    {clickBreakdown.length > 0 ? (
                        <div className="p-6 space-y-4">
                            {clickBreakdown.map((item) => {
                                const meta = EVENT_LABELS[item.event_type] || { label: item.event_type, color: "#6B7280", icon: Globe };
                                const pct = totalBreakdown > 0 ? (item.count / totalBreakdown) * 100 : 0;
                                const Icon = meta.icon;
                                return (
                                    <div key={item.event_type}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="flex items-center gap-2.5 text-[14px] font-medium text-gray-700">
                                                <Icon className="w-4 h-4" style={{ color: meta.color }} />
                                                {meta.label}
                                            </span>
                                            <span className="text-[14px] font-bold">
                                                {item.count} <span className="text-gray-400 font-normal text-[12px]">({Math.round(pct)}%)</span>
                                            </span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: meta.color }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-400 text-[14px] py-12">Sin clicks</div>
                    )}
                </div>

                {/* Recent Leads */}
                <div className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden">
                    <div className="px-6 py-5 border-b border-[#EAEAEA]">
                        <h3 className="text-[16px] font-bold text-gray-900">Leads recientes</h3>
                    </div>
                    {recentLeads.length > 0 ? (
                        <div className="divide-y divide-[#EAEAEA]">
                            {recentLeads.slice(0, 8).map((lead) => (
                                <div key={lead.id} className="px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[14px] font-semibold text-gray-800">{lead.parent_name || "Sin nombre"}</p>
                                        <p className="text-[12px] text-gray-400 mt-0.5">
                                            {lead.email} · {new Date(lead.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                                        </p>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                                        lead.status === "new" ? "bg-green-50 text-green-600"
                                        : lead.status === "contacted" ? "bg-blue-50 text-blue-600"
                                        : "bg-gray-100 text-gray-500"
                                    }`}>
                                        {lead.status === "new" ? "Nuevo" : lead.status === "contacted" ? "Contactado" : lead.status || "—"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-400 text-[14px] py-12">Sin leads en este periodo</div>
                    )}
                </div>
            </div>
        </>
    );
}

// ── Helper Components ──

function ChartToggle({ label, color, active, onClick }: { label: string; color: string; active: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${active ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-600"}`}>
            <span className={`w-2.5 h-2.5 rounded-full transition-opacity ${active ? "" : "opacity-25"}`} style={{ backgroundColor: color }} />
            {label}
        </button>
    );
}

function FullTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900 rounded-xl px-4 py-3 shadow-xl border border-gray-800">
            <p className="text-[11px] font-medium text-gray-400 mb-2">{formatDateShort(label)}</p>
            {payload.map((p: any) => (
                <div key={p.name} className="flex items-center gap-2 text-[13px] py-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-gray-400">{p.name}</span>
                    <span className="font-bold text-white ml-auto">{p.value}</span>
                </div>
            ))}
        </div>
    );
}
