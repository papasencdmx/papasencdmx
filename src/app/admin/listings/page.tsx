"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Search,
    ChevronDown,
    ChevronUp,
    X,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Save,
    ExternalLink,
    Phone,
    Mail,
    Globe,
    MapPin,
    Check,
    Star,
    Edit3,
    Filter,
    BarChart3,
    Image,
    Navigation,
    Pencil,
    Calendar,
    Trash2,
    AlertTriangle,
    Plus,
    GripVertical,
    FileText,
    Eye,
    EyeOff,
    Sparkles,
    Stethoscope,
    Smile,
    Scissors,
    Eye as EyeIcon,
    Ear,
    Baby,
    Syringe,
    Pill,
    Scan,
    Bone,
    Activity,
    Zap,
    Brush,
    Wrench,
    Gem,
    ShieldPlus,
    HeartPulse,
    Brain,
    Droplets,
    Leaf,
    CheckCircle,
    Copy,
} from "lucide-react";

const SERVICE_ICON_OPTIONS: Array<{ value: string; icon: React.ReactNode; label: string }> = [
    { value: "stethoscope", icon: <Stethoscope className="w-3.5 h-3.5" />, label: "General" },
    { value: "smile", icon: <Smile className="w-3.5 h-3.5" />, label: "Dental" },
    { value: "sparkles", icon: <Sparkles className="w-3.5 h-3.5" />, label: "Estética" },
    { value: "scissors", icon: <Scissors className="w-3.5 h-3.5" />, label: "Cirugía" },
    { value: "eye", icon: <EyeIcon className="w-3.5 h-3.5" />, label: "Oftalmo" },
    { value: "ear", icon: <Ear className="w-3.5 h-3.5" />, label: "Otorrino" },
    { value: "baby", icon: <Baby className="w-3.5 h-3.5" />, label: "Pediatría" },
    { value: "syringe", icon: <Syringe className="w-3.5 h-3.5" />, label: "Inyección" },
    { value: "pill", icon: <Pill className="w-3.5 h-3.5" />, label: "Farmacia" },
    { value: "scan", icon: <Scan className="w-3.5 h-3.5" />, label: "Diagnóstico" },
    { value: "bone", icon: <Bone className="w-3.5 h-3.5" />, label: "Ortopedia" },
    { value: "activity", icon: <Activity className="w-3.5 h-3.5" />, label: "Cardio" },
    { value: "zap", icon: <Zap className="w-3.5 h-3.5" />, label: "Láser" },
    { value: "brush", icon: <Brush className="w-3.5 h-3.5" />, label: "Limpieza" },
    { value: "search", icon: <Search className="w-3.5 h-3.5" />, label: "Revisión" },
    { value: "wrench", icon: <Wrench className="w-3.5 h-3.5" />, label: "Reparación" },
    { value: "gem", icon: <Gem className="w-3.5 h-3.5" />, label: "Premium" },
    { value: "shield_plus", icon: <ShieldPlus className="w-3.5 h-3.5" />, label: "Protección" },
    { value: "heart_pulse", icon: <HeartPulse className="w-3.5 h-3.5" />, label: "Salud" },
    { value: "brain", icon: <Brain className="w-3.5 h-3.5" />, label: "Neuro" },
    { value: "droplets", icon: <Droplets className="w-3.5 h-3.5" />, label: "Higiene" },
    { value: "leaf", icon: <Leaf className="w-3.5 h-3.5" />, label: "Natural" },
    { value: "star", icon: <Star className="w-3.5 h-3.5" />, label: "Destacado" },
    { value: "check", icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Verificado" },
];

interface SectionRow {
    id: string;
    listing_id: string;
    title: string;
    slug: string;
    content: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
}

interface Category { id: string; name: string; slug: string }
interface Zone { id: string; name: string; slug: string }
interface ListingRow {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    short_description: string | null;
    recommendation_reason: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    whatsapp: string | null;
    street_address: string | null;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
    age_min: number | null;
    age_max: number | null;
    price_min: number | null;
    price_max: number | null;
    price_range: string | null;
    languages: string[];
    schedule: string | null;
    tier: string;
    is_active: boolean;
    is_verified: boolean;
    is_featured: boolean;
    logo_url: string | null;
    cover_image_url: string | null;
    gallery_urls: string[] | null;
    google_rating: number | null;
    google_review_count: number | null;
    google_place_id: string | null;
    google_photos_enabled: boolean;
    meta_title: string | null;
    meta_description: string | null;
    active_expires_at: string | null;
    verified_expires_at: string | null;
    featured_expires_at: string | null;
    section_content: Record<string, unknown> | null;
    social_links: Record<string, string> | null;
    founded_date: string | null;
    discount_percent: number | null;
    discount_label: string | null;
    is_claimed: boolean;
    created_at: string;
    updated_at: string;
    zone_id: string | null;
    category_id: string;
    subcategory_id: string | null;
    category: { id: string; name: string; slug: string } | null;
    zone: { id: string; name: string; slug: string } | null;
}

const DAYS_ES = [
    { key: "monday", label: "Lunes" },
    { key: "tuesday", label: "Martes" },
    { key: "wednesday", label: "Miércoles" },
    { key: "thursday", label: "Jueves" },
    { key: "friday", label: "Viernes" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
];

const TIME_OPTIONS = [
    "Cerrado",
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
    "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00",
];

interface DaySchedule {
    closed: boolean;
    ranges: Array<{ open: string; close: string }>;
}

function parseScheduleString(raw: string): Record<string, DaySchedule> {
    const result: Record<string, DaySchedule> = {};
    DAYS_ES.forEach(d => { result[d.key] = { closed: true, ranges: [{ open: "09:00", close: "18:00" }] }; });
    if (!raw) return result;

    const entries = raw.split("|").map(s => s.trim()).filter(Boolean);
    for (const entry of entries) {
        const colonIdx = entry.indexOf(":");
        if (colonIdx === -1) continue;
        const dayEn = entry.substring(0, colonIdx).trim().toLowerCase();
        const hours = entry.substring(colonIdx + 1).trim();

        if (!result[dayEn]) continue;

        if (hours.toLowerCase() === "closed" || hours.toLowerCase() === "cerrado") {
            result[dayEn] = { closed: true, ranges: [{ open: "09:00", close: "18:00" }] };
        } else {
            // Parse "10:00 AM – 2:00 PM, 4:00 PM – 8:00 PM" or "10:00 – 14:00, 16:00 – 20:00"
            const rangeParts = hours.split(",").map(s => s.trim()).filter(Boolean);
            const ranges: Array<{ open: string; close: string }> = [];
            for (const part of rangeParts) {
                const match = part.match(/(\d{1,2}:\d{2})\s*(AM|PM)?\s*[–\-]\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i);
                if (match) {
                    const open = convertTo24h(match[1], match[2]);
                    const close = convertTo24h(match[3], match[4]);
                    ranges.push({ open, close });
                }
            }
            result[dayEn] = { closed: false, ranges: ranges.length > 0 ? ranges : [{ open: "09:00", close: "18:00" }] };
        }
    }
    return result;
}

function convertTo24h(time: string, ampm?: string): string {
    if (!ampm) return time.length === 4 ? "0" + time : time;
    let [h, m] = time.split(":").map(Number);
    if (ampm.toUpperCase() === "PM" && h < 12) h += 12;
    if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function buildScheduleString(schedule: Record<string, DaySchedule>): string {
    return DAYS_ES.map(d => {
        const day = schedule[d.key];
        if (!day || day.closed) return `${d.key.charAt(0).toUpperCase() + d.key.slice(1)}: Closed`;
        const rangeStr = day.ranges.map(r => `${r.open} – ${r.close}`).join(", ");
        return `${d.key.charAt(0).toUpperCase() + d.key.slice(1)}: ${rangeStr}`;
    }).join(" | ");
}

function ScheduleEditor({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(() => parseScheduleString(value));

    const update = (newSchedule: Record<string, DaySchedule>) => {
        setSchedule(newSchedule);
        onChange(buildScheduleString(newSchedule));
    };

    const toggleDay = (key: string) => {
        const next = { ...schedule, [key]: { ...schedule[key], closed: !schedule[key].closed } };
        update(next);
    };

    const updateRange = (dayKey: string, rangeIdx: number, field: "open" | "close", val: string) => {
        const day = { ...schedule[dayKey] };
        const ranges = [...day.ranges];
        ranges[rangeIdx] = { ...ranges[rangeIdx], [field]: val };
        update({ ...schedule, [dayKey]: { ...day, ranges } });
    };

    const addRange = (dayKey: string) => {
        const day = { ...schedule[dayKey] };
        const lastClose = day.ranges[day.ranges.length - 1]?.close || "14:00";
        update({ ...schedule, [dayKey]: { ...day, ranges: [...day.ranges, { open: lastClose, close: "20:00" }] } });
    };

    const removeRange = (dayKey: string, rangeIdx: number) => {
        const day = { ...schedule[dayKey] };
        const ranges = day.ranges.filter((_, i) => i !== rangeIdx);
        update({ ...schedule, [dayKey]: { ...day, ranges: ranges.length > 0 ? ranges : [{ open: "09:00", close: "18:00" }] } });
    };

    const copyToAll = (sourceKey: string) => {
        const source = schedule[sourceKey];
        const next: Record<string, DaySchedule> = {};
        DAYS_ES.forEach(d => { next[d.key] = { closed: source.closed, ranges: source.ranges.map(r => ({ ...r })) }; });
        update(next);
    };

    const selectCls = "rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:ring-1 focus:ring-orange-300 focus:border-orange-300";

    return (
        <div className="space-y-1.5 rounded-xl border border-gray-200 bg-gray-50/40 p-3">
            {DAYS_ES.map(({ key, label }) => {
                const day = schedule[key];
                return (
                    <div key={key} className={`flex items-start gap-2 rounded-lg px-2.5 py-2 ${day.closed ? "bg-gray-100/60" : "bg-white border border-gray-100"}`}>
                        <div className="w-20 shrink-0 pt-1">
                            <span className={`text-xs font-semibold ${day.closed ? "text-gray-400" : "text-gray-700"}`}>{label}</span>
                        </div>
                        <label className="flex items-center gap-1.5 shrink-0 pt-1 cursor-pointer">
                            <input type="checkbox" checked={!day.closed} onChange={() => toggleDay(key)}
                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-3.5 h-3.5" />
                            <span className="text-[11px] text-gray-400">{day.closed ? "Cerrado" : "Abierto"}</span>
                        </label>
                        {!day.closed && (
                            <div className="flex-1 space-y-1.5">
                                {day.ranges.map((range, ri) => (
                                    <div key={ri} className="flex items-center gap-1.5">
                                        <select value={range.open} onChange={(e) => updateRange(key, ri, "open", e.target.value)} className={selectCls}>
                                            {TIME_OPTIONS.filter(t => t !== "Cerrado").map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <span className="text-xs text-gray-400">–</span>
                                        <select value={range.close} onChange={(e) => updateRange(key, ri, "close", e.target.value)} className={selectCls}>
                                            {TIME_OPTIONS.filter(t => t !== "Cerrado").map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        {day.ranges.length > 1 && (
                                            <button type="button" onClick={() => removeRange(key, ri)} className="text-red-400 hover:text-red-600 p-0.5">
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                        {ri === day.ranges.length - 1 && day.ranges.length < 3 && (
                                            <button type="button" onClick={() => addRange(key)} className="text-blue-500 hover:text-blue-700 text-[10px] font-semibold ml-1">+turno</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {key === "monday" && !day.closed && (
                            <button type="button" onClick={() => copyToAll(key)} className="text-[10px] text-orange-500 hover:text-orange-700 font-semibold shrink-0 pt-1" title="Copiar a todos los días">
                                Copiar a todos
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function ListingsPage() {
    const [listings, setListings] = useState<ListingRow[]>([]);
    const [total, setTotal] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string; slug: string; category_id: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const limit = 20;

    // Filters
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [zoneFilter, setZoneFilter] = useState("");
    const [phoneFilter, setPhoneFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    // Edit
    const [editListing, setEditListing] = useState<ListingRow | null>(null);
    const [editForm, setEditForm] = useState<Record<string, unknown>>({});
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState("");

    // Copy from
    const [copyModalOpen, setCopyModalOpen] = useState(false);
    const [copySearch, setCopySearch] = useState("");
    const [copySource, setCopySource] = useState<ListingRow | null>(null);
    const [copyFields, setCopyFields] = useState<Set<string>>(new Set());

    // Delete
    const [deleteStep, setDeleteStep] = useState(0); // 0=hidden, 1=confirm, 2=type DELETE
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);

    // Section position reorder
    const [showPositionModal, setShowPositionModal] = useState(false);
    const [positionOrder, setPositionOrder] = useState<string[]>([]);

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleteStep, setBulkDeleteStep] = useState(0); // 0=hidden, 1=confirm, 2=type DELETE
    const [bulkDeleteText, setBulkDeleteText] = useState("");
    const [bulkDeleting, setBulkDeleting] = useState(false);

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === listings.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(listings.map(l => l.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (!token || selectedIds.size === 0) return;
        setBulkDeleting(true);
        let failed = 0;
        for (const id of Array.from(selectedIds)) {
            try {
                const res = await fetch(`/api/admin/listings/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) failed++;
            } catch {
                failed++;
            }
        }
        setBulkDeleting(false);
        setBulkDeleteStep(0);
        setBulkDeleteText("");
        setSelectedIds(new Set());
        fetchListings();
        if (failed > 0) setSaveError(`${failed} listing(s) no se pudieron eliminar`);
    };

    // Custom sections
    const [sections, setSections] = useState<SectionRow[]>([]);
    const [sectionsLoading, setSectionsLoading] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState("");

    // Create new listing
    const [isCreating, setIsCreating] = useState(false);

    // New zone creation
    const [showNewZone, setShowNewZone] = useState(false);
    const [newZoneName, setNewZoneName] = useState("");
    const [creatingZone, setCreatingZone] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

    const fetchListings = useCallback(async () => {
        if (!token) return;
        setLoading(true);

        // Silently trigger auto-expiry check
        fetch("/api/admin/expire-check", { method: "POST" }).catch(() => { });

        const params = new URLSearchParams({ page: String(page), limit: String(limit), active: "false" });
        if (search) params.set("search", search);
        if (categoryFilter) params.set("category", categoryFilter);
        if (zoneFilter) params.set("zone", zoneFilter);
        if (phoneFilter) params.set("phone", phoneFilter);

        try {
            const res = await fetch(`/api/admin/listings?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setListings(data.listings || []);
            setTotal(data.total || 0);
            if (data.categories) setCategories(data.categories);
            if (data.zones) setZones(data.zones);
            if (data.subcategories) setSubcategories(data.subcategories);
        } catch { /* ignore */ }
        setLoading(false);
    }, [token, page, search, categoryFilter, zoneFilter, phoneFilter]);

    useEffect(() => { fetchListings(); }, [fetchListings]);

    // Debounced search
    const [searchInput, setSearchInput] = useState("");
    const [phoneInput, setPhoneInput] = useState("");
    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);
    useEffect(() => {
        const t = setTimeout(() => { setPhoneFilter(phoneInput); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [phoneInput]);

    const totalPages = Math.ceil(total / limit);
    const activeFilters = [categoryFilter, zoneFilter, phoneFilter].filter(Boolean).length;

    const openEdit = (listing: ListingRow) => {
        setEditListing(listing);
        setEditForm({
            name: listing.name,
            slug: listing.slug,
            short_description: listing.short_description || "",
            description: listing.description || "",
            recommendation_reason: listing.recommendation_reason || "",
            phone: listing.phone || "",
            email: listing.email || "",
            website: listing.website || "",
            whatsapp: listing.whatsapp || "",
            street_address: listing.street_address || "",
            postal_code: listing.postal_code || "",
            latitude: listing.latitude,
            longitude: listing.longitude,
            schedule: listing.schedule || "",
            tier: listing.tier,
            is_active: listing.is_active,
            is_verified: listing.is_verified,
            is_featured: listing.is_featured,
            category_id: listing.category_id,
            subcategory_id: listing.subcategory_id || "",
            zone_id: listing.zone_id || "",
            age_min: listing.age_min,
            age_max: listing.age_max,
            price_min: listing.price_min,
            price_max: listing.price_max,
            price_range: listing.price_range || "",
            logo_url: listing.logo_url || "",
            cover_image_url: listing.cover_image_url || "",
            gallery_urls: listing.gallery_urls || [],
            google_rating: listing.google_rating,
            google_review_count: listing.google_review_count,
            google_place_id: listing.google_place_id || "",
            google_photos_enabled: listing.google_photos_enabled ?? true,
            meta_title: listing.meta_title || "",
            meta_description: listing.meta_description || "",
            languages: listing.languages || [],
            active_expires_at: listing.active_expires_at || null,
            verified_expires_at: listing.verified_expires_at || null,
            featured_expires_at: listing.featured_expires_at || null,
            social_links: listing.social_links || {},
            founded_date: listing.founded_date || "",
            discount_percent: listing.discount_percent ?? null,
            discount_label: listing.discount_label || "",
            is_claimed: listing.is_claimed || false,
            section_content: listing.section_content || {},
        });
        setSaveSuccess(false);
        setSaveError("");
        fetchSections(listing.id);
    };

    const openCreate = () => {
        setIsCreating(true);
        setEditListing({
            id: "",
            name: "",
            slug: "",
            description: null,
            short_description: null,
            recommendation_reason: null,
            phone: null,
            email: null,
            website: null,
            whatsapp: null,
            street_address: null,
            postal_code: null,
            latitude: null,
            longitude: null,
            age_min: null,
            age_max: null,
            price_min: null,
            price_max: null,
            price_range: null,
            languages: [],
            schedule: null,
            tier: "free",
            is_active: true,
            is_verified: false,
            is_featured: false,
            logo_url: null,
            cover_image_url: null,
            gallery_urls: null,
            google_rating: null,
            google_review_count: null,
            google_place_id: null,
            google_photos_enabled: false,
            meta_title: null,
            meta_description: null,
            active_expires_at: null,
            verified_expires_at: null,
            featured_expires_at: null,
            section_content: null,
            social_links: null,
            founded_date: null,
            discount_percent: null,
            discount_label: null,
            is_claimed: false,
            created_at: "",
            updated_at: "",
            zone_id: null,
            category_id: categories[0]?.id || "",
            subcategory_id: null,
            category: null,
            zone: null,
        } as ListingRow);
        setEditForm({
            name: "",
            slug: "",
            short_description: "",
            description: "",
            recommendation_reason: "",
            phone: "",
            email: "",
            website: "",
            whatsapp: "",
            street_address: "",
            postal_code: "",
            latitude: null,
            longitude: null,
            schedule: "",
            tier: "free",
            is_active: true,
            is_verified: false,
            is_featured: false,
            category_id: categories[0]?.id || "",
            zone_id: "",
            age_min: null,
            age_max: null,
            price_min: null,
            price_max: null,
            price_range: "",
            logo_url: "",
            cover_image_url: "",
            gallery_urls: [],
            google_rating: null,
            google_review_count: null,
            google_place_id: "",
            google_photos_enabled: false,
            meta_title: "",
            meta_description: "",
            languages: [],
            active_expires_at: null,
            verified_expires_at: null,
            featured_expires_at: null,
            social_links: {},
            founded_date: "",
            discount_percent: null,
            discount_label: "",
            is_claimed: false,
            section_content: {},
        });
        setSections([]);
        setSaveSuccess(false);
        setSaveError("");
    };

    const handleSave = async () => {
        if (!editListing || !token) return;
        setSaving(true);
        setSaveSuccess(false);
        setSaveError("");
        try {
            const url = isCreating
                ? "/api/admin/listings"
                : `/api/admin/listings/${editListing.id}`;
            const method = isCreating ? "POST" : "PATCH";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(editForm),
            });
            const result = await res.json();
            if (res.ok) {
                setSaveSuccess(true);
                fetchListings();
                if (isCreating && result.listing) {
                    // Switch to edit mode for the newly created listing
                    setIsCreating(false);
                    setEditListing({ ...editListing, ...result.listing, category: editListing.category, zone: editListing.zone } as ListingRow);
                }
                setTimeout(() => setSaveSuccess(false), 2500);
            } else {
                setSaveError(result.error || "Error al guardar");
            }
        } catch {
            setSaveError("Error de conexión");
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!editListing || !token) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/listings/${editListing.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setEditListing(null);
                setIsCreating(false);
                setDeleteStep(0);
                setDeleteConfirmText("");
                fetchListings();
            } else {
                const data = await res.json();
                setSaveError(data.error || "Error al eliminar");
            }
        } catch {
            setSaveError("Error de conexión");
        }
        setDeleting(false);
    };

    const updateField = (key: string, value: unknown) => {
        setEditForm((prev) => ({ ...prev, [key]: value }));
    };

    const updateSocialLink = (platform: string, value: string) => {
        setEditForm((prev) => ({
            ...prev,
            social_links: { ...(prev.social_links as Record<string, string> || {}), [platform]: value },
        }));
    };

    const updateSectionContent = (key: string, value: unknown) => {
        setEditForm((prev) => ({
            ...prev,
            section_content: { ...(prev.section_content as Record<string, unknown> || {}), [key]: value },
        }));
    };

    // ── Custom Sections CRUD ──
    const fetchSections = useCallback(async (listingId: string) => {
        if (!token) return;
        setSectionsLoading(true);
        try {
            const res = await fetch(`/api/admin/listings/${listingId}/sections`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setSections(data.sections || []);
        } catch { /* ignore */ }
        setSectionsLoading(false);
    }, [token]);

    const addSection = async () => {
        if (!editListing || !token || !newSectionTitle.trim()) return;
        try {
            const res = await fetch(`/api/admin/listings/${editListing.id}/sections`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: newSectionTitle.trim() }),
            });
            if (res.ok) {
                setNewSectionTitle("");
                fetchSections(editListing.id);
            }
        } catch { /* ignore */ }
    };

    const updateSection = async (sectionId: string, updates: Partial<SectionRow>) => {
        if (!editListing || !token) return;
        try {
            await fetch(`/api/admin/listings/${editListing.id}/sections`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ sectionId, ...updates }),
            });
            fetchSections(editListing.id);
        } catch { /* ignore */ }
    };

    const deleteSection = async (sectionId: string) => {
        if (!editListing || !token) return;
        try {
            await fetch(`/api/admin/listings/${editListing.id}/sections?sectionId=${sectionId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchSections(editListing.id);
        } catch { /* ignore */ }
    };

    const moveSectionUp = async (index: number) => {
        if (index === 0 || !editListing || !token) return;
        const newOrder = sections.map(s => s.id);
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        // Optimistic update
        const newSections = [...sections];
        [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
        setSections(newSections);
        await fetch(`/api/admin/listings/${editListing.id}/sections`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ order: newOrder }),
        });
    };

    const moveSectionDown = async (index: number) => {
        if (index >= sections.length - 1 || !editListing || !token) return;
        const newOrder = sections.map(s => s.id);
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        const newSections = [...sections];
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
        setSections(newSections);
        await fetch(`/api/admin/listings/${editListing.id}/sections`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ order: newOrder }),
        });
    };

    const handleCreateZone = async () => {
        if (!token || !newZoneName.trim()) return;
        setCreatingZone(true);
        try {
            const res = await fetch("/api/admin/zones", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newZoneName.trim() }),
            });
            const data = await res.json();
            if (data.zone) {
                // Add to zones list if not already there
                if (!zones.find(z => z.id === data.zone.id)) {
                    setZones(prev => [...prev, data.zone].sort((a, b) => a.name.localeCompare(b.name)));
                }
                updateField("zone_id", data.zone.id);
                setShowNewZone(false);
                setNewZoneName("");
            }
        } catch { /* ignore */ }
        setCreatingZone(false);
    };

    const handleBulkUpdate = async (updates: Record<string, unknown>) => {
        if (!token || selectedIds.size === 0) return;
        try {
            const res = await fetch("/api/admin/listings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ids: Array.from(selectedIds), updates }),
            });
            if (res.ok) {
                setSelectedIds(new Set());
                fetchListings();
            } else {
                const data = await res.json();
                setSaveError(data.error || "Error en actualización masiva");
            }
        } catch {
            setSaveError("Error de conexión");
        }
    };

    const isColegios = (() => {
        const catId = editForm.category_id as string;
        const cat = categories.find(c => c.id === catId);
        return cat?.slug === "colegios";
    })();

    // Input classes
    const inputCls = "w-full rounded-xl border border-[#E0E0E0] bg-white px-4 py-2.5 text-sm text-[#272E2F] focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all";
    const labelCls = "block text-sm font-semibold text-[#454545] mb-1.5";
    const sectionCls = "pt-6 pb-2 text-[16px] font-bold text-gray-900";

    return (
        <div className="max-w-7xl">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[22px] font-bold" style={{ color: "#272E2F" }}>Listings</h1>
                    <p className="text-[13px] mt-1" style={{ color: "#777777" }}>{total} listings en el directorio</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-gray-800 transition-all">
                    <Plus className="w-4 h-4" /> Nuevo listing
                </button>
            </div>

            {/* Search + Filters bar */}
            <div className="bg-white rounded-2xl p-5 mb-6" style={{ border: "1px solid #E0E0E0" }}>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                        <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Buscar por nombre..." className={`${inputCls} pl-10`} />
                    </div>
                    <div className="relative min-w-[160px]">
                        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                            className={`${inputCls} appearance-none pr-9`}>
                            <option value="">Todas categorías</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative min-w-[160px]">
                        <select value={zoneFilter} onChange={(e) => { setZoneFilter(e.target.value); setPage(1); }}
                            className={`${inputCls} appearance-none pr-9`}>
                            <option value="">Todas zonas</option>
                            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-all ${showFilters || activeFilters > 0 ? "bg-gray-900 text-white border-gray-900" : "border-[#E0E0E0] bg-white text-[#454545] hover:bg-[#F0F0F0]"}`}>
                        <Filter className="w-4 h-4" /> Filtros
                        {activeFilters > 0 && <span className="w-5 h-5 rounded-full bg-white text-gray-900 text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
                    </button>
                    {(searchInput || categoryFilter || zoneFilter || phoneFilter) && (
                        <button onClick={() => { setSearchInput(""); setCategoryFilter(""); setZoneFilter(""); setPhoneInput(""); setPage(1); }}
                            className="text-sm text-gray-400 hover:text-red-500 transition-colors">Limpiar</button>
                    )}
                </div>
                {showFilters && (
                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-3" style={{ borderTop: "1px solid #F0F0F0" }}>
                        <div className="relative min-w-[180px]">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)}
                                placeholder="Filtrar por teléfono..." className={`${inputCls} pl-10`} />
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E0E0E0" }}>
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /></div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-20"><p className="text-base text-gray-400">No se encontraron listings</p></div>
                ) : (
                    <>
                    {/* Bulk action bar */}
                    {selectedIds.size > 0 && (
                        <div className="flex items-center justify-between px-6 py-3 flex-wrap gap-2" style={{ backgroundColor: "#F8F8F8", borderBottom: "1px solid #E0E0E0" }}>
                            <span className="text-[13px] font-semibold" style={{ color: "#272E2F" }}>
                                {selectedIds.size} seleccionado{selectedIds.size > 1 ? "s" : ""}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Tier actions */}
                                <button onClick={() => handleBulkUpdate({ tier: "standard" })}
                                    className="px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors hover:bg-white" style={{ borderColor: "#E0E0E0", color: "#454545" }}>
                                    Tier → Standard
                                </button>
                                <button onClick={() => handleBulkUpdate({ tier: "free" })}
                                    className="px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors hover:bg-white" style={{ borderColor: "#E0E0E0", color: "#454545" }}>
                                    Tier → Free
                                </button>
                                {/* Toggle badges */}
                                <button onClick={() => handleBulkUpdate({ is_verified: false })}
                                    className="px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors hover:bg-white" style={{ borderColor: "#E0E0E0", color: "#454545" }}>
                                    Quitar Verificado
                                </button>
                                <button onClick={() => handleBulkUpdate({ is_featured: false })}
                                    className="px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors hover:bg-white" style={{ borderColor: "#E0E0E0", color: "#454545" }}>
                                    Quitar Destacado
                                </button>
                                {/* Cancel / Delete */}
                                <button onClick={() => setSelectedIds(new Set())}
                                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors" style={{ color: "#777777" }}>
                                    Cancelar
                                </button>
                                <button onClick={() => { setBulkDeleteStep(1); setBulkDeleteText(""); }}
                                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold transition-colors flex items-center gap-1.5">
                                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ backgroundColor: "#F8F8F8", borderBottom: "1px solid #E0E0E0" }}>
                                    <th className="pl-6 pr-2 py-4 w-10">
                                        <input type="checkbox"
                                            checked={listings.length > 0 && selectedIds.size === listings.length}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-400 w-4 h-4 cursor-pointer" />
                                    </th>
                                    <th className="px-6 py-4 text-left text-[12px] font-medium uppercase tracking-wider" style={{ color: "#777777" }}>Nombre</th>
                                    <th className="px-6 py-4 text-left text-[12px] font-medium uppercase tracking-wider" style={{ color: "#777777" }}>Categoría</th>
                                    <th className="px-6 py-4 text-left text-[12px] font-medium uppercase tracking-wider" style={{ color: "#777777" }}>Zona</th>
                                    <th className="px-6 py-4 text-left text-[12px] font-medium uppercase tracking-wider" style={{ color: "#777777" }}>Teléfono</th>
                                    <th className="px-6 py-4 text-left text-[12px] font-medium uppercase tracking-wider" style={{ color: "#777777" }}>Tier</th>
                                    <th className="px-6 py-4 text-left text-[12px] font-medium uppercase tracking-wider" style={{ color: "#777777" }}>Estado</th>
                                    <th className="px-6 py-4 text-right text-[12px] font-medium uppercase tracking-wider" style={{ color: "#777777" }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listings.map((listing) => (
                                    <tr key={listing.id} className={`hover:bg-[#F8F8F8] transition-colors cursor-pointer ${selectedIds.has(listing.id) ? "bg-red-50/40" : ""}`}
                                        style={{ borderBottom: "1px solid #EAEAEA" }} onClick={() => openEdit(listing)}>
                                        <td className="pl-6 pr-2 py-4 w-10">
                                            <input type="checkbox"
                                                checked={selectedIds.has(listing.id)}
                                                onClick={(e) => toggleSelect(listing.id, e)}
                                                onChange={() => {}}
                                                className="rounded border-gray-300 text-gray-900 focus:ring-gray-400 w-4 h-4 cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {listing.logo_url ? (
                                                    <img src={listing.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-[13px] font-bold" style={{ color: "#454545" }}>
                                                        {listing.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-semibold" style={{ color: "#272E2F" }}>{listing.name}</p>
                                                    <p className="text-xs mt-0.5" style={{ color: "#999999" }}>{listing.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium" style={{ color: "#454545" }}>
                                                {listing.category?.name || "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4"><span className="text-sm" style={{ color: "#454545" }}>{listing.zone?.name || "—"}</span></td>
                                        <td className="px-6 py-4"><span className="text-sm" style={{ color: "#454545" }}>{listing.phone || "—"}</span></td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${listing.tier === "free" ? "bg-gray-100 text-gray-500"
                                                : listing.tier === "standard" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                                                {listing.tier}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${listing.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-500"}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${listing.is_active ? "bg-emerald-500" : "bg-red-400"}`} />
                                                    {listing.is_active ? "Activo" : "Inactivo"}
                                                </span>
                                                {listing.is_verified && <Check className="w-4 h-4 text-blue-500" />}
                                                {listing.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a href={`/admin/analytics?listing=${listing.id}`} onClick={(e) => e.stopPropagation()}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-[#F0F0F0]" title="Ver analytics">
                                                    <BarChart3 className="w-4 h-4" style={{ color: "#777777" }} strokeWidth={2.2} fill="currentColor" fillOpacity={0.15} />
                                                </a>
                                                <button onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Build active sections for this listing
                                                        const sc = (listing.section_content || {}) as Record<string, unknown>;
                                                        const existingOrder = (sc.section_order || []) as string[];
                                                        const SECTION_LABELS: Record<string, string> = {
                                                            sobre: "Sobre nosotros",
                                                            recomendacion: "Por que lo recomendamos",
                                                            "servicios-ofrecidos": "Servicios",
                                                            tarifas: "Tarifas y precios",
                                                            opiniones: "Opiniones de Google",
                                                            horario: "Horario",
                                                            info: "Info practica",
                                                            "info-adicional": "Info adicional",
                                                            modelo: "Modelo educativo",
                                                            etapas: "Etapas educativas",
                                                            extraescolares: "Extraescolares",
                                                            servicios: "Servicios colegio",
                                                            instalaciones: "Instalaciones",
                                                            admisiones: "Admisiones",
                                                            idiomas: "Idiomas",
                                                            galeria: "Galeria",
                                                            faqs: "FAQ",
                                                        };
                                                        // Detect which sections have content
                                                        const active: string[] = [];
                                                        if (listing.description) active.push("sobre");
                                                        if (listing.recommendation_reason) active.push("recomendacion");
                                                        if (((sc.services || []) as unknown[]).length > 0) active.push("servicios-ofrecidos");
                                                        if (((sc.offer_tables || []) as Array<{ visible: boolean }>).some(t => t.visible)) active.push("tarifas");
                                                        if (sc.show_google_reviews && ((sc.google_reviews || []) as unknown[]).length > 0) active.push("opiniones");
                                                        if (listing.schedule) active.push("horario");
                                                        if (listing.age_min || listing.age_max || listing.price_range || (listing.languages && (listing.languages as string[]).length > 0)) active.push("info");
                                                        if (sc.payment_options || sc.accessibility) active.push("info-adicional");
                                                        if (sc.modelo_educativo) active.push("modelo");
                                                        if (((sc.etapas || []) as unknown[]).length > 0) active.push("etapas");
                                                        if (((sc.extraescolares || []) as unknown[]).length > 0) active.push("extraescolares");
                                                        if (((sc.servicios || []) as unknown[]).length > 0) active.push("servicios");
                                                        if (((sc.instalaciones || []) as unknown[]).length > 0) active.push("instalaciones");
                                                        if (sc.admisiones) active.push("admisiones");
                                                        if (((sc.idiomas_ensenanza || []) as unknown[]).length > 0) active.push("idiomas");
                                                        if (listing.gallery_urls && (listing.gallery_urls as string[]).length > 0 && !listing.cover_image_url) active.push("galeria");
                                                        if (((sc.faqs || []) as unknown[]).length > 0) active.push("faqs");
                                                        // Merge: use existing order for known sections, add new ones at end
                                                        const ordered = existingOrder.length > 0
                                                            ? [...existingOrder.filter(id => active.includes(id)), ...active.filter(id => !existingOrder.includes(id))]
                                                            : active;
                                                        setPositionOrder(ordered);
                                                        openEdit(listing);
                                                        setShowPositionModal(true);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all" style={{ color: "#454545", backgroundColor: "#F0F0F0" }}
                                                    title="Cambiar orden de secciones">
                                                    <GripVertical className="w-3.5 h-3.5" /> Posicion
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); openEdit(listing); }}
                                                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all" style={{ color: "#454545", backgroundColor: "#F0F0F0" }}>
                                                    <Edit3 className="w-3.5 h-3.5" /> Editar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid #E0E0E0" }}>
                        <p className="text-[13px]" style={{ color: "#777777" }}>Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}</p>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                                className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-[#F0F0F0] disabled:opacity-30 transition-all" style={{ borderColor: "#E0E0E0", color: "#777777" }}>
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-lg text-[13px] font-semibold transition-all ${p === page ? "bg-gray-900 text-white" : "hover:bg-[#F0F0F0]"}`}
                                    style={p !== page ? { color: "#454545" } : undefined}>
                                    {p}
                                </button>
                            ))}
                            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                                className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-[#F0F0F0] disabled:opacity-30 transition-all" style={{ borderColor: "#E0E0E0", color: "#777777" }}>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
                    </>
                )}
            </div>

            {/* ── Edit Modal (Full-page) ── */}
            {editListing && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-40" style={{ backdropFilter: "blur(4px)" }} onClick={() => { setEditListing(null); setIsCreating(false); }} />
                    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
                    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto" style={{ border: "1px solid #E0E0E0", maxHeight: "calc(100vh - 64px)" }}>
                        {/* Edit header */}
                        <div className="flex items-center justify-between px-8 py-5 shrink-0" style={{ borderBottom: "1px solid #E0E0E0" }}>
                            <div>
                                <h2 className="text-[18px] font-bold" style={{ color: "#272E2F" }}>{isCreating ? "Nuevo Listing" : editListing.name}</h2>
                                <p className="text-[13px] mt-0.5" style={{ color: "#777777" }}>{isCreating ? "Crear nuevo listing" : `/${editListing.category?.slug || ""}/${editListing.slug}`}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isCreating && (
                                    <>
                                        <button onClick={() => { setCopyModalOpen(true); setCopySearch(""); setCopySource(null); setCopyFields(new Set()); }}
                                            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600" style={{ borderColor: "#E0E0E0", color: "#777777" }}
                                            title="Copiar campos desde otro listing">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setDeleteStep(1); setDeleteConfirmText(""); }}
                                            className="w-9 h-9 rounded-xl border flex items-center justify-center text-red-400 hover:text-red-600 hover:border-red-400 hover:bg-red-50 transition-all" style={{ borderColor: "#E0E0E0" }}
                                            title="Eliminar listing">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <a href={`/${editListing.category?.slug || ""}/${editListing.slug}`} target="_blank"
                                            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all" style={{ borderColor: "#E0E0E0", color: "#777777" }}>
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </>
                                )}
                                <button onClick={() => { setEditListing(null); setIsCreating(false); }}
                                    className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all hover:bg-[#F0F0F0]" style={{ borderColor: "#E0E0E0", color: "#777777" }}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Edit form */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">

                            {/* ===== BASIC INFO ===== */}
                            <p className={sectionCls}>Información básica</p>
                            <div>
                                <label className={labelCls}>Nombre</label>
                                <input type="text" value={editForm.name as string} onChange={(e) => {
                                    updateField("name", e.target.value);
                                    // Auto-generate slug from name if creating new
                                    if (isCreating) {
                                        const slug = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                                        updateField("slug", slug);
                                    }
                                }} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>URL / Slug</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] shrink-0" style={{ color: "#777777" }}>/{(categories.find(c => c.id === editForm.category_id)?.slug) || "categoria"}/</span>
                                    <input type="text" value={editForm.slug as string || ""} onChange={(e) => {
                                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                                        updateField("slug", slug);
                                    }} className={inputCls} placeholder="mi-listing" />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Descripción corta</label>
                                <input type="text" value={editForm.short_description as string} onChange={(e) => updateField("short_description", e.target.value)}
                                    className={inputCls} placeholder="Resumen breve para tarjetas..." />
                            </div>
                            <div>
                                <label className={labelCls}>Descripción completa</label>
                                <textarea rows={5} value={editForm.description as string} onChange={(e) => updateField("description", e.target.value)}
                                    className={`${inputCls} resize-none`} />
                            </div>
                            <div>
                                <label className={labelCls}>Por qué lo recomendamos</label>
                                <textarea rows={3} value={editForm.recommendation_reason as string} onChange={(e) => updateField("recommendation_reason", e.target.value)}
                                    className={`${inputCls} resize-none`} placeholder="Razón de recomendación..." />
                            </div>

                            {/* ===== CONTACT ===== */}
                            <p className={sectionCls}>Contacto</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                        <Phone className="w-3.5 h-3.5 text-gray-400" /> Teléfono
                                    </label>
                                    <input type="text" value={editForm.phone as string} onChange={(e) => updateField("phone", e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" /> Email
                                    </label>
                                    <input type="email" value={editForm.email as string} onChange={(e) => updateField("email", e.target.value)} className={inputCls} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                        <Globe className="w-3.5 h-3.5 text-gray-400" /> Website
                                    </label>
                                    <input type="url" value={editForm.website as string} onChange={(e) => updateField("website", e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>WhatsApp</label>
                                    <input type="text" value={editForm.whatsapp as string} onChange={(e) => updateField("whatsapp", e.target.value)} className={inputCls} placeholder="+52..." />
                                </div>
                            </div>

                            {/* ===== LOCATION ===== */}
                            <p className={sectionCls}>Ubicación</p>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> Dirección
                                    </label>
                                    <input type="text" value={editForm.street_address as string} onChange={(e) => updateField("street_address", e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>C.P.</label>
                                    <input type="text" value={editForm.postal_code as string} onChange={(e) => updateField("postal_code", e.target.value)} className={inputCls} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                        <Navigation className="w-3.5 h-3.5 text-gray-400" /> Latitud
                                    </label>
                                    <input type="number" step="any" value={editForm.latitude !== null ? String(editForm.latitude) : ""}
                                        onChange={(e) => updateField("latitude", e.target.value ? Number(e.target.value) : null)} className={inputCls} placeholder="40.4168" />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                        <Navigation className="w-3.5 h-3.5 text-gray-400" /> Longitud
                                    </label>
                                    <input type="number" step="any" value={editForm.longitude !== null ? String(editForm.longitude) : ""}
                                        onChange={(e) => updateField("longitude", e.target.value ? Number(e.target.value) : null)} className={inputCls} placeholder="-3.7038" />
                                </div>
                            </div>

                            {/* ===== CLASSIFICATION ===== */}
                            <p className={sectionCls}>Clasificación</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Categoría</label>
                                    <div className="relative">
                                        <select value={editForm.category_id as string} onChange={(e) => { updateField("category_id", e.target.value); updateField("subcategory_id", ""); }}
                                            className={`${inputCls} appearance-none pr-9`}>
                                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Subcategoría</label>
                                    <div className="relative">
                                        <select value={editForm.subcategory_id as string} onChange={(e) => updateField("subcategory_id", e.target.value || "")}
                                            className={`${inputCls} appearance-none pr-9`}>
                                            <option value="">Sin subcategoría</option>
                                            {subcategories.filter((s) => s.category_id === editForm.category_id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Zona</label>
                                    {!showNewZone ? (
                                        <div className="space-y-1.5">
                                            <div className="relative">
                                                <select value={editForm.zone_id as string} onChange={(e) => updateField("zone_id", e.target.value || "")}
                                                    className={`${inputCls} appearance-none pr-9`}>
                                                    <option value="">Sin zona</option>
                                                    {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                            <button type="button" onClick={() => setShowNewZone(true)}
                                                className="text-xs text-blue-600 hover:text-blue-700 font-semibold">+ Crear nueva zona</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <input type="text" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") handleCreateZone(); if (e.key === "Escape") { setShowNewZone(false); setNewZoneName(""); } }}
                                                className={inputCls} placeholder="Nombre de la nueva zona..." autoFocus />
                                            <div className="flex gap-2">
                                                <button type="button" onClick={handleCreateZone} disabled={!newZoneName.trim() || creatingZone}
                                                    className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors">
                                                    {creatingZone ? "Creando..." : "Crear"}
                                                </button>
                                                <button type="button" onClick={() => { setShowNewZone(false); setNewZoneName(""); }}
                                                    className="text-xs font-semibold text-gray-500 hover:text-gray-700">Cancelar</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelCls}>Tier</label>
                                    <div className="relative">
                                        <select value={editForm.tier as string} onChange={(e) => updateField("tier", e.target.value)}
                                            className={`${inputCls} appearance-none pr-9`}>
                                            <option value="free">Free</option>
                                            <option value="standard">Standard</option>
                                            <option value="presencia_anual">Presencia Anual</option>
                                            <option value="presencia_total">Presencia Total</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Edad mín</label>
                                    <input type="number" value={editForm.age_min !== null ? String(editForm.age_min) : ""}
                                        onChange={(e) => updateField("age_min", e.target.value ? Number(e.target.value) : null)} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Edad máx</label>
                                    <input type="number" value={editForm.age_max !== null ? String(editForm.age_max) : ""}
                                        onChange={(e) => updateField("age_max", e.target.value ? Number(e.target.value) : null)} className={inputCls} />
                                </div>
                            </div>

                            {/* ===== PRICING & SCHEDULE ===== */}
                            <p className={sectionCls}>Precio y horario</p>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelCls}>Rango precio</label>
                                    <div className="relative">
                                        <select value={editForm.price_range as string || ""} onChange={(e) => updateField("price_range", e.target.value || null)}
                                            className={`${inputCls} appearance-none pr-9`}>
                                            <option value="">—</option>
                                            <option value="$">$</option>
                                            <option value="$$">$$</option>
                                            <option value="$$$">$$$</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Precio mín ($)</label>
                                    <input type="number" value={editForm.price_min !== null ? String(editForm.price_min) : ""}
                                        onChange={(e) => updateField("price_min", e.target.value ? Number(e.target.value) : null)} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Precio máx ($)</label>
                                    <input type="number" value={editForm.price_max !== null ? String(editForm.price_max) : ""}
                                        onChange={(e) => updateField("price_max", e.target.value ? Number(e.target.value) : null)} className={inputCls} />
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Horario</label>
                                <ScheduleEditor value={editForm.schedule as string} onChange={(val) => updateField("schedule", val)} />
                            </div>
                            <div>
                                <label className={labelCls}>Idiomas (separados por coma)</label>
                                <input type="text" value={Array.isArray(editForm.languages) ? (editForm.languages as string[]).join(", ") : ""}
                                    onChange={(e) => updateField("languages", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                    className={inputCls} placeholder="es, en, fr" />
                            </div>

                            {/* ===== MEDIA ===== */}
                            <p className={sectionCls}>Imágenes</p>

                            {/* Google Photos toggle */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Fotos de Google</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {editForm.google_photos_enabled
                                            ? "Mostrando fotos almacenadas de Google"
                                            : "Usando Google Places UI Kit (en vivo)"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updateField("google_photos_enabled", !editForm.google_photos_enabled)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${editForm.google_photos_enabled ? "bg-blue-600" : "bg-gray-300"}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${editForm.google_photos_enabled ? "translate-x-5" : ""}`} />
                                </button>
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                    <Image className="w-3.5 h-3.5 text-gray-400" /> Logo URL
                                </label>
                                <input type="url" value={editForm.logo_url as string} onChange={(e) => updateField("logo_url", e.target.value)} className={inputCls} />
                                {typeof editForm.logo_url === "string" && editForm.logo_url.startsWith("http") && (
                                    <img src={editForm.logo_url} alt="logo preview" className="w-16 h-16 rounded-xl object-cover mt-2 border border-gray-200" />
                                )}
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                    <Image className="w-3.5 h-3.5 text-gray-400" /> Cover Image URL
                                </label>
                                <input type="url" value={editForm.cover_image_url as string} onChange={(e) => updateField("cover_image_url", e.target.value)} className={inputCls} />
                                {typeof editForm.cover_image_url === "string" && editForm.cover_image_url.startsWith("http") && (
                                    <img src={editForm.cover_image_url} alt="cover preview" className="w-full h-24 rounded-xl object-cover mt-2 border border-gray-200" />
                                )}
                            </div>

                            {/* Gallery URLs */}
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                    <Image className="w-3.5 h-3.5 text-gray-400" /> Galería de fotos
                                </label>
                                <div className="space-y-2">
                                    {((editForm.gallery_urls as string[]) || []).map((url, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input type="url" value={url}
                                                onChange={(e) => {
                                                    const urls = [...((editForm.gallery_urls as string[]) || [])];
                                                    urls[idx] = e.target.value;
                                                    updateField("gallery_urls", urls);
                                                }}
                                                className={`${inputCls} flex-1`} placeholder="https://..." />
                                            {url && url.startsWith("http") && (
                                                <img src={url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0" />
                                            )}
                                            <button type="button" onClick={() => {
                                                const urls = [...((editForm.gallery_urls as string[]) || [])];
                                                urls.splice(idx, 1);
                                                updateField("gallery_urls", urls.length > 0 ? urls : null);
                                            }} className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => {
                                        const urls = [...((editForm.gallery_urls as string[]) || []), ""];
                                        updateField("gallery_urls", urls);
                                    }} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">+ Agregar foto</button>
                                </div>
                            </div>

                            {/* ===== SOCIAL LINKS ===== */}
                            <p className={sectionCls}>Redes sociales</p>
                            <div className="grid grid-cols-2 gap-4">
                                {(["facebook", "instagram", "twitter", "youtube", "linkedin", "tiktok"] as const).map((platform) => (
                                    <div key={platform}>
                                        <label className={labelCls}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</label>
                                        <input type="url" value={((editForm.social_links as Record<string, string>) || {})[platform] || ""}
                                            onChange={(e) => updateSocialLink(platform, e.target.value)}
                                            className={inputCls} placeholder={`https://${platform}.com/...`} />
                                    </div>
                                ))}
                            </div>

                            {/* ===== CUSTOM CTA BUTTONS ===== */}
                            <p className={sectionCls}>Botones del sidebar</p>
                            <p className="text-xs text-gray-400 -mt-1 mb-2">Controla los botones CTA de la sidebar. Si no hay botones, se generan automaticamente.</p>
                            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {(((editForm.section_content as Record<string, unknown>) || {}).cta_buttons as Array<{ title: string; url: string; color: string; icon: string; type: string }> || []).map((btn, idx) => {
                                        const updateBtn = (updates: Record<string, string>) => {
                                            const buttons = [...(((editForm.section_content as Record<string, unknown>) || {}).cta_buttons as Array<Record<string, string>> || [])];
                                            buttons[idx] = { ...buttons[idx], ...updates };
                                            updateSectionContent("cta_buttons", buttons);
                                        };
                                        const removeBtn = () => {
                                            const buttons = [...(((editForm.section_content as Record<string, unknown>) || {}).cta_buttons as Array<Record<string, string>> || [])];
                                            buttons.splice(idx, 1);
                                            updateSectionContent("cta_buttons", buttons);
                                        };
                                        const isSpecial = btn.type === "lead_form" || btn.type === "phone_reveal";
                                        return (
                                            <div key={idx} className="p-3 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <input type="text" value={btn.title} placeholder="Titulo del boton"
                                                        onChange={(e) => updateBtn({ title: e.target.value })}
                                                        className={`${inputCls} flex-1`} />
                                                    <button type="button" onClick={removeBtn}
                                                        className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                {btn.type !== "phone_reveal" && (
                                                    <div>
                                                        <input type="url" value={btn.url || ""} placeholder={btn.type === "lead_form" ? "Vacio = formulario interno, o URL del formulario externo" : "https://..."}
                                                            onChange={(e) => updateBtn({ url: e.target.value })}
                                                            className={inputCls} />
                                                        {btn.type === "lead_form" && (
                                                            <p className="text-[10px] text-gray-400 mt-1">Si dejas vacio, abre nuestro formulario. Si pones URL, redirige al formulario del negocio.</p>
                                                        )}
                                                    </div>
                                                )}
                                                {btn.type === "phone_reveal" && (
                                                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
                                                        Muestra el telefono del listing
                                                    </p>
                                                )}
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Tipo</label>
                                                        <div className="relative">
                                                            <select value={btn.type || "link"}
                                                                onChange={(e) => updateBtn({ type: e.target.value })}
                                                                className={`${inputCls} appearance-none pr-9 text-xs`}>
                                                                <option value="link">Enlace externo</option>
                                                                <option value="lead_form">Formulario contacto</option>
                                                                <option value="phone_reveal">Mostrar telefono</option>
                                                            </select>
                                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Icono</label>
                                                        <div className="flex gap-1 flex-wrap">
                                                            {[
                                                                { value: "globe", icon: <Globe className="w-3.5 h-3.5" /> },
                                                                { value: "link", icon: <ExternalLink className="w-3.5 h-3.5" /> },
                                                                { value: "phone", icon: <Phone className="w-3.5 h-3.5" /> },
                                                                { value: "mail", icon: <Mail className="w-3.5 h-3.5" /> },
                                                                { value: "map", icon: <MapPin className="w-3.5 h-3.5" /> },
                                                                { value: "nav", icon: <Navigation className="w-3.5 h-3.5" /> },
                                                                { value: "chat", icon: <Star className="w-3.5 h-3.5" /> },
                                                                { value: "share", icon: <Edit3 className="w-3.5 h-3.5" /> },
                                                            ].map((ic) => (
                                                                <button key={ic.value} type="button"
                                                                    onClick={() => updateBtn({ icon: ic.value })}
                                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${btn.icon === ic.value ? "bg-blue-100 text-blue-600 ring-2 ring-blue-300" : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-gray-200"}`}>
                                                                    {ic.icon}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Color</label>
                                                    <div className="flex gap-1.5 flex-wrap items-center">
                                                        {[
                                                            { value: "orange", label: "Naranja", bg: "bg-orange-500" },
                                                            { value: "dark", label: "Oscuro", bg: "bg-gray-900" },
                                                            { value: "blue", label: "Azul", bg: "bg-blue-600" },
                                                            { value: "green", label: "Verde", bg: "bg-emerald-600" },
                                                            { value: "emerald", label: "Verde claro", bg: "bg-emerald-200" },
                                                            { value: "red", label: "Rojo", bg: "bg-red-600" },
                                                            { value: "gray", label: "Gris", bg: "bg-gray-300" },
                                                            { value: "white", label: "Blanco", bg: "bg-white border border-gray-300" },
                                                        ].map((c) => (
                                                            <button key={c.value} type="button" title={c.label}
                                                                onClick={() => updateBtn({ color: c.value })}
                                                                className={`w-6 h-6 rounded-full ${c.bg} transition-all ${btn.color === c.value ? "ring-2 ring-offset-1 ring-blue-500 scale-110" : "hover:scale-105"}`} />
                                                        ))}
                                                        {/* Custom hex color */}
                                                        <div className="relative">
                                                            <input type="color"
                                                                value={btn.color?.startsWith("#") ? btn.color : "#f97316"}
                                                                onChange={(e) => updateBtn({ color: e.target.value })}
                                                                title="Color personalizado"
                                                                className="w-6 h-6 rounded-full cursor-pointer border border-gray-300 overflow-hidden appearance-none p-0"
                                                                style={{ WebkitAppearance: "none" }} />
                                                            {btn.color?.startsWith("#") && (
                                                                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    {btn.color?.startsWith("#") && (
                                                        <span className="text-[10px] text-gray-400 mt-0.5">{btn.color}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {((((editForm.section_content as Record<string, unknown>) || {}).cta_buttons as unknown[]) || []).length === 0 && (
                                        <div className="p-4 text-center">
                                            <p className="text-sm text-gray-400">Sin botones configurados</p>
                                            <p className="text-xs text-gray-300 mt-1">Se usan los botones automaticos (web, contacto, WhatsApp, etc.)</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 border-t border-gray-200 bg-gray-50/50 flex items-center gap-3">
                                    <button type="button" onClick={() => {
                                        const buttons = [...(((editForm.section_content as Record<string, unknown>) || {}).cta_buttons as Array<Record<string, string>> || [])];
                                        buttons.push({ title: "", url: "", color: "orange", icon: "globe", type: "link" });
                                        updateSectionContent("cta_buttons", buttons);
                                    }} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">+ Agregar boton</button>
                                    {((((editForm.section_content as Record<string, unknown>) || {}).cta_buttons as unknown[]) || []).length === 0 && (
                                        <button type="button" onClick={() => {
                                            const buttons: Array<Record<string, string>> = [];
                                            if (editForm.website) buttons.push({ title: "Visitar web oficial", url: editForm.website as string, color: "orange", icon: "globe", type: "link" });
                                            buttons.push({ title: "Solicitar informacion", url: "", color: "dark", icon: "mail", type: "lead_form" });
                                            if (editForm.whatsapp) buttons.push({ title: "WhatsApp", url: `https://wa.me/${(editForm.whatsapp as string).replace(/[^0-9]/g, "")}`, color: "emerald", icon: "chat", type: "link" });
                                            if (editForm.phone) buttons.push({ title: "Ver telefono", url: "", color: "gray", icon: "phone", type: "phone_reveal" });
                                            if (editForm.latitude && editForm.longitude) buttons.push({ title: "Como llegar", url: `https://www.google.com/maps/dir/?api=1&destination=${editForm.latitude},${editForm.longitude}`, color: "gray", icon: "nav", type: "link" });
                                            updateSectionContent("cta_buttons", buttons);
                                        }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 px-3.5 py-1.5 rounded-lg transition-all shadow-sm">
                                            <Sparkles className="w-3.5 h-3.5" /> Generar desde datos
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ===== INFO BADGES ===== */}
                            <p className={sectionCls}>Badges de informacion (Header)</p>
                            <p className="text-xs text-gray-400 -mt-1 mb-2">Etiquetas que aparecen debajo del header. Si no hay, se generan automaticamente.</p>
                            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {(((editForm.section_content as Record<string, unknown> | undefined)?.info_badges ?? []) as Array<{ text: string; icon: string; style: string }>).map((badge, idx) => {
                                        const updateBadge = (updates: Record<string, string>) => {
                                            const badges = [...(((editForm.section_content as Record<string, unknown> | undefined)?.info_badges ?? []) as Array<Record<string, string>>)];
                                            badges[idx] = { ...badges[idx], ...updates };
                                            updateSectionContent("info_badges", badges);
                                        };
                                        const removeBadge = () => {
                                            const badges = [...(((editForm.section_content as Record<string, unknown> | undefined)?.info_badges ?? []) as Array<Record<string, string>>)];
                                            badges.splice(idx, 1);
                                            updateSectionContent("info_badges", badges);
                                        };
                                        return (
                                            <div key={idx} className="p-3 flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    {[
                                                        { value: "globe", icon: <Globe className="w-3 h-3" /> },
                                                        { value: "clock", icon: <Calendar className="w-3 h-3" /> },
                                                        { value: "star", icon: <Star className="w-3 h-3" /> },
                                                        { value: "map", icon: <MapPin className="w-3 h-3" /> },
                                                        { value: "phone", icon: <Phone className="w-3 h-3" /> },
                                                        { value: "mail", icon: <Mail className="w-3 h-3" /> },
                                                        { value: "check", icon: <Check className="w-3 h-3" /> },
                                                        { value: "nav", icon: <Navigation className="w-3 h-3" /> },
                                                    ].map((ic) => (
                                                        <button key={ic.value} type="button"
                                                            onClick={() => updateBadge({ icon: ic.value })}
                                                            className={`w-6 h-6 rounded flex items-center justify-center transition-all ${badge.icon === ic.value ? "bg-orange-100 text-orange-600 ring-1 ring-orange-300" : "bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-200"}`}>
                                                            {ic.icon}
                                                        </button>
                                                    ))}
                                                </div>
                                                <input type="text" value={badge.text} placeholder="Texto del badge"
                                                    onChange={(e) => updateBadge({ text: e.target.value })}
                                                    className={`${inputCls} flex-1 !py-1.5 text-xs`} />
                                                <div className="flex gap-1">
                                                    {[
                                                        { value: "gray", bg: "bg-gray-300" },
                                                        { value: "orange", bg: "bg-orange-400" },
                                                        { value: "blue", bg: "bg-blue-500" },
                                                        { value: "green", bg: "bg-emerald-500" },
                                                    ].map((c) => (
                                                        <button key={c.value} type="button"
                                                            onClick={() => updateBadge({ style: c.value })}
                                                            className={`w-5 h-5 rounded-full ${c.bg} transition-all ${badge.style === c.value ? "ring-2 ring-offset-1 ring-blue-500 scale-110" : "hover:scale-105"}`} />
                                                    ))}
                                                </div>
                                                <button type="button" onClick={removeBadge}
                                                    className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {((((editForm.section_content as Record<string, unknown>) || {}).info_badges as unknown[]) || []).length === 0 && (
                                        <div className="p-4 text-center">
                                            <p className="text-sm text-gray-400">Sin badges configurados</p>
                                            <p className="text-xs text-gray-300 mt-1">Se generan automaticamente desde idiomas, precio, etc.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 border-t border-gray-200 bg-gray-50/50 flex items-center gap-3">
                                    <button type="button" onClick={() => {
                                        const badges = [...(((editForm.section_content as Record<string, unknown>) || {}).info_badges as Array<Record<string, string>> || [])];
                                        badges.push({ text: "", icon: "star", style: "gray" });
                                        updateSectionContent("info_badges", badges);
                                    }} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">+ Agregar badge</button>
                                    {((((editForm.section_content as Record<string, unknown>) || {}).info_badges as unknown[]) || []).length === 0 && (
                                        <button type="button" onClick={() => {
                                            const badges: Array<Record<string, string>> = [];
                                            const langs = editForm.languages as string[];
                                            const formatLang = (l: string) => l === "es" ? "Espanol" : l === "en" ? "English" : l === "fr" ? "Francais" : l === "de" ? "Deutsch" : l;
                                            if (langs?.length) badges.push({ text: langs.map(formatLang).join(", "), icon: "globe", style: "gray" });
                                            const fd = editForm.founded_date as string;
                                            if (fd) { const y = new Date(fd).getFullYear(); const a = new Date().getFullYear() - y; if (a > 0) badges.push({ text: `${a} anos`, icon: "clock", style: "gray" }); }
                                            const pr = editForm.price_range as string;
                                            if (pr) { let t = pr; const pmin = editForm.price_min; const pmax = editForm.price_max; if (pmin && pmax) t += ` (${pmin}-$$ {pmax})`; badges.push({ text: t, icon: "star", style: "orange" }); }
                                            const sc2 = (editForm.section_content as Record<string, unknown>) || {};
                                            if (sc2.confesional) badges.push({ text: sc2.confesional as string, icon: "check", style: "gray" });
                                            const me = sc2.modelo_educativo as string;
                                            if (me) badges.push({ text: me.length > 40 ? me.slice(0, 40) + "..." : me, icon: "nav", style: "gray" });
                                            if (sc2.uniforme) badges.push({ text: "Uniforme", icon: "check", style: "gray" });
                                            updateSectionContent("info_badges", badges);
                                        }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 px-3.5 py-1.5 rounded-lg transition-all shadow-sm">
                                            <Sparkles className="w-3.5 h-3.5" /> Generar desde datos
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ===== ADDITIONAL INFO ===== */}
                            <p className={sectionCls}>Información adicional</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Fecha de fundación</label>
                                    <input type="date" value={editForm.founded_date as string || ""}
                                        onChange={(e) => updateField("founded_date", e.target.value || null)}
                                        className={inputCls} />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-3 cursor-pointer pb-2.5">
                                        <input type="checkbox" checked={Boolean(editForm.is_claimed)}
                                            onChange={(e) => updateField("is_claimed", e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                        <span className="text-sm font-semibold text-gray-700">Reclamado por propietario</span>
                                    </label>
                                </div>
                            </div>

                            {/* ===== SERVICES (all categories) ===== */}
                            <p className={sectionCls}>Servicios ofrecidos</p>
                            <p className="text-xs text-gray-400 -mt-1 mb-2">Servicios que ofrece este negocio. Elige un icono y escribe el nombre.</p>
                            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {((((editForm.section_content as Record<string, unknown>) || {}).services ?? []) as Array<{ name: string; icon: string }>).map((service, idx) => {
                                        const updateService = (updates: Partial<{ name: string; icon: string }>) => {
                                            const services = [...((((editForm.section_content as Record<string, unknown>) || {}).services ?? []) as Array<{ name: string; icon: string }>)];
                                            services[idx] = { ...services[idx], ...updates };
                                            updateSectionContent("services", services);
                                        };
                                        const removeService = () => {
                                            const services = [...((((editForm.section_content as Record<string, unknown>) || {}).services ?? []) as Array<{ name: string; icon: string }>)];
                                            services.splice(idx, 1);
                                            updateSectionContent("services", services.length > 0 ? services : undefined);
                                        };
                                        return (
                                            <div key={idx} className="p-3 flex items-center gap-2">
                                                <div className="flex gap-1 flex-wrap max-w-[140px]">
                                                    {SERVICE_ICON_OPTIONS.slice(0, 12).map((ic) => (
                                                        <button key={ic.value} type="button"
                                                            onClick={() => updateService({ icon: ic.value })}
                                                            title={ic.label}
                                                            className={`w-6 h-6 rounded flex items-center justify-center transition-all ${service.icon === ic.value ? "bg-orange-100 text-orange-600 ring-1 ring-orange-300" : "bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-200"}`}>
                                                            {ic.icon}
                                                        </button>
                                                    ))}
                                                </div>
                                                <input type="text" value={service.name} placeholder="Nombre del servicio"
                                                    onChange={(e) => updateService({ name: e.target.value })}
                                                    className={`${inputCls} flex-1 !py-1.5 text-xs`} />
                                                <button type="button" onClick={removeService}
                                                    className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {((((editForm.section_content as Record<string, unknown>) || {}).services as unknown[]) || []).length === 0 && (
                                        <div className="p-4 text-center">
                                            <p className="text-sm text-gray-400">Sin servicios configurados</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 border-t border-gray-200 bg-gray-50/50">
                                    <button type="button" onClick={() => {
                                        const services = [...((((editForm.section_content as Record<string, unknown>) || {}).services ?? []) as Array<{ name: string; icon: string }>)];
                                        services.push({ name: "", icon: "stethoscope" });
                                        updateSectionContent("services", services);
                                    }} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">+ Agregar servicio</button>
                                </div>
                            </div>

                            {/* ===== OFFER TABLES ===== */}
                            <p className={sectionCls}>Tablas de ofertas / tarifas</p>
                            <p className="text-xs text-gray-400 -mt-1 mb-2">Tablas de precios que aparecen en el listing. Puedes crear varias tablas con columnas y filas personalizadas.</p>
                            {(() => {
                                const scObj = (editForm.section_content as Record<string, unknown>) || {};
                                const tables = (scObj.offer_tables || []) as Array<{
                                    id: string; title: string; visible: boolean; columns: number;
                                    rows: Array<{ type: string; cells: Array<{ text: string; bold?: boolean; color?: string; bgColor?: string; colspan?: number; align?: string }> }>;
                                    footnote?: string;
                                }>;
                                const updateTables = (updated: typeof tables) => updateSectionContent("offer_tables", updated);
                                const moveTable = (from: number, to: number) => {
                                    if (to < 0 || to >= tables.length) return;
                                    const copy = [...tables];
                                    const [item] = copy.splice(from, 1);
                                    copy.splice(to, 0, item);
                                    updateTables(copy);
                                };
                                const addTable = () => {
                                    const newTable = {
                                        id: Date.now().toString(36),
                                        title: "Nueva tabla",
                                        visible: true,
                                        columns: 3,
                                        rows: [
                                            { type: "header", cells: [{ text: "", bold: true }, { text: "Opcion 1", bold: true, align: "center" }, { text: "Opcion 2", bold: true, align: "center" }] },
                                            { type: "data", cells: [{ text: "Descripcion" }, { text: "Precio" }, { text: "Precio" }] },
                                        ],
                                        footnote: "",
                                    };
                                    updateTables([...tables, newTable]);
                                };

                                return (
                                    <div className="space-y-3">
                                        {tables.map((table, ti) => {
                                            const updateTable = (updates: Partial<typeof table>) => {
                                                const copy = [...tables];
                                                copy[ti] = { ...copy[ti], ...updates };
                                                updateTables(copy);
                                            };
                                            const removeTable = () => {
                                                const copy = [...tables];
                                                copy.splice(ti, 1);
                                                updateTables(copy);
                                            };
                                            const updateRow = (ri: number, updates: Partial<typeof table.rows[0]>) => {
                                                const rows = [...table.rows];
                                                rows[ri] = { ...rows[ri], ...updates };
                                                updateTable({ rows });
                                            };
                                            const updateCell = (ri: number, ci: number, updates: Partial<typeof table.rows[0]["cells"][0]>) => {
                                                const rows = table.rows.map((r, i) => i === ri ? { ...r, cells: r.cells.map((c, j) => j === ci ? { ...c, ...updates } : c) } : r);
                                                updateTable({ rows });
                                            };
                                            const moveRow = (from: number, to: number) => {
                                                if (to < 0 || to >= table.rows.length) return;
                                                const rows = [...table.rows];
                                                const [item] = rows.splice(from, 1);
                                                rows.splice(to, 0, item);
                                                updateTable({ rows });
                                            };
                                            const addRow = (type: string) => {
                                                const cells = Array.from({ length: table.columns }, () => ({ text: "" }));
                                                if (type === "section") {
                                                    const sectionCells = [{ text: "SECCION", bold: true, colspan: table.columns, align: "center" as const, bgColor: "#1a6b3c", color: "#ffffff" }];
                                                    updateTable({ rows: [...table.rows, { type, cells: sectionCells }] });
                                                } else {
                                                    updateTable({ rows: [...table.rows, { type, cells }] });
                                                }
                                            };
                                            const removeRow = (ri: number) => {
                                                const rows = [...table.rows];
                                                rows.splice(ri, 1);
                                                updateTable({ rows });
                                            };
                                            const addColumn = () => {
                                                const rows = table.rows.map(r => {
                                                    if (r.type === "section" && r.cells.length === 1 && r.cells[0].colspan) {
                                                        return { ...r, cells: [{ ...r.cells[0], colspan: (r.cells[0].colspan || table.columns) + 1 }] };
                                                    }
                                                    return { ...r, cells: [...r.cells, { text: "" }] };
                                                });
                                                updateTable({ columns: table.columns + 1, rows });
                                            };
                                            const removeColumn = () => {
                                                if (table.columns <= 2) return;
                                                const rows = table.rows.map(r => {
                                                    if (r.type === "section" && r.cells.length === 1 && r.cells[0].colspan) {
                                                        return { ...r, cells: [{ ...r.cells[0], colspan: (r.cells[0].colspan || table.columns) - 1 }] };
                                                    }
                                                    return { ...r, cells: r.cells.slice(0, -1) };
                                                });
                                                updateTable({ columns: table.columns - 1, rows });
                                            };

                                            return (
                                                <div key={table.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                                    {/* Table header with position controls */}
                                                    <div className="flex items-center gap-2 p-3 bg-gray-50/60 border-b border-gray-100">
                                                        {/* Table position */}
                                                        <div className="flex flex-col gap-0.5 shrink-0">
                                                            <button type="button" onClick={() => moveTable(ti, ti - 1)} disabled={ti === 0}
                                                                className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                                                                <ChevronUp className="w-3 h-3" />
                                                            </button>
                                                            <span className="text-[9px] font-bold text-gray-400 text-center leading-none">{ti + 1}</span>
                                                            <button type="button" onClick={() => moveTable(ti, ti + 1)} disabled={ti === tables.length - 1}
                                                                className="p-0.5 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                                                                <ChevronDown className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <button type="button" onClick={() => updateTable({ visible: !table.visible })}
                                                            className={`p-1 rounded ${table.visible ? "text-emerald-600" : "text-gray-300"}`} title={table.visible ? "Visible" : "Oculta"}>
                                                            {table.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                        </button>
                                                        <input type="text" value={table.title}
                                                            onChange={(e) => updateTable({ title: e.target.value })}
                                                            className="flex-1 px-2 py-1 rounded border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                                            placeholder="Titulo de la tabla" />
                                                        <button type="button" onClick={removeTable}
                                                            className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    {/* Column + footnote + theme controls */}
                                                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50/30">
                                                        <span className="text-[11px] text-gray-400 font-medium">{table.columns} col</span>
                                                        <button type="button" onClick={addColumn}
                                                            className="w-5 h-5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center text-[11px] font-bold transition-colors">+</button>
                                                        <button type="button" onClick={removeColumn}
                                                            className="w-5 h-5 rounded bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-[11px] font-bold transition-colors"
                                                            disabled={table.columns <= 2}>-</button>
                                                        <div className="mx-1 w-px h-4 bg-gray-200" />
                                                        <span className="text-[11px] text-gray-400">{table.rows.length} filas</span>
                                                        <div className="ml-auto flex items-center gap-1.5">
                                                            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Nota</span>
                                                            <input type="text" value={table.footnote || ""}
                                                                onChange={(e) => updateTable({ footnote: e.target.value })}
                                                                className="px-2 py-0.5 rounded border border-gray-200 text-[11px] text-gray-500 w-44 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                                placeholder="*Minimo 2 dias" />
                                                        </div>
                                                    </div>
                                                    {/* Theme presets — one-click apply to headers + sections */}
                                                    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 bg-white">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Tema</span>
                                                        {[
                                                            { name: "Midnight", hdr: "#0F172A", sec: "#334155", txt: "#ffffff" },
                                                            { name: "Forest", hdr: "#14532D", sec: "#059669", txt: "#ffffff" },
                                                            { name: "Ocean", hdr: "#164E63", sec: "#0891B2", txt: "#ffffff" },
                                                            { name: "Berry", hdr: "#4C1D95", sec: "#7C3AED", txt: "#ffffff" },
                                                            { name: "Warm", hdr: "#78350F", sec: "#D97706", txt: "#ffffff" },
                                                            { name: "Rose", hdr: "#881337", sec: "#E11D48", txt: "#ffffff" },
                                                            { name: "Minimal", hdr: "#F1F5F9", sec: "#E2E8F0", txt: "#1E293B" },
                                                        ].map(theme => (
                                                            <button key={theme.name} type="button" title={theme.name}
                                                                onClick={() => {
                                                                    const rows = table.rows.map(r => {
                                                                        if (r.type === "header") {
                                                                            return { ...r, cells: r.cells.map(c => ({ ...c, bgColor: theme.hdr, color: theme.txt })) };
                                                                        }
                                                                        if (r.type === "section") {
                                                                            return { ...r, cells: r.cells.map(c => ({ ...c, bgColor: theme.sec, color: theme.txt })) };
                                                                        }
                                                                        return r;
                                                                    });
                                                                    updateTable({ rows });
                                                                }}
                                                                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-[10px] font-semibold text-gray-600 group/theme">
                                                                <span className="flex gap-0.5">
                                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.hdr }} />
                                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.sec }} />
                                                                </span>
                                                                {theme.name}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Table grid */}
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs border-collapse">
                                                            <tbody>
                                                                {table.rows.map((row, ri) => (
                                                                    <tr key={ri} className={
                                                                        row.type === "header" ? "bg-gray-800 text-white" :
                                                                        row.type === "section" ? "" :
                                                                        ri % 2 === 0 ? "bg-white" : "bg-gray-50/80"
                                                                    }>
                                                                        {/* Row controls: position + type */}
                                                                        <td className="px-0.5 py-0.5 border border-gray-200 w-[72px] bg-gray-50">
                                                                            <div className="flex items-center gap-0.5">
                                                                                <div className="flex flex-col items-center shrink-0">
                                                                                    <button type="button" onClick={() => moveRow(ri, ri - 1)} disabled={ri === 0}
                                                                                        className="p-0 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed">
                                                                                        <ChevronUp className="w-2.5 h-2.5" />
                                                                                    </button>
                                                                                    <span className="text-[8px] font-bold text-gray-400 leading-none">{ri + 1}</span>
                                                                                    <button type="button" onClick={() => moveRow(ri, ri + 1)} disabled={ri === table.rows.length - 1}
                                                                                        className="p-0 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed">
                                                                                        <ChevronDown className="w-2.5 h-2.5" />
                                                                                    </button>
                                                                                </div>
                                                                                <select value={row.type}
                                                                                    onChange={(e) => {
                                                                                        const newType = e.target.value;
                                                                                        if (newType === "section") {
                                                                                            updateRow(ri, { type: newType, cells: [{ text: row.cells[0]?.text || "SECCION", bold: true, colspan: table.columns, align: "center", bgColor: "#1a6b3c", color: "#ffffff" }] });
                                                                                        } else {
                                                                                            const cellCount = row.cells.reduce((sum, c) => sum + (c.colspan || 1), 0);
                                                                                            if (cellCount < table.columns) {
                                                                                                const extra = Array.from({ length: table.columns - cellCount }, () => ({ text: "" }));
                                                                                                updateRow(ri, { type: newType, cells: [...row.cells.map(c => ({ ...c, colspan: undefined, bgColor: undefined, color: undefined })), ...extra] });
                                                                                            } else {
                                                                                                updateRow(ri, { type: newType, cells: row.cells.map(c => ({ ...c, bgColor: undefined, color: undefined })) });
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                    className="w-full text-[9px] rounded border-0 bg-transparent text-gray-500 focus:outline-none cursor-pointer p-0">
                                                                                    <option value="header">HDR</option>
                                                                                    <option value="section">SEC</option>
                                                                                    <option value="data">DAT</option>
                                                                                </select>
                                                                            </div>
                                                                        </td>
                                                                        {/* Cells */}
                                                                        {row.cells.map((cell, ci) => (
                                                                            <td key={ci} colSpan={cell.colspan || 1}
                                                                                className="border border-gray-200 p-0 relative group/cell"
                                                                                style={{ backgroundColor: cell.bgColor || undefined }}>
                                                                                <div className="flex items-center">
                                                                                    <input type="text" value={cell.text}
                                                                                        onChange={(e) => updateCell(ri, ci, { text: e.target.value })}
                                                                                        className="w-full px-1.5 py-1.5 text-xs bg-transparent focus:outline-none focus:bg-blue-50/50"
                                                                                        style={{ color: cell.color || (row.type === "header" || row.type === "section" ? "white" : undefined), fontWeight: cell.bold ? "bold" : "normal" }}
                                                                                        placeholder="..." />
                                                                                    {/* Cell style popover — opens below cell */}
                                                                                    <div className="invisible group-hover/cell:visible absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-2.5 min-w-[220px]"
                                                                                        style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))" }}>
                                                                                        {/* Arrow pointing up */}
                                                                                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45" />
                                                                                        {/* Bold toggle */}
                                                                                        <div className="flex items-center gap-1.5 mb-2.5 relative">
                                                                                            <button type="button"
                                                                                                onClick={() => updateCell(ri, ci, { bold: !cell.bold })}
                                                                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${cell.bold ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                                                                                                B Negrita</button>
                                                                                            <button type="button"
                                                                                                onClick={() => updateCell(ri, ci, { bgColor: undefined, color: undefined, bold: undefined })}
                                                                                                className="ml-auto text-[9px] text-gray-400 hover:text-red-500 font-medium">Reset</button>
                                                                                        </div>
                                                                                        {/* Background color — diverse palette */}
                                                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fondo</p>
                                                                                        <div className="flex items-center gap-1.5 mb-1">
                                                                                            {[
                                                                                                { hex: "#ffffff", label: "Sin fondo" },
                                                                                                { hex: "#F1F5F9", label: "Gris perla" },
                                                                                                { hex: "#FEF3C7", label: "Crema dorado" },
                                                                                                { hex: "#DBEAFE", label: "Azul cielo" },
                                                                                                { hex: "#D1FAE5", label: "Menta suave" },
                                                                                                { hex: "#FCE7F3", label: "Rosa pastel" },
                                                                                                { hex: "#EDE9FE", label: "Lavanda" },
                                                                                                { hex: "#FEE2E2", label: "Coral claro" },
                                                                                            ].map(c => (
                                                                                                <button key={c.hex} type="button" title={c.label}
                                                                                                    onClick={() => updateCell(ri, ci, { bgColor: c.hex === "#ffffff" ? undefined : c.hex })}
                                                                                                    className={`w-5 h-5 rounded-full shrink-0 transition-all ${cell.bgColor === c.hex || (!cell.bgColor && c.hex === "#ffffff") ? "ring-2 ring-offset-1 ring-blue-500 scale-110" : "hover:scale-110"} ${c.hex === "#ffffff" ? "border border-gray-300 bg-white" : ""}`}
                                                                                                    style={{ backgroundColor: c.hex !== "#ffffff" ? c.hex : undefined }} />
                                                                                            ))}
                                                                                        </div>
                                                                                        <div className="flex items-center gap-1.5 mb-2">
                                                                                            {[
                                                                                                { hex: "#1E293B", label: "Slate oscuro" },
                                                                                                { hex: "#1a6b3c", label: "Verde bosque" },
                                                                                                { hex: "#1E40AF", label: "Azul royal" },
                                                                                                { hex: "#7C3AED", label: "Violeta" },
                                                                                                { hex: "#BE185D", label: "Rosa fuerte" },
                                                                                                { hex: "#B45309", label: "Ambar oscuro" },
                                                                                                { hex: "#0891B2", label: "Cian" },
                                                                                                { hex: "#059669", label: "Esmeralda" },
                                                                                            ].map(c => (
                                                                                                <button key={c.hex} type="button" title={c.label}
                                                                                                    onClick={() => updateCell(ri, ci, { bgColor: c.hex })}
                                                                                                    className={`w-5 h-5 rounded-full shrink-0 transition-all ${cell.bgColor === c.hex ? "ring-2 ring-offset-1 ring-blue-500 scale-110" : "hover:scale-110"}`}
                                                                                                    style={{ backgroundColor: c.hex }} />
                                                                                            ))}
                                                                                        </div>
                                                                                        {/* Custom HEX input */}
                                                                                        <div className="flex items-center gap-1.5 mb-2.5">
                                                                                            <input type="color" value={cell.bgColor || "#ffffff"}
                                                                                                onChange={(e) => updateCell(ri, ci, { bgColor: e.target.value === "#ffffff" ? undefined : e.target.value })}
                                                                                                className="w-6 h-6 rounded-lg cursor-pointer border border-gray-200 p-0 shrink-0" />
                                                                                            <input type="text" value={cell.bgColor || ""}
                                                                                                onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === "") updateCell(ri, ci, { bgColor: v || undefined }); }}
                                                                                                className="flex-1 px-2 py-1 rounded-lg border border-gray-200 text-[10px] font-mono text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 uppercase"
                                                                                                placeholder="#HEX" maxLength={7} />
                                                                                        </div>
                                                                                        {/* Text color — diverse palette */}
                                                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Texto</p>
                                                                                        <div className="flex items-center gap-1.5 mb-2">
                                                                                            {[
                                                                                                { hex: "#000000", label: "Negro" },
                                                                                                { hex: "#374151", label: "Gris oscuro" },
                                                                                                { hex: "#6B7280", label: "Gris medio" },
                                                                                                { hex: "#ffffff", label: "Blanco" },
                                                                                                { hex: "#1a6b3c", label: "Verde bosque" },
                                                                                                { hex: "#1E40AF", label: "Azul royal" },
                                                                                                { hex: "#7C3AED", label: "Violeta" },
                                                                                                { hex: "#BE185D", label: "Rosa fuerte" },
                                                                                                { hex: "#B45309", label: "Ambar oscuro" },
                                                                                                { hex: "#DC2626", label: "Rojo" },
                                                                                                { hex: "#0891B2", label: "Cian" },
                                                                                            ].map(c => (
                                                                                                <button key={c.hex} type="button" title={c.label}
                                                                                                    onClick={() => updateCell(ri, ci, { color: c.hex === "#000000" ? undefined : c.hex })}
                                                                                                    className={`w-5 h-5 rounded-full shrink-0 transition-all ${cell.color === c.hex || (!cell.color && c.hex === "#000000") ? "ring-2 ring-offset-1 ring-blue-500 scale-110" : "hover:scale-110"} ${c.hex === "#ffffff" ? "border border-gray-300 bg-white" : ""}`}
                                                                                                    style={{ backgroundColor: c.hex !== "#ffffff" ? c.hex : undefined }} />
                                                                                            ))}
                                                                                        </div>
                                                                                        {/* Custom text HEX input */}
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <input type="color" value={cell.color || "#000000"}
                                                                                                onChange={(e) => updateCell(ri, ci, { color: e.target.value === "#000000" ? undefined : e.target.value })}
                                                                                                className="w-6 h-6 rounded-lg cursor-pointer border border-gray-200 p-0 shrink-0" />
                                                                                            <input type="text" value={cell.color || ""}
                                                                                                onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === "") updateCell(ri, ci, { color: v || undefined }); }}
                                                                                                className="flex-1 px-2 py-1 rounded-lg border border-gray-200 text-[10px] font-mono text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 uppercase"
                                                                                                placeholder="#HEX" maxLength={7} />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        ))}
                                                                        {/* Delete row */}
                                                                        <td className="px-0.5 py-0.5 border border-gray-200 w-[24px] bg-gray-50">
                                                                            <button type="button" onClick={() => removeRow(ri)}
                                                                                className="p-0.5 rounded text-gray-300 hover:text-red-600 transition-colors">
                                                                                <X className="w-3 h-3" />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Add row buttons */}
                                                    <div className="p-2.5 border-t border-gray-200 bg-gray-50/50 flex items-center gap-3">
                                                        <button type="button" onClick={() => addRow("data")}
                                                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold">
                                                            <Plus className="w-3 h-3" /> Fila</button>
                                                        <button type="button" onClick={() => addRow("header")}
                                                            className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 font-semibold">
                                                            <Plus className="w-3 h-3" /> Header</button>
                                                        <button type="button" onClick={() => addRow("section")}
                                                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold">
                                                            <Plus className="w-3 h-3" /> Seccion</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <button type="button" onClick={addTable}
                                            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors font-semibold">
                                            + Agregar tabla de ofertas
                                        </button>
                                    </div>
                                );
                            })()}

                            {/* ===== SECTION CONTENT (all categories) ===== */}
                                    <p className={sectionCls}>Contenido detallado</p>
                                    <div>
                                        <label className={labelCls}>Modelo educativo</label>
                                        <textarea rows={3} value={((editForm.section_content as Record<string, unknown>) || {}).modelo_educativo as string || ""}
                                            onChange={(e) => updateSectionContent("modelo_educativo", e.target.value)}
                                            className={`${inputCls} resize-none`} placeholder="Descripción del modelo educativo..." />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Etapas (separadas por coma)</label>
                                        <input type="text" value={Array.isArray(((editForm.section_content as Record<string, unknown>) || {}).etapas) ? ((editForm.section_content as Record<string, unknown>).etapas as string[]).join(", ") : ""}
                                            onChange={(e) => updateSectionContent("etapas", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                            className={inputCls} placeholder="Infantil, Primaria, ESO, Bachillerato" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Extraescolares (separadas por coma)</label>
                                        <input type="text" value={Array.isArray(((editForm.section_content as Record<string, unknown>) || {}).extraescolares) ? ((editForm.section_content as Record<string, unknown>).extraescolares as string[]).join(", ") : ""}
                                            onChange={(e) => updateSectionContent("extraescolares", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                            className={inputCls} placeholder="Futbol, Musica, Robotica, Teatro..." />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Servicios (separados por coma)</label>
                                        <input type="text" value={Array.isArray(((editForm.section_content as Record<string, unknown>) || {}).servicios) ? ((editForm.section_content as Record<string, unknown>).servicios as string[]).join(", ") : ""}
                                            onChange={(e) => updateSectionContent("servicios", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                            className={inputCls} placeholder="Comedor, Transporte, Enfermeria..." />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Instalaciones (separadas por coma)</label>
                                        <input type="text" value={Array.isArray(((editForm.section_content as Record<string, unknown>) || {}).instalaciones) ? ((editForm.section_content as Record<string, unknown>).instalaciones as string[]).join(", ") : ""}
                                            onChange={(e) => updateSectionContent("instalaciones", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                            className={inputCls} placeholder="Piscina, Gimnasio, Biblioteca..." />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Proceso de admisión</label>
                                        <textarea rows={3} value={((editForm.section_content as Record<string, unknown>) || {}).admisiones as string || ""}
                                            onChange={(e) => updateSectionContent("admisiones", e.target.value)}
                                            className={`${inputCls} resize-none`} placeholder="Información sobre el proceso de admisión..." />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Idiomas de enseñanza (separados por coma)</label>
                                        <input type="text" value={Array.isArray(((editForm.section_content as Record<string, unknown>) || {}).idiomas_ensenanza) ? ((editForm.section_content as Record<string, unknown>).idiomas_ensenanza as string[]).join(", ") : ""}
                                            onChange={(e) => updateSectionContent("idiomas_ensenanza", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                            className={inputCls} placeholder="Español, Inglés, Francés..." />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className={labelCls}>Alumnos/clase</label>
                                            <input type="number" value={((editForm.section_content as Record<string, unknown>) || {}).alumnos_por_clase as number || ""}
                                                onChange={(e) => updateSectionContent("alumnos_por_clase", e.target.value ? Number(e.target.value) : null)}
                                                className={inputCls} placeholder="25" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Confesional</label>
                                            <div className="relative">
                                                <select value={((editForm.section_content as Record<string, unknown>) || {}).confesional as string || ""}
                                                    onChange={(e) => updateSectionContent("confesional", e.target.value || null)}
                                                    className={`${inputCls} appearance-none pr-9`}>
                                                    <option value="">—</option>
                                                    <option value="Laico">Laico</option>
                                                    <option value="Catolico">Católico</option>
                                                    <option value="Otro">Otro</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="flex items-end">
                                            <label className="flex items-center gap-3 cursor-pointer pb-2.5">
                                                <input type="checkbox" checked={Boolean(((editForm.section_content as Record<string, unknown>) || {}).uniforme)}
                                                    onChange={(e) => updateSectionContent("uniforme", e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                                <span className="text-sm font-semibold text-gray-700">Uniforme</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Horario ampliado</label>
                                        <input type="text" value={((editForm.section_content as Record<string, unknown>) || {}).horario_ampliado as string || ""}
                                            onChange={(e) => updateSectionContent("horario_ampliado", e.target.value)}
                                            className={inputCls} placeholder="7:30 - 18:00" />
                                    </div>

                            {/* ===== FAQs (all categories) ===== */}
                            <p className={sectionCls}>Preguntas frecuentes</p>
                            <div>
                                {(((editForm.section_content as Record<string, unknown>) || {}).faqs as Array<{ question: string; answer: string }> || []).map((faq, idx) => (
                                    <div key={idx} className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
                                        <input type="text" value={faq.question} placeholder="Pregunta..."
                                            onChange={(e) => {
                                                const faqs = [...(((editForm.section_content as Record<string, unknown>) || {}).faqs as Array<{ question: string; answer: string }> || [])];
                                                faqs[idx] = { ...faqs[idx], question: e.target.value };
                                                updateSectionContent("faqs", faqs);
                                            }}
                                            className={inputCls} />
                                        <textarea rows={2} value={faq.answer} placeholder="Respuesta..."
                                            onChange={(e) => {
                                                const faqs = [...(((editForm.section_content as Record<string, unknown>) || {}).faqs as Array<{ question: string; answer: string }> || [])];
                                                faqs[idx] = { ...faqs[idx], answer: e.target.value };
                                                updateSectionContent("faqs", faqs);
                                            }}
                                            className={`${inputCls} resize-none`} />
                                        <button type="button" onClick={() => {
                                            const faqs = [...(((editForm.section_content as Record<string, unknown>) || {}).faqs as Array<{ question: string; answer: string }> || [])];
                                            faqs.splice(idx, 1);
                                            updateSectionContent("faqs", faqs);
                                        }} className="text-xs text-red-400 hover:text-red-600 font-medium">Eliminar</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => {
                                    const faqs = [...(((editForm.section_content as Record<string, unknown>) || {}).faqs as Array<{ question: string; answer: string }> || [])];
                                    faqs.push({ question: "", answer: "" });
                                    updateSectionContent("faqs", faqs);
                                }} className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold">+ Añadir pregunta</button>
                            </div>

                            {/* ===== CUSTOM SECTIONS (NAVBAR) ===== */}
                            <p className={sectionCls}>Secciones personalizadas (Navbar)</p>
                            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Navigation className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-bold text-gray-800">Secciones del navbar</span>
                                    </div>
                                    <span className="text-[11px] text-gray-400">{sections.length} secciones</span>
                                </div>

                                {sectionsLoading ? (
                                    <div className="p-6 flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {sections.map((sec, idx) => (
                                            <div key={sec.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    {/* Reorder buttons */}
                                                    <div className="flex flex-col gap-0.5 pt-1">
                                                        <button onClick={() => moveSectionUp(idx)} disabled={idx === 0}
                                                            className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20 transition-colors">
                                                            <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                                                        </button>
                                                        <button onClick={() => moveSectionDown(idx)} disabled={idx === sections.length - 1}
                                                            className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20 transition-colors">
                                                            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                                        </button>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <input type="text" defaultValue={sec.title}
                                                                onBlur={(e) => {
                                                                    if (e.target.value.trim() !== sec.title) {
                                                                        updateSection(sec.id, { title: e.target.value.trim() });
                                                                    }
                                                                }}
                                                                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                                                placeholder="Nombre de la seccion" />
                                                            <button onClick={() => updateSection(sec.id, { is_active: !sec.is_active })}
                                                                title={sec.is_active ? "Visible" : "Oculta"}
                                                                className={`p-1.5 rounded-lg border transition-colors ${sec.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-gray-200 bg-gray-50 text-gray-400"}`}>
                                                                {sec.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <button onClick={() => deleteSection(sec.id)}
                                                                className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 text-red-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        <textarea rows={3} defaultValue={sec.content}
                                                            onBlur={(e) => {
                                                                if (e.target.value !== sec.content) {
                                                                    updateSection(sec.id, { content: e.target.value });
                                                                }
                                                            }}
                                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                                                            placeholder="Contenido de esta seccion..." />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {sections.length === 0 && (
                                            <div className="p-6 text-center">
                                                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400">No hay secciones personalizadas</p>
                                                <p className="text-xs text-gray-300 mt-1">Agrega secciones para personalizar el navbar del listing</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Add new section */}
                                <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex items-center gap-2">
                                    <input type="text" value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") addSection(); }}
                                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                        placeholder="Nombre de nueva seccion..." />
                                    <button onClick={addSection} disabled={!newSectionTitle.trim()}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 transition-colors">
                                        <Plus className="w-3.5 h-3.5" /> Agregar
                                    </button>
                                </div>
                            </div>

                            {/* ===== GOOGLE ===== */}
                            <p className={sectionCls}>Google Reviews</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                                        <Star className="w-3.5 h-3.5 text-amber-500" /> Rating
                                    </label>
                                    <input type="number" step="0.1" min="0" max="5" value={editForm.google_rating !== null ? String(editForm.google_rating) : ""}
                                        onChange={(e) => updateField("google_rating", e.target.value ? Number(e.target.value) : null)} className={inputCls} placeholder="4.5" />
                                </div>
                                <div>
                                    <label className={labelCls}>Nº de reseñas</label>
                                    <input type="number" value={editForm.google_review_count !== null ? String(editForm.google_review_count) : ""}
                                        onChange={(e) => updateField("google_review_count", e.target.value ? Number(e.target.value) : null)} className={inputCls} />
                                </div>
                            </div>
                            {!!(editForm.google_place_id) && (
                                <div>
                                    <label className={labelCls}>Google Place ID</label>
                                    <input type="text" value={editForm.google_place_id as string} readOnly
                                        className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} />
                                </div>
                            )}

                            {/* Google Reviews from section_content */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className={labelCls}>Reseñas de Google (importadas)</label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox"
                                            checked={Boolean(((editForm.section_content as Record<string, unknown>) || {}).show_google_reviews)}
                                            onChange={(e) => updateSectionContent("show_google_reviews", e.target.checked)}
                                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                                        <span className="text-xs font-medium text-gray-600">Mostrar en la ficha</span>
                                    </label>
                                </div>
                                <div className="space-y-3">
                                    {((((editForm.section_content as Record<string, unknown>) || {}).google_reviews ?? []) as Array<{ author: string; text: string; rating: string }>).map((review, idx) => (
                                        <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50/40 p-3 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <input type="text" value={review.author} placeholder="Autor"
                                                        onChange={(e) => {
                                                            const reviews = [...((((editForm.section_content as Record<string, unknown>) || {}).google_reviews ?? []) as Array<Record<string, string>>)];
                                                            reviews[idx] = { ...reviews[idx], author: e.target.value };
                                                            updateSectionContent("google_reviews", reviews);
                                                        }}
                                                        className={`${inputCls} !py-1.5 text-xs flex-1`} />
                                                    <input type="text" value={review.rating} placeholder="5"
                                                        onChange={(e) => {
                                                            const reviews = [...((((editForm.section_content as Record<string, unknown>) || {}).google_reviews ?? []) as Array<Record<string, string>>)];
                                                            reviews[idx] = { ...reviews[idx], rating: e.target.value };
                                                            updateSectionContent("google_reviews", reviews);
                                                        }}
                                                        className={`${inputCls} !py-1.5 text-xs w-14`} />
                                                </div>
                                                <button type="button" onClick={() => {
                                                    const reviews = [...((((editForm.section_content as Record<string, unknown>) || {}).google_reviews ?? []) as Array<Record<string, string>>)];
                                                    reviews.splice(idx, 1);
                                                    updateSectionContent("google_reviews", reviews.length > 0 ? reviews : undefined);
                                                }} className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <textarea rows={2} value={review.text} placeholder="Texto de la reseña..."
                                                onChange={(e) => {
                                                    const reviews = [...((((editForm.section_content as Record<string, unknown>) || {}).google_reviews ?? []) as Array<Record<string, string>>)];
                                                    reviews[idx] = { ...reviews[idx], text: e.target.value };
                                                    updateSectionContent("google_reviews", reviews);
                                                }}
                                                className={`${inputCls} resize-none text-xs`} />
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => {
                                        const reviews = [...((((editForm.section_content as Record<string, unknown>) || {}).google_reviews ?? []) as Array<Record<string, string>>)];
                                        reviews.push({ author: "", text: "", rating: "5" });
                                        updateSectionContent("google_reviews", reviews);
                                    }} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">+ Agregar reseña</button>
                                </div>
                            </div>

                            {/* Payment options & Accessibility from section_content */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Opciones de pago</label>
                                    <textarea rows={2} value={((editForm.section_content as Record<string, unknown>) || {}).payment_options as string || ""}
                                        onChange={(e) => updateSectionContent("payment_options", e.target.value || undefined)}
                                        className={`${inputCls} resize-none text-xs`} placeholder="Visa, Mastercard, Efectivo..." />
                                </div>
                                <div>
                                    <label className={labelCls}>Accesibilidad</label>
                                    <textarea rows={2} value={((editForm.section_content as Record<string, unknown>) || {}).accessibility as string || ""}
                                        onChange={(e) => updateSectionContent("accessibility", e.target.value || undefined)}
                                        className={`${inputCls} resize-none text-xs`} placeholder="Acceso para silla de ruedas..." />
                                </div>
                            </div>

                            {/* ===== SEO ===== */}
                            <p className={sectionCls}>SEO</p>
                            <div>
                                <label className={labelCls}>Meta título</label>
                                <input type="text" value={editForm.meta_title as string} onChange={(e) => updateField("meta_title", e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Meta descripción</label>
                                <textarea rows={2} value={editForm.meta_description as string} onChange={(e) => updateField("meta_description", e.target.value)}
                                    className={`${inputCls} resize-none`} />
                            </div>

                            {/* ===== TOGGLES WITH EXPIRY ===== */}
                            <p className={sectionCls}>Estado y expiración</p>
                            <div className="space-y-3">
                                {/* ACTIVO */}
                                <ToggleWithExpiry
                                    label="Activo"
                                    checked={Boolean(editForm.is_active)}
                                    onToggle={() => updateField("is_active", !editForm.is_active)}
                                    expiresAt={editForm.active_expires_at as string | null}
                                    onExpiryChange={(val) => updateField("active_expires_at", val)}
                                    colorOn="emerald"
                                />
                                {/* VERIFICADO */}
                                <ToggleWithExpiry
                                    label="Verificado"
                                    checked={Boolean(editForm.is_verified)}
                                    onToggle={() => updateField("is_verified", !editForm.is_verified)}
                                    expiresAt={editForm.verified_expires_at as string | null}
                                    onExpiryChange={(val) => updateField("verified_expires_at", val)}
                                    colorOn="blue"
                                />
                                {/* DESTACADO */}
                                <ToggleWithExpiry
                                    label="Destacado"
                                    checked={Boolean(editForm.is_featured)}
                                    onToggle={() => updateField("is_featured", !editForm.is_featured)}
                                    expiresAt={editForm.featured_expires_at as string | null}
                                    onExpiryChange={(val) => updateField("featured_expires_at", val)}
                                    colorOn="amber"
                                />
                            </div>

                            {/* ===== VERIFICATION BADGE ===== */}
                            <p className={sectionCls}>Badge de verificacion (titulo)</p>
                            <p className="text-xs text-gray-400 -mt-1 mb-2">Aparece al lado del nombre del listing</p>
                            <div className="flex gap-3">
                                {[
                                    { value: "none", label: "No verificado", preview: (
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="4 3" />
                                            <path d="M15 9l-6 6M9 9l6 6" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    )},
                                    { value: "gray", label: "Gris", preview: (
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" fill="#9CA3AF" />
                                            <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )},
                                    { value: "blue", label: "Azul", preview: (
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" fill="#3B82F6" />
                                            <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )},
                                ].map((opt) => (
                                    <button key={opt.value} type="button"
                                        onClick={() => updateSectionContent("verification_badge", opt.value)}
                                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                            (((editForm.section_content as Record<string, unknown>) || {}).verification_badge || "none") === opt.value
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                        }`}>
                                        <span>{opt.preview}</span>
                                        <span className="text-xs font-semibold text-gray-700">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                            {(((editForm.section_content as Record<string, unknown>) || {}).verification_badge || "none") === "none" && (
                                <div className="mt-2">
                                    <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Link al hacer clic en badge no verificado</label>
                                    <input type="url"
                                        value={((editForm.section_content as Record<string, unknown>) || {}).verification_link as string || ""}
                                        onChange={(e) => updateSectionContent("verification_link", e.target.value)}
                                        className={inputCls}
                                        placeholder="/colaborar" />
                                    <p className="text-[10px] text-gray-400 mt-1">Si esta vacio, usa el link por defecto</p>
                                </div>
                            )}
                        </div>

                        {/* Save footer */}
                        <div className="px-8 py-4 shrink-0 flex items-center justify-between" style={{ borderTop: "1px solid #E0E0E0" }}>
                            {saveError && <p className="text-[13px] text-red-500 font-medium">{saveError}</p>}
                            {!saveError && <button onClick={() => { setEditListing(null); setIsCreating(false); }}
                                className="rounded-xl border px-5 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#F0F0F0]" style={{ borderColor: "#E0E0E0", color: "#454545" }}>Cancelar</button>}
                            <button onClick={handleSave} disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 transition-all"
                                style={{ background: saveSuccess ? "#059669" : "#1a1a1a" }}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                {saving ? "Guardando..." : saveSuccess ? "Guardado" : isCreating ? "Crear listing" : "Guardar cambios"}
                            </button>
                        </div>
                    </div>
                    </div>

                    {/* ── Position Reorder Modal ── */}
                    {showPositionModal && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ backdropFilter: "blur(4px)" }}>
                            <div className="absolute inset-0 bg-black/40" onClick={() => setShowPositionModal(false)} />
                            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 z-10 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-[16px] text-gray-900">Orden de secciones</h3>
                                        <p className="text-[12px] text-gray-400 mt-0.5">Arrastra las secciones para cambiar el orden en el listing</p>
                                    </div>
                                    <button onClick={() => setShowPositionModal(false)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                                <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
                                    {(() => {
                                        const SECTION_LABELS: Record<string, string> = {
                                            sobre: "Sobre nosotros",
                                            recomendacion: "Recomendacion",
                                            "servicios-ofrecidos": "Servicios",
                                            tarifas: "Tarifas y precios",
                                            opiniones: "Opiniones Google",
                                            horario: "Horario",
                                            info: "Info practica",
                                            "info-adicional": "Info adicional",
                                            modelo: "Modelo educativo",
                                            etapas: "Etapas educativas",
                                            extraescolares: "Extraescolares",
                                            servicios: "Servicios colegio",
                                            instalaciones: "Instalaciones",
                                            admisiones: "Admisiones",
                                            idiomas: "Idiomas",
                                            galeria: "Galeria",
                                            faqs: "FAQ",
                                        };
                                        const SECTION_ICONS: Record<string, string> = {
                                            sobre: "📝", recomendacion: "✅", "servicios-ofrecidos": "🩺",
                                            tarifas: "💰", opiniones: "⭐", horario: "🕐",
                                            info: "📊", "info-adicional": "💳", modelo: "💡",
                                            etapas: "🎓", extraescolares: "🏋️", servicios: "🍽️",
                                            instalaciones: "🏢", admisiones: "📋", idiomas: "🌍",
                                            galeria: "🖼️", faqs: "❓",
                                        };
                                        const movePos = (from: number, to: number) => {
                                            if (to < 0 || to >= positionOrder.length) return;
                                            const copy = [...positionOrder];
                                            const [item] = copy.splice(from, 1);
                                            copy.splice(to, 0, item);
                                            setPositionOrder(copy);
                                        };
                                        return (
                                            <div className="space-y-1">
                                                {positionOrder.map((id, idx) => (
                                                    <div key={id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors group">
                                                        <div className="flex flex-col gap-0 shrink-0">
                                                            <button type="button" onClick={() => movePos(idx, idx - 1)} disabled={idx === 0}
                                                                className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                                                                <ChevronUp className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button type="button" onClick={() => movePos(idx, idx + 1)} disabled={idx === positionOrder.length - 1}
                                                                className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                                                                <ChevronDown className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        <span className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[12px] font-bold text-gray-400 shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-[15px] shrink-0">{SECTION_ICONS[id] || "📄"}</span>
                                                        <span className="text-[13px] font-semibold text-gray-700 flex-1">{SECTION_LABELS[id] || id}</span>
                                                        <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                    <button onClick={() => setShowPositionModal(false)}
                                        className="rounded-xl border px-5 py-2.5 text-[13px] font-semibold transition-all hover:bg-gray-50" style={{ borderColor: "#E0E0E0", color: "#454545" }}>
                                        Cancelar
                                    </button>
                                    <button onClick={async () => {
                                        if (!editListing || !token) return;
                                        const sc = (editForm.section_content || {}) as Record<string, unknown>;
                                        const updatedSc = { ...sc, section_order: positionOrder };
                                        const res = await fetch(`/api/admin/listings/${editListing.id}`, {
                                            method: "PATCH",
                                            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                                            body: JSON.stringify({ section_content: updatedSc }),
                                        });
                                        if (res.ok) {
                                            setEditForm(prev => ({ ...prev, section_content: updatedSc }));
                                            setShowPositionModal(false);
                                        }
                                    }}
                                        className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-semibold text-white transition-all"
                                        style={{ background: "#1a1a1a" }}>
                                        <Save className="w-4 h-4" /> Guardar orden
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Delete Confirmation Dialogs ── */}
                    {deleteStep > 0 && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ backdropFilter: "blur(4px)" }}>
                            <div className="absolute inset-0 bg-black/40" onClick={() => { setDeleteStep(0); setDeleteConfirmText(""); }} />

                            {/* Step 1: Are you sure? */}
                            {deleteStep === 1 && (
                                <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 z-10">
                                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 text-center">¿Estás seguro?</h3>
                                    <p className="text-sm text-gray-500 text-center mt-2">
                                        Vas a eliminar el listing <strong className="text-gray-900">{editListing.name}</strong>. Esta acción no se puede deshacer.
                                    </p>
                                    <div className="flex gap-3 mt-6">
                                        <button onClick={() => { setDeleteStep(0); setDeleteConfirmText(""); }}
                                            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                                            Cancelar
                                        </button>
                                        <button onClick={() => setDeleteStep(2)}
                                            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-all">
                                            Confirmar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Type DELETE to confirm */}
                            {deleteStep === 2 && (
                                <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 z-10">
                                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                        <Trash2 className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 text-center">Confirmación final</h3>
                                    <p className="text-sm text-gray-500 text-center mt-2">
                                        Para confirmar la eliminación, escribe <strong className="text-red-600 font-mono">DELETE</strong> en el campo:
                                    </p>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="Escribe DELETE aquí..."
                                        className="w-full mt-4 rounded-xl border-2 border-red-200 bg-red-50/50 px-4 py-3 text-center text-sm font-mono font-bold text-gray-800 placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
                                        autoFocus
                                    />
                                    <div className="flex gap-3 mt-5">
                                        <button onClick={() => { setDeleteStep(0); setDeleteConfirmText(""); }}
                                            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={deleteConfirmText !== "DELETE" || deleting}
                                            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2">
                                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            {deleting ? "Eliminando..." : "Eliminar definitivamente"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ── Copy From Modal ── */}
            {copyModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ backdropFilter: "blur(4px)" }}>
                    <div className="absolute inset-0 bg-black/40" onClick={() => setCopyModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 z-10 max-h-[85vh] flex flex-col">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Copy className="w-5 h-5 text-indigo-500" />
                                Copiar campos desde otro listing
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Busca un listing y selecciona los campos que quieres copiar.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Search */}
                            <div>
                                <input
                                    type="text"
                                    placeholder="Buscar listing por nombre..."
                                    value={copySearch}
                                    onChange={(e) => { setCopySearch(e.target.value); setCopySource(null); setCopyFields(new Set()); }}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                />
                                {copySearch.length >= 2 && !copySource && (
                                    <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                                        {listings.filter((l) => l.name.toLowerCase().includes(copySearch.toLowerCase()) && l.id !== editListing?.id).slice(0, 8).map((l) => (
                                            <button key={l.id} onClick={() => { setCopySource(l); setCopySearch(l.name); }}
                                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between">
                                                <span className="font-medium text-gray-900">{l.name}</span>
                                                <span className="text-xs text-gray-400">{l.category?.name || ""}</span>
                                            </button>
                                        ))}
                                        {listings.filter((l) => l.name.toLowerCase().includes(copySearch.toLowerCase()) && l.id !== editListing?.id).length === 0 && (
                                            <p className="px-4 py-3 text-sm text-gray-400 text-center">Sin resultados</p>
                                        )}
                                    </div>
                                )}
                                {copySource && (
                                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100">
                                        <span className="text-sm font-medium text-indigo-700">Fuente: {copySource.name}</span>
                                        <button onClick={() => { setCopySource(null); setCopySearch(""); setCopyFields(new Set()); }}
                                            className="ml-auto text-xs text-indigo-500 hover:text-indigo-700">Cambiar</button>
                                    </div>
                                )}
                            </div>

                            {/* Field groups */}
                            {copySource && (() => {
                                const fieldGroups = [
                                    { key: "basic", label: "Nombre y slug", fields: ["name", "slug"], preview: copySource.name },
                                    { key: "descriptions", label: "Descripciones", fields: ["short_description", "description", "recommendation_reason"], preview: copySource.short_description?.slice(0, 60) || copySource.description?.slice(0, 60) || "—" },
                                    { key: "contact", label: "Contacto", fields: ["phone", "email", "website", "whatsapp"], preview: [copySource.phone, copySource.email].filter(Boolean).join(", ") || "—" },
                                    { key: "address", label: "Dirección", fields: ["street_address", "postal_code", "latitude", "longitude"], preview: copySource.street_address || "—" },
                                    { key: "schedule", label: "Horario", fields: ["schedule"], preview: copySource.schedule?.slice(0, 40) || "—" },
                                    { key: "category", label: "Categoría y zona", fields: ["category_id", "subcategory_id", "zone_id"], preview: copySource.category?.name || "—" },
                                    { key: "age", label: "Rango de edad", fields: ["age_min", "age_max"], preview: copySource.age_min != null ? `${copySource.age_min}–${copySource.age_max} años` : "—" },
                                    { key: "price", label: "Precios", fields: ["price_min", "price_max", "price_range"], preview: copySource.price_range || "—" },
                                    { key: "images", label: "Imágenes", fields: ["logo_url", "cover_image_url", "gallery_urls"], preview: copySource.cover_image_url ? "Tiene cover" : "—" },
                                    { key: "google", label: "Google", fields: ["google_rating", "google_review_count", "google_place_id", "google_photos_enabled"], preview: copySource.google_place_id || "—" },
                                    { key: "seo", label: "SEO", fields: ["meta_title", "meta_description"], preview: copySource.meta_title || "—" },
                                    { key: "languages", label: "Idiomas", fields: ["languages"], preview: (copySource.languages || []).join(", ") || "—" },
                                    { key: "social", label: "Redes sociales", fields: ["social_links"], preview: Object.keys(copySource.social_links || {}).join(", ") || "—" },
                                    { key: "status", label: "Estado", fields: ["tier", "is_active", "is_verified", "is_featured", "is_claimed"], preview: copySource.tier },
                                    { key: "dates", label: "Fechas de expiración", fields: ["active_expires_at", "verified_expires_at", "featured_expires_at", "founded_date"], preview: copySource.founded_date || "—" },
                                    { key: "sc_badges", label: "Badges de información (Header)", fields: ["sc:info_badges"], preview: (() => { const sc = (copySource.section_content || {}) as Record<string, unknown>; const b = sc.info_badges as Array<{text:string}> | undefined; return b?.length ? b.map(x => x.text).join(", ") : "—"; })() },
                                    { key: "sc_modelo", label: "Modelo educativo", fields: ["sc:modelo_educativo"], preview: ((copySource.section_content || {}) as Record<string, unknown>).modelo_educativo as string || "—" },
                                    { key: "sc_etapas", label: "Etapas educativas", fields: ["sc:etapas"], preview: (() => { const v = ((copySource.section_content || {}) as Record<string, unknown>).etapas; return Array.isArray(v) ? v.join(", ") : "—"; })() },
                                    { key: "sc_extra", label: "Actividades extraescolares", fields: ["sc:extraescolares"], preview: (() => { const v = ((copySource.section_content || {}) as Record<string, unknown>).extraescolares; return Array.isArray(v) ? `${(v as string[]).length} actividades` : "—"; })() },
                                    { key: "sc_servicios", label: "Servicios e instalaciones", fields: ["sc:servicios", "sc:instalaciones"], preview: (() => { const sc = (copySource.section_content || {}) as Record<string, unknown>; const s = Array.isArray(sc.servicios) ? sc.servicios.length : 0; const i = Array.isArray(sc.instalaciones) ? sc.instalaciones.length : 0; return s + i > 0 ? `${s} servicios, ${i} instalaciones` : "—"; })() },
                                    { key: "sc_idiomas", label: "Idiomas de enseñanza", fields: ["sc:idiomas_ensenanza"], preview: (() => { const v = ((copySource.section_content || {}) as Record<string, unknown>).idiomas_ensenanza; return Array.isArray(v) ? v.join(", ") : "—"; })() },
                                    { key: "sc_admisiones", label: "Admisiones", fields: ["sc:admisiones"], preview: ((copySource.section_content || {}) as Record<string, unknown>).admisiones as string || "—" },
                                    { key: "sc_faqs", label: "Preguntas frecuentes", fields: ["sc:faqs"], preview: (() => { const v = ((copySource.section_content || {}) as Record<string, unknown>).faqs; return Array.isArray(v) ? `${v.length} preguntas` : "—"; })() },
                                    { key: "sc_details", label: "Detalles (alumnos, uniforme, confesional, horario)", fields: ["sc:alumnos_por_clase", "sc:uniforme", "sc:confesional", "sc:horario_ampliado"], preview: ((copySource.section_content || {}) as Record<string, unknown>).horario_ampliado as string || "—" },
                                    { key: "sc_cta", label: "Botones CTA", fields: ["sc:cta_buttons"], preview: (() => { const v = ((copySource.section_content || {}) as Record<string, unknown>).cta_buttons; return Array.isArray(v) ? `${v.length} botones` : "—"; })() },
                                    { key: "sc_services", label: "Servicios ofrecidos", fields: ["sc:services"], preview: (() => { const v = ((copySource.section_content || {}) as Record<string, unknown>).services; return Array.isArray(v) ? `${v.length} servicios` : "—"; })() },
                                    { key: "sc_offers", label: "Tablas de ofertas", fields: ["sc:offer_tables"], preview: (() => { const v = ((copySource.section_content || {}) as Record<string, unknown>).offer_tables; return Array.isArray(v) ? `${v.length} tablas` : "—"; })() },
                                    { key: "sc_order", label: "Orden de secciones", fields: ["sc:section_order"], preview: (() => { const v = ((copySource.section_content || {}) as Record<string, unknown>).section_order; return Array.isArray(v) && v.length ? `${v.length} secciones ordenadas` : "—"; })() },
                                ];
                                const toggleGroup = (key: string, fields: string[]) => {
                                    setCopyFields((prev) => {
                                        const next = new Set(prev);
                                        const allSelected = fields.every((f) => next.has(f));
                                        if (allSelected) fields.forEach((f) => next.delete(f));
                                        else fields.forEach((f) => next.add(f));
                                        return next;
                                    });
                                };
                                return (
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700">Selecciona los campos a copiar:</span>
                                            <button onClick={() => {
                                                const allFields = fieldGroups.flatMap((g) => g.fields);
                                                setCopyFields((prev) => prev.size === allFields.length ? new Set() : new Set(allFields));
                                            }} className="text-xs text-indigo-500 hover:text-indigo-700">
                                                {copyFields.size === fieldGroups.flatMap((g) => g.fields).length ? "Deseleccionar todo" : "Seleccionar todo"}
                                            </button>
                                        </div>
                                        {fieldGroups.map((g) => {
                                            const checked = g.fields.every((f) => copyFields.has(f));
                                            const partial = !checked && g.fields.some((f) => copyFields.has(f));
                                            return (
                                                <label key={g.key}
                                                    className={`flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${checked ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-50 border border-transparent"}`}>
                                                    <input type="checkbox" checked={checked} ref={(el) => { if (el) el.indeterminate = partial; }}
                                                        onChange={() => toggleGroup(g.key, g.fields)}
                                                        className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-sm font-medium text-gray-900">{g.label}</span>
                                                        <p className="text-xs text-gray-400 truncate mt-0.5">{g.preview}</p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setCopyModalOpen(false)}
                                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                                Cancelar
                            </button>
                            <button
                                disabled={!copySource || copyFields.size === 0}
                                onClick={() => {
                                    if (!copySource || !editListing || !token) return;
                                    // Build the merged form
                                    const mergedForm = { ...editForm };
                                    const scUpdates: Record<string, unknown> = {};
                                    copyFields.forEach((field) => {
                                        if (field.startsWith("sc:")) {
                                            const scKey = field.slice(3);
                                            const srcSc = (copySource.section_content || {}) as Record<string, unknown>;
                                            if (srcSc[scKey] !== undefined) scUpdates[scKey] = srcSc[scKey];
                                        } else {
                                            const val = (copySource as unknown as Record<string, unknown>)[field];
                                            if (val !== undefined) mergedForm[field] = val ?? "";
                                        }
                                    });
                                    if (Object.keys(scUpdates).length > 0) {
                                        const existingSc = (mergedForm.section_content || {}) as Record<string, unknown>;
                                        mergedForm.section_content = { ...existingSc, ...scUpdates };
                                    }
                                    setEditForm(mergedForm);
                                    setCopyModalOpen(false);
                                    // Auto-save with merged data
                                    setSaving(true);
                                    setSaveSuccess(false);
                                    setSaveError("");
                                    (async () => {
                                        try {
                                            const res = await fetch(`/api/admin/listings/${editListing.id}`, {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                                body: JSON.stringify(mergedForm),
                                            });
                                            if (res.ok) {
                                                setSaveSuccess(true);
                                                fetchListings();
                                                setTimeout(() => setSaveSuccess(false), 2500);
                                            } else {
                                                const result = await res.json();
                                                setSaveError(result.error || "Error al copiar");
                                            }
                                        } catch { setSaveError("Error de conexión"); }
                                        setSaving(false);
                                    })();
                                }}
                                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2">
                                <Copy className="w-4 h-4" />
                                Aplicar {copyFields.size > 0 ? `(${copyFields.size} campos)` : ""}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bulk Delete Confirmation Dialog ── */}
            {bulkDeleteStep > 0 && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ backdropFilter: "blur(4px)" }}>
                    <div className="absolute inset-0 bg-black/40" onClick={() => { setBulkDeleteStep(0); setBulkDeleteText(""); }} />

                    {bulkDeleteStep === 1 && (
                        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 z-10">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 text-center">¿Eliminar {selectedIds.size} listing{selectedIds.size > 1 ? "s" : ""}?</h3>
                            <p className="text-sm text-gray-500 text-center mt-2">
                                Esta acción eliminará <strong className="text-red-600">{selectedIds.size}</strong> listing{selectedIds.size > 1 ? "s" : ""} de forma permanente. No se puede deshacer.
                            </p>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => { setBulkDeleteStep(0); setBulkDeleteText(""); }}
                                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                                    Cancelar
                                </button>
                                <button onClick={() => setBulkDeleteStep(2)}
                                    className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-all">
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    )}

                    {bulkDeleteStep === 2 && (
                        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 z-10">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 text-center">Confirmación final</h3>
                            <p className="text-sm text-gray-500 text-center mt-2">
                                Para eliminar <strong className="text-red-600">{selectedIds.size}</strong> listing{selectedIds.size > 1 ? "s" : ""}, escribe <strong className="text-red-600 font-mono">DELETE</strong>:
                            </p>
                            <input
                                type="text"
                                value={bulkDeleteText}
                                onChange={(e) => setBulkDeleteText(e.target.value)}
                                placeholder="Escribe DELETE aquí..."
                                className="w-full mt-4 rounded-xl border-2 border-red-200 bg-red-50/50 px-4 py-3 text-center text-sm font-mono font-bold text-gray-800 placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
                                autoFocus
                            />
                            <div className="flex gap-3 mt-5">
                                <button onClick={() => { setBulkDeleteStep(0); setBulkDeleteText(""); }}
                                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={bulkDeleteText !== "DELETE" || bulkDeleting}
                                    className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2">
                                    {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    {bulkDeleting ? "Eliminando..." : `Eliminar ${selectedIds.size}`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Toggle With Expiry Picker ── */
function ToggleWithExpiry({
    label,
    checked,
    onToggle,
    expiresAt,
    onExpiryChange,
    colorOn,
}: {
    label: string;
    checked: boolean;
    onToggle: () => void;
    expiresAt: string | null;
    onExpiryChange: (val: string | null) => void;
    colorOn: "emerald" | "blue" | "amber";
}) {
    const [showPicker, setShowPicker] = useState(false);

    const colorMap = {
        emerald: {
            bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700",
            checkBorder: "border-emerald-500", checkBg: "bg-emerald-500",
        },
        blue: {
            bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700",
            checkBorder: "border-blue-500", checkBg: "bg-blue-500",
        },
        amber: {
            bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700",
            checkBorder: "border-amber-500", checkBg: "bg-amber-500",
        },
    };
    const c = colorMap[colorOn];

    // Calculate countdown
    let expiryLabel = "\u221E Sin expiración";
    let isExpired = false;
    if (expiresAt) {
        const exp = new Date(expiresAt);
        const now = new Date();
        const diffMs = exp.getTime() - now.getTime();
        if (diffMs <= 0) {
            expiryLabel = "\u26A0 Expirado";
            isExpired = true;
        } else {
            const days = Math.floor(diffMs / 86400000);
            const hrs = Math.floor((diffMs % 86400000) / 3600000);
            if (days > 0) {
                expiryLabel = `Expira en ${days}d ${hrs}h`;
            } else {
                expiryLabel = `Expira en ${hrs}h`;
            }
        }
    }

    // Convert ISO to datetime-local input value (America/Mexico_City)
    const toLocalInput = (iso: string | null): string => {
        if (!iso) return "";
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, "0");
        const madrid = new Date(d.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
        return `${madrid.getFullYear()}-${pad(madrid.getMonth() + 1)}-${pad(madrid.getDate())}T${pad(madrid.getHours())}:${pad(madrid.getMinutes())}`;
    };

    const fromLocalInput = (val: string): string | null => {
        if (!val) return null;
        const d = new Date(val);
        return d.toISOString();
    };

    return (
        <div className={`rounded-xl border p-4 transition-all ${checked ? `${c.border} ${c.bg}` : "border-gray-200 bg-gray-50"
            }`}>
            <div className="flex items-center justify-between">
                <button type="button" onClick={onToggle} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? `${c.checkBorder} ${c.checkBg}` : "border-gray-300"
                        }`}>
                        {checked && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`text-sm font-bold ${checked ? c.text : "text-gray-400"}`}>{label}</span>
                </button>

                <div className="flex items-center gap-2">
                    {checked && (
                        <span className={`text-xs font-medium ${isExpired ? "text-red-500" : expiresAt ? "text-gray-500" : "text-gray-400"}`}>
                            {expiryLabel}
                        </span>
                    )}
                    {checked && (
                        <button type="button" onClick={() => setShowPicker(!showPicker)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${showPicker ? `${c.checkBg} text-white` : "bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300"
                                }`}>
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Date picker */}
            {checked && showPicker && (
                <div className="mt-3 pt-3 flex items-center gap-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                        type="datetime-local"
                        value={toLocalInput(expiresAt)}
                        onChange={(e) => onExpiryChange(fromLocalInput(e.target.value))}
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                    {expiresAt && (
                        <button type="button" onClick={() => onExpiryChange(null)}
                            className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors whitespace-nowrap">
                            Quitar fecha
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
