"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Upload,
    List,
    ArrowRight,
    Mail,
    Star,
    CalendarDays,
    MapPin,
    Megaphone,
    Settings,
    TrendingUp,
    Users,
    Loader2,
    BarChart3,
    ArrowUpRight,
    ExternalLink,
    AlertTriangle,
    Clock,
    LogIn,
    Pencil,
    Trash2,
    FileUp,
    Lock,
    Activity,
    StickyNote,
    CheckSquare,
    Plus,
    X,
    Check,
    Square,
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
    entity_name: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
}

interface Stats {
    listings: number;
    leads: number;
    reviews: number;
    clicks: number;
    recentLeads: number;
    recentClicks: number;
    listingsByCategory: Array<{ category: string; count: number }>;
    recentActivity: Array<{ name: string; slug: string; category: string; createdAt: string }>;
    activityLogs: ActivityLog[];
    incomplete: number;
}

const ACTION_CONFIG: Record<string, { label: string; icon: typeof LogIn; color: string; bg: string }> = {
    login: { label: "Inicio de sesion", icon: LogIn, color: "text-emerald-700", bg: "bg-emerald-50" },
    listing_update: { label: "Edito listing", icon: Pencil, color: "text-blue-700", bg: "bg-blue-50" },
    listing_delete: { label: "Elimino listing", icon: Trash2, color: "text-red-700", bg: "bg-red-50" },
    listing_create: { label: "Creo listing", icon: List, color: "text-violet-700", bg: "bg-violet-50" },
    import_csv: { label: "Importo CSV", icon: FileUp, color: "text-amber-700", bg: "bg-amber-50" },
    password_change: { label: "Cambio contraseña", icon: Lock, color: "text-gray-700", bg: "bg-gray-100" },
};

const QUICK_ACTIONS = [
    { title: "Importar CSV", description: "Subir listings desde archivo CSV", href: "/admin/import", icon: Upload, color: "bg-emerald-100 text-emerald-700" },
    { title: "Listings", description: "Gestionar listings del directorio", href: "/admin/listings", icon: List, color: "bg-blue-100 text-blue-700" },
    { title: "Leads", description: "Solicitudes de familias", href: "#", icon: Mail, color: "bg-amber-100 text-amber-700", disabled: true },
    { title: "Reseñas", description: "Moderar opiniones de padres", href: "#", icon: Star, color: "bg-orange-100 text-orange-600", disabled: true },
    { title: "Eventos", description: "Calendario de actividades", href: "/admin/events", icon: CalendarDays, color: "bg-purple-100 text-purple-700" },
    { title: "Zonas", description: "Categorías y barrios", href: "#", icon: MapPin, color: "bg-cyan-100 text-cyan-700", disabled: true },
    { title: "Anunciantes", description: "Gestión de partnerships", href: "#", icon: Megaphone, color: "bg-rose-100 text-rose-600", disabled: true },
    { title: "Analytics", description: "Métricas de rendimiento", href: "/admin/analytics", icon: BarChart3, color: "bg-indigo-100 text-indigo-700" },
    { title: "Configuración", description: "Ajustes del sitio", href: "/admin/settings", icon: Settings, color: "bg-gray-200 text-gray-600" },
];

interface AdminNote {
    id: string;
    text: string;
    createdAt: string;
}

interface AdminTask {
    id: string;
    text: string;
    done: boolean;
    createdAt: string;
}

function getStorageKey(prefix: string) {
    const name = typeof window !== "undefined" ? localStorage.getItem("admin_display_name") || "default" : "default";
    return `admin_${prefix}_${name}`;
}

