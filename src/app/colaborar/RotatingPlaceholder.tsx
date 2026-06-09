"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Real, recognizable Mexico City businesses across categories.
 * Keep diverse — colegios, deportes, ocio, servicios — so it feels alive
 * and inclusive, not biased toward one category.
 */
const PLACEHOLDERS = [
    // Deportes / academias
    "Club Deportivo Chapultepec",
    "Pumas Academy",
    "Club Mundet",
    "Academia de Tenis Polanco",
    // Colegios
    "Colegio Americano",
    "Instituto Cumbres",
    "Colegio Madrid",
    // Salud
    "Hospital Infantil de México",
    "Star Médica Pediatría",
    "Clínica Infantil Roma",
    // Ocio familiar
    "KidZania",
    "Papalote Museo del Niño",
    "Six Flags México",
    "Acuario Inbursa",
    "La Feria de Chapultepec",
    // Servicios
    "Liverpool",
    "Julio Cepeda Juguetería",
    "Decathlon",
    "Martí",
    "Telcel",
    "AT&T",
    // Comida / café
    "Starbucks",
    "Cielito Querido Café",
    // Campamentos / idiomas
    "Campamento Pipiol",
    "Harmon Hall Summer Camp",
    "Kanela Campamentos",
    // Arte / música
    "Música para Niños",
    "Escuela de Pintura Frida",
    "Yoga Kids CDMX",
];

const ROTATE_MS = 2200;

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
    /** Whether to keep animating once the value is filled (default false). */
    animateWhileFilled?: boolean;
}

/**
 * Underline-style input with an animated placeholder that cycles through
 * popular Mexico City business names. Stops when the user focuses or types.
 */
export function RotatingPlaceholder({ animateWhileFilled = false, value, onFocus, onBlur, ...props }: Props) {
    const [idx, setIdx] = useState(0);
    const [focused, setFocused] = useState(false);
    const valueIsEmpty = !value || (typeof value === "string" && value.length === 0);
    const isAnimating = !focused && (animateWhileFilled || valueIsEmpty);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!isAnimating) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(() => {
            setIdx((i) => (i + 1) % PLACEHOLDERS.length);
        }, ROTATE_MS);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isAnimating]);

    return (
        <span className="relative flex items-baseline gap-2 border-b-[1.5px] border-warm-300 focus-within:border-copper-600 transition-colors py-2">
            <input
                {...props}
                value={value}
                onFocus={(e) => {
                    setFocused(true);
                    onFocus?.(e);
                }}
                onBlur={(e) => {
                    setFocused(false);
                    onBlur?.(e);
                }}
                className="flex-1 min-w-0 bg-transparent border-0 focus:ring-0 px-0 py-0 text-[16px] leading-[1.4] text-warm-900 outline-none"
            />

            {/* Animated placeholder overlay — only when input is empty AND unfocused */}
            {valueIsEmpty && !focused && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-baseline py-2 overflow-hidden"
                >
                    <span className="text-[16px] leading-[1.4] text-warm-400 select-none flex items-baseline gap-1.5">
                        <span className="text-warm-300">Ej.</span>
                        <span
                            key={idx}
                            className="inline-block animate-placeholder-rotate"
                        >
                            {PLACEHOLDERS[idx]}
                        </span>
                    </span>
                </span>
            )}
        </span>
    );
}
