/**
 * Seed script to create admin users in Supabase.
 * Run with: npx tsx scripts/seed-admins.ts
 *
 * This creates the two admin accounts: Sido and Hassan
 * with a default password that should be changed on first login.
 */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmins() {
  const admins = [
    { username: "Sido", display_name: "Sido", password: "PadresMadrid2026!" },
    { username: "Hassan", display_name: "Hassan", password: "PadresMadrid2026!" },
  ];

  for (const admin of admins) {
    const password_hash = await bcrypt.hash(admin.password, 12);

    const { error } = await supabase.from("admin_users").upsert(
      {
        username: admin.username,
        display_name: admin.display_name,
        password_hash,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "username" }
    );

    if (error) {
      console.error(`Failed to create ${admin.username}:`, error.message);
    } else {
      console.log(`Admin "${admin.username}" created/updated successfully`);
    }
  }

  console.log("\nDone! Both admins use password: PadresMadrid2026!");
  console.log("They can change it from the admin panel Settings page.");
}

seedAdmins();
