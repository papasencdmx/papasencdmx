import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Public partner submission endpoint (used by /colaborar).
 *
 * Hardening:
 *   - Honeypot field (`website_url_confirm`) — bots fill it, humans don't see it
 *   - IP rate limit: max 5 submissions per IP per hour (in-memory map, resets on deploy)
 *   - Server-side schema validation
 *   - Forces status/source/is_active so the public can't bypass the workflow
 */

const MAX_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;
const ipCounter = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
    const real = req.headers.get("x-real-ip");
    if (real) return real;
    return "unknown";
}

function rateLimit(ip: string): { allowed: boolean; resetAt: number } {
    const now = Date.now();
    const entry = ipCounter.get(ip);
    if (!entry || now > entry.resetAt) {
        ipCounter.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true, resetAt: now + WINDOW_MS };
    }
    if (entry.count >= MAX_PER_HOUR) {
        return { allowed: false, resetAt: entry.resetAt };
    }
    entry.count += 1;
    return { allowed: true, resetAt: entry.resetAt };
}

interface SubmissionBody {
    business_name?: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    website?: string;
    listing_type?: string;
    title?: string;
    short_description?: string;
    activity_types?: string[];
    age_min?: string | number;
    age_max?: string | number;
    zone?: string;
    street_address?: string;
    dates_start?: string;
    dates_end?: string;
    price?: string | number;
    price_discounted?: string | number;
    image_url?: string;
    booking_url?: string;
    website_url_confirm?: string;
    submission_mode?: string;
}

const ALLOWED_LISTING_TYPES = new Set([
    "campamento",
    "extraescolar",
    "evento",
    "plan_familiar",
    "otro",
]);

const ALLOWED_ACTIVITY_TYPES = new Set([
    "Deportivo",
    "Multiaventura",
    "Idiomas",
    "Arte/Creatividad",
    "Tecnología",
    "Naturaleza",
    "Educativo",
    "Musical",
    "Náutico",
]);

function err(message: string, status = 400) {
    return NextResponse.json({ error: message }, { status });
}

function slugify(input: string): string {
    return input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 80);
}

