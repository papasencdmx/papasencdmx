import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getCategories, getListingCount } from "@/lib/data";
import { getCityConfig } from "@/config/city";

const config = getCityConfig();

export const metadata: Metadata = {
    title: `Directorio familiar de ${config.cityName} — Papás en ${config.cityName}`,
    description: `Encuentra colegios, campamentos, extraescolares, ocio familiar, deportes y salud para tu familia en ${config.cityName}. Selección verificada.`,
    alternates: { canonical: "/directorio" },
};

export const revalidate = 1800;

// Index order — editorial sequencing (most-searched first)
const FEATURED_ORDER = [
    "colegios",
    "campamentos",
    "extraescolares",
    "ocio-familiar",
    "deportes",
    "salud",
];

const CATEGORY_KICKERS: Record<string, string> = {
    colegios: "Concertados, privados y públicos. Con jornadas de puertas abiertas verificadas por familias.",
    campamentos: "Urbanos, de naturaleza, deportivos. Verano, Navidad y Semana Santa.",
    extraescolares: "Deporte, idiomas, arte, tecnología. Fuera del horario lectivo.",
    "ocio-familiar": "Talleres, museos y planes para sábados sin lluvia y para los lluviosos.",
    deportes: "Clubs y academias para niños desde los 3 años. Federados y no federados.",
    salud: "Pediatras, dentistas, psicólogos y otros profesionales para familias.",
};

