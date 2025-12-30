// ============================================
// LATEST VERSION ENDPOINT
// GET /latest
// Returns info about the latest version
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get latest version using helper function
    const { data, error } = await supabase.rpc("get_latest_version");

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No versions available",
        }),
        { status: 404, headers }
      );
    }

    const latest = data[0];

    // Response (without file_path for security)
    const response = {
      version: latest.version,
      file_name: latest.file_name,
      file_size: latest.file_size,
      changelog: latest.changelog,
      released_at: latest.created_at,
      download_url: `https://raw.githubusercontent.com/Evonyte/evonyte-distribution/master/${latest.file_name}`,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      { status: 500, headers }
    );
  }
});