export async function POST(req: NextRequest) {
    /* ── 0. Rate limit ────────────────────────────────────── */
    const ip = getClientIp(req);
    const rl = rateLimit(ip);
    if (!rl.allowed) {
        return NextResponse.json(
            {
                error: "Has enviado demasiadas propuestas. Inténtalo más tarde.",
                resetAt: rl.resetAt,
            },
            { status: 429 }
        );
    }

    /* ── 1. Parse + honeypot ──────────────────────────────── */
    let body: SubmissionBody;
    try {
        body = (await req.json()) as SubmissionBody;
    } catch {
        return err("Invalid JSON");
    }

    // Honeypot — silently succeed without doing anything
    if (body.website_url_confirm && body.website_url_confirm.trim().length > 0) {
        return NextResponse.json({ ok: true }, { status: 200 });
    }

    /* ── 2. Validate ──────────────────────────────────────── */
    const businessName = (body.business_name || "").trim();
    const contactName = (body.contact_name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const website = (body.website || "").trim() || null;
    const listingType = (body.listing_type || "").trim();
    const title = (body.title || "").trim();
    const shortDescription = (body.short_description || "").trim();
    const activityTypes = Array.isArray(body.activity_types)
        ? body.activity_types.filter((t) => ALLOWED_ACTIVITY_TYPES.has(t))
        : [];
    const ageMin =
        body.age_min === "" || body.age_min == null ? null : Number(body.age_min);
    const ageMax =
        body.age_max === "" || body.age_max == null ? null : Number(body.age_max);
    const zone = (body.zone || "").trim();
    const streetAddress = (body.street_address || "").trim() || null;
    const datesStart = (body.dates_start || "").trim() || null;
    const datesEnd = (body.dates_end || "").trim() || null;
    const price =
        body.price === "" || body.price == null ? null : Number(body.price);
    const priceDiscounted =
        body.price_discounted === "" || body.price_discounted == null
            ? null
            : Number(body.price_discounted);
    const imageUrl = (body.image_url || "").trim();
    const bookingUrl = (body.booking_url || "").trim();

    if (businessName.length < 2) return err("Nombre del negocio inválido");
    if (contactName.length < 2) return err("Nombre de contacto inválido");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("Email inválido");
    if (phone.length < 6) return err("Teléfono inválido");
    if (!ALLOWED_LISTING_TYPES.has(listingType)) return err("Tipo de actividad inválido");
    if (title.length < 3 || title.length > 80) return err("Título inválido");
    if (shortDescription.length < 20 || shortDescription.length > 300)
        return err("Descripción debe tener 20–300 caracteres");
    if (activityTypes.length === 0) return err("Selecciona al menos un tipo de actividad");
    if (ageMin == null || ageMax == null || ageMin < 0 || ageMax > 99 || ageMin > ageMax)
        return err("Rango de edad inválido");
    if (zone.length === 0) return err("Zona requerida");
    if (price != null && priceDiscounted != null && priceDiscounted >= price)
        return err("El precio para la comunidad debe ser menor que el precio normal");
    if (!imageUrl || !/^https?:\/\//.test(imageUrl)) return err("Imagen requerida");
    if (!/^https?:\/\//.test(bookingUrl)) return err("URL de reserva inválida");

    /* ── 3. Get city + map category/zone + insert listing ──── */
    const supabase = createServerClient();
    const citySlug = process.env.NEXT_PUBLIC_CITY_SLUG || "madrid";

    const { data: city } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", citySlug)
        .maybeSingle();

    if (!city?.id) {
        console.error("[submissions] City not found:", citySlug);
        return NextResponse.json(
            { error: "Configuración del sitio incompleta" },
            { status: 500 }
        );
    }

    // Map listing_type → category_id so approved listings appear on the right
    // category page (/campamentos, /extraescolares, etc.). Admin can override later.
    const LISTING_TYPE_TO_CATEGORY: Record<string, string> = {
        campamento: "campamentos",
        extraescolar: "extraescolares",
        evento: "ocio-familiar",
        plan_familiar: "ocio-familiar",
        otro: "ocio-familiar",
    };
    const categorySlugGuess = LISTING_TYPE_TO_CATEGORY[listingType] || "ocio-familiar";
    const { data: matchedCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlugGuess)
        .maybeSingle();
    const categoryId = matchedCategory?.id || null;

    // Best-effort zone_id lookup by text match.
    let zoneId: string | null = null;
    if (zone) {
        const { data: matchedZone } = await supabase
            .from("zones")
            .select("id")
            .eq("city_id", city.id)
            .ilike("name", zone)
            .maybeSingle();
        zoneId = matchedZone?.id || null;
    }

    // Compute discount_percent from price spread (if both prices given)
    let discountPercent: number | null = null;
    if (price != null && priceDiscounted != null && priceDiscounted < price) {
        discountPercent = Math.round(((price - priceDiscounted) / price) * 100);
    }

    // Build a unique slug (append timestamp to avoid collisions on retries)
    const baseSlug = slugify(`${businessName}-${title}`).slice(0, 60) || "propuesta";
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const { data: inserted, error: insertError } = await supabase
        .from("listings")
        .insert({
            city_id: city.id,
            category_id: categoryId,
            zone_id: zoneId,
            name: businessName,
            slug,
            description: title, // keep the partner's listing title as the description seed
            short_description: shortDescription,
            email,
            phone,
            website,
            street_address: streetAddress,
            age_min: ageMin,
            age_max: ageMax,
            price_min: priceDiscounted ?? price, // visible price (post-discount)
            price_max: price ?? priceDiscounted, // original
            discount_percent: discountPercent,
            cover_image_url: imageUrl,
            is_active: false, // not visible until admin approves
            is_featured: false,
            tier: "free",
            booking_url: bookingUrl,
            contact_name: contactName,
            source: "submission",
            submission_status: "pending",
            submitted_at: new Date().toISOString(),
            // Stash extra context as part of recommendation_reason for the
            // admin reviewer until we add a dedicated column
            recommendation_reason: [
                body.submission_mode === "paid_partner"
                    ? "⭐ PAID PARTNER — verificar plan contratado"
                    : null,
                `Tipo: ${listingType}`,
                `Zona: ${zone}`,
                `Actividades: ${activityTypes.join(", ")}`,
                price != null
                    ? `Precio: $$ {price}${priceDiscounted != null ? ` (comunidad: $$ {priceDiscounted})` : ""}`
                    : null,
                datesStart ? `Inicio: ${datesStart}` : null,
                datesEnd ? `Fin: ${datesEnd}` : null,
            ]
                .filter(Boolean)
                .join("\n"),
        })
        .select("id")
        .single();

    if (insertError || !inserted) {
        console.error("[submissions] Insert error:", insertError);
        return NextResponse.json(
            { error: "No pudimos guardar tu propuesta. Inténtalo de nuevo." },
            { status: 500 }
        );
    }

    /* ── 4. Save activity_types as listing_tags ────────────── */
    if (activityTypes.length > 0) {
        const tagRows = activityTypes.map((t) => ({
            listing_id: inserted.id,
            tag_type: "activity_type",
            tag_value: t,
        }));
        await supabase.from("listing_tags").insert(tagRows);
    }

    return NextResponse.json({ ok: true, id: inserted.id });
}
