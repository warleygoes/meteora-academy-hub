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
    const format = url.searchParams.get("format") || "json"; // json | csv | sql

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

    if (format === "sql") {
      const esc = (v: any): string => {
        if (v === null || v === undefined) return "NULL";
        if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
        if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
        return `'${String(v).replace(/'/g, "''")}'`;
      };

      const lines: string[] = [
        `-- auth.users + auth.identities export ${new Date().toISOString()}`,
        `-- Total: ${allUsers.length} users`,
        `-- Execute as superuser on target Supabase database`,
        ``,
        `SET session_replication_role = 'replica';`,
        ``,
        `-- ===================== auth.users =====================`,
      ];

      for (const u of allUsers) {
        const meta = u.user_metadata || {};
        const appMeta = u.app_metadata || { provider: "email", providers: ["email"] };
        lines.push(`INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at,
  recovery_token, recovery_sent_at, email_change_token_new, email_change,
  email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
  phone_change, phone_change_token, phone_change_sent_at,
  email_change_token_current, email_change_confirm_status,
  banned_until, reauthentication_token, reauthentication_sent_at,
  is_sso_user, deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  ${esc(u.id)}, 'authenticated', 'authenticated',
  ${esc(u.email)}, ${esc((u as any).encrypted_password || '')},
  ${u.email_confirmed_at ? esc(u.email_confirmed_at) : "NOW()"},
  NULL, '', NULL, '', NULL, '', '', NULL,
  ${esc(u.last_sign_in_at)},
  ${esc(appMeta)},
  ${esc(meta)},
  FALSE,
  ${esc(u.created_at)}, ${esc(u.updated_at)},
  ${esc(u.phone)}, NULL,
  '', '', NULL, '', 0, NULL, '', NULL, FALSE, NULL
) ON CONFLICT (id) DO NOTHING;`);
      }

      lines.push(``);
      lines.push(`-- ===================== auth.identities =====================`);

      for (const u of allUsers) {
        lines.push(`INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  ${esc(u.id)},
  jsonb_build_object('sub', ${esc(u.id)}, 'email', ${esc(u.email)}, 'email_verified', true),
  'email',
  ${esc(u.id)},
  ${u.last_sign_in_at ? esc(u.last_sign_in_at) : "NOW()"},
  ${esc(u.created_at)}, ${esc(u.updated_at)}
) ON CONFLICT (provider, provider_id) DO NOTHING;`);
      }

      lines.push(``);
      lines.push(`SET session_replication_role = 'origin';`);
      lines.push(``);
      lines.push(`-- Verification queries:`);
      lines.push(`-- SELECT COUNT(*) FROM auth.users;`);
      lines.push(`-- SELECT COUNT(*) FROM auth.identities;`);
      lines.push(`-- SELECT u.id, u.email FROM auth.users u LEFT JOIN auth.identities i ON i.user_id = u.id WHERE i.id IS NULL;`);

      return new Response(lines.join("\n"), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/sql; charset=utf-8",
          "Content-Disposition": `attachment; filename=auth_users_${new Date().toISOString().slice(0, 10)}.sql`,
        },
      });
    }

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
      encrypted_password: (u as any).encrypted_password || null,
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
