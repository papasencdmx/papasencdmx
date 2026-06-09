"use client";

import { useEffect, useState } from "react";
import { Sparkles, Mail, Tag, MapPin, Compass, ShieldCheck, X, Loader2, Check } from "lucide-react";

const COOKIE_KEY = "pem_cookie_consent";
const DISMISSED_KEY = "pem_newsletter_dismissed_v1";
const SUBSCRIBED_KEY = "pem_newsletter_subscribed_v1";
const DELAY_MS = 12000;
const COOLDOWN_DAYS = 30;

export function NewsletterPopup() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Skip if already subscribed
        try {
            if (localStorage.getItem(SUBSCRIBED_KEY)) return;
            const dismissedAt = localStorage.getItem(DISMISSED_KEY);
            if (dismissedAt) {
                const days = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
                if (days < COOLDOWN_DAYS) return;
            }
        } catch {
            // localStorage unavailable — bail
            return;
        }

        let timer: ReturnType<typeof setTimeout> | null = null;
        let fired = false;

        const fire = () => {
            if (fired) return;
            fired = true;
            if (timer) clearTimeout(timer);
            document.removeEventListener("mouseout", onMouseLeave);
            setOpen(true);
        };

        const onMouseLeave = (e: MouseEvent) => {
            // Exit-intent: mouse left through the top edge of the viewport.
            // Skip on touch devices (no real mouse).
            if (e.clientY > 0) return;
            if (e.relatedTarget) return;
            fire();
        };

        const startCountdown = () => {
            if (timer) return;
            timer = setTimeout(fire, DELAY_MS);
            // Only attach exit-intent on devices with a real pointer.
            const hasFinePointer =
                typeof window.matchMedia === "function" &&
                window.matchMedia("(hover: hover) and (pointer: fine)").matches;
            if (hasFinePointer) {
                document.addEventListener("mouseout", onMouseLeave);
            }
        };

        const stored = (() => {
            try {
                return localStorage.getItem(COOKIE_KEY);
            } catch {
                return null;
            }
        })();

        if (stored) {
            startCountdown();
        } else {
            const onConsent = () => startCountdown();
            window.addEventListener("pem:consent", onConsent as EventListener);
            return () => {
                window.removeEventListener("pem:consent", onConsent as EventListener);
                document.removeEventListener("mouseout", onMouseLeave);
                if (timer) clearTimeout(timer);
            };
        }
        return () => {
            document.removeEventListener("mouseout", onMouseLeave);
            if (timer) clearTimeout(timer);
        };
    }, []);

    // Lock scroll while open
    useEffect(() => {
        if (!open) return;
        const orig = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = orig;
        };
    }, [open]);

    const close = (asDismiss = true) => {
        if (asDismiss) {
            try {
                localStorage.setItem(DISMISSED_KEY, String(Date.now()));
            } catch {
                // ignore
            }
        }
        setOpen(false);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        const trimmed = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setError("Email no válido");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: trimmed }),
            });
            if (!res.ok) {
                setError("No pudimos suscribirte. Inténtalo en un momento.");
                setSubmitting(false);
                return;
            }
            setDone(true);
            try {
                localStorage.setItem(SUBSCRIBED_KEY, String(Date.now()));
            } catch {
                // ignore
            }
            setTimeout(() => close(false), 2200);
        } catch {
            setError("Error de conexión.");
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Suscríbete a Papás en CDMX"
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center px-3 sm:px-4 sm:py-6 animate-fade-in"
        >
            {/* Backdrop */}
            <button
                aria-label="Cerrar"
                onClick={() => close(true)}
                className="absolute inset-0 bg-warm-900/45 backdrop-blur-[3px]"
            />

            {/* Card */}
            <div
                className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.25)] ring-1 ring-warm-100 overflow-hidden animate-slide-up"
            >
                {/* Decorative top band */}
                <div
                    aria-hidden="true"
                    className="relative h-24 sm:h-28 overflow-hidden"
                    style={{
                        background:
                            "linear-gradient(120deg, #FFE4D6 0%, #FFD0B8 35%, #FFB591 70%, #F97316 100%)",
                    }}
                >
                    <div className="absolute -top-6 -right-4 h-32 w-32 rounded-full bg-white/40 blur-2xl" />
                    <div className="absolute bottom-0 -left-6 h-24 w-24 rounded-full bg-amber-200/60 blur-2xl" />
                    <div className="relative flex h-full items-center justify-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-4 py-2 shadow-md ring-1 ring-white/40">
                            <Sparkles className="h-4 w-4 text-brand-500" aria-hidden="true" />
                            <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand-700">
                                Comunidad Papás en CDMX
                            </span>
                        </div>
                    </div>
                </div>

                {/* Close */}
                <button
                    type="button"
                    onClick={() => close(true)}
                    aria-label="Cerrar"
                    className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-warm-700 shadow-md ring-1 ring-warm-200 backdrop-blur hover:bg-white transition"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>

                {/* Body */}
                <div className="px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
                    {!done ? (
                        <>
                            <h2 className="font-display text-[22px] sm:text-[24px] font-extrabold leading-[1.15] text-warm-900">
                                Lo mejor para tu familia en la CDMX, directo a tu correo
                            </h2>
                            <p className="mt-2 text-[14px] text-warm-600 leading-relaxed">
                                Recomendaciones, ofertas exclusivas y los recursos que de verdad
                                usamos las familias madrileñas — cada semana, sin ruido.
                            </p>

                            {/* Value bullets */}
                            <ul className="mt-4 space-y-2.5">
                                <Bullet
                                    icon={Tag}
                                    iconBg="bg-red-50"
                                    iconColor="text-red-600"
                                    text="Descuentos exclusivos para nuestra comunidad"
                                />
                                <Bullet
                                    icon={Compass}
                                    iconBg="bg-ocean-100"
                                    iconColor="text-ocean-700"
                                    text="Colegios, extraescolares, campamentos, servicios y más"
                                />
                                <Bullet
                                    icon={MapPin}
                                    iconBg="bg-emerald-50"
                                    iconColor="text-emerald-600"
                                    text="Planes y novedades de tu barrio antes que el resto"
                                />
                                <Bullet
                                    icon={ShieldCheck}
                                    iconBg="bg-warm-100"
                                    iconColor="text-warm-700"
                                    text="Solo lo verificado — cero spam, cancelas cuando quieras"
                                />
                            </ul>

                            {/* Form */}
                            <form onSubmit={submit} className="mt-5">
                                <label htmlFor="np-email" className="sr-only">
                                    Email
                                </label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative flex-1">
                                        <Mail
                                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400"
                                            aria-hidden="true"
                                        />
                                        <input
                                            id="np-email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="tu@email.com"
                                            className="w-full rounded-xl border border-warm-200 bg-white pl-9 pr-3 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-[14px] font-bold text-white hover:bg-brand-600 active:scale-[0.98] transition disabled:opacity-60"
                                    >
                                        {submitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                        ) : (
                                            <>Quiero unirme</>
                                        )}
                                    </button>
                                </div>
                                {error && (
                                    <p className="mt-2 text-[12px] font-semibold text-red-600">{error}</p>
                                )}
                            </form>

                            <button
                                type="button"
                                onClick={() => close(true)}
                                className="mt-3 block text-[12px] text-warm-400 hover:text-warm-600 transition"
                            >
                                No, gracias — prefiero perderme las ofertas
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-center py-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                                <Check className="h-7 w-7" aria-hidden="true" />
                            </div>
                            <h2 className="font-display text-[20px] font-extrabold text-warm-900">
                                ¡Estás dentro!
                            </h2>
                            <p className="mt-2 text-[14px] text-warm-600 leading-relaxed">
                                Te acabamos de mandar un email de bienvenida. La próxima edición
                                con ofertas llega esta semana.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Bullet({
    icon: Icon,
    iconBg,
    iconColor,
    text,
}: {
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    text: string;
}) {
    return (
        <li className="flex items-start gap-2.5">
            <span
                className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
            >
                <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[13.5px] text-warm-700 leading-snug">{text}</span>
        </li>
    );
}
