"use client";

import { useState } from "react";

type FormStatus = "idle" | "loading" | "success" | "error";

export function ContactForm() {
    const [status, setStatus] = useState<FormStatus>("idle");
    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) return;

        setStatus("loading");
        try {
            // For now, send to mailto (can be replaced with API route later)
            const mailtoUrl = `mailto:hola@papasencdmx.com?subject=${encodeURIComponent(
                form.subject || "Consulta desde la web"
            )}&body=${encodeURIComponent(
                `Nombre: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
            )}`;
            window.open(mailtoUrl, "_blank");
            setStatus("success");
        } catch {
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div className="text-center py-12">
                <p className="text-4xl mb-4">✉️</p>
                <h3 className="font-display text-lg font-bold text-ocean-900 mb-2">
                    ¡Mensaje preparado!
                </h3>
                <p className="text-sm text-warm-500">
                    Se ha abierto tu cliente de correo. Si no se ha abierto, envíanos un
                    email directamente a{" "}
                    <a
                        href="mailto:hola@papasencdmx.com"
                        className="text-copper-500 font-semibold"
                    >
                        hola@papasencdmx.com
                    </a>
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label
                        htmlFor="contact-name"
                        className="block text-sm font-semibold text-warm-700 mb-1.5"
                    >
                        Nombre *
                    </label>
                    <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Tu nombre"
                        className="input-field"
                    />
                </div>
                <div>
                    <label
                        htmlFor="contact-email"
                        className="block text-sm font-semibold text-warm-700 mb-1.5"
                    >
                        Email *
                    </label>
                    <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                        className="input-field"
                    />
                </div>
            </div>

            <div>
                <label
                    htmlFor="contact-subject"
                    className="block text-sm font-semibold text-warm-700 mb-1.5"
                >
                    Asunto
                </label>
                <select
                    id="contact-subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="input-field"
                >
                    <option value="">Selecciona un tema</option>
                    <option value="Consulta general">Consulta general</option>
                    <option value="Publicidad">Información sobre publicidad</option>
                    <option value="Directorio">Sobre el directorio</option>
                    <option value="Newsletter">Sobre la newsletter</option>
                    <option value="Error/Bug">Reportar un error</option>
                    <option value="Otro">Otro</option>
                </select>
            </div>

            <div>
                <label
                    htmlFor="contact-message"
                    className="block text-sm font-semibold text-warm-700 mb-1.5"
                >
                    Mensaje *
                </label>
                <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Cuéntanos cómo podemos ayudarte..."
                    className="input-field resize-none"
                />
            </div>

            <button
                type="submit"
                disabled={status === "loading"}
                className="btn-copper w-full sm:w-auto"
            >
                {status === "loading"
                    ? "Enviando..."
                    : status === "error"
                        ? "Reintentar"
                        : "Enviar mensaje"}
            </button>
        </form>
    );
}
