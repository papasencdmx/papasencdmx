"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Plus, ExternalLink, Trash2, FileText } from "lucide-react";
import type { Page } from "@/types";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    published: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Publicada" },
    draft: { bg: "bg-amber-50", text: "text-amber-700", label: "Borrador" },
    archived: { bg: "bg-gray-100", text: "text-gray-500", label: "Archivada" },
};

export default function PaginasPage() {
    const [token, setToken] = useState<string | null>(null);
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = localStorage.getItem("admin_token");
        if (!t) {
            window.location.href = "/admin/login";
            return;
        }
        setToken(t);
    }, []);

    const fetchPages = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch("/api/admin/pages", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setPages(data.pages || []);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);

    const deletePage = async (id: string) => {
        if (!token) return;
        if (!confirm("¿Eliminar esta página? La acción no se puede deshacer.")) return;
        await fetch(`/api/admin/pages/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        setPages((prev) => prev.filter((p) => p.id !== id));
    };

    if (!token) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                <div>
                    <h1 className="text-[22px] font-bold" style={{ color: "#272E2F" }}>
                        Páginas
                    </h1>
                    <p className="text-[13px] mt-1" style={{ color: "#777777" }}>
                        Páginas filtradas que se muestran en /guias/[slug]. {pages.length} en total.
                    </p>
                </div>
                <Link
                    href="/admin/paginas/nueva"
                    className="inline-flex items-center gap-2 rounded-xl bg-copper-600 hover:bg-copper-700 text-white px-4 py-2 text-[13px] font-bold transition"
                >
                    <Plus className="w-4 h-4" />
                    Nueva página
                </Link>
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            )}

            {!loading && pages.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-copper-50 text-copper-600">
                        <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-[15px] font-semibold text-gray-800">Aún no hay páginas creadas</p>
                    <p className="text-[13px] text-gray-500 mt-1 max-w-md mx-auto">
                        Crea tu primera página filtrada para mostrar listings curados (ej. campamentos verano, ofertas, extraescolares).
                    </p>
                    <Link
                        href="/admin/paginas/nueva"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-copper-600 hover:bg-copper-700 text-white px-4 py-2 text-[13px] font-bold transition"
                    >
                        <Plus className="w-4 h-4" />
                        Crear primera página
                    </Link>
                </div>
            )}

            {!loading && pages.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Título</th>
                                    <th className="px-4 py-3 font-semibold">Slug</th>
                                    <th className="px-4 py-3 font-semibold">Tipo</th>
                                    <th className="px-4 py-3 font-semibold">Destacados</th>
                                    <th className="px-4 py-3 font-semibold">Estado</th>
                                    <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pages.map((p) => {
                                    const status = STATUS_STYLES[p.status] || STATUS_STYLES.draft;
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900">{p.title}</div>
                                                {p.hero_headline && (
                                                    <div className="text-[11.5px] text-gray-500 truncate max-w-[280px]">
                                                        {p.hero_headline}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[12px] text-gray-700">
                                                /guias/{p.slug}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 capitalize">
                                                {p.page_type}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {p.featured_listing_ids?.length || 0}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${status.bg} ${status.text}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {p.status === "published" && (
                                                        <a
                                                            href={`/guias/${p.slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 text-[11px] font-semibold"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            Ver
                                                        </a>
                                                    )}
                                                    <Link
                                                        href={`/admin/paginas/${p.id}`}
                                                        className="inline-flex items-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 text-[11px] font-semibold"
                                                    >
                                                        Editar
                                                    </Link>
                                                    <button
                                                        onClick={() => deletePage(p.id)}
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
