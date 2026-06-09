"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";

const FAVORITES_KEY = "pem_favorites_v1";

function readFavorites(): Set<string> {
    if (typeof window === "undefined") return new Set();
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr : []);
    } catch {
        return new Set();
    }
}

function writeFavorites(set: Set<string>) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(set)));
        window.dispatchEvent(new CustomEvent("pem:favorites-changed"));
    } catch {
        // ignore
    }
}

export function ListingCardActions({
    listingId,
    title,
    shareUrl,
    whatsappMessage,
}: {
    listingId: string;
    title: string;
    shareUrl: string;
    whatsappMessage: string;
}) {
    const [favorited, setFavorited] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setFavorited(readFavorites().has(listingId));
        const onChange = () => setFavorited(readFavorites().has(listingId));
        window.addEventListener("pem:favorites-changed", onChange);
        return () => window.removeEventListener("pem:favorites-changed", onChange);
    }, [listingId]);

    const toggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const set = readFavorites();
        if (set.has(listingId)) set.delete(listingId);
        else set.add(listingId);
        writeFavorites(set);
        setFavorited(set.has(listingId));
    };

    const shareViaWhatsApp = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const text = encodeURIComponent(`${whatsappMessage}\n${shareUrl}`);
        window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    };

    if (!mounted) {
        // Avoid hydration mismatch flicker; render placeholder shape.
        return (
            <div className="flex items-center gap-1.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-warm-200 bg-white" />
                <span className="inline-flex h-8 items-center rounded-full border border-warm-200 bg-white px-3" />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <button
                type="button"
                onClick={toggleFavorite}
                aria-label={favorited ? `Quitar ${title} de favoritos` : `Guardar ${title} en favoritos`}
                aria-pressed={favorited}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                    favorited
                        ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                        : "border-warm-200 bg-white text-warm-500 hover:text-rose-500 hover:border-rose-200"
                }`}
            >
                <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} aria-hidden="true" />
            </button>

            <button
                type="button"
                onClick={shareViaWhatsApp}
                aria-label={`Compartir ${title} por WhatsApp`}
                className="inline-flex items-center gap-1.5 rounded-full border border-warm-200 bg-white px-3 h-8 text-[12px] font-semibold text-warm-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
            >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Compartir
            </button>
        </div>
    );
}
