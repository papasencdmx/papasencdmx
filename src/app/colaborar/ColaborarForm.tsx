"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Check, CheckCircle2 } from "lucide-react";
import { ImagePicker } from "./ImagePicker";
import { RotatingPlaceholder } from "./RotatingPlaceholder";

const LISTING_TYPES = [
    { value: "campamento", label: "Campamento" },
    { value: "extraescolar", label: "Extraescolar" },
    { value: "evento", label: "Evento" },
    { value: "plan_familiar", label: "Plan familiar" },
    { value: "otro", label: "Otro" },
];

const ACTIVITY_TYPES = [
    "Deportivo",
    "Multiaventura",
    "Idiomas",
    "Arte/Creatividad",
    "Tecnología",
    "Naturaleza",
    "Educativo",
    "Musical",
    "Náutico",
];

interface FormState {
    business_name: string;
    contact_name: string;
    email: string;
    phone: string;
    website: string;
    listing_type: string;
    title: string;
    short_description: string;
    activity_types: string[];
    age_min: string;
    age_max: string;
    zone: string;
    street_address: string;
    dates_start: string;
    dates_end: string;
    price: string;
    price_discounted: string;
    image_url: string;
    booking_url: string;
    website_url_confirm: string;
}

const INITIAL: FormState = {
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    website: "",
    listing_type: "",
    title: "",
    short_description: "",
    activity_types: [],
    age_min: "",
    age_max: "",
    zone: "",
    street_address: "",
    dates_start: "",
    dates_end: "",
    price: "",
    price_discounted: "",
    image_url: "",
    booking_url: "",
    website_url_confirm: "",
};

