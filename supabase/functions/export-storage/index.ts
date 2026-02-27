import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function listAllFiles(supabase: any, bucket: string, prefix = ""): Promise<string[]> {
  const paths: string[] = [];
  const { data: files, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
  if (error || !files) return paths;
  for (const file of files) {
    const fullPath = prefix ? `${prefix}/${file.name}` : file.name;
    if (file.id === null) {
      paths.push(...(await listAllFiles(supabase, bucket, fullPath)));
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const bucketParam = url.searchParams.get("bucket");
    const allBuckets = ["avatars", "product-images", "community-images"];

    // If no bucket specified, return bucket list with file counts
    if (!bucketParam) {
      const info = [];
      for (const b of allBuckets) {
        const files = await listAllFiles(supabase, b);
        info.push({ bucket: b, files: files.length });
      }
      return new Response(JSON.stringify(info), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!allBuckets.includes(bucketParam)) {
      return new Response(JSON.stringify({ error: `Invalid bucket. Use: ${allBuckets.join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Export single bucket
    const filePaths = await listAllFiles(supabase, bucketParam);
    console.log(`Bucket ${bucketParam}: ${filePaths.length} files`);

    const zip = new JSZip();
    let count = 0;

    for (const path of filePaths) {
      try {
        const { data: blob, error: dlError } = await supabase.storage.from(bucketParam).download(path);
        if (dlError || !blob) { console.error(`Skip ${path}: ${dlError?.message}`); continue; }
        const buf = new Uint8Array(await blob.arrayBuffer());
        zip.file(path, buf);
        count++;
      } catch (e) {
        console.error(`Error ${path}:`, e.message);
      }
    }

    console.log(`Zipping ${count} files from ${bucketParam}...`);
    const zipData = await zip.generateAsync({ type: "uint8array", compression: "STORE" });

    return new Response(zipData, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${bucketParam}_${new Date().toISOString().slice(0, 10)}.zip"`,
      },
    });
  } catch (e) {
    console.error("Export error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
