// ============================================
// LATEST VERSION ENDPOINT
// GET /latest
// Returns info about the latest version
// Now reads from version.json on GitHub (single source of truth)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Fetch version.json from GitHub (single source of truth)
    const versionJsonUrl = "https://raw.githubusercontent.com/Evonyte/evonyte-distribution/master/version.json";
    const versionResponse = await fetch(versionJsonUrl);

    if (!versionResponse.ok) {
      throw new Error(`Failed to fetch version.json: ${versionResponse.statusText}`);
    }

    const versionData = await versionResponse.json();

    // Response in expected format
    const response = {
      version: versionData.version,
      file_name: `evonyte-admin-v${versionData.version}-windows.zip`,
      file_size: 16777216, // Approximate size
      changelog: versionData.changelog.join("\n"),
      released_at: versionData.releaseDate,
      download_url: versionData.downloadUrl,
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
