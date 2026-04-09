import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ExportedUser {
  id: string;
  email: string;
  encrypted_password: string;
  raw_user_meta_data?: Record<string, unknown>;
  raw_app_meta_data?: Record<string, unknown>;
  created_at?: string;
  phone?: string;
}

interface ExportedProfile {
  user_id: string;
  email?: string;
  display_name?: string;
  role_type?: string;
  company_name?: string;
  country?: string;
  phone?: string;
  client_count?: string;
  network_type?: string;
  cheapest_plan_usd?: number;
  main_problems?: string;
  main_desires?: string;
  bio?: string;
  avatar_url?: string;
  cpf?: string;
  gender?: string;
  birth_date?: string;
  observations?: string;
  approved?: boolean;
  status?: string;
}

interface ExportedRole {
  user_id: string;
  role: string;
}

interface MigrationPayload {
  users: ExportedUser[];
  profiles?: ExportedProfile[];
  user_roles?: ExportedRole[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: { user: caller } } = await supabaseAdmin.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (!caller) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: adminRole } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").maybeSingle();
  if (!adminRole) {
    return new Response(JSON.stringify({ error: "Not admin" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: MigrationPayload = await req.json();
    const { users, profiles, user_roles } = payload;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(JSON.stringify({ error: "No users provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = {
      auth_users: { created: 0, skipped: 0, errors: [] as string[] },
      profiles: { created: 0, updated: 0, errors: [] as string[] },
      user_roles: { created: 0, skipped: 0, errors: [] as string[] },
    };

    // Map original user IDs to new IDs (in case IDs change)
    const userIdMap = new Map<string, string>();

    const BATCH_SIZE = 5;

    // =========================================================================
    // STEP 1: Create auth.users via Admin API
    // Note: Admin API cannot set encrypted_password directly.
    // For preserving bcrypt hashes, use scripts/import-users.sql on the DB.
    // This function creates users with a temporary password and maps IDs.
    // =========================================================================

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async (u) => {
          try {
            const { data: authData, error: authError } =
              await supabaseAdmin.auth.admin.createUser({
                email: u.email.trim().toLowerCase(),
                email_confirm: true,
                user_metadata: u.raw_user_meta_data || { display_name: u.email },
                app_metadata: u.raw_app_meta_data || { provider: "email", providers: ["email"] },
                phone: u.phone || undefined,
              });

            if (authError) {
              if (authError.message?.includes("already") || authError.message?.includes("exists")) {
                results.auth_users.skipped++;
                // Try to find existing user by email
                const { data: existingProfile } = await supabaseAdmin
                  .from("profiles").select("user_id").eq("email", u.email.toLowerCase()).maybeSingle();
                if (existingProfile) {
                  userIdMap.set(u.id, existingProfile.user_id);
                }
                return;
              }
              results.auth_users.errors.push(`${u.email}: ${authError.message}`);
              return;
            }

            if (authData.user) {
              userIdMap.set(u.id, authData.user.id);
              results.auth_users.created++;
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            results.auth_users.errors.push(`${u.email}: ${msg}`);
          }
        })
      );
    }

    // =========================================================================
    // STEP 2: Upsert profiles
    // =========================================================================
    const finalProfiles = (profiles && profiles.length > 0) ? profiles : users.map((u) => ({
      user_id: u.id,
      email: u.email,
      display_name: (u.raw_user_meta_data?.display_name as string) || u.email,
    }));

    for (let i = 0; i < finalProfiles.length; i += BATCH_SIZE) {
      const batch = finalProfiles.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (p) => {
          const mappedUserId = userIdMap.get(p.user_id) || p.user_id;
          try {
            const row: Record<string, unknown> = {
              user_id: mappedUserId,
              email: p.email?.toLowerCase(),
              display_name: p.display_name,
              role_type: p.role_type || null,
              company_name: p.company_name || null,
              country: p.country || null,
              phone: p.phone || null,
              client_count: p.client_count || null,
              network_type: p.network_type || null,
              cheapest_plan_usd: p.cheapest_plan_usd || null,
              main_problems: p.main_problems || null,
              main_desires: p.main_desires || null,
              bio: p.bio || null,
              avatar_url: p.avatar_url || null,
              cpf: p.cpf || null,
              gender: p.gender || null,
              birth_date: p.birth_date || null,
              observations: p.observations || null,
              approved: p.approved ?? true,
              status: p.status || "approved",
            };

            const { error: insertErr } = await supabaseAdmin.from("profiles").insert(row);
            if (insertErr) {
              if (insertErr.message?.includes("duplicate")) {
                const { error: updateErr } = await supabaseAdmin
                  .from("profiles").update(row).eq("user_id", mappedUserId);
                if (updateErr) {
                  results.profiles.errors.push(`${p.email}: ${updateErr.message}`);
                } else {
                  results.profiles.updated++;
                }
              } else {
                results.profiles.errors.push(`${p.email}: ${insertErr.message}`);
              }
            } else {
              results.profiles.created++;
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            results.profiles.errors.push(`${p.email}: ${msg}`);
          }
        })
      );
    }

    // =========================================================================
    // STEP 3: Insert user_roles
    // =========================================================================
    const rolesToInsert = user_roles || [];

    for (let i = 0; i < rolesToInsert.length; i += BATCH_SIZE) {
      const batch = rolesToInsert.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (r) => {
          const mappedUserId = userIdMap.get(r.user_id) || r.user_id;
          try {
            const { error } = await supabaseAdmin.from("user_roles").insert({
              user_id: mappedUserId,
              role: r.role,
            });
            if (error) {
              if (error.message?.includes("duplicate")) {
                results.user_roles.skipped++;
              } else {
                results.user_roles.errors.push(`${mappedUserId}/${r.role}: ${error.message}`);
              }
            } else {
              results.user_roles.created++;
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            results.user_roles.errors.push(`${r.user_id}/${r.role}: ${msg}`);
          }
        })
      );
    }

    return new Response(JSON.stringify({
      success: true,
      summary: {
        auth_users: `${results.auth_users.created} criados, ${results.auth_users.skipped} existentes, ${results.auth_users.errors.length} erros`,
        profiles: `${results.profiles.created} criados, ${results.profiles.updated} atualizados, ${results.profiles.errors.length} erros`,
        user_roles: `${results.user_roles.created} criados, ${results.user_roles.skipped} existentes, ${results.user_roles.errors.length} erros`,
      },
      details: results,
      note: "Para preservar senhas bcrypt originais, execute scripts/import-users.sql diretamente no banco. A Admin API cria usuários com senha temporária.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Migration error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