export function ColaborarForm() {
    const searchParams = useSearchParams();
    const [form, setForm] = useState<FormState>(INITIAL);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isPartnerMode = searchParams.get("modo") === "partner";

    useEffect(() => {
        const tipo = searchParams.get("tipo");
        if (tipo && LISTING_TYPES.some((t) => t.value === tipo)) {
            setForm((f) => ({ ...f, listing_type: tipo }));
        }
    }, [searchParams]);

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((f) => ({ ...f, [key]: value }));

    const descLen = form.short_description.length;
    const descLimit = 300;

    const priceNum = form.price === "" ? null : Number(form.price);
    const priceDiscNum = form.price_discounted === "" ? null : Number(form.price_discounted);
    const priceValid =
        priceDiscNum == null || priceNum == null || priceDiscNum < priceNum;

    const canProceed =
        form.business_name.trim().length >= 2 &&
        form.contact_name.trim().length >= 2 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
        form.phone.trim().length >= 6 &&
        form.listing_type &&
        form.title.trim().length >= 3 &&
        form.short_description.trim().length >= 20 &&
        form.short_description.length <= 300 &&
        form.activity_types.length > 0 &&
        form.age_min !== "" &&
        form.age_max !== "" &&
        form.zone.trim().length > 0 &&
        priceValid &&
        form.image_url.length > 0 &&
        /^https?:\/\//.test(form.booking_url.trim());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting || !canProceed) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    submission_mode: isPartnerMode ? "paid_partner" : "commission",
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error || "No pudimos enviar tu propuesta. Inténtalo de nuevo.");
                setSubmitting(false);
                return;
            }
            setSuccess(true);
        } catch {
            setError("Error de conexión. Inténtalo en un momento.");
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="grid grid-cols-12 gap-8 lg:gap-12 items-start">
                <div className="col-span-12 lg:col-span-2">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="h-7 w-7" />
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-9">
                    <h2 className="font-display font-extrabold text-[clamp(2rem,4.5vw,3.25rem)] leading-[1] tracking-[-0.02em] text-warm-900">
                        Recibido,{" "}
                        <span className="italic font-medium text-copper-700">gracias.</span>
                    </h2>
                    <div className="mt-6 max-w-xl space-y-4 text-[15px] leading-[1.65] text-warm-700">
                        <p>
                            Tu propuesta está en cola de revisión. En menos de{" "}
                            <strong className="text-warm-900">48 horas</strong> te escribiremos
                            a{" "}
                            <span className="font-bold text-warm-900 underline decoration-copper-400 decoration-2 underline-offset-4">
                                {form.email}
                            </span>{" "}
                            con la decisión y los siguientes pasos.
                        </p>
                        <p className="text-[13.5px] text-warm-500">
                            Mientras tanto, descansa. Lo revisamos a mano, persona a persona.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="grid grid-cols-12 gap-x-6 sm:gap-x-12 gap-y-16 sm:gap-y-24"
            noValidate
        >
            {/* ─────────────────────── §01 ─────────────────────── */}
            <Chapter
                num="01"
                title={
                    <>
                        El equipo
                        <br />
                        <span className="italic font-medium text-copper-700">detrás</span>
                    </>
                }
            >
                <Field label="Nombre del negocio" required>
                    <RotatingPlaceholder
                        type="text"
                        required
                        minLength={2}
                        value={form.business_name}
                        onChange={(e) => update("business_name", e.target.value)}
                    />
                </Field>
                <Field label="Persona de contacto" required>
                    <Input
                        type="text"
                        required
                        value={form.contact_name}
                        onChange={(e) => update("contact_name", e.target.value)}
                        placeholder="Tu nombre"
                    />
                </Field>
                <Grid2>
                    <Field label="Email" required>
                        <Input
                            type="email"
                            required
                            inputMode="email"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            placeholder="tu@email.com"
                        />
                    </Field>
                    <Field label="Teléfono" required>
                        <Input
                            type="tel"
                            required
                            inputMode="tel"
                            value={form.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            placeholder="+52 55 1234 5678"
                        />
                    </Field>
                </Grid2>
                <Field label="Sitio web" hint="Opcional">
                    <Input
                        type="url"
                        inputMode="url"
                        value={form.website}
                        onChange={(e) => update("website", e.target.value)}
                        placeholder="https://"
                    />
                </Field>
            </Chapter>

            {/* ─────────────────────── §02 ─────────────────────── */}
            <Chapter
                num="02"
                title={
                    <>
                        Lo que
                        <br />
                        <span className="italic font-medium text-copper-700">ofreces</span>
                    </>
                }
            >
                <Field label="¿Qué quieres ofrecer?" required>
                    <Select
                        required
                        value={form.listing_type}
                        onChange={(e) => update("listing_type", e.target.value)}
                    >
                        <option value="">Elige una opción…</option>
                        {LISTING_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field
                    label="Título de la actividad"
                    hint={`${form.title.length}/80`}
                    required
                >
                    <Input
                        type="text"
                        required
                        maxLength={80}
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                        placeholder="Ej. Campamento de fútbol con los Pumas"
                    />
                </Field>
                <Field
                    label="Descripción corta"
                    hint={
                        <span className={descLen >= 250 ? "text-copper-600 font-bold" : ""}>
                            {descLen}/{descLimit}
                        </span>
                    }
                    required
                >
                    <textarea
                        required
                        maxLength={descLimit}
                        rows={3}
                        value={form.short_description}
                        onChange={(e) => update("short_description", e.target.value)}
                        placeholder="Resume en 2–3 frases qué hace especial tu actividad"
                        className="w-full bg-white border-0 border-b-[1.5px] border-warm-300 focus:border-copper-600 focus:ring-0 px-0 pt-2 pb-2 text-[16px] leading-[1.55] text-warm-900 placeholder:text-warm-400 resize-none outline-none transition-colors"
                    />
                </Field>

                <Field label="Tipo de actividad" hint="Selecciona los que apliquen" required>
                    <div className="flex flex-wrap gap-2 pt-1">
                        {ACTIVITY_TYPES.map((t) => {
                            const active = form.activity_types.includes(t);
                            return (
                                <button
                                    type="button"
                                    key={t}
                                    onClick={() =>
                                        update(
                                            "activity_types",
                                            active
                                                ? form.activity_types.filter((x) => x !== t)
                                                : [...form.activity_types, t]
                                        )
                                    }
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-1.5 text-[13px] font-semibold transition-all min-h-[36px] ${
                                        active
                                            ? "bg-warm-900 text-warm-50"
                                            : "bg-white text-warm-700 ring-1 ring-warm-300 hover:ring-warm-500"
                                    }`}
                                >
                                    {active && (
                                        <Check
                                            className="h-3.5 w-3.5 text-copper-400"
                                            aria-hidden="true"
                                        />
                                    )}
                                    {t}
                                </button>
                            );
                        })}
                    </div>
                </Field>

                <Grid2>
                    <Field label="Edad mínima" required hint="años">
                        <Input
                            type="number"
                            min={0}
                            max={18}
                            required
                            value={form.age_min}
                            onChange={(e) => update("age_min", e.target.value)}
                            placeholder="4"
                            suffix="años"
                        />
                    </Field>
                    <Field label="Edad máxima" required hint="años">
                        <Input
                            type="number"
                            min={0}
                            max={18}
                            required
                            value={form.age_max}
                            onChange={(e) => update("age_max", e.target.value)}
                            placeholder="12"
                            suffix="años"
                        />
                    </Field>
                </Grid2>

                <Field label="Zona" required>
                    <Input
                        type="text"
                        required
                        value={form.zone}
                        onChange={(e) => update("zone", e.target.value)}
                        placeholder="Polanco · Condesa · Coyoacán…"
                    />
                </Field>
                <Field label="Dirección" hint="Opcional">
                    <Input
                        type="text"
                        value={form.street_address}
                        onChange={(e) => update("street_address", e.target.value)}
                        placeholder="Calle, número, código postal"
                    />
                </Field>
                <Grid2>
                    <Field label="Fecha de inicio" hint="Opcional">
                        <Input
                            type="date"
                            value={form.dates_start}
                            onChange={(e) => update("dates_start", e.target.value)}
                        />
                    </Field>
                    <Field label="Fecha de fin" hint="Opcional">
                        <Input
                            type="date"
                            value={form.dates_end}
                            onChange={(e) => update("dates_end", e.target.value)}
                        />
                    </Field>
                </Grid2>
            </Chapter>

            {/* ─────────────────────── §03 ─────────────────────── */}
            <Chapter
                num="03"
                title={
                    <>
                        El{" "}
                        <span className="italic font-medium text-copper-700">precio</span>
                    </>
                }
            >
                <Grid2>
                    <Field label="Precio normal" hint="$ · Opcional">
                        <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={form.price}
                            onChange={(e) => update("price", e.target.value)}
                            placeholder="450"
                            prefix="$"
                        />
                    </Field>
                    <Field label="Precio comunidad" hint="$ · Opcional">
                        <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={form.price_discounted}
                            onChange={(e) => update("price_discounted", e.target.value)}
                            placeholder="380"
                            prefix="$"
                        />
                    </Field>
                </Grid2>
                {!priceValid && (
                    <p className="text-[12.5px] font-semibold text-rose-600">
                        El precio comunidad debe ser menor que el precio normal.
                    </p>
                )}
            </Chapter>

            {/* ─────────────────────── §04 ─────────────────────── */}
            <Chapter
                num="04"
                title={
                    <>
                        La{" "}
                        <span className="italic font-medium text-copper-700">imagen</span>
                    </>
                }
            >
                <Field label="Imagen principal" required>
                    <ImagePicker
                        value={form.image_url}
                        onChange={(url) => update("image_url", url)}
                    />
                </Field>
            </Chapter>

            {/* ─────────────────────── §05 ─────────────────────── */}
            <Chapter
                num="05"
                title={
                    <>
                        El{" "}
                        <span className="italic font-medium text-copper-700">enlace</span>
                    </>
                }
            >
                <Field label="URL de reservación o información" required>
                    <Input
                        type="url"
                        required
                        inputMode="url"
                        value={form.booking_url}
                        onChange={(e) => update("booking_url", e.target.value)}
                        placeholder="https://"
                    />
                </Field>
            </Chapter>

            {/* ─────────────────────── Submit ─────────────────────── */}
            <div className="col-span-12 mt-4 sm:mt-8">
                <div className="flex items-center gap-4 mb-8">
                    <span className="flex-1 h-px bg-warm-300" aria-hidden="true" />
                    <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-warm-500">
                        Enviar a revisión
                    </span>
                    <span className="flex-1 h-px bg-warm-300" aria-hidden="true" />
                </div>

                {error && (
                    <p className="mb-5 text-[14px] font-semibold text-rose-600 text-center">
                        {error}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                    <p className="text-[13px] text-warm-500 max-w-md leading-relaxed">
                        Al enviar, aceptas que nos pongamos en contacto contigo para revisar
                        tu propuesta. Sin spam, lo prometemos.
                    </p>
                    <button
                        type="submit"
                        disabled={!canProceed || submitting}
                        className="group inline-flex items-center gap-3 bg-warm-900 hover:bg-copper-700 text-warm-50 px-8 py-4 text-[13px] uppercase tracking-[0.18em] font-bold transition-all active:scale-[0.99] disabled:bg-warm-300 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        <span>{submitting ? "Enviando…" : "Enviar mi propuesta"}</span>
                        <span
                            aria-hidden="true"
                            className="text-copper-400 group-hover:text-warm-50 group-hover:translate-x-1 transition-all"
                        >
                            →
                        </span>
                    </button>
                </div>
            </div>

            {/* Honeypot */}
            <input
                type="text"
                name="website_url_confirm"
                value={form.website_url_confirm}
                onChange={(e) => update("website_url_confirm", e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: "-10000px",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                }}
            />
        </form>
    );
}

/* ── Building blocks ───────────────────────────────────── */

/**
 * Chapter — numbered editorial section.
 * Layout: title 4/12, fields 8/12 on desktop. Stacks on mobile.
 * Asides live in the dedicated FAQ section below the form.
 */
function Chapter({
    num,
    title,
    children,
}: {
    num: string;
    title: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Chapter rule + number */}
            <div className="col-span-12 -mb-4 sm:-mb-8">
                <div className="flex items-baseline gap-4 mb-2">
                    <span className="text-[11px] uppercase tracking-[0.28em] font-bold text-copper-600 tabular-nums">
                        §{num}
                    </span>
                    <span className="flex-1 h-px bg-warm-300" aria-hidden="true" />
                </div>
            </div>

            {/* Title column */}
            <div className="col-span-12 lg:col-span-4">
                <h2 className="font-display font-extrabold leading-[0.95] tracking-[-0.02em] text-warm-900 text-[clamp(1.85rem,3.8vw,2.75rem)]">
                    {title}
                </h2>
            </div>

            {/* Fields column */}
            <div className="col-span-12 lg:col-span-8 lg:pt-2">
                <div className="space-y-7">{children}</div>
            </div>
        </>
    );
}

function Field({
    label,
    hint,
    required,
    children,
}: {
    label: string;
    hint?: React.ReactNode;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <div className="flex items-baseline justify-between mb-2">
                <span className="text-[10.5px] uppercase tracking-[0.22em] font-bold text-warm-500">
                    {label}
                    {required && (
                        <span className="ml-1.5 text-copper-600" aria-hidden="true">
                            *
                        </span>
                    )}
                </span>
                {hint && (
                    <span className="text-[11px] text-warm-400 tabular-nums">{hint}</span>
                )}
            </div>
            {children}
        </label>
    );
}

/**
 * Underline-style input. Brand palette (no cream, no serif).
 * Border thickens & turns copper on focus.
 */
function Input({
    prefix,
    suffix,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
    prefix?: string;
    suffix?: string;
}) {
    return (
        <span className="flex items-baseline gap-2 border-b-[1.5px] border-warm-300 focus-within:border-copper-600 transition-colors py-2">
            {prefix && (
                <span className="text-[16px] font-semibold text-warm-500 shrink-0">
                    {prefix}
                </span>
            )}
            <input
                {...props}
                className="flex-1 min-w-0 bg-transparent border-0 focus:ring-0 px-0 py-0 text-[16px] leading-[1.4] text-warm-900 placeholder:text-warm-400 outline-none"
            />
            {suffix && (
                <span className="text-[13px] font-semibold text-warm-500 shrink-0">
                    {suffix}
                </span>
            )}
        </span>
    );
}

function Select(
    props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }
) {
    return (
        <span className="flex items-baseline border-b-[1.5px] border-warm-300 focus-within:border-copper-600 transition-colors py-2">
            <select
                {...props}
                className="flex-1 min-w-0 bg-transparent border-0 focus:ring-0 px-0 py-0 text-[16px] leading-[1.4] text-warm-900 outline-none appearance-none cursor-pointer"
            >
                {props.children}
            </select>
            <span aria-hidden="true" className="text-warm-500 text-[12px]">
                ▾
            </span>
        </span>
    );
}

function Grid2({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7">{children}</div>;
}
