// ============================================
// SEED ENDPOINT (one-time use, then delete)
// POST /seed
// Body: JSON with version info
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers }
    );
  }

  try {
    const body = await req.json();
    const { version, file_name, file_size, changelog, secret } = body;

    // Simple secret check (NOT for production - just for initial seed)
    if (secret !== "evonyte-seed-2024") {
      return new Response(
        JSON.stringify({ error: "Invalid secret" }),
        { status: 403, headers }
      );
    }

    if (!version || !file_name || !file_size) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: version, file_name, file_size" }),
        { status: 400, headers }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, set all existing versions to is_latest = false
    await supabase
      .from("versions")
      .update({ is_latest: false })
      .neq("version", version);

    // Upsert the new version
    const { data, error } = await supabase
      .from("versions")
      .upsert({
        version,
        file_name,
        file_path: `releases/${file_name}`,
        file_size,
        changelog: changelog || "",
        is_latest: true,
        is_active: true,
      }, { onConflict: "version" })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Version seeded successfully",
        data,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: String(error),
      }),
      { status: 500, headers }
    );
  }
});
