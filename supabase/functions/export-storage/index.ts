import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buckets = ["avatars", "product-images", "community-images"];
    const zip = new JSZip();

    for (const bucket of buckets) {
      // List all files in bucket
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

      if (listError) {
        console.error(`Error listing ${bucket}:`, listError.message);
        continue;
      }

      if (!files || files.length === 0) continue;

      // For buckets with folder structure (avatars), we need to recurse
      for (const file of files) {
        if (file.id === null) {
          // It's a folder, list its contents
          const { data: subFiles } = await supabase.storage
            .from(bucket)
            .list(file.name, { limit: 1000 });

          if (subFiles) {
            for (const subFile of subFiles) {
              if (subFile.id === null) continue;
              const path = `${file.name}/${subFile.name}`;
              const { data: blob, error: dlError } = await supabase.storage
                .from(bucket)
                .download(path);

              if (dlError || !blob) {
                console.error(`Error downloading ${bucket}/${path}:`, dlError?.message);
                continue;
              }

              const arrayBuffer = await blob.arrayBuffer();
              zip.file(`${bucket}/${path}`, arrayBuffer);
            }
          }
        } else {
          // It's a file
          const { data: blob, error: dlError } = await supabase.storage
            .from(bucket)
            .download(file.name);

          if (dlError || !blob) {
            console.error(`Error downloading ${bucket}/${file.name}:`, dlError?.message);
            continue;
          }

          const arrayBuffer = await blob.arrayBuffer();
          zip.file(`${bucket}/${file.name}`, arrayBuffer);
        }
      }
    }

    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: "uint8array" });

    return new Response(zipBlob, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="storage_export_${new Date().toISOString().slice(0, 10)}.zip"`,
      },
    });
  } catch (e) {
    console.error("Export error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
