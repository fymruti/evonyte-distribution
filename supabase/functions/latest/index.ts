// ============================================
// LATEST VERSION ENDPOINT
// GET /latest
// Returns hardcoded latest version info
// Simple and reliable - update this file when releasing new versions
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

  // === CURRENT VERSION - UPDATE HERE WHEN RELEASING ===
  const currentVersion = {
    version: "1.0.52",
    file_name: "evonyte-admin-v1.0.52-windows.zip",
    file_size: 25000000,
    changelog: "UI: Dual dropdown - wybor CO trenowac + JAK (intensywnosc)\nUI: Info badge z parametrami modelu\nUI: Auto-epoki dla intensywnosci (30/100/150)",
    released_at: "2026-01-01",
    download_url: "https://github.com/Evonyte/evonyte-distribution/releases/download/v1.0.52/evonyte-admin-v1.0.52-windows.zip",
  };

  return new Response(JSON.stringify(currentVersion), {
    status: 200,
    headers,
  });
});
