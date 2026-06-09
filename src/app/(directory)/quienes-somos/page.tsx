import Link from "next/link";
import type { Metadata } from "next";
import { Users, Shield, MapPin, Heart, ArrowRight } from "lucide-react";
import { getCityConfig } from "@/config/city";

export const metadata: Metadata = {
    title: "Quiénes Somos | Papás en CDMX",
    description:
        "Menos pantallas, más infancia. Conoce a Papás en CDMX, el directorio verificado para familias en la Ciudad de México.",
};

const config = getCityConfig();

const values = [
    {
        icon: Users,
        title: "Comunidad",
        description:
            "Conectamos familias con los mejores servicios locales, creando una red de confianza entre padres.",
    },
    {
        icon: Shield,
        title: "Verificación",
        description:
            "Todos nuestros listados pasan por un proceso de verificación para garantizar calidad y fiabilidad.",
    },
    {
        icon: MapPin,
        title: "Local",
        description:
            "Nos enfocamos en servicios cercanos a ti, porque sabemos que la proximidad importa para las familias.",
    },
    {
        icon: Heart,
        title: "Pasión",
        description:
            "Somos padres también, y entendemos las necesidades reales de las familias mexicanas.",
    },
];

export default function QuienesSomosPage() {
    return (
        <main>
            {/* Hero */}
            <section className="container-padres section-padding text-center">
                <span className="badge-verified text-xs font-bold uppercase tracking-wide mb-6 inline-block">
                    Nuestra Historia
                </span>
                <h1 className="font-display text-display-lg sm:text-display-xl text-ocean-900 mb-6">
                    Menos pantallas,
                    <br />
                    <span className="text-copper-500">más infancia</span>
                </h1>
                <div className="max-w-2xl mx-auto">
                    <p className="card p-6 text-warm-500 text-lg leading-relaxed">
                        Nacimos en {config.cityName} para ayudar a los padres a encontrar lo
                        mejor para sus hijos, cerca de casa.
                    </p>
                </div>
            </section>

            {/* Manifesto */}
            <section className="border-t border-warm-200">
                <div className="container-padres section-padding">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <p className="text-warm-500 text-lg leading-relaxed">
                            <strong className="text-ocean-900">
                                Verificamos cada recomendación.
                            </strong>{" "}
                            Porque sabemos que cuando buscas un pediatra a las 3 de la mañana
                            o un campamento para agosto, no quieres 50 opciones de Google.
                            Quieres la correcta.
                        </p>
                        <p className="text-warm-500 text-lg leading-relaxed">
                            <strong className="text-ocean-900">
                                Somos padres, no influencers.
                            </strong>{" "}
                            No nos paga nadie por recomendar algo. Si un sitio está en nuestro
                            directorio, es porque merece estar.
                        </p>
                        <p className="text-warm-500 text-lg leading-relaxed">
                            <strong className="text-ocean-900">
                                Creemos en lo local.
                            </strong>{" "}
                            En el parque de tu barrio, en la tienda de la esquina, en la
                            academia donde conocerá a sus mejores amigos. Internet está genial,
                            pero la infancia pasa en las calles.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="bg-warm-100 border-t border-warm-200">
                <div className="container-padres section-padding">
                    <h2 className="font-display text-display-sm text-ocean-900 text-center mb-10">
                        Nuestros Valores
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {values.map((value) => (
                            <div key={value.title} className="card p-6">
                                <value.icon className="w-9 h-9 text-copper-500 mb-4" />
                                <h3 className="font-display text-base font-bold text-ocean-900 mb-2">
                                    {value.title}
                                </h3>
                                <p className="text-sm text-warm-500 leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="border-t border-warm-200">
                <div className="container-padres section-padding">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="card p-8 text-center">
                            <div className="font-display text-display-md text-copper-500 mb-1">
                                2023
                            </div>
                            <div className="font-bold text-sm text-ocean-900 uppercase tracking-wide mb-1">
                                Fundación
                            </div>
                            <p className="text-xs text-warm-400">Empezamos en la CDMX</p>
                        </div>
                        <div className="card p-8 text-center">
                            <div className="font-display text-display-md text-copper-500 mb-1">
                                +{config.subscriberCount.toLocaleString("es-MX")}
                            </div>
                            <div className="font-bold text-sm text-ocean-900 uppercase tracking-wide mb-1">
                                Familias
                            </div>
                            <p className="text-xs text-warm-400">
                                Suscritas a nuestra newsletter
                            </p>
                        </div>
                        <div className="card p-8 text-center">
                            <div className="font-display text-display-md text-copper-500 mb-1">
                                12
                            </div>
                            <div className="font-bold text-sm text-ocean-900 uppercase tracking-wide mb-1">
                                Ciudades
                            </div>
                            <p className="text-xs text-warm-400">
                                En expansión durante 2026
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-ocean-900">
                <div className="container-padres section-padding text-center">
                    <h2 className="font-display text-display-sm text-white mb-4">
                        ¿Quieres formar parte?
                    </h2>
                    <p className="text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed">
                        Si tienes un negocio enfocado en familias, únete a nuestro
                        directorio y llega a miles de padres buscando servicios como el
                        tuyo.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                            href="/colaborar"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-transparent px-6 py-3 font-body font-bold text-white transition-all duration-200 hover:bg-white hover:text-ocean-900"
                        >
                            Soy Empresa <ArrowRight className="h-4 w-4" />
                        </a>
                        <Link href="/contacto" className="btn-copper">
                            Contactar
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
