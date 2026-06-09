"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Activity,
    LogIn,
    Pencil,
    Trash2,
    FileUp,
    Lock,
    List,
    Clock,
    ChevronLeft,
    ChevronRight,
    Filter,
    Loader2,
} from "lucide-react";

interface ChangeEntry {
    field: string;
    label: string;
    from: string;
    to: string;
}

interface ActivityLog {
    id: string;
    admin_username: string;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    entity_name: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
}

const ACTION_CONFIG: Record<string, { label: string; icon: typeof LogIn; color: string; bg: string }> = {
    login: { label: "Inicio de sesion", icon: LogIn, color: "text-emerald-700", bg: "bg-emerald-50" },
    listing_update: { label: "Edito listing", icon: Pencil, color: "text-blue-700", bg: "bg-blue-50" },
    listing_delete: { label: "Elimino listing", icon: Trash2, color: "text-red-700", bg: "bg-red-50" },
    listing_create: { label: "Creo listing", icon: List, color: "text-violet-700", bg: "bg-violet-50" },
    import_csv: { label: "Importo CSV", icon: FileUp, color: "text-amber-700", bg: "bg-amber-50" },
    password_change: { label: "Cambio contraseña", icon: Lock, color: "text-gray-700", bg: "bg-gray-100" },
};

const ACTION_OPTIONS = [
    { value: "", label: "Todas las acciones" },
    { value: "login", label: "Inicio de sesion" },
    { value: "listing_update", label: "Editar listing" },
    { value: "listing_delete", label: "Eliminar listing" },
    { value: "import_csv", label: "Importar CSV" },
    { value: "password_change", label: "Cambiar contraseña" },
];

const USER_OPTIONS = [
    { value: "", label: "Todos los usuarios" },
    { value: "Sido", label: "Sido" },
    { value: "Hassan", label: "Hassan" },
];

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);

    if (mins < 1) return "ahora mismo";
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "ayer";
    if (days < 7) return `hace ${days} dias`;

    return d.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AdminActivityPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filterUser, setFilterUser] = useState("");
    const [filterAction, setFilterAction] = useState("");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem("admin_token");
        if (!token) return;

        const params = new URLSearchParams({
            page: page.toString(),
            limit: "15",
        });
        if (filterUser) params.set("user", filterUser);
        if (filterAction) params.set("action", filterAction);

        try {
            const res = await fetch(`/api/admin/activity?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setLogs(data.logs || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
        } catch {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [page, filterUser, filterAction]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [filterUser, filterAction]);

    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Registro de Actividad</h1>
                        <p className="text-sm text-gray-400">
                            {total} {total === 1 ? "registro" : "registros"} en los ultimos 30 dias
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-5 flex flex-wrap items-center gap-3" style={{ border: "1px solid #EAECF0" }}>
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                    {USER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                    {ACTION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                {(filterUser || filterAction) && (
                    <button
                        onClick={() => { setFilterUser(""); setFilterAction(""); }}
                        className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Log List */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: "1px solid #EAECF0" }}>
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-16">
                        <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-400">No hay registros de actividad</p>
                        <p className="text-xs text-gray-300 mt-1">La actividad aparecera aqui cuando los admins usen el panel</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {logs.map((log) => {
                            const config = ACTION_CONFIG[log.action] || { label: log.action, icon: Clock, color: "text-gray-600", bg: "bg-gray-50" };
                            const LogIcon = config.icon;
                            return (
                                <div key={log.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                                        <LogIcon className={`w-5 h-5 ${config.color}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-gray-800">
                                            <span className="font-bold">{log.admin_username}</span>
                                            {" "}
                                            <span className="text-gray-500">{config.label}</span>
                                            {log.entity_name && (
                                                <>
                                                    {" "}
                                                    <span className="font-semibold text-gray-700">{log.entity_name}</span>
                                                </>
                                            )}
                                        </p>
                                        {log.action === "import_csv" && log.details && (
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {(log.details as Record<string, number>).total} listings procesados:
                                                {" "}{(log.details as Record<string, number>).created} nuevos,
                                                {" "}{(log.details as Record<string, number>).updated} actualizados
                                                {(log.details as Record<string, number>).errors > 0 && (
                                                    <span className="text-red-400">, {(log.details as Record<string, number>).errors} errores</span>
                                                )}
                                            </p>
                                        )}
                                        {log.action === "listing_update" && log.details && (log.details as { changes?: ChangeEntry[] }).changes && (
                                            <div className="mt-1.5 space-y-1">
                                                {((log.details as { changes: ChangeEntry[] }).changes).map((c, idx) => (
                                                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                                                        <span className="font-semibold text-gray-500">{c.label}:</span>
                                                        <span className="text-red-400 line-through">{c.from}</span>
                                                        <span className="text-gray-300">&rarr;</span>
                                                        <span className="text-emerald-600 font-medium">{c.to}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* User badge */}
                                    <div className="shrink-0 hidden sm:block">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                            log.admin_username === "Sido"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-blue-50 text-blue-700"
                                        }`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                            {log.admin_username}
                                        </span>
                                    </div>

                                    {/* Time */}
                                    <span className="text-[11px] font-medium text-gray-400 shrink-0 whitespace-nowrap">
                                        {formatDate(log.created_at)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: "1px solid #EAECF0" }}>
                        <p className="text-xs text-gray-400">
                            Pagina {page} de {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
