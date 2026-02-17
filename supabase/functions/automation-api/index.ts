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

// ─── Product CRUD ────────────────────────────────────────────────

async function handleCreateProduct(
  supabase: ReturnType<typeof createClient>,
  params: { name: string; type: string; description?: string; active?: boolean; has_content?: boolean; payment_type?: string; saas_url?: string; thumbnail_url?: string; thumbnail_vertical_url?: string }
) {
  if (!params.name) return json({ error: "name is required" }, 400);
  if (!params.type) return json({ error: "type is required" }, 400);

  const insertData: any = {
    name: params.name,
    type: params.type,
    description: params.description || null,
    active: params.active ?? true,
    has_content: params.has_content ?? false,
    payment_type: params.payment_type || "one_time",
    saas_url: params.saas_url || null,
    thumbnail_url: params.thumbnail_url || null,
    thumbnail_vertical_url: params.thumbnail_vertical_url || null,
  };

  // If has_content, create a course automatically
  if (insertData.has_content) {
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .insert({ title: params.name, status: "draft" })
      .select()
      .single();
    if (courseErr) return json({ error: courseErr.message }, 500);
    insertData.course_id = course.id;
  }

  const { data, error } = await supabase.from("products").insert(insertData).select().single();
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, product: data });
}

async function handleUpdateProduct(
  supabase: ReturnType<typeof createClient>,
  params: { product_id: string; [key: string]: any }
) {
  const { product_id, ...updates } = params;
  if (!product_id) return json({ error: "product_id is required" }, 400);

  const allowed = ["name", "description", "type", "active", "has_content", "payment_type", "saas_url", "thumbnail_url", "thumbnail_vertical_url", "sort_order", "show_on_home"];
  const updateData: any = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) updateData[key] = updates[key];
  }

  const { data, error } = await supabase.from("products").update(updateData).eq("id", product_id).select().single();
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, product: data });
}

async function handleDeleteProduct(
  supabase: ReturnType<typeof createClient>,
  params: { product_id: string }
) {
  if (!params.product_id) return json({ error: "product_id is required" }, 400);

  // Get product to check for course_id
  const { data: product } = await supabase.from("products").select("id, course_id").eq("id", params.product_id).maybeSingle();
  if (!product) return json({ error: "Product not found" }, 404);

  // Clean up related data
  await supabase.from("offers").delete().eq("product_id", params.product_id);
  await supabase.from("user_products").delete().eq("product_id", params.product_id);
  await supabase.from("product_categories").delete().eq("product_id", params.product_id);
  await supabase.from("package_products").delete().eq("product_id", params.product_id);

  if (product.course_id) {
    // Delete lessons, modules, progress, enrollments
    const { data: modules } = await supabase.from("course_modules").select("id").eq("course_id", product.course_id);
    if (modules && modules.length > 0) {
      const moduleIds = modules.map(m => m.id);
      const { data: lessons } = await supabase.from("course_lessons").select("id").in("module_id", moduleIds);
      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map(l => l.id);
        await supabase.from("lesson_contents").delete().in("lesson_id", lessonIds);
        await supabase.from("lesson_comments").delete().in("lesson_id", lessonIds);
        await supabase.from("lesson_progress").delete().in("lesson_id", lessonIds);
        await supabase.from("lesson_ratings").delete().in("lesson_id", lessonIds);
        await supabase.from("user_lesson_access").delete().in("lesson_id", lessonIds);
      }
      await supabase.from("course_lessons").delete().in("module_id", moduleIds);
    }
    await supabase.from("course_modules").delete().eq("course_id", product.course_id);
    await supabase.from("course_enrollments").delete().eq("course_id", product.course_id);
    await supabase.from("lesson_progress").delete().eq("course_id", product.course_id);
    await supabase.from("courses").delete().eq("id", product.course_id);
  }

  const { error } = await supabase.from("products").delete().eq("id", params.product_id);
  if (error) return json({ error: error.message }, 500);
  return json({ success: true });
}

// ─── Package CRUD ────────────────────────────────────────────────

