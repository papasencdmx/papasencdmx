import { createServerClient } from "@/lib/supabase";

const SECRET = process.env.ADMIN_SECRET || "fallback-secret";

export type ActivityAction =
    | "login"
    | "logout"
    | "password_change"
    | "listing_create"
    | "listing_update"
    | "listing_delete"
    | "section_create"
    | "section_delete"
    | "import_csv"
    | "event_create"
    | "event_update"
    | "event_delete"
    | "occurrence_create"
    | "occurrence_update"
    | "occurrence_delete"
    | "order_status_update"
    | "order_update"
    | "order_refund"
    | "order_cancel"
    | "order_resend_email"
    | "feature_create"
    | "feature_update"
    | "feature_delete";

export type EntityType = "listing" | "user" | "import" | "event" | "occurrence" | "order" | "feature" | null;

interface LogParams {
    action: ActivityAction;
    entityType?: EntityType;
    entityId?: string;
    entityName?: string;
    details?: Record<string, unknown>;
}

/** Extract username from a Bearer token */
export function getUsernameFromToken(authHeader: string | null): string | null {
    if (!authHeader) return null;
    const token = authHeader.replace("Bearer ", "");
    try {
        const decoded = Buffer.from(token, "base64").toString("utf-8");
        const parts = decoded.split(":");
        if (parts.length < 3) return null;
        const secret = parts.slice(2).join(":");
        if (secret !== SECRET) return null;
        const timestamp = parseInt(parts[1], 10);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp > sevenDays) return null;
        return parts[0];
    } catch {
        return null;
    }
}

/** Log an admin activity — fire-and-forget (non-blocking) */
export function logActivity(username: string, params: LogParams) {
    const supabase = createServerClient();
    supabase
        .from("admin_activity_log")
        .insert({
            admin_username: username,
            action: params.action,
            entity_type: params.entityType || null,
            entity_id: params.entityId || null,
            entity_name: params.entityName || null,
            details: params.details || null,
        })
        .then(({ error }) => {
            if (error) console.error("[activity-log]", error.message);
        });
}
