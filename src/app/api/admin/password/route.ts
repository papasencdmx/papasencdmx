import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase";
import { getUsernameFromToken } from "@/lib/activityLog";

// PUT: Change password
export async function PUT(req: NextRequest) {
    const auth = req.headers.get("authorization");

    if (!auth) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const username = getUsernameFromToken(auth);
    if (!username) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    try {
        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Faltan campos requeridos" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "La nueva contraseña debe tener al menos 6 caracteres" },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Verify current password
        const { data: user, error: fetchError } = await supabase
            .from("admin_users")
            .select("id, password_hash")
            .ilike("username", username)
            .single();

        if (fetchError || !user) {
            return NextResponse.json(
                { error: "Usuario no encontrado" },
                { status: 404 }
            );
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!passwordMatch) {
            return NextResponse.json(
                { error: "La contraseña actual es incorrecta" },
                { status: 401 }
            );
        }

        // Hash and update new password
        const newHash = await bcrypt.hash(newPassword, 12);
        const { error: updateError } = await supabase
            .from("admin_users")
            .update({
                password_hash: newHash,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (updateError) {
            return NextResponse.json(
                { error: "Error al actualizar la contraseña" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
}