async function handleCreatePackage(
  supabase: ReturnType<typeof createClient>,
  params: { name: string; description?: string; active?: boolean; payment_type?: string; features?: string[]; product_ids?: string[] }
) {
  if (!params.name) return json({ error: "name is required" }, 400);

  const { data, error } = await supabase.from("packages").insert({
    name: params.name,
    description: params.description || null,
    active: params.active ?? true,
    payment_type: params.payment_type || "one_time",
    features: params.features || [],
  }).select().single();
  if (error) return json({ error: error.message }, 500);

  // Link products if provided
  if (params.product_ids && params.product_ids.length > 0) {
    const links = params.product_ids.map((pid, i) => ({ package_id: data.id, product_id: pid, sort_order: i }));
    await supabase.from("package_products").insert(links);
  }

  return json({ success: true, package: data });
}

async function handleUpdatePackage(
  supabase: ReturnType<typeof createClient>,
  params: { package_id: string; [key: string]: any }
) {
  const { package_id, ...updates } = params;
  if (!package_id) return json({ error: "package_id is required" }, 400);

  const allowed = ["name", "description", "active", "payment_type", "features", "thumbnail_url", "thumbnail_vertical_url", "show_in_showcase", "is_trail"];
  const updateData: any = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) updateData[key] = updates[key];
  }

  const { data, error } = await supabase.from("packages").update(updateData).eq("id", package_id).select().single();
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, package: data });
}

async function handleDeletePackage(
  supabase: ReturnType<typeof createClient>,
  params: { package_id: string }
) {
  if (!params.package_id) return json({ error: "package_id is required" }, 400);

  await supabase.from("package_products").delete().eq("package_id", params.package_id);
  await supabase.from("package_product_groups").delete().eq("package_id", params.package_id);
  await supabase.from("offers").delete().eq("package_id", params.package_id);
  await supabase.from("user_plans").delete().eq("package_id", params.package_id);
  await supabase.from("plan_meetings").delete().eq("package_id", params.package_id);
  await supabase.from("menu_link_packages").delete().eq("package_id", params.package_id);

  const { error } = await supabase.from("packages").delete().eq("id", params.package_id);
  if (error) return json({ error: error.message }, 500);
  return json({ success: true });
}

// ─── Module CRUD ─────────────────────────────────────────────────

async function handleCreateModule(
  supabase: ReturnType<typeof createClient>,
  params: { course_id: string; title: string; description?: string; sort_order?: number }
) {
  if (!params.course_id) return json({ error: "course_id is required" }, 400);
  if (!params.title) return json({ error: "title is required" }, 400);

  const { data, error } = await supabase.from("course_modules").insert({
    course_id: params.course_id,
    title: params.title,
    description: params.description || null,
    sort_order: params.sort_order ?? 0,
  }).select().single();
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, module: data });
}

async function handleUpdateModule(
  supabase: ReturnType<typeof createClient>,
  params: { module_id: string; title?: string; description?: string; sort_order?: number }
) {
  if (!params.module_id) return json({ error: "module_id is required" }, 400);

  const updateData: any = {};
  if (params.title !== undefined) updateData.title = params.title;
  if (params.description !== undefined) updateData.description = params.description;
  if (params.sort_order !== undefined) updateData.sort_order = params.sort_order;

  const { data, error } = await supabase.from("course_modules").update(updateData).eq("id", params.module_id).select().single();
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, module: data });
}

async function handleDeleteModule(
  supabase: ReturnType<typeof createClient>,
  params: { module_id: string }
) {
  if (!params.module_id) return json({ error: "module_id is required" }, 400);

  // Delete lessons and their contents
  const { data: lessons } = await supabase.from("course_lessons").select("id").eq("module_id", params.module_id);
  if (lessons && lessons.length > 0) {
    const lessonIds = lessons.map(l => l.id);
    await supabase.from("lesson_contents").delete().in("lesson_id", lessonIds);
    await supabase.from("lesson_comments").delete().in("lesson_id", lessonIds);
    await supabase.from("lesson_progress").delete().in("lesson_id", lessonIds);
    await supabase.from("lesson_ratings").delete().in("lesson_id", lessonIds);
    await supabase.from("user_lesson_access").delete().in("lesson_id", lessonIds);
    await supabase.from("course_lessons").delete().in("id", lessonIds);
  }

  const { error } = await supabase.from("course_modules").delete().eq("id", params.module_id);
  if (error) return json({ error: error.message }, 500);
  return json({ success: true });
}

