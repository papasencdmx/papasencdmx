"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Upload,
    LogOut,
    Menu,
    X,
    List,
    BarChart3,
    Star,
    CalendarDays,
    MapPin,
    Mail,
    Megaphone,
    Settings,
    Activity,
    Link2,
    Ticket,
    GraduationCap,
    Sun,
    CalendarCheck,
    ChevronRight,
} from "lucide-react";

const NAV_SECTIONS = [
    {
        title: "Workspace",
        items: [
            { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
            { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
            { label: "Listings", href: "/admin/listings", icon: List },
            { label: "Páginas", href: "/admin/paginas", icon: List },
            { label: "Propuestas", href: "/admin/propuestas", icon: Mail },
            { label: "Actividad", href: "/admin/activity", icon: Activity },
        ],
    },
    {
        title: "Gestión",
        items: [
            { label: "Importar CSV", href: "/admin/import", icon: Upload },
            { label: "Track Enlaces", href: "/admin/enlaces", icon: Link2 },
            { label: "Leads", href: "/admin/leads", icon: Mail, disabled: true },
            { label: "Reseñas", href: "/admin/reviews", icon: Star, disabled: true },
        ],
    },
    {
        title: "Configurar",
        items: [
            { label: "Categorías", href: "/admin/taxonomies", icon: MapPin, disabled: true },
            {
                label: "Reservas",
                icon: CalendarCheck,
                groupKey: "reservas",
                children: [
                    { label: "Eventos", href: "/admin/events?section=actividades", icon: CalendarDays, matchSection: "actividades" },
                    { label: "Colegios", href: "/admin/events?section=colegios", icon: GraduationCap, matchSection: "colegios" },
                    { label: "Campamentos", href: "/admin/events?section=campamentos", icon: Sun, matchSection: "campamentos" },
                ],
            },
            { label: "Pedidos", href: "/admin/orders", icon: Ticket },
            { label: "Recuperar reservas", href: "/admin/abandoned", icon: Mail },
            { label: "Anunciantes", href: "/admin/advertisers", icon: Megaphone, disabled: true },
            { label: "Ajustes", href: "/admin/settings", icon: Settings },
        ],
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={null}>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </Suspense>
    );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentSection = searchParams.get("section") || "";
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [displayName, setDisplayName] = useState("");

    const isLoginPage = pathname === "/admin/login";

    useEffect(() => {
        if (isLoginPage) {
            setAuthenticated(true);
            return;
        }

        const token = localStorage.getItem("admin_token");
        if (!token) {
            router.push("/admin/login");
            return;
        }

        fetch("/api/admin/auth", {
            headers: { Authorization: `Bearer ${token}` },
        }).then((res) => {
            if (res.ok) {
                setAuthenticated(true);
                res.json().then((data) => {
                    if (data.displayName) {
                        setDisplayName(data.displayName);
                        localStorage.setItem("admin_display_name", data.displayName);
                    }
                });
            } else {
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_display_name");
                router.push("/admin/login");
            }
        });
    }, [isLoginPage, router]);

    const handleLogout = () => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_display_name");
        router.push("/admin/login");
    };

    // CSS to hide root layout's Header/Footer — static trusted strings only
    const adminCss = [
        "body > header, body > footer { display: none !important; }",
        "body > main { background: #F2F2F2 !important; padding: 0 !important; }",
        "body { background: #F2F2F2 !important; }",
        ".admin-shell, .admin-shell * { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif !important; }",
    ].join("\n");
    const adminStyles = (
        <>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            <style dangerouslySetInnerHTML={{ __html: adminCss }} />
        </>
    );

    if (isLoginPage) return <>{adminStyles}{children}</>;

    if (authenticated === null) {
        return (
            <>
                {adminStyles}
                <div className="min-h-screen flex items-center justify-center" style={{ background: "#F2F2F2" }}>
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </>
        );
    }

    return (
        <>
            {adminStyles}
            <div className="admin-shell" style={{ background: "#F2F2F2", minHeight: "100vh" }}>
                <div className="flex min-h-screen">
                    {/* Sidebar overlay */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    {/* Sidebar */}
                    <aside
                        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                            }`}
                        style={{ borderRight: "1px solid #E0E0E0" }}
                    >
                        {/* Brand */}
                        <div className="flex items-center gap-2.5 px-5 h-[72px] shrink-0" style={{ borderBottom: "1px solid #E0E0E0" }}>
                            <img src="/icons/papas_en_cdmx.svg" alt="Papás en CDMX" className="h-9 w-auto object-contain" />
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 rounded-full px-1.5 py-0.5 uppercase tracking-wider">Admin</span>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="ml-auto lg:hidden text-gray-400 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Nav */}
                        <nav className="flex-1 px-4 pt-6 space-y-7 overflow-y-auto">
                            {NAV_SECTIONS.map((section) => (
                                <div key={section.title}>
                                    <p className="text-[13px] font-medium text-gray-400 px-3 mb-2 flex items-center gap-1.5">
                                        {section.title}
                                        <span className="text-[9px]">&#9650;</span>
                                    </p>
                                    <div className="space-y-0.5">
                                        {section.items.map((item) => {
                                            if ("children" in item && item.children) {
                                                return (
                                                    <NavGroup
                                                        key={item.groupKey}
                                                        item={item as NavGroupItem}
                                                        pathname={pathname}
                                                        currentSection={currentSection}
                                                        onNavigate={() => setSidebarOpen(false)}
                                                    />
                                                );
                                            }
                                            const hrefPath = item.href.split("?")[0];
                                            const match = "matchSection" in item ? item.matchSection : undefined;
                                            const isActive = match
                                                ? pathname === hrefPath && currentSection === match
                                                : pathname === hrefPath && (pathname !== "/admin/events" || !currentSection);
                                            const disabled = "disabled" in item && item.disabled;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={disabled ? "#" : item.href}
                                                    onClick={(e) => {
                                                        if (disabled) e.preventDefault();
                                                        else setSidebarOpen(false);
                                                    }}
                                                    className={`flex items-center gap-3.5 px-3 py-3 rounded-xl text-[15px] transition-all ${disabled
                                                        ? "cursor-not-allowed"
                                                        : isActive
                                                            ? "font-semibold"
                                                            : "hover:bg-[#F6F6F6]"
                                                        }`}
                                                    style={{
                                                        color: disabled ? "#CCCCCC" : isActive ? "#272E2F" : "#454545",
                                                        backgroundColor: isActive ? "#F0F0F0" : undefined,
                                                    }}
                                                >
                                                    <item.icon
                                                        className="w-5 h-5 shrink-0"
                                                        style={{ color: disabled ? "#CCCCCC" : isActive ? "#000000" : "#777777" }}
                                                        strokeWidth={2.2}
                                                        fill={disabled ? "none" : "currentColor"}
                                                        fillOpacity={disabled ? 0 : 0.15}
                                                    />
                                                    <span className="flex-1">{item.label}</span>
                                                    {disabled && (
                                                        <span className="w-2 h-2 rounded-full bg-gray-200" />
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </nav>

                        {/* User + Logout */}
                        <div className="px-4 py-5 space-y-2" style={{ borderTop: "1px solid #E0E0E0" }}>
                            {displayName && (
                                <div className="flex items-center gap-3 px-3 py-2">
                                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-[14px] font-medium text-gray-700">{displayName}</span>
                                </div>
                            )}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3.5 px-3 py-3 rounded-xl text-[15px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all w-full"
                            >
                                <LogOut className="w-5 h-5" strokeWidth={2.2} style={{ color: "#777777" }} />
                                Cerrar sesión
                            </button>
                        </div>
                    </aside>

                    {/* Main */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Top bar */}
                        <header className="h-[72px] bg-white flex items-center px-5 sm:px-8 shrink-0 sticky top-0 z-30" style={{ borderBottom: "1px solid #E0E0E0" }}>
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden mr-3 text-gray-400 hover:text-gray-700"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <h2 className="text-[17px] font-semibold text-gray-800">
                                {flattenItems(NAV_SECTIONS).find((i) => {
                                    if (!("href" in i) || !i.href) return false;
                                    const hrefPath = i.href.split("?")[0];
                                    const match = "matchSection" in i ? i.matchSection : undefined;
                                    return match
                                        ? pathname === hrefPath && currentSection === match
                                        : pathname === hrefPath && (pathname !== "/admin/events" || !currentSection);
                                })?.label || "Dashboard"}
                            </h2>
                            <span className="ml-auto text-[11px] font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">v1.0.0 <span className="text-amber-500">Beta</span></span>
                        </header>

                        {/* Content */}
                        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Collapsible nav group ──────────────────────────────────────────────────

type IconCmp = React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number; fill?: string; fillOpacity?: number }>;

interface NavChild {
    label: string;
    href: string;
    icon: IconCmp;
    matchSection?: string;
}

interface NavGroupItem {
    label: string;
    icon: IconCmp;
    groupKey: string;
    children: NavChild[];
}

function NavGroup({
    item,
    pathname,
    currentSection,
    onNavigate,
}: {
    item: NavGroupItem;
    pathname: string;
    currentSection: string;
    onNavigate: () => void;
}) {
    const anyChildActive = item.children.some((c) => {
        const hrefPath = c.href.split("?")[0];
        return c.matchSection
            ? pathname === hrefPath && currentSection === c.matchSection
            : pathname === hrefPath;
    });

    const storageKey = `admin_nav_group_${item.groupKey}`;
    const [open, setOpen] = useState(() => {
        if (typeof window === "undefined") return anyChildActive;
        const stored = window.localStorage.getItem(storageKey);
        if (stored === "1") return true;
        if (stored === "0") return false;
        return anyChildActive;
    });

    useEffect(() => {
        if (anyChildActive) setOpen(true);
    }, [anyChildActive]);

    const toggle = () => {
        const next = !open;
        setOpen(next);
        try { window.localStorage.setItem(storageKey, next ? "1" : "0"); } catch { /* no-op */ }
    };

    const Icon = item.icon;

    return (
        <div>
            <button
                type="button"
                onClick={toggle}
                className={`flex w-full items-center gap-3.5 px-3 py-3 rounded-xl text-[15px] transition-all ${
                    anyChildActive && !open ? "font-semibold" : "hover:bg-[#F6F6F6]"
                }`}
                style={{
                    color: anyChildActive ? "#272E2F" : "#454545",
                }}
                aria-expanded={open}
            >
                <Icon
                    className="w-5 h-5 shrink-0"
                    style={{ color: anyChildActive ? "#000000" : "#777777" }}
                    strokeWidth={2.2}
                    fill="currentColor"
                    fillOpacity={0.15}
                />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}
                />
            </button>
            {open && (
                <div className="mt-0.5 ml-3 pl-3 space-y-0.5 border-l border-gray-100">
                    {item.children.map((child) => {
                        const hrefPath = child.href.split("?")[0];
                        const isActive = child.matchSection
                            ? pathname === hrefPath && currentSection === child.matchSection
                            : pathname === hrefPath;
                        const ChildIcon = child.icon;
                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                onClick={onNavigate}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all ${
                                    isActive ? "font-semibold" : "hover:bg-[#F6F6F6]"
                                }`}
                                style={{
                                    color: isActive ? "#272E2F" : "#555555",
                                    backgroundColor: isActive ? "#F0F0F0" : undefined,
                                }}
                            >
                                <ChildIcon
                                    className="w-4 h-4 shrink-0"
                                    style={{ color: isActive ? "#000000" : "#888888" }}
                                    strokeWidth={2.2}
                                />
                                <span>{child.label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Flattens top-level + group children for title lookup
function flattenItems(sections: typeof NAV_SECTIONS): Array<{ label: string; href?: string; matchSection?: string }> {
    const out: Array<{ label: string; href?: string; matchSection?: string }> = [];
    for (const s of sections) {
        for (const i of s.items) {
            if ("children" in i && i.children) {
                for (const c of i.children) {
                    out.push({ label: c.label, href: c.href, matchSection: c.matchSection });
                }
            } else if ("href" in i) {
                const ms = "matchSection" in i ? (i as { matchSection?: string }).matchSection : undefined;
                out.push({ label: i.label, href: i.href, matchSection: ms });
            }
        }
    }
    return out;
}
