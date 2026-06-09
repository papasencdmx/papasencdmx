"use client";

import { useState } from "react";
import { Mail, Sun, Moon } from "lucide-react";
import { HeroAnimation } from "./HeroAnimation";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
import waitAnimation from "../../public/wait.json";

interface HeroSectionProps {
    subscriberCount: number;
    cityName: string;
    newsletterDomain: string;
    displayCount: number;
}

export function HeroSection({
    subscriberCount,
    cityName,
    newsletterDomain,
    displayCount,
}: HeroSectionProps) {
    const [isLight, setIsLight] = useState(false);

    const pill = (
        <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 border transition-colors duration-500 ${isLight ? "bg-copper-500/10 border-copper-500/20" : "bg-white/10 border-white/10"
                }`}
        >
            <span className="flex -space-x-1 text-sm">
                <span>😊</span><span>👶</span><span>👨‍👩‍👧</span><span>🧡</span>
            </span>
            <span className={`text-xs sm:text-sm font-medium transition-colors duration-500 ${isLight ? "text-ocean-900/70" : "text-white/85"}`}>
                {subscriberCount.toLocaleString("es-MX")}+ familias ya suscritas
            </span>
        </div>
    );

    const toggle = (
        <button
            onClick={() => setIsLight(!isLight)}
            className={`p-2.5 rounded-full transition-all duration-300 backdrop-blur-md flex-shrink-0 ${isLight
                ? "bg-ocean-900/10 text-ocean-900 hover:bg-ocean-900/20"
                : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }`}
            aria-label={isLight ? "Modo oscuro" : "Modo claro"}
        >
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
    );

    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubscribe = async () => {
        if (!email || !email.includes("@")) return;
        setStatus("loading");
        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                setStatus("success");
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };

    const emailCta = (
        <div className="mt-6 flex items-stretch gap-2 max-w-sm sm:max-w-md">
            <div
                className={`flex-1 flex items-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm transition-all duration-500 ${isLight
                    ? "border-warm-300 bg-white/80 shadow-sm"
                    : "border-white/20 bg-white/[0.08] shadow-[0_0_12px_rgba(255,255,255,0.04)]"
                    }`}
            >
                <Mail className={`h-4 w-4 shrink-0 ${isLight ? "text-warm-400" : "text-white/40"}`} />
                <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                    disabled={status === "success"}
                    className={`flex-1 bg-transparent outline-none text-sm placeholder:opacity-50 ${isLight ? "text-ocean-900 placeholder:text-warm-400" : "text-white placeholder:text-white/40"
                        }`}
                />
            </div>
            <button
                onClick={handleSubscribe}
                disabled={status === "loading" || status === "success"}
                className={`btn-copper whitespace-nowrap text-sm px-5 flex items-center rounded-xl transition-all duration-300 ${status === "success" ? "opacity-90 cursor-default" : ""
                    }`}
            >
                {status === "loading" && (
                    <span className="w-9 h-9" style={{ filter: "brightness(0) invert(1)" }}>
                        <Lottie animationData={waitAnimation} loop autoplay style={{ width: 36, height: 36 }} />
                    </span>
                )}
                {status === "success" && "¡Estás dentro! 🎉"}
                {status === "error" && "Reintentar"}
                {status === "idle" && "Suscribete"}
            </button>
        </div>
    );

    const stats = (
        <div className="flex gap-4 sm:gap-5 lg:gap-7 justify-between sm:justify-start">
            {[
                { icon: "👥", value: `${(subscriberCount / 1000).toFixed(0)}K`, label: "suscriptores" },
                { icon: "📧", value: "49%", label: "apertura" },
                { icon: "✅", value: `${displayCount.toLocaleString("es-MX")}+`, label: "servicios verificados" },
            ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2.5">
                    <span className="text-xl">{stat.icon}</span>
                    <div>
                        <p className={`font-display text-xl font-extrabold tracking-tight transition-colors duration-500 ${isLight ? "text-ocean-900" : "text-white"}`}>
                            {stat.value}
                        </p>
                        <p className={`text-[11px] uppercase tracking-wider font-semibold transition-colors duration-500 ${isLight ? "text-warm-500" : "text-white/45"}`}>
                            {stat.label}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <section
            className={`relative overflow-hidden transition-colors duration-500 ${isLight
                ? "bg-gradient-to-br from-[#FFF9F0] via-[#FFF4E8] to-[#FFEBD4]"
                : "bg-gradient-to-br from-ocean-900 via-[#2A4A6E] to-ocean-900"
                }`}
        >
            {/* Dot pattern */}
            <div
                className={`absolute inset-0 transition-opacity duration-500 ${isLight ? "opacity-[0.06]" : "opacity-[0.04]"}`}
                style={{
                    backgroundImage: isLight
                        ? "radial-gradient(circle at 1px 1px, #C87941 1px, transparent 0)"
                        : "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "40px 40px",
                }}
            />

            {/* Mobile: Lottie background illustration */}
            <div className="absolute right-[-30px] top-[38%] -translate-y-1/2 w-[260px] sm:w-[300px] opacity-[0.18] lg:hidden pointer-events-none">
                <HeroAnimation />
            </div>

            {/* ─── MOBILE ─── */}
            <div className="lg:hidden container-padres relative py-6 flex flex-col" style={{ minHeight: "520px" }}>
                {/* TOP: badge + toggle on same row */}
                <div className="flex items-center justify-between">
                    {pill}
                    {toggle}
                </div>

                {/* CENTER: content block — my-auto splits space equally above & below */}
                <div className="flex-1 flex flex-col">
                    <div className="my-auto">
                        <h1 className={`font-display text-[clamp(28px,5vw,42px)] font-extrabold leading-[1.12] tracking-tight transition-colors duration-500 ${isLight ? "text-ocean-900" : "text-white"}`}>
                            Tu guia familiar{" "}
                            <br className="hidden sm:block" />
                            para vivir en <span className="text-copper-500">{cityName}</span>
                        </h1>

                        <p className={`mt-4 text-[15px] sm:text-lg leading-relaxed max-w-sm sm:max-w-md transition-colors duration-500 ${isLight ? "text-warm-600" : "text-white/70"}`}>
                            Cada semana: los mejores planes, recursos y recomendaciones para
                            familias. Directorio verificado de +{displayCount.toLocaleString("es-MX")} servicios.
                        </p>

                        {emailCta}

                        <p className={`mt-2.5 text-xs transition-colors duration-500 ${isLight ? "text-warm-400" : "text-white/35"}`}>
                            Gratis para siempre. Solo contenido útil para ti y tu familia.
                        </p>
                    </div>
                </div>

                {/* BOTTOM: stats anchored at bottom */}
                {stats}
            </div>

            {/* ─── DESKTOP ─── */}
            <div className="hidden lg:block container-padres relative py-16">
                <div className="absolute top-4 right-4 z-10">{toggle}</div>

                <div className="flex items-center gap-12">
                    <div className="flex-1 max-w-xl">
                        <div className="mb-5">{pill}</div>

                        <h2 className={`font-display text-[clamp(32px,4.5vw,42px)] font-extrabold leading-[1.12] tracking-tight transition-colors duration-500 ${isLight ? "text-ocean-900" : "text-white"}`}>
                            Tu guia familiar<br />para vivir en <span className="text-copper-500">{cityName}</span>
                        </h2>

                        <p className={`mt-4 text-lg leading-relaxed max-w-md transition-colors duration-500 ${isLight ? "text-warm-600" : "text-white/70"}`}>
                            Cada semana: los mejores planes, recursos y recomendaciones para familias. Directorio verificado de +{displayCount.toLocaleString("es-MX")} servicios.
                        </p>

                        {emailCta}

                        <p className={`mt-2.5 text-xs transition-colors duration-500 ${isLight ? "text-warm-400" : "text-white/35"}`}>
                            Gratis para siempre. Solo contenido útil para ti y tu familia.
                        </p>
                    </div>

                    <div className="flex items-center justify-end flex-shrink-0 w-[440px] xl:w-[510px] ml-auto -mr-4">
                        <HeroAnimation />
                    </div>
                </div>

                <div className="mt-9">{stats}</div>
            </div>
        </section>
    );
}
