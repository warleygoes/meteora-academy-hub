import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminCallerId = claimsData.claims.sub;

    // Check admin role
    const { data: roleData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", adminCallerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bodyPayload = await req.json();
    const targetUserId = bodyPayload.userId || bodyPayload.user_id;
    const targetEmail = bodyPayload.email ? String(bodyPayload.email).trim().toLowerCase() : null;
    const newPassword = bodyPayload.newPassword;

    if (!targetUserId && !targetEmail) {
      return new Response(JSON.stringify({ error: "userId or email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (newPassword) {
      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let updated = false;

      // 1. Try updating directly by targetUserId if provided
      if (targetUserId) {
        const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
          password: newPassword,
        });
        if (!updateError) {
          updated = true;
        }
      }

      // 2. Fallback: If update by targetUserId failed or was not provided, look up in auth.users by email
      if (!updated && targetEmail) {
        const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        const foundUser = usersData?.users?.find(
          (u: any) => u.email?.toLowerCase() === targetEmail
        );

        if (foundUser) {
          const { error: updateByEmailError } = await adminClient.auth.admin.updateUserById(foundUser.id, {
            password: newPassword,
          });
          if (!updateByEmailError) {
            updated = true;
            // Sync profiles table user_id if targetUserId differed or was invalid
            if (targetUserId && targetUserId !== foundUser.id) {
              await adminClient.from("profiles").update({ user_id: foundUser.id }).eq("user_id", targetUserId);
            }
          }
        } else {
          // 3. User does not exist in auth.users at all -> create account in auth.users
          const { data: createAuthData, error: createAuthError } = await adminClient.auth.admin.createUser({
            email: targetEmail,
            password: newPassword,
            email_confirm: true,
          });

          if (!createAuthError && createAuthData?.user) {
            updated = true;
            const newAuthId = createAuthData.user.id;
            if (targetUserId) {
              await adminClient.from("profiles").update({ user_id: newAuthId }).eq("user_id", targetUserId);
            } else {
              await adminClient.from("profiles").update({ user_id: newAuthId }).eq("email", targetEmail);
            }
          } else if (createAuthError) {
            return new Response(JSON.stringify({ error: createAuthError.message }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }

      if (!updated) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Recovery link generation
      if (!targetEmail) {
        return new Response(JSON.stringify({ error: "Email is required for recovery link" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient.auth.admin.generateLink({
        type: "recovery",
        email: targetEmail,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
