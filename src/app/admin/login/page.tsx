"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [secretWord, setSecretWord] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [blockedUntil, setBlockedUntil] = useState<string | null>(null);
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
    const [countdown, setCountdown] = useState("");

    // Countdown timer when blocked
    useEffect(() => {
        if (!blockedUntil) return;

        const update = () => {
            const remaining = new Date(blockedUntil).getTime() - Date.now();
            if (remaining <= 0) {
                setBlocked(false);
                setBlockedUntil(null);
                setCountdown("");
                setError("");
                setAttemptsLeft(null);
                return;
            }
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            setCountdown(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [blockedUntil]);

    // Persist block state across refresh
    useEffect(() => {
        const stored = localStorage.getItem("admin_blocked_until");
        if (stored) {
            const remaining = new Date(stored).getTime() - Date.now();
            if (remaining > 0) {
                setBlocked(true);
                setBlockedUntil(stored);
            } else {
                localStorage.removeItem("admin_blocked_until");
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (blocked) return;
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/admin/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, secretWord }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.removeItem("admin_blocked_until");
                localStorage.setItem("admin_token", data.token);
                localStorage.setItem("admin_display_name", data.displayName);
                router.push("/admin");
            } else if (data.blocked) {
                setBlocked(true);
                setBlockedUntil(data.blockedUntil);
                localStorage.setItem("admin_blocked_until", data.blockedUntil);
                setError(data.error);
            } else {
                setError(data.error || "Credenciales incorrectas");
                if (data.attemptsLeft !== undefined) {
                    setAttemptsLeft(data.attemptsLeft);
                }
            }
        } catch {
            setError("Error de conexion");
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = blocked || loading;

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F8F9FA" }}>
            <div className="w-full max-w-sm">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <img src="/icons/papas_en_cdmx.svg" alt="Papás en CDMX" className="h-14 w-auto object-contain" />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <h1 className="text-xl font-bold text-gray-800">Padres Admin</h1>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5 uppercase tracking-wider">Admin</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Introduce tus credenciales</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className={`bg-white rounded-2xl p-6 shadow-sm space-y-4 transition-all ${blocked ? "opacity-70" : ""}`} style={{ border: "1px solid #F0F0F0" }}>
                    <div>
                        <label htmlFor="admin-user" className="block text-xs font-semibold text-gray-500 mb-1.5">
                            Usuario
                        </label>
                        <input
                            id="admin-user"
                            type="text"
                            required
                            disabled={isDisabled}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="usuario"
                            autoComplete="off"
                            className={`w-full rounded-lg border px-4 py-2.5 text-sm transition-all ${
                                blocked
                                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            }`}
                        />
                    </div>

                    <div>
                        <label htmlFor="admin-pass" className="block text-xs font-semibold text-gray-500 mb-1.5">
                            Contraseña
                        </label>
                        <input
                            id="admin-pass"
                            type="password"
                            required
                            disabled={isDisabled}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="off"
                            className={`w-full rounded-lg border px-4 py-2.5 text-sm transition-all ${
                                blocked
                                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            }`}
                        />
                    </div>

                    {/* Secret word field — no label, no placeholder */}
                    <div>
                        <input
                            id="admin-key"
                            type="password"
                            required
                            disabled={isDisabled}
                            value={secretWord}
                            onChange={(e) => setSecretWord(e.target.value)}
                            autoComplete="off"
                            className={`w-full rounded-lg border px-4 py-2.5 text-sm transition-all ${
                                blocked
                                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "border-gray-200 bg-gray-50 text-gray-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            }`}
                        />
                    </div>

                    {/* Blocked banner */}
                    {blocked && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                                <p className="text-sm font-bold text-red-600">Acceso Bloqueado</p>
                            </div>
                            <p className="text-xs text-red-500">
                                Demasiados intentos fallidos. Tu acceso ha sido bloqueado.
                            </p>
                            {countdown && (
                                <div className="mt-2 text-center">
                                    <span className="font-mono text-lg font-bold text-red-600">{countdown}</span>
                                    <p className="text-[10px] text-red-400 mt-0.5">tiempo restante</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {!blocked && error && (
                        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-500">
                            {error}
                            {attemptsLeft !== null && attemptsLeft <= 2 && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    <span className="text-xs font-semibold">
                                        {attemptsLeft === 0
                                            ? "Ultimo intento antes del bloqueo"
                                            : `${attemptsLeft} ${attemptsLeft === 1 ? "intento" : "intentos"} antes del bloqueo`}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isDisabled}
                        className={`w-full rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-all shadow-sm ${
                            blocked
                                ? "bg-gray-300 cursor-not-allowed"
                                : "disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}
                        style={blocked ? undefined : { background: "linear-gradient(135deg, #34D399, #10B981)" }}
                    >
                        {blocked ? "Bloqueado" : loading ? "Verificando..." : "Iniciar sesion"}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-300 mt-8">
                    © {new Date().getFullYear()} Papás en CDMX
                </p>
            </div>
        </div>
    );
}
