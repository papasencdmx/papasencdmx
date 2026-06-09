/**
 * Seed the login secret word into admin_config.
 * Run with: npx tsx scripts/seed-secret-word.ts
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

async function seed() {
  const secretWord = "ROOT";
  const hash = await bcrypt.hash(secretWord, 12);

  const { error } = await supabase.from("admin_config").upsert({
    key: "login_secret_word",
    value: hash,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Secret word stored successfully (bcrypt-hashed).");
    console.log("The word is: ROOT");
  }
}

seed();
