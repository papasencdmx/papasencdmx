"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageForm } from "../PageForm";
import type { Page } from "@/types";

export default function EditPaginaPage() {
    const params = useParams<{ id: string }>();
    const [token, setToken] = useState<string | null>(null);
    const [page, setPage] = useState<Page | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = localStorage.getItem("admin_token");
        if (!t) {
            window.location.href = "/admin/login";
            return;
        }
        setToken(t);
    }, []);

    useEffect(() => {
        if (!token) return;
        const id = params?.id;
        if (!id) return;
        fetch(`/api/admin/pages/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => setPage(d.page || null))
            .finally(() => setLoading(false));
    }, [params, token]);

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    if (!page) return <p className="text-gray-500">Página no encontrada</p>;
    return <PageForm initial={page} isNew={false} />;
}