// ─── Lesson CRUD ─────────────────────────────────────────────────

async function handleCreateLesson(
  supabase: ReturnType<typeof createClient>,
  params: { module_id: string; title: string; description?: string; video_url?: string; duration_minutes?: number; is_free?: boolean; sort_order?: number }
) {
  if (!params.module_id) return json({ error: "module_id is required" }, 400);
  if (!params.title) return json({ error: "title is required" }, 400);

  const { data, error } = await supabase.from("course_lessons").insert({
    module_id: params.module_id,
    title: params.title,
    description: params.description || null,
    video_url: params.video_url || null,
    duration_minutes: params.duration_minutes ?? 0,
    is_free: params.is_free ?? false,
    sort_order: params.sort_order ?? 0,
  }).select().single();
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, lesson: data });
}

async function handleUpdateLesson(
  supabase: ReturnType<typeof createClient>,
  params: { lesson_id: string; title?: string; description?: string; video_url?: string; duration_minutes?: number; is_free?: boolean; sort_order?: number }
) {
  if (!params.lesson_id) return json({ error: "lesson_id is required" }, 400);

  const allowed = ["title", "description", "video_url", "duration_minutes", "is_free", "sort_order"];
  const updateData: any = {};
  for (const key of allowed) {
    if ((params as any)[key] !== undefined) updateData[key] = (params as any)[key];
  }

  const { data, error } = await supabase.from("course_lessons").update(updateData).eq("id", params.lesson_id).select().single();
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, lesson: data });
}

async function handleDeleteLesson(
  supabase: ReturnType<typeof createClient>,
  params: { lesson_id: string }
) {
  if (!params.lesson_id) return json({ error: "lesson_id is required" }, 400);

  await supabase.from("lesson_contents").delete().eq("lesson_id", params.lesson_id);
  await supabase.from("lesson_comments").delete().eq("lesson_id", params.lesson_id);
  await supabase.from("lesson_progress").delete().eq("lesson_id", params.lesson_id);
  await supabase.from("lesson_ratings").delete().eq("lesson_id", params.lesson_id);
  await supabase.from("user_lesson_access").delete().eq("lesson_id", params.lesson_id);

  const { error } = await supabase.from("course_lessons").delete().eq("id", params.lesson_id);
  if (error) return json({ error: error.message }, 500);
  return json({ success: true });
}

// ─── Lesson Content CRUD ─────────────────────────────────────────

async function handleCreateLessonContent(
  supabase: ReturnType<typeof createClient>,
  params: { lesson_id: string; title: string; type: string; content?: string; sort_order?: number }
) {
  if (!params.lesson_id) return json({ error: "lesson_id is required" }, 400);
  if (!params.title) return json({ error: "title is required" }, 400);
  if (!params.type) return json({ error: "type is required (video, text, image, audio, link, pdf)" }, 400);

  const { data, error } = await supabase.from("lesson_contents").insert({
    lesson_id: params.lesson_id,
    title: params.title,
    type: params.type,
    content: params.content || null,
    sort_order: params.sort_order ?? 0,
  }).select().single();
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, lesson_content: data });
}

async function handleUpdateLessonContent(
  supabase: ReturnType<typeof createClient>,
  params: { content_id: string; title?: string; type?: string; content?: string; sort_order?: number }
) {
  if (!params.content_id) return json({ error: "content_id is required" }, 400);

  const allowed = ["title", "type", "content", "sort_order"];
  const updateData: any = {};
  for (const key of allowed) {
    if ((params as any)[key] !== undefined) updateData[key] = (params as any)[key];
  }

  const { data, error } = await supabase.from("lesson_contents").update(updateData).eq("id", params.content_id).select().single();
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, lesson_content: data });
}

