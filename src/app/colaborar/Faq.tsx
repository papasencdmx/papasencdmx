"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FaqItem {
    q: string;
    a: React.ReactNode;
}

const FAQS: FaqItem[] = [
    {
        q: "¿Por qué pedís mis datos de contacto?",
        a: (
            <>
                <p>
                    Para verificar tu propuesta y poder ponernos en contacto contigo de forma
                    directa.
                </p>
                <p className="mt-2 text-warm-500">
                    Nuestro equipo revisa personalmente cada nueva colaboración. Tu email y
                    teléfono solo se usan para coordinar la colaboración — nunca los
                    publicamos ni los compartimos con terceros.
                </p>
            </>
        ),
    },
    {
        q: "¿Cómo escribo una buena descripción?",
        a: (
            <>
                <p>
                    Sé concreto. Una descripción que explique qué hace especial a tu
                    actividad convierte hasta <strong className="text-warm-900">3×</strong>{" "}
                    más que una genérica.
                </p>
                <p className="mt-2 text-warm-500">
                    Ejemplo malo: «Campamento divertido en verano para niños». Ejemplo bueno:
                    «Campamento de fútbol en las instalaciones de un club con
                    entrenadores titulados y dos sesiones diarias.»
                </p>
            </>
        ),
    },
    {
        q: "¿Cómo funciona el precio para la comunidad?",
        a: (
            <>
                <p>
                    Si nos ofreces un precio menor al normal exclusivo para nuestra
                    comunidad, lo destacamos automáticamente en la tarjeta con un badge de
                    descuento — esto multiplica las reservas.
                </p>
                <p className="mt-2 text-warm-500">
                    Si prefieres no aplicar descuento, deja vacíos ambos campos y mostraremos
                    «Consultar precio».
                </p>
            </>
        ),
    },
    {
        q: "¿Qué tipo de imagen debería subir?",
        a: (
            <>
                <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-0.5 leading-none">✓</span>
                        <span>Foto real de la actividad o de las instalaciones.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold mt-0.5 leading-none">✕</span>
                        <span>Folletos, carteles con texto encima o logos sueltos.</span>
                    </li>
                </ul>
                <p className="mt-2 text-warm-500">
                    Comprimimos automáticamente a 1200px sin perder calidad visible. Tamaño
                    máximo: 5 MB.
                </p>
            </>
        ),
    },
    {
        q: "¿Por qué pedís un enlace de reserva?",
        a: (
            <>
                <p>
                    Es donde las familias completarán la reserva o pedirán información sobre
                    tu actividad.
                </p>
                <p className="mt-2 text-warm-500">
                    Generamos automáticamente un enlace tracking propio para que veas cuántas
                    familias han hecho clic desde Papás en CDMX hacia tu web.
                </p>
            </>
        ),
    },
    {
        q: "¿Cuánto tarda la revisión?",
        a: (
            <>
                <p>
                    Menos de <strong className="text-warm-900">48 horas</strong>. Te
                    escribimos al email que has indicado con la decisión y los siguientes
                    pasos.
                </p>
                <p className="mt-2 text-warm-500">
                    Si la propuesta encaja con nuestra comunidad, la publicamos en las
                    páginas relevantes (campamentos, extraescolares, etc.). Si no encaja en
                    este momento, te explicamos por qué.
                </p>
            </>
        ),
    },
    {
        q: "¿Tiene algún coste?",
        a: (
            <>
                <p>
                    Enviar tu propuesta es <strong className="text-warm-900">100% gratis</strong>.
                    Una vez aprobada, tampoco cobramos por la presencia básica.
                </p>
                <p className="mt-2 text-warm-500">
                    Solo si te interesa aparecer destacado o promocionado en posiciones
                    premium hablaremos contigo de planes específicos. Sin compromiso.
                </p>
            </>
        ),
    },
];

export function Faq() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="mt-24" aria-labelledby="faq-heading">
            {/* Section heading — editorial rule */}
            <div className="flex items-center gap-4 mb-10">
                <span className="text-[11px] uppercase tracking-[0.28em] font-bold text-copper-600">
                    N.º 02
                </span>
                <span className="flex-1 h-px bg-warm-300" aria-hidden="true" />
                <span className="text-[11px] uppercase tracking-[0.22em] font-bold text-warm-500">
                    Preguntas frecuentes
                </span>
            </div>

            <div className="grid grid-cols-12 gap-x-6 sm:gap-x-12 gap-y-8 items-start">
                <h2
                    id="faq-heading"
                    className="col-span-12 lg:col-span-4 font-display font-extrabold leading-[0.95] tracking-[-0.02em] text-warm-900 text-[clamp(1.85rem,3.8vw,2.75rem)]"
                >
                    Lo que se{" "}
                    <span className="italic font-medium text-copper-700">pregunta</span>{" "}
                    siempre.
                </h2>

                <div className="col-span-12 lg:col-span-8 lg:pt-2">
                    <ul className="border-t border-warm-300">
                        {FAQS.map((item, i) => {
                            const isOpen = openIndex === i;
                            return (
                                <li
                                    key={i}
                                    className="border-b border-warm-300"
                                >
                                    <button
                                        type="button"
                                        aria-expanded={isOpen}
                                        onClick={() => setOpenIndex(isOpen ? null : i)}
                                        className="w-full flex items-center justify-between gap-6 py-5 text-left group"
                                    >
                                        <span className="font-display text-[16px] sm:text-[17px] font-bold text-warm-900 leading-snug pr-4">
                                            {item.q}
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className={`shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                                                isOpen
                                                    ? "bg-copper-600 text-white"
                                                    : "bg-warm-100 text-warm-700 group-hover:bg-copper-100 group-hover:text-copper-700"
                                            }`}
                                        >
                                            {isOpen ? (
                                                <Minus className="h-3.5 w-3.5" />
                                            ) : (
                                                <Plus className="h-3.5 w-3.5" />
                                            )}
                                        </span>
                                    </button>
                                    <div
                                        className="grid transition-[grid-template-rows] duration-300 ease-out"
                                        style={{
                                            gridTemplateRows: isOpen ? "1fr" : "0fr",
                                        }}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="pb-5 pr-12 text-[14.5px] leading-[1.65] text-warm-700">
                                                {item.a}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </section>
    );
}
