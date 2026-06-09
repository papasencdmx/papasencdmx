"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Loader2,
    Mail,
    Phone,
    ExternalLink,
    Check,
    X as XIcon,
    Inbox,
} from "lucide-react";

interface Submission {
    id: string;
    name: string;
    slug: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    short_description: string | null;
    recommendation_reason: string | null;
    cover_image_url: string | null;
    booking_url: string | null;
    age_min: number | null;
    age_max: number | null;
    price_min: number | null;
    price_max: number | null;
    discount_percent: number | null;
    street_address: string | null;
    category_id: string | null;
    zone_id: string | null;
    submission_status: string;
    submitted_at: string | null;
    approved_at: string | null;
    approved_by: string | null;
    created_at: string;
}

interface CategoryOption {
    id: string;
    name: string;
    slug: string;
}
interface ZoneOption {
    id: string;
    name: string;
    slug: string;
}

const PAGE_CATEGORIES = [
    "campamento",
    "campamento-urbano",
    "campamento-verano",
    "extraescolar",
    "evento",
    "oferta",
    "plan-familiar",
];

const STATUS_TABS = [
    { value: "pending", label: "Pendientes" },
    { value: "approved", label: "Aprobadas" },
    { value: "rejected", label: "Rechazadas" },
];

function formatDateTime(s?: string | null): string {
    if (!s) return "—";
    return new Date(s).toLocaleString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function PropuestasPage() {
    const [token, setToken] = useState<string | null>(null);
    const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
    const [items, setItems] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Submission | null>(null);

    useEffect(() => {
        const t = localStorage.getItem("admin_token");
        if (!t) {
            window.location.href = "/admin/login";
            return;
        }
        setToken(t);
    }, []);

    const fetchItems = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/submissions?status=${tab}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setItems(data.submissions || []);
        } finally {
            setLoading(false);
        }
    }, [token, tab]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    if (!token) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                <div>
                    <h1 className="text-[22px] font-bold text-gray-900">Propuestas de partners</h1>
                    <p className="text-[13px] mt-1 text-gray-500">
                        Listings enviados por colaboradores vía /colaborar.
                    </p>
                </div>
            </div>

            {/* Status tabs */}
            <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 p-1 mb-6">
                {STATUS_TABS.map((t) => (
                    <button
                        key={t.value}
                        type="button"
                        onClick={() => setTab(t.value as "pending" | "approved" | "rejected")}
                        className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition ${
                            tab === t.value
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            )}

            {!loading && items.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                        <Inbox className="w-6 h-6" />
                    </div>
                    <p className="text-[15px] font-semibold text-gray-800">
                        No hay propuestas {tab === "pending" ? "pendientes" : tab === "approved" ? "aprobadas" : "rechazadas"}
                    </p>
                </div>
            )}

            {!loading && items.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-[13px]">
                        <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Negocio</th>
                                <th className="px-4 py-3 font-semibold">Contacto</th>
                                <th className="px-4 py-3 font-semibold">Edad / Precio</th>
                                <th className="px-4 py-3 font-semibold">Recibida</th>
                                <th className="px-4 py-3 font-semibold text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-900">{s.name}</div>
                                        {s.short_description && (
                                            <div className="text-[11.5px] text-gray-500 max-w-sm truncate">
                                                {s.short_description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        <div>{s.contact_name || "—"}</div>
                                        <div className="text-[11.5px] text-gray-500">{s.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 text-[12px]">
                                        {s.age_min != null && s.age_max != null
                                            ? `${s.age_min}–${s.age_max} años`
                                            : "—"}
                                        <br />
                                        {s.price_min != null ? `$$ {s.price_min}` : "Consultar"}
                                    </td>
                                    <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                                        {formatDateTime(s.submitted_at || s.created_at)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => setSelected(s)}
                                            className="inline-flex items-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 text-[12px] font-semibold"
                                        >
                                            Revisar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selected && (
                <ReviewDrawer
                    submission={selected}
                    token={token}
                    onClose={() => setSelected(null)}
                    onChanged={() => {
                        setSelected(null);
                        fetchItems();
                    }}
                />
            )}
        </div>
    );
}

function ReviewDrawer({
    submission,
    token,
    onClose,
    onChanged,
}: {
    submission: Submission;
    token: string;
    onClose: () => void;
    onChanged: () => void;
}) {
    const [name, setName] = useState(submission.name);
    const [contactName, setContactName] = useState(submission.contact_name || "");
    const [shortDescription, setShortDescription] = useState(
        submission.short_description || ""
    );
    const [phone, setPhone] = useState(submission.phone || "");
    const [email, setEmail] = useState(submission.email || "");
    const [website, setWebsite] = useState(submission.website || "");
    const [bookingUrl, setBookingUrl] = useState(submission.booking_url || "");
    const [coverImage, setCoverImage] = useState(submission.cover_image_url || "");
    const [streetAddress, setStreetAddress] = useState(submission.street_address || "");
    const [ageMin, setAgeMin] = useState(submission.age_min?.toString() || "");
    const [ageMax, setAgeMax] = useState(submission.age_max?.toString() || "");
    const [priceMin, setPriceMin] = useState(submission.price_min?.toString() || "");
    const [priceMax, setPriceMax] = useState(submission.price_max?.toString() || "");
    const [discountPercent, setDiscountPercent] = useState(
        submission.discount_percent?.toString() || ""
    );
    const [categoryId, setCategoryId] = useState(submission.category_id || "");
    const [zoneId, setZoneId] = useState(submission.zone_id || "");
    const [tags, setTags] = useState<string[]>([]);
    const [working, setWorking] = useState(false);
    const [confirmReject, setConfirmReject] = useState(false);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [zones, setZones] = useState<ZoneOption[]>([]);

    // Fetch category + zone options (from existing admin listings endpoint)
    useEffect(() => {
        if (!token) return;
        fetch("/api/admin/listings?limit=1", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => {
                setCategories(d.categories || []);
                setZones(d.zones || []);
            })
            .catch(() => {});
    }, [token]);

    const submit = async (action: "approve" | "reject") => {
        setWorking(true);
        try {
            const body: Record<string, unknown> = {
                name,
                contact_name: contactName || null,
                short_description: shortDescription,
                phone,
                email,
                website: website || null,
                booking_url: bookingUrl,
                cover_image_url: coverImage,
                street_address: streetAddress || null,
                age_min: ageMin === "" ? null : Number(ageMin),
                age_max: ageMax === "" ? null : Number(ageMax),
                price_min: priceMin === "" ? null : Number(priceMin),
                price_max: priceMax === "" ? null : Number(priceMax),
                discount_percent: discountPercent === "" ? null : Number(discountPercent),
                category_id: categoryId || null,
                zone_id: zoneId || null,
                action,
            };
            if (action === "approve") body.page_category_tags = tags;
            const res = await fetch(`/api/admin/submissions/${submission.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            if (res.ok) onChanged();
        } finally {
            setWorking(false);
        }
    };

    const toggleTag = (t: string) =>
        setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

    const isPending = submission.submission_status === "pending";

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <button
                aria-label="Cerrar"
                onClick={onClose}
                className="absolute inset-0 bg-warm-900/40 backdrop-blur-[2px]"
            />
            <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="font-display font-bold text-gray-900 text-lg">Revisar propuesta</h2>
                        <p className="text-[12px] text-gray-500">
                            Recibida: {formatDateTime(submission.submitted_at || submission.created_at)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                        aria-label="Cerrar"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                    {coverImage && (
                        <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-warm-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={coverImage} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <Field label="Nombre del negocio">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Persona de contacto">
                        <input
                            type="text"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Descripción corta">
                        <textarea
                            value={shortDescription}
                            onChange={(e) => setShortDescription(e.target.value)}
                            rows={3}
                            className={inputCls + " resize-y"}
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Email">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Teléfono">
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={inputCls}
                            />
                        </Field>
                    </div>
                    <Field label="Sitio web">
                        <input
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className={inputCls}
                            placeholder="https://"
                        />
                    </Field>

                    {/* Category + zone */}
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Categoría">
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className={inputCls}
                            >
                                <option value="">— Sin categoría —</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Zona">
                            <select
                                value={zoneId}
                                onChange={(e) => setZoneId(e.target.value)}
                                className={inputCls}
                            >
                                <option value="">— Sin zona —</option>
                                {zones.map((z) => (
                                    <option key={z.id} value={z.id}>
                                        {z.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                    <Field label="Dirección">
                        <input
                            type="text"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            className={inputCls}
                            placeholder="Calle, número, código postal"
                        />
                    </Field>

                    {/* Age + price */}
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Edad mín">
                            <input
                                type="number"
                                min={0}
                                max={18}
                                value={ageMin}
                                onChange={(e) => setAgeMin(e.target.value)}
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Edad máx">
                            <input
                                type="number"
                                min={0}
                                max={18}
                                value={ageMax}
                                onChange={(e) => setAgeMax(e.target.value)}
                                className={inputCls}
                            />
                        </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <Field label="Precio visible ($)">
                            <input
                                type="number"
                                step="0.01"
                                value={priceMin}
                                onChange={(e) => setPriceMin(e.target.value)}
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Precio original ($)">
                            <input
                                type="number"
                                step="0.01"
                                value={priceMax}
                                onChange={(e) => setPriceMax(e.target.value)}
                                className={inputCls}
                            />
                        </Field>
                        <Field label="% Descuento">
                            <input
                                type="number"
                                min={0}
                                max={80}
                                value={discountPercent}
                                onChange={(e) => setDiscountPercent(e.target.value)}
                                className={inputCls}
                            />
                        </Field>
                    </div>

                    <Field label="URL de reserva">
                        <input
                            type="url"
                            value={bookingUrl}
                            onChange={(e) => setBookingUrl(e.target.value)}
                            className={inputCls}
                        />
                    </Field>
                    <Field label="URL de imagen">
                        <input
                            type="url"
                            value={coverImage}
                            onChange={(e) => setCoverImage(e.target.value)}
                            className={inputCls}
                        />
                    </Field>

                    {submission.recommendation_reason && (
                        <div className="rounded-xl bg-warm-50 border border-warm-100 px-3.5 py-3 text-[12px] text-warm-700 whitespace-pre-line leading-relaxed">
                            <span className="block font-bold uppercase tracking-wider text-warm-500 text-[10px] mb-1">
                                Datos del partner
                            </span>
                            {submission.recommendation_reason}
                        </div>
                    )}

                    {isPending && (
                        <div>
                            <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-700 mb-2">
                                Asignar tags de página
                            </label>
                            <p className="text-[11.5px] text-gray-500 mb-2">
                                Determina en qué páginas filtradas aparecerá esta listing.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {PAGE_CATEGORIES.map((c) => {
                                    const active = tags.includes(c);
                                    return (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => toggleTag(c)}
                                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold border transition ${
                                                active
                                                    ? "bg-copper-600 border-copper-600 text-white"
                                                    : "bg-white border-warm-200 text-warm-700 hover:border-warm-300"
                                            }`}
                                        >
                                            {active && <Check className="w-3 h-3" />}
                                            {c}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        {submission.email && (
                            <a
                                href={`mailto:${submission.email}`}
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-warm-100 hover:bg-warm-200 text-warm-700 px-3 py-2 text-[12px] font-semibold"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                Contactar email
                            </a>
                        )}
                        {submission.booking_url && (
                            <a
                                href={submission.booking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-warm-100 hover:bg-warm-200 text-warm-700 px-3 py-2 text-[12px] font-semibold"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Ver enlace partner
                            </a>
                        )}
                    </div>
                </div>

                {/* Footer actions */}
                {isPending && (
                    <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-end gap-2">
                        {!confirmReject ? (
                            <button
                                onClick={() => setConfirmReject(true)}
                                disabled={working}
                                className="rounded-xl border border-red-200 text-red-600 px-4 py-2 text-[13px] font-semibold hover:bg-red-50 transition disabled:opacity-50"
                            >
                                Rechazar
                            </button>
                        ) : (
                            <>
                                <span className="text-[12px] text-red-600 font-semibold mr-1">¿Confirmar?</span>
                                <button
                                    onClick={() => setConfirmReject(false)}
                                    className="text-[12px] text-gray-500 underline-offset-2 hover:underline"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => submit("reject")}
                                    disabled={working}
                                    className="rounded-xl bg-red-600 text-white px-4 py-2 text-[13px] font-bold hover:bg-red-700 disabled:opacity-50"
                                >
                                    {working ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, rechazar"}
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => submit("approve")}
                            disabled={working || tags.length === 0}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-[13px] font-bold disabled:opacity-50"
                            title={tags.length === 0 ? "Selecciona al menos un tag de página" : ""}
                        >
                            {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Aprobar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const inputCls =
    "w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-copper-200 focus:border-copper-400 transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="block text-[12px] font-semibold text-gray-700 mb-1">{label}</span>
            {children}
        </label>
    );
}