async function handleDeleteLessonContent(
  supabase: ReturnType<typeof createClient>,
  params: { content_id: string }
) {
  if (!params.content_id) return json({ error: "content_id is required" }, 400);

  const { error } = await supabase.from("lesson_contents").delete().eq("id", params.content_id);
  if (error) return json({ error: error.message }, 500);
  return json({ success: true });
}

// ─── List Modules/Lessons ────────────────────────────────────────

async function handleListModules(
  supabase: ReturnType<typeof createClient>,
  params: { course_id: string }
) {
  if (!params.course_id) return json({ error: "course_id is required" }, 400);
  const { data, error } = await supabase.from("course_modules").select("id, title, description, sort_order").eq("course_id", params.course_id).order("sort_order");
  if (error) return json({ error: error.message }, 500);
  return json({ modules: data });
}

async function handleListLessons(
  supabase: ReturnType<typeof createClient>,
  params: { module_id: string }
) {
  if (!params.module_id) return json({ error: "module_id is required" }, 400);
  const { data, error } = await supabase.from("course_lessons").select("id, title, description, video_url, duration_minutes, is_free, sort_order").eq("module_id", params.module_id).order("sort_order");
  if (error) return json({ error: error.message }, 500);
  return json({ lessons: data });
}

async function handleListLessonContents(
  supabase: ReturnType<typeof createClient>,
  params: { lesson_id: string }
) {
  if (!params.lesson_id) return json({ error: "lesson_id is required" }, 400);
  const { data, error } = await supabase.from("lesson_contents").select("id, title, type, content, sort_order").eq("lesson_id", params.lesson_id).order("sort_order");
  if (error) return json({ error: error.message }, 500);
  return json({ lesson_contents: data });
}

// ─── Bulk Lessons ────────────────────────────────────────────────

async function handleCreateBulkLessons(
  supabase: ReturnType<typeof createClient>,
  params: { module_id: string; lessons: { title: string; video_url?: string; description?: string; duration_minutes?: number }[] }
) {
  if (!params.module_id) return json({ error: "module_id is required" }, 400);
  if (!Array.isArray(params.lessons) || params.lessons.length === 0) return json({ error: "lessons array is required and must not be empty" }, 400);

  // Verify module exists
  const { data: mod } = await supabase.from("course_modules").select("id").eq("id", params.module_id).maybeSingle();
  if (!mod) return json({ error: "Module not found" }, 404);

  const rows = params.lessons.map((lesson, index) => ({
    module_id: params.module_id,
    title: lesson.title || `Lesson ${index + 1}`,
    description: lesson.description || null,
    video_url: lesson.video_url || null,
    duration_minutes: lesson.duration_minutes ?? 0,
    sort_order: index * 10,
    is_free: false,
  }));

  const { data, error } = await supabase.from("course_lessons").insert(rows).select();
  if (error) return json({ error: error.message }, 500);
  return json({ success: true, created_count: data.length, lessons: data });
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
  // Product CRUD
  create_product: handleCreateProduct,
  update_product: handleUpdateProduct,
  delete_product: handleDeleteProduct,
  // Package CRUD
  create_package: handleCreatePackage,
  update_package: handleUpdatePackage,
  delete_package: handleDeletePackage,
  // Module CRUD
  create_module: handleCreateModule,
  update_module: handleUpdateModule,
  delete_module: handleDeleteModule,
  list_modules: handleListModules,
  // Lesson CRUD
  create_lesson: handleCreateLesson,
  update_lesson: handleUpdateLesson,
  delete_lesson: handleDeleteLesson,
  list_lessons: handleListLessons,
  // Lesson Content CRUD
  create_lesson_content: handleCreateLessonContent,
  update_lesson_content: handleUpdateLessonContent,
  delete_lesson_content: handleDeleteLessonContent,
  list_lesson_contents: handleListLessonContents,
  // Bulk operations
  create_bulk_lessons: handleCreateBulkLessons,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: API key check
    const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedKey = Deno.env.get("AUTOMATION_API_KEY");

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