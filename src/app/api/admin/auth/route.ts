import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase";
import { logActivity } from "@/lib/activityLog";

const SECRET = process.env.ADMIN_SECRET || "fallback-secret";
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function createToken(username: string): string {
    const payload = `${username}:${Date.now()}:${SECRET}`;
    return Buffer.from(payload).toString("base64");
}

function validateToken(token: string): { valid: boolean; username: string | null } {
    try {
        const decoded = Buffer.from(token, "base64").toString("utf-8");
        const parts = decoded.split(":");
        if (parts.length < 3) return { valid: false, username: null };

        const username = parts[0];
        const timestamp = parseInt(parts[1], 10);
        const secret = parts.slice(2).join(":");

        if (secret !== SECRET) return { valid: false, username: null };

        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp > sevenDays) return { valid: false, username: null };

        return { valid: true, username };
    } catch {
        return { valid: false, username: null };
    }
}

function getClientIP(req: NextRequest): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown"
    );
}

// POST: Login
export async function POST(req: NextRequest) {
    const supabase = createServerClient();
    const ip = getClientIP(req);

    try {
        // 1. Check if IP is blocked
        const { data: attempt } = await supabase
            .from("admin_login_attempts")
            .select("attempts, blocked_until")
            .eq("ip_address", ip)
            .single();

        if (attempt?.blocked_until) {
            const blockedUntil = new Date(attempt.blocked_until).getTime();
            if (Date.now() < blockedUntil) {
                const remainingMs = blockedUntil - Date.now();
                const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
                return NextResponse.json(
                    {
                        error: `Acceso bloqueado. Intenta de nuevo en ${remainingHours}h.`,
                        blocked: true,
                        blockedUntil: attempt.blocked_until,
                    },
                    { status: 403 }
                );
            }
            // Block expired — reset
            await supabase
                .from("admin_login_attempts")
                .update({ attempts: 0, blocked_until: null, last_attempt_at: new Date().toISOString() })
                .eq("ip_address", ip);
        }

        const { username, password, secretWord } = await req.json();

        // 2. Validate secret word from Supabase
        const { data: config, error: configError } = await supabase
            .from("admin_config")
            .select("value")
            .eq("key", "login_secret_word")
            .single();

        if (!config) {
            console.error("[admin-auth] admin_config query failed:", configError?.message, "| Has service key:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
            return NextResponse.json({ error: "Error de configuración" }, { status: 500 });
        }

        const secretMatch = await bcrypt.compare(secretWord || "", config.value);

        // 3. Validate credentials
        let credentialsValid = false;
        let user: { username: string; display_name: string; password_hash: string } | null = null;

        if (secretMatch && username && password) {
            const { data } = await supabase
                .from("admin_users")
                .select("username, display_name, password_hash")
                .ilike("username", username)
                .single();

            if (data) {
                const passwordMatch = await bcrypt.compare(password, data.password_hash);
                if (passwordMatch) {
                    credentialsValid = true;
                    user = data;
                }
            }
        }

        // 4. Handle failure
        if (!secretMatch || !credentialsValid || !user) {
            const currentAttempts = (attempt?.attempts || 0) + 1;
            const shouldBlock = currentAttempts >= MAX_ATTEMPTS;

            await supabase.from("admin_login_attempts").upsert({
                ip_address: ip,
                attempts: currentAttempts,
                blocked_until: shouldBlock
                    ? new Date(Date.now() + BLOCK_DURATION_MS).toISOString()
                    : null,
                last_attempt_at: new Date().toISOString(),
            });

            if (shouldBlock) {
                return NextResponse.json(
                    {
                        error: "Demasiados intentos fallidos. Acceso bloqueado por 24 horas.",
                        blocked: true,
                        blockedUntil: new Date(Date.now() + BLOCK_DURATION_MS).toISOString(),
                    },
                    { status: 403 }
                );
            }

            const remaining = MAX_ATTEMPTS - currentAttempts;
            return NextResponse.json(
                {
                    error: `Credenciales incorrectas. ${remaining} ${remaining === 1 ? "intento" : "intentos"} restantes.`,
                    attemptsLeft: remaining,
                },
                { status: 401 }
            );
        }

        // 5. Success — reset attempts
        await supabase.from("admin_login_attempts").upsert({
            ip_address: ip,
            attempts: 0,
            blocked_until: null,
            last_attempt_at: new Date().toISOString(),
        });

        const token = createToken(user.username);

        logActivity(user.username, {
            action: "login",
            entityType: "user",
            entityName: user.display_name,
        });

        return NextResponse.json({
            token,
            username: user.username,
            displayName: user.display_name,
        });
    } catch {
        return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
}

// GET: Validate token
export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    const token = auth?.replace("Bearer ", "");

    if (!token) {
        return NextResponse.json({ valid: false }, { status: 401 });
    }

    const { valid, username } = validateToken(token);
    if (!valid || !username) {
        return NextResponse.json({ valid: false }, { status: 401 });
    }

    const supabase = createServerClient();
    const { data: user } = await supabase
        .from("admin_users")
        .select("display_name")
        .ilike("username", username)
        .single();

    if (!user) {
        return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({
        valid: true,
        username,
        displayName: user.display_name,
    });
}
