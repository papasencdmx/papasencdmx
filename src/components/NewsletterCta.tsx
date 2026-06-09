"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

interface NewsletterCtaProps {
    subscriberCount: number;
    cityName: string;
}

export function NewsletterCta({ subscriberCount, cityName }: NewsletterCtaProps) {
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

    return (
        <section className="container-padres pt-14">
            <div className="rounded-2xl bg-warm-100 border border-warm-200 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-8">
                {/* Illustration */}
                <div className="hidden sm:block shrink-0">
                    <img
                        src="/icons/mail_person.png"
                        alt="Newsletter"
                        className="w-28 h-28 object-contain"
                    />
                </div>

                {/* Copy */}
                <div className="flex-1 max-w-lg">
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ocean-900 tracking-tight">
                        La newsletter local que leen {subscriberCount.toLocaleString("es-MX")} familias en {cityName}
                    </h2>
                    <p className="text-sm text-warm-500 mt-2 leading-relaxed">
                        Planes, colegios, campamentos y recomendaciones verificadas. Cada miércoles y domingo en tu bandeja.
                    </p>
                </div>

                {/* Email form */}
                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                    {status === "success" ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 rounded-xl px-5 py-3">
                            ¡Bienvenido/a! 🎉 Revisa tu bandeja
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 sm:flex-initial flex items-center gap-2 rounded-xl border border-warm-300 bg-white px-4 py-3 text-sm transition-colors focus-within:border-copper-400">
                                <Mail className="h-4 w-4 shrink-0 text-warm-400" />
                                <input
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                                    disabled={status === "loading"}
                                    className="flex-1 bg-transparent outline-none text-sm text-ocean-900 placeholder:text-warm-400 min-w-0"
                                />
                            </div>
                            <button
                                onClick={handleSubscribe}
                                disabled={status === "loading"}
                                className="btn-copper text-sm whitespace-nowrap"
                            >
                                {status === "loading" ? "..." : status === "error" ? "Reintentar" : "Suscríbete"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
