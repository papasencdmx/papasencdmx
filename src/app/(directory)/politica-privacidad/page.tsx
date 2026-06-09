import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Política de Privacidad | Papás en CDMX",
    description:
        "Política de privacidad y protección de datos personales de Papás en México.",
};

export default function PoliticaPrivacidadPage() {
    const lastUpdated = new Date().toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const sections = [
        {
            title: "1. Responsable del Tratamiento",
            content:
                "Papás en México, operado por Local Family Network LTD, es responsable del tratamiento de los datos personales recogidos a través de este sitio web.",
        },
        {
            title: "2. Datos que Recopilamos",
            content:
                "Recopilamos los datos personales que nos proporcionas voluntariamente a través de nuestros formularios de contacto, incluyendo:",
            list: [
                "Nombre y apellidos",
                "Dirección de correo electrónico",
                "Número de teléfono",
                "Empresa u organización",
                "Cualquier otra información que decidas compartir con nosotros",
            ],
        },
        {
            title: "3. Finalidad del Tratamiento",
            content: "Utilizamos tus datos personales para:",
            list: [
                "Responder a tus consultas y solicitudes de información",
                "Gestionar las solicitudes de publicidad en nuestra red de medios",
                "Enviarte información comercial sobre nuestros servicios, si has dado tu consentimiento",
                "Mejorar nuestros servicios y la experiencia del usuario",
            ],
        },
        {
            title: "4. Base Legal",
            content:
                "El tratamiento de tus datos se basa en tu consentimiento expreso al enviar los formularios de contacto, así como en nuestro interés legítimo de gestionar las relaciones comerciales.",
        },
        {
            title: "5. Conservación de Datos",
            content:
                "Conservaremos tus datos personales mientras sea necesario para cumplir con las finalidades descritas y durante el tiempo exigido por la legislación aplicable.",
        },
        {
            title: "6. Tus Derechos",
            content: "Tienes derecho a:",
            list: [
                "Acceder a tus datos personales",
                "Rectificar datos inexactos o incompletos",
                "Solicitar la supresión de tus datos",
                "Oponerte al tratamiento de tus datos",
                "Solicitar la limitación del tratamiento",
                "Solicitar la portabilidad de tus datos",
            ],
            footer:
                "Para ejercer estos derechos, puedes contactarnos a través de nuestra página de contacto.",
        },
        {
            title: "7. Cookies",
            content:
                "Este sitio web puede utilizar cookies para mejorar la experiencia del usuario. Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestro sitio web.",
        },
        {
            title: "8. Modificaciones",
            content:
                "Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento. Cualquier cambio será publicado en esta página con la fecha de actualización correspondiente.",
        },
        {
            title: "9. Contacto",
            content:
                "Si tienes preguntas sobre esta política de privacidad o sobre cómo tratamos tus datos personales, puedes contactarnos a través de nuestra página de contacto.",
        },
    ];

    return (
        <main className="container-padres section-padding">
            <div className="max-w-3xl mx-auto">
                <h1 className="font-display text-display-md sm:text-display-lg text-ocean-900 mb-4">
                    Política de Privacidad
                </h1>
                <p className="text-sm text-warm-400 mb-10">
                    Última actualización: {lastUpdated}
                </p>

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
                            {section.footer && (
                                <p className="text-sm text-warm-500 leading-relaxed">
                                    {section.footer}
                                </p>
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
