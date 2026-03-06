import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "json"; // json | csv

    // Fetch ALL users via admin API with pagination
    const allUsers: any[] = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) throw new Error(`Error listing users: ${error.message}`);
      if (!users || users.length === 0) break;
      allUsers.push(...users);
      if (users.length < perPage) break;
      page++;
    }

    console.log(`Total users fetched: ${allUsers.length}`);

    if (format === "csv") {
      const headers = [
        "id", "email", "encrypted_password", "phone", "created_at", "updated_at", "last_sign_in_at",
        "email_confirmed_at", "confirmed_at", "role",
        "display_name", "company_name", "country", "phone_meta",
        "role_type", "client_count", "network_type",
      ];

      const csvLines = [headers.join(",")];

      for (const u of allUsers) {
        const meta = u.user_metadata || {};
        const row = [
          u.id,
          u.email || "",
          (u as any).encrypted_password || "",
          u.phone || "",
          u.created_at || "",
          u.updated_at || "",
          u.last_sign_in_at || "",
          u.email_confirmed_at || "",
          u.confirmed_at || "",
          u.role || "",
          (meta.display_name || "").replace(/,/g, " "),
          (meta.company_name || "").replace(/,/g, " "),
          (meta.country || "").replace(/,/g, " "),
          (meta.phone || "").replace(/,/g, " "),
          (meta.role_type || "").replace(/,/g, " "),
          (meta.client_count || "").replace(/,/g, " "),
          (meta.network_type || "").replace(/,/g, " "),
        ];
        csvLines.push(row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
      }

      return new Response(csvLines.join("\n"), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=users_${new Date().toISOString().slice(0, 10)}.csv`,
        },
      });
    }

    // JSON format - return simplified user objects
    const simplified = allUsers.map(u => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      created_at: u.created_at,
      updated_at: u.updated_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
      confirmed_at: u.confirmed_at,
      role: u.role,
      user_metadata: u.user_metadata,
    }));

    return new Response(JSON.stringify({ total: simplified.length, users: simplified }, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename=users_${new Date().toISOString().slice(0, 10)}.json`,
      },
    });
  } catch (e: any) {
    console.error("export-users error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
