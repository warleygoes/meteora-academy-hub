import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

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

    // MODE: schema — export DDL (CREATE TABLE statements)
    if (mode === "schema") {
      const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
      const pgClient = new Client(dbUrl);
      await pgClient.connect();

      try {
        // Get columns
        const colResult = await pgClient.queryObject<{
          table_name: string; column_name: string; udt_name: string;
          is_nullable: string; column_default: string | null; ordinal_position: number;
        }>(`
          SELECT table_name, column_name, udt_name, is_nullable, column_default, ordinal_position
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ANY($1)
          ORDER BY table_name, ordinal_position
        `, [TABLES_ORDER]);

        // Get primary keys
        const pkResult = await pgClient.queryObject<{ table_name: string; column_name: string }>(`
          SELECT tc.table_name, kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public' AND tc.table_name = ANY($1)
        `, [TABLES_ORDER]);

        // Get foreign keys
        const fkResult = await pgClient.queryObject<{
          table_name: string; column_name: string; foreign_table: string; foreign_column: string; constraint_name: string;
        }>(`
          SELECT tc.table_name, kcu.column_name,
            ccu.table_name AS foreign_table, ccu.column_name AS foreign_column,
            tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' AND tc.table_name = ANY($1)
        `, [TABLES_ORDER]);

        // Get unique constraints
        const uqResult = await pgClient.queryObject<{ table_name: string; column_name: string; constraint_name: string }>(`
          SELECT tc.table_name, kcu.column_name, tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public' AND tc.table_name = ANY($1)
        `, [TABLES_ORDER]);

        // Get enums
        const enumResult = await pgClient.queryObject<{ typname: string; enumlabel: string }>(`
          SELECT t.typname, e.enumlabel
          FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
          ORDER BY t.typname, e.enumsortorder
        `);

        // Group data
        const colsByTable = new Map<string, typeof colResult.rows>();
        for (const c of colResult.rows) {
          if (!colsByTable.has(c.table_name)) colsByTable.set(c.table_name, []);
          colsByTable.get(c.table_name)!.push(c);
        }

        const pksByTable = new Map<string, Set<string>>();
        for (const pk of pkResult.rows) {
          if (!pksByTable.has(pk.table_name)) pksByTable.set(pk.table_name, new Set());
          pksByTable.get(pk.table_name)!.add(pk.column_name);
        }

        const fksByTable = new Map<string, typeof fkResult.rows>();
        for (const fk of fkResult.rows) {
          if (!fksByTable.has(fk.table_name)) fksByTable.set(fk.table_name, []);
          fksByTable.get(fk.table_name)!.push(fk);
        }

        const uqsByTable = new Map<string, Map<string, string[]>>();
        for (const uq of uqResult.rows) {
          if (!uqsByTable.has(uq.table_name)) uqsByTable.set(uq.table_name, new Map());
          const tbl = uqsByTable.get(uq.table_name)!;
          if (!tbl.has(uq.constraint_name)) tbl.set(uq.constraint_name, []);
          tbl.get(uq.constraint_name)!.push(uq.column_name);
        }

        const enumMap = new Map<string, string[]>();
        for (const e of enumResult.rows) {
          if (!enumMap.has(e.typname)) enumMap.set(e.typname, []);
          enumMap.get(e.typname)!.push(e.enumlabel);
        }

        // Build SQL
        const lines: string[] = [];
        lines.push("-- =============================================================");
        lines.push("-- Meteora Academy - Schema Export (DDL)");
        lines.push(`-- Generated: ${new Date().toISOString()}`);
        lines.push("-- =============================================================");
        lines.push("");

        // Emit enums
        for (const [name, labels] of enumMap) {
          lines.push(`CREATE TYPE public.${name} AS ENUM (${labels.map(l => `'${l}'`).join(", ")});`);
        }
        if (enumMap.size > 0) lines.push("");

        for (const tName of TABLES_ORDER) {
          const cols = colsByTable.get(tName);
          if (!cols) continue;
          const pks = pksByTable.get(tName) || new Set();
          const fks = fksByTable.get(tName) || [];
          const uqs = uqsByTable.get(tName) || new Map();

          lines.push(`-- =====================`);
          lines.push(`-- TABLE: ${tName}`);
          lines.push(`-- =====================`);
          lines.push(`CREATE TABLE IF NOT EXISTS public."${tName}" (`);

          const colDefs: string[] = [];
          for (const c of cols) {
            let typeName = c.udt_name;
            if (typeName === "uuid") typeName = "uuid";
            else if (typeName === "text") typeName = "text";
            else if (typeName === "bool") typeName = "boolean";
            else if (typeName === "int4") typeName = "integer";
            else if (typeName === "int8") typeName = "bigint";
            else if (typeName === "float8") typeName = "double precision";
            else if (typeName === "numeric") typeName = "numeric";
            else if (typeName === "timestamptz") typeName = "timestamp with time zone";
            else if (typeName === "timestamp") typeName = "timestamp without time zone";
            else if (typeName === "date") typeName = "date";
            else if (typeName === "jsonb") typeName = "jsonb";
            else if (typeName === "json") typeName = "json";
            else if (typeName === "_text") typeName = "text[]";
            else if (typeName === "_uuid") typeName = "uuid[]";
            else if (typeName === "_int4") typeName = "integer[]";
            else if (typeName === "_float8") typeName = "double precision[]";
            else if (enumMap.has(typeName)) typeName = `public.${typeName}`;

            let def = `  "${c.column_name}" ${typeName}`;
            if (c.is_nullable === "NO") def += " NOT NULL";
            if (c.column_default !== null) def += ` DEFAULT ${c.column_default}`;
            colDefs.push(def);
          }

          // Primary key
          const pkCols = cols.filter(c => pks.has(c.column_name));
          if (pkCols.length > 0) {
            colDefs.push(`  PRIMARY KEY (${pkCols.map(c => `"${c.column_name}"`).join(", ")})`);
          }

          // Unique constraints
          for (const [, uqCols] of uqs) {
            colDefs.push(`  UNIQUE (${uqCols.map(c => `"${c}"`).join(", ")})`);
          }

          lines.push(colDefs.join(",\n"));
          lines.push(");");
          lines.push("");

          // Foreign keys as ALTER TABLE
          for (const fk of fks) {
            lines.push(`ALTER TABLE public."${tName}" ADD CONSTRAINT "${fk.constraint_name}" FOREIGN KEY ("${fk.column_name}") REFERENCES public."${fk.foreign_table}" ("${fk.foreign_column}");`);
          }

          // RLS
          lines.push(`ALTER TABLE public."${tName}" ENABLE ROW LEVEL SECURITY;`);
          lines.push("");
        }

        await pgClient.end();

        return new Response(lines.join("\n"), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/sql; charset=utf-8",
            "Content-Disposition": `attachment; filename=schema_${new Date().toISOString().slice(0, 10)}.sql`,
          },
        });
      } catch (schemaErr) {
        await pgClient.end();
        throw schemaErr;
      }
    }

    // MODE: data — export only INSERT statements (no DDL)
    // MODE: full — same as data (kept for backward compat)
    const dataOnly = mode === "data" || mode === "full";
    const lines: string[] = [];
    lines.push("-- =============================================================");
    lines.push("-- Meteora Academy - Data Only Dump (INSERT INTO statements)");
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push("-- =============================================================");
    lines.push("");
    lines.push("SET session_replication_role = 'replica';");
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
    lines.push("SET session_replication_role = 'origin';");
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
