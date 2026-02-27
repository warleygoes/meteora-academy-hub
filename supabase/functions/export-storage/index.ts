import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function streamToUint8Array(blob: Blob): Promise<Uint8Array> {
  const reader = blob.stream().getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function listAllFiles(supabase: any, bucket: string, prefix: string = ""): Promise<string[]> {
  const paths: string[] = [];
  const { data: files, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });

  if (error || !files) return paths;

  for (const file of files) {
    const fullPath = prefix ? `${prefix}/${file.name}` : file.name;
    if (file.id === null) {
      // It's a folder, recurse
      const subPaths = await listAllFiles(supabase, bucket, fullPath);
      paths.push(...subPaths);
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
}

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

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
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
    let fileCount = 0;

    for (const bucket of buckets) {
      const filePaths = await listAllFiles(supabase, bucket);
      console.log(`Bucket ${bucket}: ${filePaths.length} files`);

      for (const path of filePaths) {
        try {
          const { data: blob, error: dlError } = await supabase.storage
            .from(bucket)
            .download(path);

          if (dlError || !blob) {
            console.error(`Skip ${bucket}/${path}: ${dlError?.message}`);
            continue;
          }

          // Stream to avoid large single allocation
          const data = await streamToUint8Array(blob);
          zip.file(`${bucket}/${path}`, data);
          fileCount++;
        } catch (e) {
          console.error(`Error processing ${bucket}/${path}:`, e.message);
        }
      }
    }

    console.log(`Zipping ${fileCount} files...`);
    const zipData = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 1 } });

    return new Response(zipData, {
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
