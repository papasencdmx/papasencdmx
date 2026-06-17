"use client";

import { useSearchParams } from "next/navigation";

/**
 * Conditional hero — same form, two messages:
 *   /colaborar                  → free/commission partner pitch ("gratis", "sin compromiso")
 *   /colaborar?modo=partner     → paid partner onboarding ("completa tu perfil") — no "gratis"
 */
export function ColaborarHero() {
    const params = useSearchParams();
    const isPartner = params.get("modo") === "partner";

    return (
        <div className="mb-16 sm:mb-24">
            <div className="flex items-center gap-4 mb-6">
                <span className="text-[11px] uppercase tracking-[0.28em] font-bold text-copper-600">
                    N.º 01
                </span>
                <span className="flex-1 h-px bg-warm-300" aria-hidden="true" />
                <span className="text-[11px] uppercase tracking-[0.22em] font-bold text-warm-500">
                    {isPartner ? "Onboarding de colaborador" : "Propuestas de colaboradores"}
                </span>
            </div>

            <div className="grid grid-cols-12 gap-8 lg:gap-12 items-end">
                <h1 className="col-span-12 lg:col-span-8 font-display font-extrabold leading-[0.95] tracking-[-0.025em] text-warm-900 text-[clamp(2.5rem,6vw,5rem)]">
                    {isPartner ? (
                        <>
                            Completa
                            <br />
                            <span className="italic font-medium text-copper-700">
                                tu perfil
                            </span>
                            <br />
                            de colaborador.
                        </>
                    ) : (
                        <>
                            Cuéntanos sobre
                            <br />
                            <span className="italic font-medium text-copper-700">
                                tu actividad,
                            </span>
                            <br />
                            la familia te lee.
                        </>
                    )}
                </h1>

                <div className="col-span-12 lg:col-span-4 lg:pb-3">
                    {isPartner ? (
                        <>
                            <p className="text-[15px] sm:text-[16px] leading-[1.6] text-warm-600 max-w-sm">
                                Sube los datos y la imagen de tu negocio. Tu equipo de Padres en
                                CDMX lo revisará y publicará tu ficha en las{" "}
                                <strong className="text-warm-900 font-bold">próximas 48h</strong>.
                            </p>
                            <div className="mt-5 flex items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-100 text-ocean-800 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                                    Partner activo
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-copper-50 text-copper-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                                    Plaza reservada
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-[15px] sm:text-[16px] leading-[1.6] text-warm-600 max-w-sm">
                                Revisamos cada propuesta a mano en menos de{" "}
                                <strong className="text-warm-900 font-bold">48 horas</strong>.
                                Sin tarifas, sin compromiso. Si encaja con nuestra comunidad, te
                                ayudamos a llegar a miles de familias en la CDMX.
                            </p>
                            <div className="mt-5 flex items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Gratis
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-100 text-ocean-800 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                                    Verificado a mano
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
