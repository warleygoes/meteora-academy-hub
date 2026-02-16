import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImportRow {
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  gender?: string;
  birth_date?: string;
  registered_at?: string;
  last_login?: string;
  completion_pct?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
  const { data: { user: caller } } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!caller) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: roleData } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").maybeSingle();
  if (!roleData) {
    return new Response(JSON.stringify({ error: "Not admin" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Handle DELETE - remove auth user so email can be re-registered
  if (req.method === "DELETE") {
    try {
      const { user_id } = await req.json();
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  // Handle POST - import users
  try {
    const { users, defaultPassword } = await req.json() as { users: ImportRow[]; defaultPassword: string };

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(JSON.stringify({ error: "No users provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!defaultPassword || defaultPassword.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { email: string; status: "created" | "exists" | "error"; message?: string }[] = [];

    const BATCH_SIZE = 5;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(row => processUser(supabaseAdmin, row, defaultPassword))
      );
      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          results.push({ email: "unknown", status: "error", message: result.reason?.message || "Unknown error" });
        }
      }
    }

    const created = results.filter(r => r.status === "created").length;
    const exists = results.filter(r => r.status === "exists").length;
    const errors = results.filter(r => r.status === "error").length;

    return new Response(JSON.stringify({ created, exists, errors, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Import error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processUser(
  supabaseAdmin: any,
  row: ImportRow,
  defaultPassword: string
): Promise<{ email: string; status: "created" | "exists" | "error"; message?: string }> {
  if (!row.email || !row.email.includes("@")) {
    return { email: row.email || "empty", status: "error", message: "Invalid email" };
  }

  const email = row.email.trim().toLowerCase();

  const obsLines: string[] = [];
  if (row.registered_at) obsLines.push(`Data de Cadastro: ${row.registered_at}`);
  if (row.last_login) obsLines.push(`Último Login: ${row.last_login}`);
  if (row.completion_pct) obsLines.push(`Percentual de Conclusão: ${row.completion_pct}`);
  const observations = obsLines.length > 0 ? obsLines.join("\n") : null;

  let birthDate: string | null = null;
  if (row.birth_date) {
    const match = row.birth_date.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      birthDate = `${match[3]}-${match[2]}-${match[1]}`;
    }
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { display_name: row.name },
    });

    if (authError) {
      if (authError.message?.includes("already been registered") || authError.message?.includes("already exists")) {
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("user_id")
          .eq("email", email)
          .maybeSingle();

        if (existingProfile) {
          await supabaseAdmin.from("profiles").update({
            cpf: row.cpf || null,
            gender: row.gender || null,
            birth_date: birthDate,
            observations,
            phone: row.phone || undefined,
          }).eq("user_id", existingProfile.user_id);
        }

        return { email, status: "exists", message: "User already exists, profile updated" };
      }
      return { email, status: "error", message: authError.message };
    }

    if (authData.user) {
      // Wait briefly for the trigger to create the profile
      await new Promise(r => setTimeout(r, 100));

      await supabaseAdmin.from("profiles").update({
        display_name: row.name,
        email,
        phone: row.phone || null,
        cpf: row.cpf || null,
        gender: row.gender || null,
        birth_date: birthDate,
        observations,
        approved: true,
        status: "approved",
      }).eq("user_id", authData.user.id);
    }

    return { email, status: "created" };
  } catch (err: any) {
    return { email, status: "error", message: err.message };
  }
}
