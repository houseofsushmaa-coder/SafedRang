import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load .env from root or frontend
const rootEnv = path.resolve(process.cwd(), ".env");
const frontendEnv = path.resolve(process.cwd(), "frontend", ".env");

if (fs.existsSync(frontendEnv)) {
  dotenv.config({ path: frontendEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing VITE_SUPABASE_URL or Supabase Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const VALID_ROLES = ["customer", "admin", "super_admin", "manager"];

async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  console.log("==================================================");
  console.log("   SAFED RANG — USER ROLE MANAGEMENT SCRIPT");
  console.log("==================================================");

  // Command: list
  if (!command || command === "list") {
    console.log("\n📋 Fetching registered users...\n");

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, role, full_name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("⚠️ Could not query 'profiles' table:", error.message);
      console.log(
        "💡 Make sure you have executed supabase/schema_roles.sql in your Supabase SQL Editor.",
      );
    } else if (!profiles || profiles.length === 0) {
      console.log("No user profiles found in the database.");
    } else {
      console.table(
        profiles.map((p) => ({
          Email: p.email,
          Role: (p.role || "customer").toUpperCase(),
          Name: p.full_name || "(none)",
          ID: p.id,
        })),
      );
    }

    console.log("\n📖 USAGE:");
    console.log("  node scripts/set-role.mjs <email> <role>");
    console.log("  Allowed roles: admin | customer | super_admin | manager");
    console.log("\nEXAMPLES:");
    console.log("  node scripts/set-role.mjs admin@safedrang.com admin");
    console.log("  node scripts/set-role.mjs customer@test.com customer\n");
    return;
  }

  const targetEmail = args[0]?.trim();
  const targetRole = args[1]?.toLowerCase()?.trim();

  if (!targetEmail || !targetRole) {
    console.error("❌ Error: Missing email or role argument.");
    console.log("Usage: node scripts/set-role.mjs <email> <role>");
    process.exit(1);
  }

  if (!VALID_ROLES.includes(targetRole)) {
    console.error(
      `❌ Error: Invalid role "${targetRole}". Allowed: ${VALID_ROLES.join(", ")}`,
    );
    process.exit(1);
  }

  console.log(`\n🔄 Updating role for [${targetEmail}] to [${targetRole.toUpperCase()}]...`);

  // 1. Try calling the RPC helper function set_user_role
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "set_user_role",
    {
      target_email: targetEmail,
      new_role: targetRole,
    },
  );

  if (!rpcError) {
    console.log("✅ Success (via RPC):", rpcResult);
    return;
  }

  // 2. If RPC is not created yet, try updating profiles table directly
  console.log("ℹ️ RPC not found or restricted, updating profiles table directly...");
  const { data: profileUpdate, error: profileErr } = await supabase
    .from("profiles")
    .update({ role: targetRole, updated_at: new Date().toISOString() })
    .ilike("email", targetEmail)
    .select();

  if (profileErr) {
    console.error("❌ Failed to update profiles table:", profileErr.message);
    console.log("\n💡 TIP: Run the SQL in supabase/schema_roles.sql in your Supabase SQL Editor first!");
    process.exit(1);
  }

  if (!profileUpdate || profileUpdate.length === 0) {
    console.warn(
      `⚠️ No existing profile found with email "${targetEmail}". Attempting to insert...`,
    );
    // Try to find if user exists in auth or insert placeholder
    const { error: insErr } = await supabase.from("profiles").insert([
      {
        email: targetEmail,
        role: targetRole,
      },
    ]);
    if (insErr) {
      console.error("❌ Could not insert profile:", insErr.message);
      process.exit(1);
    }
  }

  console.log(`✅ Success! [${targetEmail}] is now set to role: ${targetRole.toUpperCase()}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
