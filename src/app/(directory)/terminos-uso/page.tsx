import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Términos de Uso | Papás en CDMX",
    description:
        "Términos y condiciones de uso del sitio web Papás en México.",
};

export default function TerminosUsoPage() {
    const lastUpdated = new Date().toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const sections = [
        {
            title: "1. Aceptación de los Términos",
            content:
                "Al acceder y utilizar el sitio web de Papás en México, aceptas cumplir con estos términos de uso. Si no estás de acuerdo con alguna parte de estos términos, te rogamos que no utilices nuestro sitio web.",
        },
        {
            title: "2. Descripción del Servicio",
            content:
                "Papás en México es un directorio verificado de servicios familiares y una red de medios digitales enfocada en contenido para familias en México. Ofrecemos un directorio de servicios verificados y servicios de publicidad para empresas que desean conectar con padres y familias.",
        },
        {
            title: "3. Uso del Sitio Web",
            content:
                "Te comprometes a utilizar este sitio web de manera responsable y conforme a la legislación vigente. Queda prohibido:",
            list: [
                "Utilizar el sitio web con fines ilegales o no autorizados",
                "Intentar acceder a áreas restringidas del sitio",
                "Transmitir virus o código malicioso",
                "Recopilar información de otros usuarios sin su consentimiento",
                "Interferir con el funcionamiento normal del sitio web",
            ],
        },
        {
            title: "4. Propiedad Intelectual",
            content:
                "Todo el contenido de este sitio web, incluyendo textos, gráficos, logotipos, imágenes, y software, es propiedad de Papás en México o de sus licenciantes y está protegido por las leyes de propiedad intelectual. No está permitida la reproducción, distribución, comunicación pública o transformación de estos contenidos sin autorización expresa.",
        },
        {
            title: "5. Directorio y Listados",
            content:
                "Los listados del directorio son verificados por nuestro equipo, pero no garantizamos la exactitud completa de toda la información. Los servicios listados son responsables de la veracidad de sus datos. Recomendamos siempre contactar directamente con el servicio para confirmar información actualizada.",
        },
        {
            title: "6. Enlaces a Terceros",
            content:
                "Este sitio web puede contener enlaces a sitios web de terceros. No somos responsables del contenido, políticas de privacidad o prácticas de estos sitios externos.",
        },
        {
            title: "7. Limitación de Responsabilidad",
            content:
                'El sitio web se proporciona "tal cual" y "según disponibilidad". No garantizamos que el sitio esté libre de errores o que funcione de manera ininterrumpida. No seremos responsables de daños directos, indirectos, incidentales o consecuentes derivados del uso de este sitio web.',
        },
        {
            title: "8. Modificaciones",
            content:
                "Nos reservamos el derecho de modificar estos términos de uso en cualquier momento. Los cambios entrarán en vigor desde su publicación en esta página. Te recomendamos revisar periódicamente estos términos.",
        },
        {
            title: "9. Ley Aplicable",
            content:
                "Estos términos se rigen por la legislación mexicana. Cualquier disputa relacionada con estos términos estará sujeta a la jurisdicción de los tribunales mexicanos.",
        },
        {
            title: "10. Contacto",
            content:
                "Si tienes preguntas sobre estos términos de uso, puedes contactarnos a través de nuestra página de contacto.",
        },
    ];

    return (
        <main className="container-padres section-padding">
            <div className="max-w-3xl mx-auto">
                <h1 className="font-display text-display-md sm:text-display-lg text-ocean-900 mb-4">
                    Términos de Uso
                </h1>
                <p className="text-sm text-warm-400 mb-6">
                    Última actualización: {lastUpdated}
                </p>

                <div className="rounded-2xl bg-ocean-50 border border-ocean-100 p-5 mb-10">
                    <p className="text-sm text-ocean-900 leading-relaxed">
                        <strong className="font-semibold">¿Vas a reservar una plaza o pack?</strong>{" "}
                        La compra de entradas, plazas y campamentos se rige por unos
                        Términos de compra específicos.{" "}
                        <Link
                            href="/terminos-compra"
                            className="font-semibold underline decoration-ocean-300 underline-offset-2 hover:text-ocean-700"
                        >
                            Consulta los Términos de compra
                        </Link>
                        .
                    </p>
                </div>

                <div className="space-y-8">
                    {sections.map((section) => (
                        <section key={section.title} className="space-y-3">
                            <h2 className="font-display text-lg font-bold text-ocean-900">
                                {section.title}
                            </h2>
                            <p className="text-sm text-warm-500 leading-relaxed">
                                {section.content}
                            </p>
                            {section.list && (
                                <ul className="list-disc pl-6 space-y-1.5 text-sm text-warm-500">
                                    {section.list.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}
                </div>

                <div className="mt-12 pt-8 border-t border-warm-200">
                    <p className="text-sm text-warm-400">
                        ¿Tienes preguntas?{" "}
                        <Link
                            href="/contacto"
                            className="font-semibold text-copper-500 hover:text-copper-400 transition-colors"
                        >
                            Contacta con nosotros
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
