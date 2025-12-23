// ============================================
// UPLOAD ENDPOINT (admin only)
// POST /upload
// Body: multipart/form-data with file + metadata
// Header: Authorization: Bearer YOUR_API_KEY
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
    // 1. Verify API key with 'upload' permission
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid API key" }),
        { status: 401, headers }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const { is_valid, permissions } = keyData[0];

    if (!is_valid || !permissions.includes("upload")) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions (upload required)" }),
        { status: 403, headers }
      );
    }

    // 2. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const version = formData.get("version") as string;
    const changelog = formData.get("changelog") as string || "";
    const setLatest = (formData.get("set_latest") as string) === "true";

    if (!file || !version) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: file, version" }),
        { status: 400, headers }
      );
    }

    // Validate file type (.exe)
    if (!file.name.endsWith(".exe") && !file.name.endsWith(".msi")) {
      return new Response(
        JSON.stringify({ error: "Only .exe and .msi files are allowed" }),
        { status: 400, headers }
      );
    }

    // 3. Upload file to Supabase Storage
    const fileName = `evonyte-admin-v${version}.exe`;
    const filePath = `releases/${fileName}`;

    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("evonyte-releases")
      .upload(filePath, fileBuffer, {
        contentType: "application/x-msdownload",
        upsert: false, // Don't overwrite if exists
      });

    if (uploadError) {
      if (uploadError.message.includes("duplicate")) {
        return new Response(
          JSON.stringify({ error: "Version already exists" }),
          { status: 409, headers }
        );
      }
      throw uploadError;
    }

    // 4. Create database entry
    const { data: versionData, error: versionError } = await supabase
      .from("versions")
      .insert({
        version,
        file_name: fileName,
        file_path: filePath,
        file_size: file.size,
        changelog,
        is_latest: setLatest,
        is_active: true,
      })
      .select()
      .single();

    if (versionError) {
      // Rollback: delete uploaded file
      await supabase.storage
        .from("evonyte-releases")
        .remove([filePath]);
      throw versionError;
    }

    // 5. Success response
    const response = {
      success: true,
      version: versionData.version,
      file_name: versionData.file_name,
      file_size: versionData.file_size,
      is_latest: versionData.is_latest,
      message: "Version uploaded successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 201,
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
