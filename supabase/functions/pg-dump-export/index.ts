import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const TABLES_ORDER = [
  "course_categories",
  "courses",
  "course_modules",
  "course_lessons",
  "lesson_contents",
  "products",
  "product_categories",
  "product_sales_pages",
  "packages",
  "package_product_groups",
  "package_products",
  "offers",
  "plans",
  "plan_courses",
  "plan_services",
  "plan_meetings",
  "services",
  "profiles",
  "user_roles",
  "user_plans",
  "user_products",
  "user_lesson_access",
  "course_enrollments",
  "lesson_progress",
  "lesson_ratings",
  "lesson_comments",
  "community_posts",
  "community_comments",
  "community_likes",
  "diagnostics",
  "diagnostic_questions",
  "diagnostic_answers",
  "diagnostic_lead_tracking",
  "diagnostic_recommendation_rules",
  "banners",
  "menu_links",
  "menu_link_products",
  "menu_link_packages",
  "network_topologies",
  "platform_settings",
  "system_logs",
  "testimonials",
  "webhook_endpoints",
  "webhook_event_types",
];

function escapeSQL(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) {
    const items = val.map((v) => {
      if (v === null) return "NULL";
      const s = String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `"${s}"`;
    });
    return `'{${items.join(",")}}'`;
  }
  if (typeof val === "object") {
    const json = JSON.stringify(val).replace(/'/g, "''");
    return `'${json}'::jsonb`;
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

async function verifyAdmin(supabaseAdmin: any, authHeader: string | null) {
  if (!authHeader) return null;
  const { data: { user: caller } } = await supabaseAdmin.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (!caller) return null;
  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .eq("role", "admin")
    .maybeSingle();
  return roleData ? caller : null;
}

async function fetchAllRows(supabaseAdmin: any, tableName: string) {
  let allRows: Record<string, unknown>[] = [];
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select("*")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) return { rows: allRows, error: error.message };
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return { rows: allRows, error: null };
}

function generateTableSQL(tableName: string, rows: Record<string, unknown>[]): string {
  const lines: string[] = [];
  lines.push(`-- =====================`);
  lines.push(`-- TABLE: ${tableName}`);
  lines.push(`-- =====================`);

  if (rows.length === 0) {
    lines.push(`-- (empty table)`);
    lines.push("");
    return lines.join("\n");
  }

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(", ");

  for (const row of rows) {
    const values = columns.map((col) => escapeSQL(row[col])).join(", ");
    lines.push(`INSERT INTO public."${tableName}" (${colList}) VALUES (${values});`);
  }

  lines.push(`-- ${rows.length} rows`);
  lines.push("");
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const caller = await verifyAdmin(supabaseAdmin, req.headers.get("Authorization"));
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "full"; // full | list | table | schema
    const tableName = url.searchParams.get("table");

    // MODE: list — returns table list with row counts
    if (mode === "list") {
      const tableInfo = [];
      for (const t of TABLES_ORDER) {
        const { rows } = await fetchAllRows(supabaseAdmin, t);
        tableInfo.push({ table: t, rows: rows.length });
      }
      return new Response(JSON.stringify(tableInfo), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // MODE: table — export single table
    if (mode === "table" && tableName) {
      if (!TABLES_ORDER.includes(tableName)) {
        return new Response(JSON.stringify({ error: "Table not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { rows, error } = await fetchAllRows(supabaseAdmin, tableName);
      if (error) {
        return new Response(JSON.stringify({ error }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const sql = `-- Meteora Academy - Table: ${tableName}\n-- Generated: ${new Date().toISOString()}\n\nBEGIN;\n\n${generateTableSQL(tableName, rows)}\nCOMMIT;\n`;

      return new Response(sql, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/sql; charset=utf-8",
          "Content-Disposition": `attachment; filename=${tableName}_${new Date().toISOString().slice(0, 10)}.sql`,
        },
      });
    }

    // MODE: schema — export DDL only (disable constraints for restore)
    if (mode === "schema") {
      const lines: string[] = [];
      lines.push("-- =============================================================");
      lines.push("-- Meteora Academy - Disable constraints for data import");
      lines.push(`-- Generated: ${new Date().toISOString()}`);
      lines.push("-- =============================================================");
      lines.push("");
      lines.push("-- Run this BEFORE importing data:");
      lines.push("SET session_replication_role = 'replica';");
      lines.push("");
      lines.push("-- Run this AFTER importing all data:");
      lines.push("-- SET session_replication_role = 'origin';");
      return new Response(lines.join("\n"), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/sql; charset=utf-8",
          "Content-Disposition": `attachment; filename=00_disable_constraints.sql`,
        },
      });
    }

    // MODE: full — original behavior (all tables in one file)
    const lines: string[] = [];
    lines.push("-- =============================================================");
    lines.push("-- Meteora Academy - Full Data Dump (INSERT INTO statements)");
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push("-- =============================================================");
    lines.push("");
    lines.push("BEGIN;");
    lines.push("");

    for (const t of TABLES_ORDER) {
      const { rows, error } = await fetchAllRows(supabaseAdmin, t);
      if (error) {
        lines.push(`-- ERROR fetching ${t}: ${error}`);
        continue;
      }
      lines.push(generateTableSQL(t, rows));
    }

    lines.push("COMMIT;");
    lines.push("");

    return new Response(lines.join("\n"), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": "attachment; filename=pg_dump_data.sql",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("pg-dump-export error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
