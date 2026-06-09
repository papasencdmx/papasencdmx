"use client";

import { useState, useEffect } from "react";
import { Lock, Check, AlertCircle, User } from "lucide-react";

export default function AdminSettingsPage() {
    const [displayName, setDisplayName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        const name = localStorage.getItem("admin_display_name");
        if (name) setDisplayName(name);
    }, []);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Las contraseñas nuevas no coinciden" });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "La nueva contraseña debe tener al menos 6 caracteres" });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch("/api/admin/password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: "success", text: "Contraseña actualizada correctamente" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMessage({ type: "error", text: data.error || "Error al cambiar la contraseña" });
            }
        } catch {
            setMessage({ type: "error", text: "Error de conexión" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-6">Configuración</h1>

            {/* User Info Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6" style={{ border: "1px solid #EAECF0" }}>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="w-7 h-7 text-emerald-700" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-900">{displayName || "Admin"}</p>
                        <p className="text-sm text-gray-400">Administrador</p>
                    </div>
                </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: "1px solid #EAECF0" }}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Cambiar Contraseña</h2>
                        <p className="text-sm text-gray-400">Actualiza tu contraseña de acceso al panel</p>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                            Contraseña actual
                        </label>
                        <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                            Nueva contraseña
                        </label>
                        <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                            Confirmar nueva contraseña
                        </label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite la nueva contraseña"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                    </div>

                    {message && (
                        <div
                            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${
                                message.type === "success"
                                    ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                                    : "bg-red-50 border border-red-100 text-red-500"
                            }`}
                        >
                            {message.type === "success" ? (
                                <Check className="w-4 h-4 shrink-0" />
                            ) : (
                                <AlertCircle className="w-4 h-4 shrink-0" />
                            )}
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        style={{ background: "linear-gradient(135deg, #34D399, #10B981)" }}
                    >
                        {loading ? "Actualizando..." : "Cambiar Contraseña"}
                    </button>
                </form>
            </div>
        </div>
    );
}
