import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCityConfig } from "@/config/city";

const cfg = getCityConfig();

export const metadata: Metadata = {
    title: `Colabora con Papás en ${cfg.cityName} — Envía tu propuesta`,
    description: `¿Organizas campamentos, actividades o servicios para familias en ${cfg.cityName}? Envíanos tu propuesta y llega a miles de familias.`,
    robots: { index: true, follow: true },
};

/**
 * Editorial layout — full-width, masthead-style header with hairline rule.
 * Uses brand palette (warm/copper/ocean) and Plus Jakarta Sans.
 */
export default function ColaborarLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-warm-50 antialiased text-warm-900">
            <header className="bg-white border-b border-warm-200">
                <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-14 py-5 flex items-center justify-between gap-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 group"
                    >
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-copper-600 text-white text-[15px] font-extrabold group-hover:bg-copper-700 transition-colors">
                            P
                        </span>
                        <div className="flex flex-col">
                            <span className="font-display text-[14px] sm:text-[15px] font-extrabold tracking-tight leading-none text-warm-900">
                                Papás en {cfg.cityName}
                            </span>
                            <span className="hidden sm:inline-block text-[10.5px] uppercase tracking-[0.22em] font-semibold text-warm-400 mt-1">
                                Colaboradores
                            </span>
                        </div>
                    </Link>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] uppercase tracking-[0.18em] font-bold text-warm-500 hover:text-copper-600 transition-colors whitespace-nowrap"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Volver al sitio</span>
                        <span className="sm:hidden">Volver</span>
                    </Link>
                </div>
            </header>
            <main>{children}</main>
        </div>
    );
}