export default async function DirectorioPage() {
    const categories = await getCategories();

    const ordered = FEATURED_ORDER
        .map((slug) => categories.find((c) => c.slug === slug))
        .filter((c): c is NonNullable<typeof c> => !!c);

    const counts = await Promise.all(ordered.map((c) => getListingCount(c.id)));
    const totalListings = counts.reduce((a, b) => a + b, 0);

    return (
        <div className="bg-white text-warm-900">
            {/* ────────────────────────── Masthead ────────────────────────── */}
            <header className="border-b border-warm-200">
                <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-14 pt-10 sm:pt-16 pb-10 sm:pb-14">
                    {/* Hairline label row */}
                    <div className="flex items-baseline gap-4 mb-10 sm:mb-14">
                        <span className="text-[11px] uppercase tracking-[0.28em] font-bold text-copper-600">
                            Directorio
                        </span>
                        <span className="flex-1 h-px bg-warm-300" aria-hidden="true" />
                        <span className="text-[11px] uppercase tracking-[0.22em] font-bold text-warm-500">
                            {totalListings.toLocaleString("es-MX")} fichas curadas
                        </span>
                    </div>

                    {/* Headline + search — asymmetric */}
                    <div className="grid grid-cols-12 gap-x-6 sm:gap-x-12 gap-y-10 items-end">
                        <h1 className="col-span-12 lg:col-span-7 font-display font-extrabold leading-[0.92] tracking-[-0.03em] text-warm-900 text-[clamp(2.75rem,7vw,6rem)]">
                            Lo que tu familia
                            <br />
                            necesita,{" "}
                            <span className="italic font-medium text-copper-700">
                                a mano.
                            </span>
                        </h1>

                        <div className="col-span-12 lg:col-span-5 lg:pb-4">
                            <p className="text-[15px] sm:text-[17px] leading-[1.55] text-warm-700 max-w-md mb-6">
                                Colegios, campamentos, extraescolares y servicios para familias
                                en {config.cityName}. Verificado por nuestro equipo, no por
                                algoritmos.
                            </p>

                            {/* Search */}
                            <form
                                action="/buscar"
                                method="GET"
                                role="search"
                                className="flex items-stretch border-b-2 border-warm-900 max-w-md focus-within:border-copper-600 transition-colors"
                            >
                                <Search
                                    className="self-center w-[18px] h-[18px] text-warm-500 mr-2.5 shrink-0"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    name="q"
                                    placeholder="Buscar colegios, dentistas, campamentos…"
                                    aria-label="Buscar en el directorio"
                                    className="flex-1 min-w-0 bg-transparent border-0 focus:ring-0 px-0 py-3 text-[15px] text-warm-900 placeholder:text-warm-400 outline-none"
                                />
                                <button
                                    type="submit"
                                    className="shrink-0 text-[12px] uppercase tracking-[0.18em] font-bold text-warm-900 hover:text-copper-700 px-2 transition-colors"
                                >
                                    Buscar
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            {/* ────────────────────────── Index ────────────────────────── */}
            <section aria-labelledby="index-heading">
                <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-14 pt-14 sm:pt-20">
                    <div className="flex items-baseline gap-4 mb-8 sm:mb-12">
                        <span className="text-[11px] uppercase tracking-[0.28em] font-bold text-warm-500">
                            Índice
                        </span>
                        <span className="flex-1 h-px bg-warm-300" aria-hidden="true" />
                        <span id="index-heading" className="sr-only">
                            Categorías del directorio
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.22em] font-bold text-warm-500">
                            06 categorías
                        </span>
                    </div>
                </div>

                {/* Each row spans full width on mobile and gets a generous editorial layout
                    on desktop. Hairline rules above each row, copper indicator on hover. */}
                <ul className="border-t border-warm-200">
                    {ordered.map((cat, i) => {
                        const count = counts[i];
                        const num = String(i + 1).padStart(2, "0");
                        const kicker = CATEGORY_KICKERS[cat.slug] || cat.description || "";
                        return (
                            <li key={cat.id} className="border-b border-warm-200">
                                <Link
                                    href={`/${cat.slug}`}
                                    className="group block"
                                >
                                    <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-14 py-8 sm:py-10 lg:py-12 grid grid-cols-12 gap-x-6 sm:gap-x-10 lg:gap-x-14 items-baseline relative">
                                        {/* Hover indicator — copper bar that grows in from left */}
                                        <span
                                            aria-hidden="true"
                                            className="absolute left-0 top-0 bottom-0 w-0 bg-copper-600 transition-[width] duration-300 ease-out group-hover:w-[3px]"
                                        />

                                        {/* Number */}
                                        <span
                                            className="col-span-2 sm:col-span-1 font-display font-extrabold tabular-nums leading-none tracking-[-0.04em] text-warm-300 group-hover:text-copper-600 transition-colors"
                                            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
                                        >
                                            {num}
                                        </span>

                                        {/* Title + kicker */}
                                        <div className="col-span-10 sm:col-span-8 lg:col-span-7">
                                            <h3 className="font-display font-extrabold leading-[1] tracking-[-0.02em] text-warm-900 group-hover:text-copper-700 transition-colors text-[clamp(1.75rem,4vw,3rem)]">
                                                {cat.name}
                                            </h3>
                                            <p className="mt-3 sm:mt-4 text-[14.5px] sm:text-[15.5px] leading-[1.55] text-warm-600 max-w-xl">
                                                {kicker}
                                            </p>
                                        </div>

                                        {/* Count + arrow */}
                                        <div className="col-span-12 sm:col-span-3 lg:col-span-4 mt-4 sm:mt-0 flex sm:flex-col sm:items-end sm:text-right gap-3 sm:gap-1">
                                            {count > 0 && (
                                                <span className="font-display font-extrabold tabular-nums leading-none text-warm-900 text-[clamp(1.5rem,3vw,2.25rem)]">
                                                    {count.toLocaleString("es-MX")}
                                                </span>
                                            )}
                                            <span className="text-[10.5px] uppercase tracking-[0.22em] font-bold text-warm-500 self-end sm:self-auto">
                                                {count === 1 ? "ficha" : "fichas"}
                                            </span>
                                            <span
                                                aria-hidden="true"
                                                className="ml-auto sm:ml-0 sm:mt-3 inline-flex items-baseline gap-1.5 text-[12px] uppercase tracking-[0.18em] font-bold text-warm-900 group-hover:text-copper-700 transition-colors"
                                            >
                                                Ver
                                                <span className="group-hover:translate-x-1 transition-transform">
                                                    →
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {/* ────────────────────────── Partner CTA ────────────────────────── */}
            <section className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-14 pt-16 sm:pt-24 pb-20 sm:pb-28">
                <div className="grid grid-cols-12 gap-x-6 sm:gap-x-12 gap-y-6 items-end">
                    <div className="col-span-12 lg:col-span-8">
                        <span className="inline-block text-[11px] uppercase tracking-[0.28em] font-bold text-copper-600 mb-4">
                            Para colaboradores
                        </span>
                        <h2 className="font-display font-extrabold leading-[0.95] tracking-[-0.025em] text-warm-900 text-[clamp(2rem,5vw,3.75rem)]">
                            ¿Diriges un negocio
                            <br />
                            <span className="italic font-medium text-copper-700">
                                para familias?
                            </span>
                        </h2>
                        <p className="mt-5 text-[15px] sm:text-[16px] leading-[1.55] text-warm-700 max-w-lg">
                            Únete gratis al directorio. Si encajas con nuestra comunidad, te
                            publicamos sin tarifas ni compromiso.
                        </p>
                    </div>
                    <div className="col-span-12 lg:col-span-4 lg:pb-3">
                        <Link
                            href="/colaborar"
                            className="group inline-flex items-baseline gap-3 bg-warm-900 hover:bg-copper-700 text-warm-50 px-7 py-4 text-[13px] uppercase tracking-[0.18em] font-bold transition-colors"
                        >
                            <span>Enviar mi propuesta</span>
                            <span
                                aria-hidden="true"
                                className="text-copper-400 group-hover:text-warm-50 group-hover:translate-x-1 transition-all"
                            >
                                →
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Footer mark */}
                <div className="mt-20 flex items-center gap-4">
                    <span className="flex-1 h-px bg-warm-300" aria-hidden="true" />
                    <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-warm-500">
                        Hecho a mano en {config.cityName}
                    </span>
                    <span className="flex-1 h-px bg-warm-300" aria-hidden="true" />
                </div>
            </section>
        </div>
    );
}
