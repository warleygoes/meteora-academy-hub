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
  updated_at?: string;
  last_sign_in_at?: string;
  phone?: string;
  email_confirmed_at?: string;
}

interface ExportedProfile {
  id?: string;
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
  created_at?: string;
  updated_at?: string;
}

interface ExportedRole {
  id?: string;
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
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: { user: caller } } = await supabaseAdmin.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (!caller) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    return new Response(JSON.stringify({ error: "Not admin" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: MigrationPayload = await req.json();
    const { users, profiles, user_roles } = payload;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: "No users provided in payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = {
      auth_users: { created: 0, skipped: 0, errors: [] as string[] },
      identities: { created: 0, skipped: 0, errors: [] as string[] },
      profiles: { created: 0, updated: 0, errors: [] as string[] },
      user_roles: { created: 0, skipped: 0, errors: [] as string[] },
    };

    // =========================================================================
    // STEP 1: Insert auth.users via raw SQL (service role required)
    // We use supabase.rpc to call a migration helper function,
    // but since we can't create functions on the fly, we use the Admin API
    // =========================================================================

    const BATCH_SIZE = 10;

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async (u) => {
          try {
            // Try creating user via Admin API with pre-set password
            const { data: authData, error: authError } =
              await supabaseAdmin.auth.admin.createUser({
                email: u.email,
                email_confirm: true,
                user_metadata: u.raw_user_meta_data || { display_name: u.email },
                app_metadata: u.raw_app_meta_data || {
                  provider: "email",
                  providers: ["email"],
                },
                phone: u.phone || undefined,
              });

            if (authError) {
              if (
                authError.message?.includes("already been registered") ||
                authError.message?.includes("already exists")
              ) {
                results.auth_users.skipped++;
                return { email: u.email, status: "skipped", userId: null };
              }
              results.auth_users.errors.push(`${u.email}: ${authError.message}`);
              return { email: u.email, status: "error", userId: null };
            }

            results.auth_users.created++;

            // Note: The Admin API doesn't allow setting encrypted_password directly.
            // For full password migration, the SQL script (scripts/import-users.sql)
            // must be used directly on the database.
            // This function creates users and profiles/roles programmatically.

            return {
              email: u.email,
              status: "created",
              userId: authData.user?.id || null,
              originalId: u.id,
            };
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            results.auth_users.errors.push(`${u.email}: ${msg}`);
            return { email: u.email, status: "error", userId: null };
          }
        })
      );

      // Collect user ID mappings (original -> new)
      for (const r of batchResults) {
        if (r.status === "fulfilled" && r.value.status === "created") {
          // Map original ID to new ID for profiles/roles
          const originalId = r.value.originalId;
          const newId = r.value.userId;
          if (originalId && newId) {
            userIdMap.set(originalId, newId);
          }
        }
      }
    }

    // Build user ID map for existing users (by email)
    const userIdMap = new Map<string, string>();

    // For users that were skipped (already exist), find their current IDs
    for (const u of users) {
      if (!userIdMap.has(u.id)) {
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("user_id")
          .eq("email", u.email.toLowerCase())
          .maybeSingle();

        if (existingProfile) {
          userIdMap.set(u.id, existingProfile.user_id);
        }
      }
    }

    // =========================================================================
    // STEP 2: Insert profiles
    // =========================================================================
    const profilesToInsert = profiles || [];

    // If no profiles provided, create basic ones from users data
    const finalProfiles =
      profilesToInsert.length > 0
        ? profilesToInsert
        : users.map((u) => ({
            user_id: u.id,
            email: u.email,
            display_name:
              (u.raw_user_meta_data?.display_name as string) || u.email,
          }));

    for (let i = 0; i < finalProfiles.length; i += BATCH_SIZE) {
      const batch = finalProfiles.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (p) => {
          const mappedUserId = userIdMap.get(p.user_id) || p.user_id;

          try {
            const profileData: Record<string, unknown> = {
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

            // Try insert first
            const { error: insertError } = await supabaseAdmin
              .from("profiles")
              .insert(profileData);

            if (insertError) {
              if (insertError.message?.includes("duplicate")) {
                // Update existing
                const { error: updateError } = await supabaseAdmin
                  .from("profiles")
                  .update(profileData)
                  .eq("user_id", mappedUserId);

                if (updateError) {
                  results.profiles.errors.push(
                    `${p.email}: ${updateError.message}`
                  );
                } else {
                  results.profiles.updated++;
                }
              } else {
                results.profiles.errors.push(
                  `${p.email}: ${insertError.message}`
                );
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
                results.user_roles.errors.push(
                  `${mappedUserId}/${r.role}: ${error.message}`
                );
              }
            } else {
              results.user_roles.created++;
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            results.user_roles.errors.push(`${mappedUserId}/${r.role}: ${msg}`);
          }
        })
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          auth_users: `${results.auth_users.created} created, ${results.auth_users.skipped} skipped, ${results.auth_users.errors.length} errors`,
          profiles: `${results.profiles.created} created, ${results.profiles.updated} updated, ${results.profiles.errors.length} errors`,
          user_roles: `${results.user_roles.created} created, ${results.user_roles.skipped} skipped, ${results.user_roles.errors.length} errors`,
        },
        details: results,
        note: "For full password migration (preserving bcrypt hashes), use the SQL script directly on the database. The Admin API creates users with new passwords.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Migration error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
