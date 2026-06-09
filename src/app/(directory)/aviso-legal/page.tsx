import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Aviso Legal | Papás en CDMX",
    description: "Aviso legal e información sobre la empresa Papás en México.",
};

export default function AvisoLegalPage() {
    return (
        <main className="container-padres section-padding">
            <div className="max-w-3xl mx-auto">
                <h1 className="font-display text-display-md sm:text-display-lg text-ocean-900 mb-8">
                    Aviso Legal
                </h1>

                {/* Datos identificativos */}
                <div className="card p-6 sm:p-8 mb-6">
                    <h2 className="font-display text-lg font-bold text-ocean-900 mb-4">
                        Datos identificativos
                    </h2>
                    <p className="text-sm text-warm-500 mb-4">
                        Conforme a la legislación mexicana aplicable al comercio electrónico
                        y a la protección de datos personales, se informa:
                    </p>
                    <ul className="space-y-2 text-sm text-warm-500">
                        <li>
                            <strong className="text-warm-800">Denominación social:</strong>{" "}
                            Papás en México
                        </li>
                        <li>
                            <strong className="text-warm-800">Titular:</strong>{" "}
                            Local Family Network LTD
                        </li>
                        <li>
                            <strong className="text-warm-800">Domicilio:</strong> Ciudad de México,
                            México
                        </li>
                        <li>
                            <strong className="text-warm-800">Correo electrónico:</strong>{" "}
                            hola@papasencdmx.com
                        </li>
                        <li>
                            <strong className="text-warm-800">Sitio web:</strong>{" "}
                            papasencdmx.com
                        </li>
                    </ul>
                </div>

                {/* Propiedad intelectual */}
                <div className="card p-6 sm:p-8 mb-6">
                    <h2 className="font-display text-lg font-bold text-ocean-900 mb-4">
                        Propiedad intelectual
                    </h2>
                    <p className="text-sm text-warm-500 leading-relaxed">
                        Todos los contenidos de este sitio web, incluyendo textos, imágenes,
                        gráficos, logos, iconos, software y cualquier otro material, están
                        protegidos por las leyes de propiedad intelectual e industrial.
                        Queda prohibida su reproducción, distribución, comunicación pública o
                        transformación sin autorización expresa.
                    </p>
                </div>

                {/* Exclusión de responsabilidad */}
                <div className="card p-6 sm:p-8 mb-6">
                    <h2 className="font-display text-lg font-bold text-ocean-900 mb-4">
                        Exclusión de responsabilidad
                    </h2>
                    <p className="text-sm text-warm-500 leading-relaxed">
                        Papás en México no se hace responsable de los contenidos o servicios
                        de terceros enlazados desde esta web. La información proporcionada
                        tiene carácter orientativo y no constituye asesoramiento profesional.
                    </p>
                </div>

                {/* Documentos legales */}
                <div className="card p-6 sm:p-8">
                    <h2 className="font-display text-lg font-bold text-ocean-900 mb-4">
                        Documentos legales
                    </h2>
                    <p className="text-sm text-warm-500 mb-4">
                        Consulta nuestros documentos legales completos:
                    </p>
                    <ul className="space-y-2">
                        <li>
                            <Link
                                href="/politica-privacidad"
                                className="text-sm font-semibold text-copper-500 hover:text-copper-400 transition-colors"
                            >
                                Política de Privacidad
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/terminos-uso"
                                className="text-sm font-semibold text-copper-500 hover:text-copper-400 transition-colors"
                            >
                                Términos de Uso
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
