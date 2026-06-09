import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB after client-side compression
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const BUCKET = "listings";

// IP rate limit: 10 uploads / IP / hour (same approach as /api/submissions)
const MAX_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000;
const ipCounter = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
    const real = req.headers.get("x-real-ip");
    if (real) return real;
    return "unknown";
}

function rateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = ipCounter.get(ip);
    if (!entry || now > entry.resetAt) {
        ipCounter.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }
    if (entry.count >= MAX_PER_HOUR) return false;
    entry.count += 1;
    return true;
}

/**
 * Verify magic bytes match the declared image type.
 * Defends against polyglot files / mislabelled binaries.
 */
function verifyMagicBytes(bytes: Uint8Array, declaredType: string): boolean {
    if (bytes.length < 12) return false;

    // JPEG: FF D8 FF
    if (declaredType === "image/jpeg") {
        return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (declaredType === "image/png") {
        return (
            bytes[0] === 0x89 &&
            bytes[1] === 0x50 &&
            bytes[2] === 0x4e &&
            bytes[3] === 0x47 &&
            bytes[4] === 0x0d &&
            bytes[5] === 0x0a &&
            bytes[6] === 0x1a &&
            bytes[7] === 0x0a
        );
    }
    // WebP: "RIFF" .... "WEBP"
    if (declaredType === "image/webp") {
        return (
            bytes[0] === 0x52 && // R
            bytes[1] === 0x49 && // I
            bytes[2] === 0x46 && // F
            bytes[3] === 0x46 && // F
            bytes[8] === 0x57 && // W
            bytes[9] === 0x45 && // E
            bytes[10] === 0x42 && // B
            bytes[11] === 0x50 // P
        );
    }
    return false;
}

/**
 * Public image upload for partner submissions.
 *
 * Hardening:
 *   - Rate limit (10/IP/hour) — prevents bucket flooding
 *   - Type allowlist (JPG/PNG/WebP only) — blocks SVG (XSS), HTML, scripts, executables
 *   - Magic-byte verification — content must match declared type (blocks polyglot files
 *     where a malicious payload is renamed with .jpg)
 *   - Size cap 2MB post-compression (client compresses to ~300KB typically)
 *   - UUID filenames — no user-controlled paths
 *   - Cache-Control: immutable for 1 year
 *   - Auto-creates the storage bucket on first use (no manual setup needed)
 */

// Track whether we've verified the bucket exists this process lifetime.
// First request creates if missing; subsequent requests skip the check.
let bucketEnsured = false;

async function ensureBucket(
    supabase: ReturnType<typeof createServerClient>
): Promise<{ ok: true } | { ok: false; error: string }> {
    if (bucketEnsured) return { ok: true };
    try {
        const { data: existing, error: getError } = await supabase.storage.getBucket(BUCKET);
        if (existing) {
            bucketEnsured = true;
            return { ok: true };
        }
        // getBucket returns error when bucket doesn't exist — try to create it.
        if (getError && !/not found/i.test(getError.message)) {
            // Some other error (permissions, network) — surface it.
            return { ok: false, error: getError.message };
        }
        const { error: createError } = await supabase.storage.createBucket(BUCKET, {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024,
            allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        });
        if (createError && !/already exists|duplicate/i.test(createError.message)) {
            return { ok: false, error: createError.message };
        }
        bucketEnsured = true;
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Bucket check failed" };
    }
}
export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        if (!rateLimit(ip)) {
            return NextResponse.json(
                { error: "Demasiadas subidas desde tu IP. Inténtalo más tarde." },
                { status: 429 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        if (!ALLOWED_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: "Tipo de archivo no permitido. Solo JPG, PNG o WebP." },
                { status: 415 }
            );
        }
        if (file.size === 0) {
            return NextResponse.json({ error: "Archivo vacío" }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json(
                { error: "Archivo demasiado grande" },
                { status: 413 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // Magic byte verification — must match declared type
        if (!verifyMagicBytes(bytes, file.type)) {
            return NextResponse.json(
                {
                    error:
                        "El archivo no parece ser una imagen válida. Sube una foto JPG, PNG o WebP real.",
                },
                { status: 415 }
            );
        }

        const supabase = createServerClient();

        // Auto-create the bucket on first use — no manual setup needed.
        const bucketResult = await ensureBucket(supabase);
        if (!bucketResult.ok) {
            console.error("[uploads/listings] Bucket setup failed:", bucketResult.error);
            return NextResponse.json(
                { error: `No pudimos preparar el almacenamiento: ${bucketResult.error}` },
                { status: 500 }
            );
        }

        const ext =
            file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const filename = `${crypto.randomUUID()}.${ext}`;
        const path = `submissions/${filename}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, arrayBuffer, {
                contentType: file.type,
                cacheControl: "31536000",
                upsert: false,
            });

        if (uploadError) {
            console.error("[uploads/listings] Storage error:", uploadError);
            const msg = uploadError.message || "";
            // Surface specific cause to the client so debugging is easy
            if (msg.toLowerCase().includes("bucket") && msg.toLowerCase().includes("not found")) {
                return NextResponse.json(
                    {
                        error: `Falta el bucket "${BUCKET}" en Supabase Storage. Créalo (público, 5MB max, MIME types image/jpeg + image/png + image/webp).`,
                    },
                    { status: 500 }
                );
            }
            if (msg.toLowerCase().includes("policy") || msg.toLowerCase().includes("rls")) {
                return NextResponse.json(
                    {
                        error: `Bloqueado por RLS en Supabase Storage. La política del bucket "${BUCKET}" debe permitir insert al service_role.`,
                    },
                    { status: 500 }
                );
            }
            return NextResponse.json(
                { error: `Error al subir: ${msg}` },
                { status: 500 }
            );
        }

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        if (!pub?.publicUrl) {
            return NextResponse.json({ error: "No public URL returned" }, { status: 500 });
        }

        return NextResponse.json({ url: pub.publicUrl, path });
    } catch (err) {
        console.error("[uploads/listings] Unexpected error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
