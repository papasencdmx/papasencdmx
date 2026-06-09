"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Loader2,
    Mail,
    Phone,
    Copy,
    Check,
    Trash2,
    ExternalLink,
    MessageCircle,
    Users,
} from "lucide-react";

interface AbandonedRow {
    id: string;
    event_id: string;
    occurrence_id: string | null;
    buyer_name: string | null;
    buyer_email: string;
    buyer_phone: string | null;
    attendee_names: string[] | null;
    quantity: number | null;
    notes: string | null;
    pack_name: string | null;
    stage: string;
    created_at: string;
    updated_at: string;
    event?: { title: string; slug: string; section?: string };
}

const STAGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    form_fill: { bg: "bg-blue-50", text: "text-blue-700", label: "Rellenó formulario" },
    pay_click: { bg: "bg-amber-50", text: "text-amber-700", label: "Clic en pagar" },
    pay_failed: { bg: "bg-red-50", text: "text-red-700", label: "Pago falló" },
};

function formatDateTime(s: string): string {
    return new Date(s).toLocaleString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AbandonedPage() {
    const [token, setToken] = useState<string | null>(null);
    const [rows, setRows] = useState<AbandonedRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [stageFilter, setStageFilter] = useState<string>("");
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        const t = localStorage.getItem("admin_token");
        if (!t) {
            window.location.href = "/admin/login";
            return;
        }
        setToken(t);
    }, []);

    const fetchRows = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const url = stageFilter
                ? `/api/admin/abandoned?stage=${stageFilter}`
                : "/api/admin/abandoned";
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setRows(data.rows || []);
        } catch {
            console.error("Failed to fetch abandoned checkouts");
        } finally {
            setLoading(false);
        }
    }, [token, stageFilter]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const deleteRow = async (id: string) => {
        if (!token) return;
        if (!confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;
        const res = await fetch(`/api/admin/abandoned/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setRows((prev) => prev.filter((r) => r.id !== id));
    };

    const copyField = (value: string, key: string) => {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(key);
            setTimeout(() => setCopied(null), 1500);
        });
    };

    const exportCsv = () => {
        const header = [
            "fecha",
            "etapa",
            "evento",
            "pack",
            "nombre",
            "email",
            "telefono",
            "plazas",
            "asistentes",
            "notas",
        ];
        const lines = [header.join(",")];
        for (const r of rows) {
            const cells = [
                r.updated_at,
                STAGE_STYLES[r.stage]?.label || r.stage,
                r.event?.title || "",
                r.pack_name || "",
                r.buyer_name || "",
                r.buyer_email,
                r.buyer_phone || "",
                r.quantity || "",
                (r.attendee_names || []).join(" | "),
                (r.notes || "").replace(/\n/g, " "),
            ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
            lines.push(cells.join(","));
        }
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reservas-incompletas-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    if (!token) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                <div>
                    <h1 className="text-[22px] font-bold" style={{ color: "#272E2F" }}>
                        Recuperar reservas
                    </h1>
                    <p className="text-[13px] mt-1" style={{ color: "#777777" }}>
                        Familias que empezaron la reserva pero no completaron el pago. {rows.length} en total.
                    </p>
                </div>
                <button
                    onClick={exportCsv}
                    disabled={rows.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-40"
                >
                    Exportar CSV
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
                <button
                    onClick={() => setStageFilter("")}
                    className={`rounded-full px-4 py-1.5 text-[12px] font-semibold border transition ${
                        stageFilter === ""
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                >
                    Todas
                </button>
                {Object.entries(STAGE_STYLES).map(([key, s]) => (
                    <button
                        key={key}
                        onClick={() => setStageFilter(key)}
                        className={`rounded-full px-4 py-1.5 text-[12px] font-semibold border transition ${
                            stageFilter === key
                                ? "bg-gray-900 text-white border-gray-900"
                                : `${s.bg} ${s.text} border-transparent hover:brightness-95`
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            )}

            {!loading && rows.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <p className="text-[15px] font-semibold text-gray-800">No hay reservas incompletas</p>
                    <p className="text-[13px] text-gray-500 mt-1">
                        Aparecerán aquí cuando alguien empiece a rellenar el formulario pero no termine de pagar.
                    </p>
                </div>
            )}

            {!loading && rows.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Contacto</th>
                                    <th className="px-4 py-3 font-semibold">Evento</th>
                                    <th className="px-4 py-3 font-semibold">Asistentes</th>
                                    <th className="px-4 py-3 font-semibold">Etapa</th>
                                    <th className="px-4 py-3 font-semibold">Actualizado</th>
                                    <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((r) => {
                                    const stage = STAGE_STYLES[r.stage] || STAGE_STYLES.form_fill;
                                    const whatsApp = r.buyer_phone
                                        ? `https://wa.me/${r.buyer_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                              `Hola ${r.buyer_name || ""}, vimos que estabas reservando ${r.event?.title || "un plan"} — ¿te podemos ayudar a completar la reserva?`
                                          )}`
                                        : null;
                                    const mailto = `mailto:${r.buyer_email}?subject=${encodeURIComponent(
                                        `Tu reserva en ${r.event?.title || "Papás en CDMX"}`
                                    )}&body=${encodeURIComponent(
                                        `Hola ${r.buyer_name || ""},\n\nVimos que empezaste a reservar ${r.event?.title || ""}${r.pack_name ? ` (${r.pack_name})` : ""} pero no completaste el pago. ¿Podemos ayudarte?\n\nUn saludo,\nPapás en CDMX`
                                    )}`;

                                    return (
                                        <tr key={r.id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900">
                                                    {r.buyer_name || <span className="text-gray-400">—</span>}
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-600 mt-0.5">
                                                    <span className="truncate max-w-[200px]">{r.buyer_email}</span>
                                                    <button
                                                        onClick={() => copyField(r.buyer_email, `email-${r.id}`)}
                                                        className="text-gray-400 hover:text-gray-700"
                                                        title="Copiar email"
                                                    >
                                                        {copied === `email-${r.id}` ? (
                                                            <Check className="w-3 h-3 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                </div>
                                                {r.buyer_phone && (
                                                    <div className="flex items-center gap-1 text-gray-500 text-[12px] mt-0.5">
                                                        <Phone className="w-3 h-3" />
                                                        {r.buyer_phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900">
                                                    {r.event?.title || <span className="text-gray-400">—</span>}
                                                </div>
                                                {r.pack_name && (
                                                    <div className="text-[12px] text-gray-500 mt-0.5">{r.pack_name}</div>
                                                )}
                                                {r.event?.slug && (
                                                    <a
                                                        href={`/ofertas/${r.event.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-0.5"
                                                    >
                                                        Ver página <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1 text-gray-700">
                                                    <Users className="w-3.5 h-3.5 text-gray-400" />
                                                    {r.quantity || 1}
                                                </div>
                                                {r.attendee_names && r.attendee_names.length > 0 && (
                                                    <div className="text-[11px] text-gray-500 mt-0.5 max-w-[180px] truncate">
                                                        {r.attendee_names.filter(Boolean).join(", ")}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${stage.bg} ${stage.text}`}>
                                                    {stage.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-[12px]">
                                                {formatDateTime(r.updated_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <a
                                                        href={mailto}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 text-[11px] font-semibold"
                                                        title="Enviar email"
                                                    >
                                                        <Mail className="w-3 h-3" />
                                                        Email
                                                    </a>
                                                    {whatsApp && (
                                                        <a
                                                            href={whatsApp}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 text-[11px] font-semibold"
                                                            title="Enviar WhatsApp"
                                                        >
                                                            <MessageCircle className="w-3 h-3" />
                                                            WhatsApp
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => deleteRow(r.id)}
                                                        className="inline-flex items-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
