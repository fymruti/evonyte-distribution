// ============================================
// DOWNLOAD ENDPOINT (with API key auth)
// GET /download?version=1.0.0
// Header: Authorization: Bearer YOUR_API_KEY
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
    // 1. Verify API key
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid API key" }),
        { status: 401, headers }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify API key
    const { data: keyData, error: keyError } = await supabase.rpc(
      "verify_api_key",
      { key_to_check: apiKey }
    );

    if (keyError || !keyData || keyData.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 403, headers }
      );
    }

    const { is_valid, api_key_id, permissions } = keyData[0];

    if (!is_valid || !permissions.includes("download")) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403, headers }
      );
    }

    // 2. Get version from query params
    const url = new URL(req.url);
    const requestedVersion = url.searchParams.get("version");

    let versionQuery = supabase
      .from("versions")
      .select("*")
      .eq("is_active", true);

    if (requestedVersion) {
      versionQuery = versionQuery.eq("version", requestedVersion);
    } else {
      versionQuery = versionQuery.eq("is_latest", true);
    }

    const { data: versionData, error: versionError } = await versionQuery.single();

    if (versionError || !versionData) {
      return new Response(
        JSON.stringify({ error: "Version not found" }),
        { status: 404, headers }
      );
    }

    // 3. Generate signed URL for download (expires in 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from("evonyte-releases")
      .createSignedUrl(versionData.file_path, 3600); // 1 hour

    if (signedUrlError || !signedUrlData) {
      throw new Error("Failed to generate download URL");
    }

    // 4. Log download for analytics
    const clientIp = req.headers.get("x-forwarded-for") ||
                     req.headers.get("x-real-ip") ||
                     "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    await supabase.rpc("log_download", {
      p_version_id: versionData.id,
      p_api_key_id: api_key_id,
      p_ip_address: clientIp,
      p_user_agent: userAgent,
    });

    // 5. Return signed URL
    const response = {
      version: versionData.version,
      file_name: versionData.file_name,
      file_size: versionData.file_size,
      changelog: versionData.changelog,
      download_url: signedUrlData.signedUrl,
      expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
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
