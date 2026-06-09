"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Loader2, X, AlertTriangle } from "lucide-react";

const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5 MB raw input cap (covers most phone photos)
const MAX_OUTPUT_WIDTH = 1200;
const JPEG_QUALITY = 0.8;

/**
 * Compress + resize an image client-side using Canvas. Strips EXIF.
 * Returns a JPEG Blob ≤ 1200px wide, quality 0.8.
 */
async function compressImage(file: File): Promise<Blob> {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    try {
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Image load failed"));
            img.src = url;
        });
        const ratio = img.width > MAX_OUTPUT_WIDTH ? MAX_OUTPUT_WIDTH / img.width : 1;
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable");
        ctx.drawImage(img, 0, 0, w, h);
        const blob: Blob = await new Promise((resolve, reject) => {
            canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
                "image/jpeg",
                JPEG_QUALITY
            );
        });
        return blob;
    } finally {
        URL.revokeObjectURL(url);
    }
}

export function ImagePicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (url: string) => void;
}) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const handleFile = async (file: File) => {
        setError(null);

        // 1) Type check
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
            setError("Solo se permiten imágenes JPG, PNG o WebP.");
            return;
        }

        // 2) Size check (raw input)
        if (file.size > MAX_INPUT_BYTES) {
            setError("La imagen es demasiado grande. Tamaño máximo: 5 MB.");
            return;
        }

        setUploading(true);
        setProgress(20);

        try {
            // 3) Compress client-side (Canvas)
            const compressed = await compressImage(file);
            setProgress(55);

            // 4) Upload to /api/uploads/listings
            const fd = new FormData();
            fd.append("file", compressed, "listing.jpg");
            const res = await fetch("/api/uploads/listings", {
                method: "POST",
                body: fd,
            });
            setProgress(85);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const msg = data.error || data.details || `Upload falló (HTTP ${res.status})`;
                throw new Error(msg);
            }
            const data = (await res.json()) as { url: string };
            if (!data.url) throw new Error("El servidor no devolvió una URL");
            setProgress(100);
            onChange(data.url);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Error al subir la imagen");
        } finally {
            setTimeout(() => {
                setUploading(false);
                setProgress(0);
            }, 250);
        }
    };

    const onPick = () => inputRef.current?.click();
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    if (value) {
        return (
            <div className="relative">
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-warm-100 border border-warm-200">
                    <Image
                        src={value}
                        alt="Imagen de la actividad"
                        fill
                        sizes="(max-width: 640px) 100vw, 600px"
                        className="object-cover"
                        unoptimized
                    />
                </div>
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-warm-700 shadow-md ring-1 ring-warm-200 hover:bg-white transition"
                    aria-label="Eliminar imagen"
                >
                    <X className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={onPick}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-bold text-warm-800 shadow-md ring-1 ring-warm-200 hover:bg-white transition"
                >
                    Cambiar foto
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                        e.target.value = "";
                    }}
                    className="hidden"
                />
            </div>
        );
    }

    return (
        <div>
            <button
                type="button"
                onClick={onPick}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                disabled={uploading}
                className="w-full rounded-xl border-2 border-dashed border-warm-300 bg-warm-50/40 hover:bg-warm-50 hover:border-copper-400 transition-colors px-5 py-10 text-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 flex flex-col items-center"
            >
                {uploading ? (
                    <>
                        <Loader2 className="h-7 w-7 text-copper-600 animate-spin" />
                        <p className="mt-3 text-[14px] font-semibold text-warm-800">
                            Procesando imagen…
                        </p>
                        <div className="mt-3 h-1.5 w-48 rounded-full bg-warm-200 overflow-hidden">
                            <div
                                className="h-full bg-copper-600 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-copper-50 text-copper-700">
                            <Upload className="h-5 w-5" />
                        </span>
                        <p className="mt-3 text-[14px] font-semibold text-warm-800">
                            Sube una foto o arrástrala aquí
                        </p>
                        <p className="mt-1 text-[12px] text-warm-500">
                            JPG, PNG o WebP · máx. 5 MB · se comprime automáticamente
                        </p>
                    </>
                )}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                }}
                className="hidden"
            />
            {error && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-rose-600">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    {error}
                </p>
            )}
        </div>
    );
}
