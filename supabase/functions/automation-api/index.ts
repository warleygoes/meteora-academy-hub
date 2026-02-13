import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ─── Action handlers ─────────────────────────────────────────────

async function handleCreateUser(
  supabase: ReturnType<typeof createClient>,
  params: {
    email: string;
    password: string;
    display_name?: string;
    phone?: string;
    country?: string;
    company_name?: string;
    approved?: boolean;
  }
) {
  const { email, password, display_name, phone, country, company_name, approved } = params;

  if (!email?.includes("@")) return json({ error: "Invalid email" }, 400);
  if (!password || password.length < 6) return json({ error: "Password must be ≥ 6 chars" }, 400);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      display_name: display_name || email,
      phone,
      country,
      company_name,
    },
  });

  if (authError) {
    const exists = authError.message?.includes("already") ?? false;
    return json({ error: authError.message, code: exists ? "USER_EXISTS" : "AUTH_ERROR" }, exists ? 409 : 400);
  }

  // Wait for trigger, then update profile
  await new Promise((r) => setTimeout(r, 300));

  if (authData.user) {
    await supabase.from("profiles").update({
      display_name: display_name || email,
      phone: phone || null,
      country: country || null,
      company_name: company_name || null,
      approved: approved ?? true,
      status: approved !== false ? "approved" : "pending",
    }).eq("user_id", authData.user.id);
  }

  return json({
    success: true,
    user_id: authData.user?.id,
    email: authData.user?.email,
  });
}

async function handleEnrollUser(
  supabase: ReturnType<typeof createClient>,
  params: { user_id?: string; email?: string; course_id: string }
) {
  const { course_id } = params;
  let userId = params.user_id;

  if (!course_id) return json({ error: "course_id is required" }, 400);

  // Resolve user_id from email if needed
  if (!userId && params.email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", params.email.trim().toLowerCase())
      .maybeSingle();
    if (!profile) return json({ error: "User not found with that email", code: "USER_NOT_FOUND" }, 404);
    userId = profile.user_id;
  }

  if (!userId) return json({ error: "user_id or email is required" }, 400);

  // Check course exists
  const { data: course } = await supabase.from("courses").select("id, title").eq("id", course_id).maybeSingle();
  if (!course) return json({ error: "Course not found", code: "COURSE_NOT_FOUND" }, 404);

  // Check existing enrollment
  const { data: existing } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", course_id)
    .maybeSingle();

  if (existing) {
    return json({ success: true, already_enrolled: true, enrollment_id: existing.id });
  }

  const { data: enrollment, error } = await supabase
    .from("course_enrollments")
    .insert({ user_id: userId, course_id })
    .select()
    .single();

  if (error) return json({ error: error.message }, 500);

  return json({
    success: true,
    already_enrolled: false,
    enrollment_id: enrollment.id,
    course_title: course.title,
  });
}

async function handleAssignProduct(
  supabase: ReturnType<typeof createClient>,
  params: { user_id?: string; email?: string; product_id: string }
) {
  const { product_id } = params;
  let userId = params.user_id;

  if (!product_id) return json({ error: "product_id is required" }, 400);

  // Resolve user_id from email
  if (!userId && params.email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", params.email.trim().toLowerCase())
      .maybeSingle();
    if (!profile) return json({ error: "User not found", code: "USER_NOT_FOUND" }, 404);
    userId = profile.user_id;
  }

  if (!userId) return json({ error: "user_id or email is required" }, 400);

  // Check product exists
  const { data: product } = await supabase.from("products").select("id, name, course_id").eq("id", product_id).maybeSingle();
  if (!product) return json({ error: "Product not found", code: "PRODUCT_NOT_FOUND" }, 404);

  // Assign product
  const { data: existing } = await supabase
    .from("user_products")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", product_id)
    .maybeSingle();

  if (existing) {
    return json({ success: true, already_assigned: true });
  }

  const { error } = await supabase.from("user_products").insert({ user_id: userId, product_id });
  if (error) return json({ error: error.message }, 500);

  // Also enroll in course if product has one
  if (product.course_id) {
    const { data: existingEnroll } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", product.course_id)
      .maybeSingle();

    if (!existingEnroll) {
      await supabase.from("course_enrollments").insert({ user_id: userId, course_id: product.course_id });
    }
  }

  return json({ success: true, already_assigned: false, product_name: product.name });
}

async function handleAssignPackage(
  supabase: ReturnType<typeof createClient>,
  params: { user_id?: string; email?: string; package_id: string }
) {
  const { package_id } = params;
  let userId = params.user_id;

  if (!package_id) return json({ error: "package_id is required" }, 400);

  if (!userId && params.email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", params.email.trim().toLowerCase())
      .maybeSingle();
    if (!profile) return json({ error: "User not found", code: "USER_NOT_FOUND" }, 404);
    userId = profile.user_id;
  }

  if (!userId) return json({ error: "user_id or email is required" }, 400);

  // Check package exists
  const { data: pkg } = await supabase.from("packages").select("id, name").eq("id", package_id).maybeSingle();
  if (!pkg) return json({ error: "Package not found", code: "PACKAGE_NOT_FOUND" }, 404);

  // Check existing
  const { data: existing } = await supabase
    .from("user_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("package_id", package_id)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    return json({ success: true, already_assigned: true });
  }

  const { error } = await supabase.from("user_plans").insert({
    user_id: userId,
    package_id,
    status: "active",
  });
  if (error) return json({ error: error.message }, 500);

  return json({ success: true, already_assigned: false, package_name: pkg.name });
}

async function handleListCourses(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("courses")
    .select("id, title, status, category_id")
    .order("sort_order");
  if (error) return json({ error: error.message }, 500);
  return json({ courses: data });
}

async function handleListProducts(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, type, active, has_content, course_id")
    .order("sort_order");
  if (error) return json({ error: error.message }, 500);
  return json({ products: data });
}

async function handleListPackages(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("packages")
    .select("id, name, active, payment_type")
    .order("name");
  if (error) return json({ error: error.message }, 500);
  return json({ packages: data });
}

// ─── Router ──────────────────────────────────────────────────────

type ActionHandler = (supabase: ReturnType<typeof createClient>, params: any) => Promise<Response>;

const ACTIONS: Record<string, ActionHandler> = {
  create_user: handleCreateUser,
  enroll_user: handleEnrollUser,
  assign_product: handleAssignProduct,
  assign_package: handleAssignPackage,
  list_courses: handleListCourses,
  list_products: handleListProducts,
  list_packages: handleListPackages,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: API key check
    const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey || apiKey !== expectedKey) {
      return json({ error: "Unauthorized. Provide x-api-key header." }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse body
    const body = await req.json().catch(() => ({}));
    const { action, ...params } = body as { action?: string; [key: string]: unknown };

    if (!action) {
      return json({
        error: "Missing 'action' field",
        available_actions: Object.keys(ACTIONS),
      }, 400);
    }

    const handler = ACTIONS[action];
    if (!handler) {
      return json({
        error: `Unknown action: ${action}`,
        available_actions: Object.keys(ACTIONS),
      }, 400);
    }

    return await handler(supabase, params);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