function timeAgo(dateStr: string) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "ayer";
    return `hace ${days} días`;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [displayName, setDisplayName] = useState("");

    // Notes & Tasks state
    const [notes, setNotes] = useState<AdminNote[]>([]);
    const [tasks, setTasks] = useState<AdminTask[]>([]);
    const [newNote, setNewNote] = useState("");
    const [newTask, setNewTask] = useState("");
    const [activeTab, setActiveTab] = useState<"notes" | "tasks">("tasks");

    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        if (!token) return;

        // Get display name
        const storedName = localStorage.getItem("admin_display_name");
        if (storedName) setDisplayName(storedName);

        fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((data) => { setStats(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    // Load notes & tasks from localStorage
    useEffect(() => {
        try {
            const savedNotes = localStorage.getItem(getStorageKey("notes"));
            const savedTasks = localStorage.getItem(getStorageKey("tasks"));
            if (savedNotes) setNotes(JSON.parse(savedNotes));
            if (savedTasks) setTasks(JSON.parse(savedTasks));
        } catch { /* ignore */ }
    }, []);

    const saveNotes = (updated: AdminNote[]) => { setNotes(updated); localStorage.setItem(getStorageKey("notes"), JSON.stringify(updated)); };
    const saveTasks = (updated: AdminTask[]) => { setTasks(updated); localStorage.setItem(getStorageKey("tasks"), JSON.stringify(updated)); };

    const addNote = () => {
        if (!newNote.trim()) return;
        saveNotes([{ id: Date.now().toString(), text: newNote.trim(), createdAt: new Date().toISOString() }, ...notes]);
        setNewNote("");
    };
    const deleteNote = (id: string) => saveNotes(notes.filter((n) => n.id !== id));

    const addTask = () => {
        if (!newTask.trim()) return;
        saveTasks([...tasks, { id: Date.now().toString(), text: newTask.trim(), done: false, createdAt: new Date().toISOString() }]);
        setNewTask("");
    };
    const toggleTask = (id: string) => saveTasks(tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t));
    const deleteTask = (id: string) => saveTasks(tasks.filter((t) => t.id !== id));

    const statCards = [
        { label: "Listings", value: stats?.listings, icon: List, iconBg: "bg-gray-100", iconColor: "text-gray-700", sub: "activos", trend: null as number | null },
        { label: "Leads", value: stats?.leads, icon: Users, iconBg: "bg-gray-100", iconColor: "text-gray-700", sub: "total", trend: stats?.recentLeads || null },
        { label: "Reseñas", value: stats?.reviews, icon: Star, iconBg: "bg-gray-100", iconColor: "text-gray-700", sub: "publicadas", trend: null as number | null },
        { label: "Clicks", value: stats?.clicks, icon: TrendingUp, iconBg: "bg-gray-100", iconColor: "text-gray-700", sub: "total", trend: stats?.recentClicks || null },
    ];

    return (
        <div className="max-w-7xl">
            {/* ── Welcome Row ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[22px] font-bold" style={{ color: "#272E2F" }}>Bienvenido al panel{displayName ? ` ${displayName}` : ""}</h1>
                    <p className="text-[13px] mt-1" style={{ color: "#777777" }}>Gestiona el directorio de Papás en CDMX desde aquí.</p>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="/"
                        target="_blank"
                        className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#F0F0F0]"
                        style={{ borderColor: "#E0E0E0", color: "#454545" }}
                    >
                        <ExternalLink className="w-4 h-4" /> Ver Sitio
                    </a>
                    <Link
                        href="/admin/import"
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-gray-800"
                    >
                        <Upload className="w-4 h-4" /> Importar CSV
                    </Link>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid gap-5 grid-cols-2 lg:grid-cols-4 mb-8">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-2xl p-6 transition-all"
                        style={{ border: "1px solid #E0E0E0" }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[13px] font-medium" style={{ color: "#777777" }}>{stat.label}</p>
                            <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                                <stat.icon className={`w-[18px] h-[18px] ${stat.iconColor}`} strokeWidth={2.2} />
                            </div>
                        </div>
                        {loading ? (
                            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                        ) : (
                            <p className="text-[32px] font-bold leading-none" style={{ color: "#272E2F" }}>
                                {stat.value !== undefined ? stat.value.toLocaleString("es-MX") : "0"}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                            {!loading && stat.trend !== null && stat.trend > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-2 py-0.5">
                                    <ArrowUpRight className="w-3 h-3" />+{stat.trend}
                                </span>
                            )}
                            <span className="text-[12px] font-medium" style={{ color: "#999999" }}>{!loading && stat.trend && stat.trend > 0 ? "esta semana" : stat.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Activity + Alerts Row ── */}
            <div className="grid gap-5 lg:grid-cols-5 mb-8">
                {/* Admin Activity Log */}
                <div className="lg:col-span-3 bg-white rounded-2xl p-6" style={{ border: "1px solid #E0E0E0" }}>
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Activity className="w-4 h-4" style={{ color: "#454545" }} />
                            </div>
                            <h3 className="text-[16px] font-bold" style={{ color: "#272E2F" }}>Registro de Actividad</h3>
                        </div>
                        <Link
                            href="/admin/activity"
                            className="text-[12px] font-semibold" style={{ color: "#777777" }}
                        >
                            Ver todo
                        </Link>
                    </div>
                    {loading ? (
                        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                    ) : stats?.activityLogs && stats.activityLogs.length > 0 ? (
                        <div className="space-y-3">
                            {stats.activityLogs.slice(0, 6).map((log) => {
                                const config = ACTION_CONFIG[log.action] || { label: log.action, icon: Clock, color: "text-gray-600", bg: "bg-gray-50" };
                                const LogIcon = config.icon;
                                return (
                                    <div key={log.id} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid #EAEAEA" }}>
                                        <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                                            <LogIcon className={`w-4 h-4 ${config.color}`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px]" style={{ color: "#454545" }}>
                                                <span className="font-bold" style={{ color: "#272E2F" }}>{log.admin_username}</span>
                                                {" "}
                                                <span style={{ color: "#777777" }}>{config.label}</span>
                                                {log.entity_name && (
                                                    <span className="font-semibold" style={{ color: "#272E2F" }}> {log.entity_name}</span>
                                                )}
                                                {log.action === "import_csv" && log.details && (
                                                    <span className="text-[11px] ml-1" style={{ color: "#999999" }}>
                                                        ({(log.details as Record<string, number>).created} nuevos, {(log.details as Record<string, number>).updated} actualizados)
                                                    </span>
                                                )}
                                            </p>
                                            {log.action === "listing_update" && log.details && (log.details as { changes?: ChangeEntry[] }).changes && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {((log.details as { changes: ChangeEntry[] }).changes).slice(0, 3).map((c, idx) => (
                                                        <span key={idx} className="text-[11px] bg-gray-100 rounded-lg px-2 py-0.5 font-medium" style={{ color: "#454545" }}>
                                                            {c.label}
                                                        </span>
                                                    ))}
                                                    {((log.details as { changes: ChangeEntry[] }).changes).length > 3 && (
                                                        <span className="text-[11px]" style={{ color: "#999999" }}>
                                                            +{((log.details as { changes: ChangeEntry[] }).changes).length - 3} mas
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-medium rounded-lg px-2 py-0.5 shrink-0 whitespace-nowrap" style={{ color: "#999999", backgroundColor: "#F0F0F0" }}>
                                            {timeAgo(log.created_at)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Activity className="w-8 h-8 mx-auto mb-2" style={{ color: "#E0E0E0" }} />
                            <p className="text-[13px]" style={{ color: "#999999" }}>No hay actividad registrada</p>
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Incomplete alert */}
                    {!loading && stats && stats.incomplete > 0 && (
                        <div className="bg-amber-50 rounded-2xl p-5" style={{ border: "1px solid #E0E0E0" }}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold" style={{ color: "#272E2F" }}>Listings incompletos</p>
                                    <p className="text-[12px] mt-0.5" style={{ color: "#777777" }}>{stats.incomplete} sin descripción o teléfono</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes & Tasks */}
                    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E0E0E0" }}>
                        {/* Tabs */}
                        <div className="flex" style={{ borderBottom: "1px solid #EAEAEA" }}>
                            <button
                                onClick={() => setActiveTab("tasks")}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[12px] font-semibold transition-all ${activeTab === "tasks" ? "border-b-2 border-gray-900" : "hover:bg-[#F0F0F0]"}`}
                                style={{ color: activeTab === "tasks" ? "#272E2F" : "#777777" }}
                            >
                                <CheckSquare className="w-3.5 h-3.5" /> Tareas
                                {tasks.filter((t) => !t.done).length > 0 && (
                                    <span className="bg-gray-100 text-[10px] font-bold rounded-lg px-1.5 py-0.5" style={{ color: "#454545" }}>{tasks.filter((t) => !t.done).length}</span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("notes")}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[12px] font-semibold transition-all ${activeTab === "notes" ? "border-b-2 border-gray-900" : "hover:bg-[#F0F0F0]"}`}
                                style={{ color: activeTab === "notes" ? "#272E2F" : "#777777" }}
                            >
                                <StickyNote className="w-3.5 h-3.5" /> Notas
                                {notes.length > 0 && (
                                    <span className="bg-gray-100 text-[10px] font-bold rounded-lg px-1.5 py-0.5" style={{ color: "#454545" }}>{notes.length}</span>
                                )}
                            </button>
                        </div>

                        <div className="p-4">
                            {activeTab === "tasks" ? (
                                <>
                                    {/* Add task */}
                                    <form onSubmit={(e) => { e.preventDefault(); addTask(); }} className="flex gap-2 mb-3">
                                        <input
                                            value={newTask}
                                            onChange={(e) => setNewTask(e.target.value)}
                                            placeholder="Nueva tarea..."
                                            className="flex-1 text-[13px] rounded-xl border px-3 py-2 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                                            style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                        />
                                        <button type="submit" className="w-9 h-9 rounded-xl bg-[#F0F0F0] hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0" style={{ color: "#454545" }}>
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </form>
                                    {/* Task list */}
                                    <div className="space-y-1 max-h-[240px] overflow-y-auto">
                                        {tasks.filter((t) => !t.done).map((task) => (
                                            <div key={task.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[#F0F0F0] group transition-colors">
                                                <button onClick={() => toggleTask(task.id)} className="shrink-0 transition-colors" style={{ color: "#E0E0E0" }}>
                                                    <Square className="w-4 h-4" />
                                                </button>
                                                <span className="text-[13px] flex-1 min-w-0" style={{ color: "#454545" }}>{task.text}</span>
                                                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-all shrink-0 hover:text-red-400" style={{ color: "#E0E0E0" }}>
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {tasks.filter((t) => t.done).length > 0 && (
                                            <div className="pt-2 mt-2" style={{ borderTop: "1px solid #EAEAEA" }}>
                                                <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1" style={{ color: "#CCCCCC" }}>Completadas</p>
                                                {tasks.filter((t) => t.done).map((task) => (
                                                    <div key={task.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-[#F0F0F0] group transition-colors">
                                                        <button onClick={() => toggleTask(task.id)} className="text-emerald-400 shrink-0">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <span className="text-[13px] line-through flex-1 min-w-0" style={{ color: "#999999" }}>{task.text}</span>
                                                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-all shrink-0 hover:text-red-400" style={{ color: "#E0E0E0" }}>
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {tasks.length === 0 && (
                                            <p className="text-center text-[12px] py-6" style={{ color: "#CCCCCC" }}>Sin tareas pendientes</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Add note */}
                                    <form onSubmit={(e) => { e.preventDefault(); addNote(); }} className="flex gap-2 mb-3">
                                        <input
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            placeholder="Escribe una nota..."
                                            className="flex-1 text-[13px] rounded-xl border px-3 py-2 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                                            style={{ borderColor: "#E0E0E0", color: "#272E2F" }}
                                        />
                                        <button type="submit" className="w-9 h-9 rounded-xl bg-[#F0F0F0] hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0" style={{ color: "#454545" }}>
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </form>
                                    {/* Notes list */}
                                    <div className="space-y-2 max-h-[240px] overflow-y-auto">
                                        {notes.map((note) => (
                                            <div key={note.id} className="flex items-start gap-2.5 p-3 rounded-xl group" style={{ backgroundColor: "#F8F8F8", border: "1px solid #EAEAEA" }}>
                                                <p className="text-[13px] flex-1 min-w-0 leading-relaxed" style={{ color: "#454545" }}>{note.text}</p>
                                                <button onClick={() => deleteNote(note.id)} className="opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5 hover:text-red-400" style={{ color: "#E0E0E0" }}>
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {notes.length === 0 && (
                                            <p className="text-center text-[12px] py-6" style={{ color: "#CCCCCC" }}>Sin notas</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Category Chart Row ── */}
            <div className="grid gap-5 lg:grid-cols-5 mb-8">
                {stats?.listingsByCategory && stats.listingsByCategory.length > 0 && (
                    <div className="lg:col-span-3 bg-white rounded-2xl p-6" style={{ border: "1px solid #E0E0E0" }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[16px] font-bold" style={{ color: "#272E2F" }}>Listings por Categoría</h3>
                            <span className="text-[12px] font-medium" style={{ color: "#999999" }}>Total: {stats.listings}</span>
                        </div>
                        <div className="space-y-4">
                            {stats.listingsByCategory
                                .sort((a, b) => b.count - a.count)
                                .map((cat) => {
                                    const max = Math.max(...stats.listingsByCategory.map((c) => c.count), 1);
                                    const pct = (cat.count / max) * 100;
                                    return (
                                        <div key={cat.category} className="flex items-center gap-4">
                                            <span className="w-28 text-[13px] font-semibold truncate shrink-0" style={{ color: "#454545" }}>
                                                {cat.category}
                                            </span>
                                            <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ backgroundColor: "#F0F0F0" }}>
                                                <div
                                                    className="h-full rounded-lg transition-all duration-700"
                                                    style={{
                                                        width: `${Math.max(pct, 4)}%`,
                                                        backgroundColor: "#272E2F",
                                                    }}
                                                />
                                            </div>
                                            <span className="text-[13px] font-bold w-10 text-right shrink-0" style={{ color: "#272E2F" }}>
                                                {cat.count}
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* Summary */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6" style={{ border: "1px solid #E0E0E0" }}>
                    <h3 className="text-[16px] font-bold mb-5" style={{ color: "#272E2F" }}>Resumen</h3>
                    <div className="space-y-4">
                        {[
                            { label: "Listings Activos", sub: "Total en directorio", value: stats?.listings, icon: List },
                            { label: "Clicks Recientes", sub: "Últimos 7 días", value: stats?.recentClicks, icon: TrendingUp },
                            { label: "Leads Recientes", sub: "Últimos 7 días", value: stats?.recentLeads, icon: Mail },
                            { label: "Categorías", sub: "En el directorio", value: stats?.listingsByCategory?.length, icon: MapPin },
                        ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between py-1" style={{ borderBottom: "1px solid #EAEAEA" }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F0F0F0" }}>
                                        <row.icon className="w-[18px] h-[18px]" style={{ color: "#777777" }} strokeWidth={2.2} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold" style={{ color: "#272E2F" }}>{row.label}</p>
                                        <p className="text-[11px]" style={{ color: "#999999" }}>{row.sub}</p>
                                    </div>
                                </div>
                                <p className="text-[18px] font-bold" style={{ color: "#272E2F" }}>{row.value ?? "—"}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <h3 className="text-[13px] font-medium uppercase tracking-wider mb-4" style={{ color: "#777777" }}>Acciones Rápidas</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {QUICK_ACTIONS.map((action) => (
                    <Link
                        key={action.title}
                        href={action.href}
                        className={`group bg-white rounded-2xl p-5 transition-all ${action.disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-[#F8F8F8]"
                            }`}
                        style={{ border: "1px solid #E0E0E0" }}
                        onClick={(e) => action.disabled && e.preventDefault()}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F0F0F0" }}>
                                <action.icon className="w-5 h-5" style={{ color: "#777777" }} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-[14px] font-semibold" style={{ color: "#272E2F" }}>{action.title}</h3>
                                <p className="text-[12px]" style={{ color: "#999999" }}>{action.description}</p>
                            </div>
                            {!action.disabled && (
                                <ArrowRight className="w-4 h-4 ml-auto shrink-0 transition-colors" style={{ color: "#E0E0E0" }} />
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
