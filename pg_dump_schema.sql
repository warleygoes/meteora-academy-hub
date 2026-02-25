-- =============================================================
-- Meteora Academy - Full Schema Dump (public schema)
-- Generated: 2026-02-25
-- =============================================================

-- =====================
-- 1. ENUMS
-- =====================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.lesson_content_type AS ENUM ('video', 'text', 'image', 'audio', 'link', 'pdf');
CREATE TYPE public.product_type AS ENUM ('course', 'service', 'consultation', 'implementation', 'virtual_event', 'in_person_event', 'saas');

-- =====================
-- 2. FUNCTIONS
-- =====================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_email_exists(check_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(email) = LOWER(check_email)
  )
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id, email, display_name, role_type, company_name,
    country, phone, client_count, network_type, cheapest_plan_usd,
    main_problems, main_desires
  )
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'role_type',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'client_count',
    NEW.raw_user_meta_data->>'network_type',
    NULLIF(NEW.raw_user_meta_data->>'cheapest_plan_usd', '')::numeric,
    NEW.raw_user_meta_data->>'main_problems',
    NEW.raw_user_meta_data->>'main_desires'
  );
  RETURN NEW;
END;
$function$;

-- =====================
-- 3. TABLES
-- =====================

-- banners
CREATE TABLE public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT ''::text,
  subtitle text,
  image_url text,
  video_url text,
  link_url text,
  link_label text DEFAULT 'Saiba Mais'::text,
  link_target text DEFAULT '_self'::text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  segment_exclude_product_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- courses
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category_id uuid,
  thumbnail_url text,
  thumbnail_vertical_url text,
  status text NOT NULL DEFAULT 'draft'::text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT courses_status_check CHECK (status = ANY (ARRAY['draft'::text, 'published'::text]))
);

-- course_categories
CREATE TABLE public.course_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  auto_translate boolean NOT NULL DEFAULT true
);

-- course_modules
CREATE TABLE public.course_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- course_lessons
CREATE TABLE public.course_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  video_url text,
  duration_minutes integer DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_free boolean NOT NULL DEFAULT false,
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- course_enrollments
CREATE TABLE public.course_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_enrollments_course_id_user_id_key UNIQUE (course_id, user_id)
);

-- community_posts
CREATE TABLE public.community_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  link_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- community_comments
CREATE TABLE public.community_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  parent_id uuid,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- community_likes
CREATE TABLE public.community_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_likes_post_id_user_id_key UNIQUE (post_id, user_id)
);

-- diagnostics
CREATE TABLE public.diagnostics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  country text,
  company_name text,
  role_type text,
  client_count text,
  network_type text,
  cheapest_plan numeric,
  main_problems text,
  main_goals text,
  tech_knowledge text,
  status text DEFAULT 'pending'::text,
  user_id uuid,
  scores jsonb DEFAULT '{}'::jsonb,
  results jsonb DEFAULT '{}'::jsonb,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- diagnostic_questions
CREATE TABLE public.diagnostic_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section text NOT NULL,
  type text NOT NULL,
  question_text text NOT NULL,
  description text,
  options jsonb DEFAULT '[]'::jsonb,
  weight numeric DEFAULT 1.0,
  sort_order integer DEFAULT 0,
  field_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- diagnostic_answers
CREATE TABLE public.diagnostic_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostic_id uuid,
  question_id uuid,
  answer_value jsonb NOT NULL,
  score_contribution numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- diagnostic_lead_tracking
CREATE TABLE public.diagnostic_lead_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostic_id uuid NOT NULL,
  lead_temperature text NOT NULL DEFAULT 'cold'::text,
  commercial_status text NOT NULL DEFAULT 'new'::text,
  assigned_advisor text,
  recommended_product_auto text,
  assigned_level_auto text,
  last_action text,
  last_action_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT diagnostic_lead_tracking_diagnostic_id_key UNIQUE (diagnostic_id)
);

-- diagnostic_recommendation_rules
CREATE TABLE public.diagnostic_recommendation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condition_field text NOT NULL,
  condition_operator text NOT NULL,
  condition_value numeric NOT NULL,
  recommended_product_id uuid,
  priority integer DEFAULT 0,
  title text,
  description text,
  cta_text text,
  cta_type text DEFAULT 'custom_url'::text,
  cta_url text,
  conditions jsonb DEFAULT '[]'::jsonb,
  conditions_logic text NOT NULL DEFAULT 'and'::text,
  recommended_product_ids uuid[] DEFAULT '{}'::uuid[],
  recommended_package_ids uuid[] DEFAULT '{}'::uuid[],
  created_at timestamptz DEFAULT now()
);

-- lesson_comments
CREATE TABLE public.lesson_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL,
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  comment_type text NOT NULL DEFAULT 'comment'::text,
  video_timestamp_seconds integer,
  parent_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- lesson_contents
CREATE TABLE public.lesson_contents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL,
  type public.lesson_content_type NOT NULL,
  title text NOT NULL,
  content text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- lesson_progress
CREATE TABLE public.lesson_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_progress_user_course_lesson_key UNIQUE (user_id, course_id, lesson_id)
);

-- lesson_ratings
CREATE TABLE public.lesson_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  course_id uuid NOT NULL,
  rating integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_ratings_rating_check CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT lesson_ratings_user_id_lesson_id_key UNIQUE (user_id, lesson_id)
);

-- menu_links
CREATE TABLE public.menu_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  url text NOT NULL,
  icon text NOT NULL DEFAULT 'link'::text,
  open_mode text NOT NULL DEFAULT 'same_tab'::text,
  active boolean NOT NULL DEFAULT true,
  auto_translate boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- menu_link_products
CREATE TABLE public.menu_link_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_link_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT menu_link_products_menu_link_id_product_id_key UNIQUE (menu_link_id, product_id)
);

-- menu_link_packages
CREATE TABLE public.menu_link_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_link_id uuid NOT NULL,
  package_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT menu_link_packages_menu_link_id_package_id_key UNIQUE (menu_link_id, package_id)
);

-- network_topologies
CREATE TABLE public.network_topologies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Minha Topologia'::text,
  data jsonb NOT NULL DEFAULT '{"edges": [], "nodes": []}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- products
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  type public.product_type NOT NULL,
  active boolean NOT NULL DEFAULT true,
  payment_type text NOT NULL DEFAULT 'one_time'::text,
  recurring_type text,
  course_id uuid,
  saas_url text,
  show_on_home boolean NOT NULL DEFAULT false,
  has_content boolean NOT NULL DEFAULT false,
  features_list jsonb DEFAULT '[]'::jsonb,
  thumbnail_url text,
  thumbnail_vertical_url text,
  cta_type text DEFAULT 'direct_purchase'::text,
  cta_url text,
  trial_enabled boolean NOT NULL DEFAULT false,
  trial_days integer,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- product_categories
CREATE TABLE public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  category_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_categories_product_id_category_id_key UNIQUE (product_id, category_id)
);

-- product_sales_pages
CREATE TABLE public.product_sales_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  slug text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  hero_headline text,
  hero_subheadline text,
  hero_context_line text,
  hero_cta_text text,
  hero_cta_link text,
  hero_background_image text,
  hero_badge_text text,
  hero_social_proof_micro text,
  hero_video_url text,
  problem_title text,
  problem_bullet_points jsonb DEFAULT '[]'::jsonb,
  problem_explanation_title text,
  problem_explanation_text text,
  transformation_title text,
  before_points jsonb DEFAULT '[]'::jsonb,
  after_points jsonb DEFAULT '[]'::jsonb,
  social_micro_number text,
  social_micro_text text,
  social_micro_badge text,
  core_benefits jsonb DEFAULT '[]'::jsonb,
  modules jsonb DEFAULT '[]'::jsonb,
  program_name text,
  program_format text,
  program_duration text,
  program_access_time text,
  selected_testimonials jsonb DEFAULT '[]'::jsonb,
  objections jsonb DEFAULT '[]'::jsonb,
  bonuses jsonb DEFAULT '[]'::jsonb,
  anchor_items jsonb DEFAULT '[]'::jsonb,
  anchor_total_value text,
  anchor_comparison_text text,
  price_display text,
  price_original text,
  price_installments text,
  price_currency text DEFAULT 'USD'::text,
  price_stripe_link text,
  price_highlight_text text,
  guarantee_title text,
  guarantee_description text,
  guarantee_type text,
  guarantee_days integer,
  urgency_type text,
  urgency_text text,
  urgency_date timestamptz,
  urgency_spots_remaining integer,
  countdown_enabled boolean DEFAULT false,
  final_cta_title text,
  final_cta_text text,
  final_cta_button_text text,
  final_cta_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_product_sales_page UNIQUE (product_id),
  CONSTRAINT unique_slug UNIQUE (slug)
);

-- packages
CREATE TABLE public.packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  payment_type text NOT NULL DEFAULT 'one_time'::text,
  duration_days integer,
  is_trail boolean NOT NULL DEFAULT false,
  show_in_showcase boolean NOT NULL DEFAULT false,
  features text[] DEFAULT '{}'::text[],
  thumbnail_url text,
  thumbnail_vertical_url text,
  cta_type text DEFAULT 'direct_purchase'::text,
  cta_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- package_product_groups
CREATE TABLE public.package_product_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  thumbnail_url text,
  thumbnail_vertical_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- package_products
CREATE TABLE public.package_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id uuid NOT NULL,
  product_id uuid NOT NULL,
  group_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT package_products_package_id_product_id_key UNIQUE (package_id, product_id)
);

-- offers
CREATE TABLE public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid,
  package_id uuid,
  name text NOT NULL DEFAULT 'Oferta Padrão'::text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD'::text,
  duration_type text NOT NULL DEFAULT 'no_expiration'::text,
  duration_days integer,
  periodicity text,
  is_default boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  payment_link_active boolean NOT NULL DEFAULT true,
  stripe_link_active boolean NOT NULL DEFAULT false,
  stripe_price_id text,
  hotmart_link_active boolean NOT NULL DEFAULT false,
  hotmart_url text,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT offers_one_parent CHECK (
    ((product_id IS NOT NULL) AND (package_id IS NULL)) OR
    ((product_id IS NULL) AND (package_id IS NOT NULL))
  )
);

-- plans
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD'::text,
  payment_type text NOT NULL DEFAULT 'monthly'::text,
  duration_days integer,
  active boolean NOT NULL DEFAULT true,
  features text[] DEFAULT '{}'::text[],
  stripe_price_id text,
  stripe_product_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plans_payment_type_check CHECK (payment_type = ANY (ARRAY['one_time'::text, 'monthly'::text]))
);

-- plan_courses
CREATE TABLE public.plan_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL,
  course_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plan_courses_plan_id_course_id_key UNIQUE (plan_id, course_id)
);

-- plan_meetings
CREATE TABLE public.plan_meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  meeting_date timestamptz NOT NULL,
  meeting_link text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- plan_services
CREATE TABLE public.plan_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL,
  service_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plan_services_plan_id_service_id_key UNIQUE (plan_id, service_id)
);

-- profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text,
  display_name text,
  avatar_url text,
  bio text,
  phone text,
  cpf text,
  gender text,
  birth_date date,
  country text,
  company_name text,
  role_type text,
  client_count text,
  network_type text,
  cheapest_plan_usd numeric,
  main_problems text,
  main_desires text,
  observations text,
  status text NOT NULL DEFAULT 'pending'::text,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_user_id_key UNIQUE (user_id),
  CONSTRAINT bio_length CHECK (length(bio) <= 500),
  CONSTRAINT company_name_length CHECK (length(company_name) <= 200),
  CONSTRAINT display_name_length CHECK (length(display_name) <= 100),
  CONSTRAINT main_desires_length CHECK (length(main_desires) <= 2000),
  CONSTRAINT main_problems_length CHECK (length(main_problems) <= 2000),
  CONSTRAINT phone_length CHECK (length(phone) <= 20),
  CONSTRAINT valid_network_type CHECK (network_type IS NULL OR network_type = ANY (ARRAY['radio'::text, 'fiber'::text, 'both'::text])),
  CONSTRAINT valid_role_type CHECK (role_type IS NULL OR role_type = ANY (ARRAY['owner'::text, 'employee'::text]))
);

-- services
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD'::text,
  payment_type text NOT NULL DEFAULT 'one_time'::text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT services_payment_type_check CHECK (payment_type = ANY (ARRAY['monthly'::text, 'one_time'::text]))
);

-- platform_settings
CREATE TABLE public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_settings_key_key UNIQUE (key)
);

-- system_logs
CREATE TABLE public.system_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT 'system'::text,
  entity_id text,
  level text NOT NULL DEFAULT 'info'::text,
  details text,
  performed_by uuid,
  performer_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- testimonials
CREATE TABLE public.testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name text NOT NULL,
  title text,
  description text,
  role text,
  country text,
  isp_size text,
  result_text text,
  video_url text,
  tags text[],
  destinations text[],
  product_ids text[],
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- user_lesson_access
CREATE TABLE public.user_lesson_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_lesson_access_user_id_lesson_id_key UNIQUE (user_id, lesson_id)
);

-- user_plans
CREATE TABLE public.user_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  package_id uuid NOT NULL,
  offer_id uuid,
  status text NOT NULL DEFAULT 'active'::text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_plans_status_check CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text]))
);

-- user_products
CREATE TABLE public.user_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  offer_id uuid,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_products_user_id_product_id_key UNIQUE (user_id, product_id)
);

-- user_roles
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

-- webhook_endpoints
CREATE TABLE public.webhook_endpoints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT ''::text,
  url text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- webhook_event_types
CREATE TABLE public.webhook_event_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_key text NOT NULL,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhook_event_types_event_key_key UNIQUE (event_key)
);

-- =====================
-- 4. FOREIGN KEYS
-- =====================
ALTER TABLE public.banners ADD CONSTRAINT banners_segment_exclude_product_id_fkey FOREIGN KEY (segment_exclude_product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.community_comments ADD CONSTRAINT community_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.community_comments(id) ON DELETE CASCADE;
ALTER TABLE public.community_comments ADD CONSTRAINT community_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;

ALTER TABLE public.community_likes ADD CONSTRAINT community_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;

ALTER TABLE public.community_posts ADD CONSTRAINT community_posts_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.course_enrollments ADD CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.course_lessons ADD CONSTRAINT course_lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.course_modules(id) ON DELETE CASCADE;

ALTER TABLE public.course_modules ADD CONSTRAINT course_modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.courses ADD CONSTRAINT courses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.course_categories(id) ON DELETE SET NULL;

ALTER TABLE public.diagnostic_answers ADD CONSTRAINT diagnostic_answers_diagnostic_id_fkey FOREIGN KEY (diagnostic_id) REFERENCES public.diagnostics(id) ON DELETE CASCADE;
ALTER TABLE public.diagnostic_answers ADD CONSTRAINT diagnostic_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.diagnostic_questions(id) ON DELETE CASCADE;

ALTER TABLE public.diagnostic_lead_tracking ADD CONSTRAINT diagnostic_lead_tracking_diagnostic_id_fkey FOREIGN KEY (diagnostic_id) REFERENCES public.diagnostics(id) ON DELETE CASCADE;

ALTER TABLE public.diagnostic_recommendation_rules ADD CONSTRAINT diagnostic_recommendation_rules_recommended_product_id_fkey FOREIGN KEY (recommended_product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- NOTE: This FK references auth.users which is managed by Supabase Auth.
-- For local setup, you'll need to create a minimal auth.users table or remove this FK.
-- ALTER TABLE public.diagnostics ADD CONSTRAINT diagnostics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.lesson_comments ADD CONSTRAINT lesson_comments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.lesson_comments ADD CONSTRAINT lesson_comments_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id) ON DELETE CASCADE;
ALTER TABLE public.lesson_comments ADD CONSTRAINT lesson_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.lesson_comments(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_contents ADD CONSTRAINT lesson_contents_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.lesson_progress ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_ratings ADD CONSTRAINT lesson_ratings_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.lesson_ratings ADD CONSTRAINT lesson_ratings_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id) ON DELETE CASCADE;

ALTER TABLE public.menu_link_packages ADD CONSTRAINT menu_link_packages_menu_link_id_fkey FOREIGN KEY (menu_link_id) REFERENCES public.menu_links(id) ON DELETE CASCADE;
ALTER TABLE public.menu_link_packages ADD CONSTRAINT menu_link_packages_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE;

ALTER TABLE public.menu_link_products ADD CONSTRAINT menu_link_products_menu_link_id_fkey FOREIGN KEY (menu_link_id) REFERENCES public.menu_links(id) ON DELETE CASCADE;
ALTER TABLE public.menu_link_products ADD CONSTRAINT menu_link_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.offers ADD CONSTRAINT offers_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE;
ALTER TABLE public.offers ADD CONSTRAINT offers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.package_product_groups ADD CONSTRAINT package_product_groups_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE;

ALTER TABLE public.package_products ADD CONSTRAINT package_products_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.package_product_groups(id) ON DELETE SET NULL;
ALTER TABLE public.package_products ADD CONSTRAINT package_products_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE;
ALTER TABLE public.package_products ADD CONSTRAINT package_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.plan_courses ADD CONSTRAINT plan_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.plan_courses ADD CONSTRAINT plan_courses_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;

ALTER TABLE public.plan_meetings ADD CONSTRAINT plan_meetings_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE;

ALTER TABLE public.plan_services ADD CONSTRAINT plan_services_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;
ALTER TABLE public.plan_services ADD CONSTRAINT plan_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;

ALTER TABLE public.product_categories ADD CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.course_categories(id) ON DELETE CASCADE;
ALTER TABLE public.product_categories ADD CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.product_sales_pages ADD CONSTRAINT product_sales_pages_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.products ADD CONSTRAINT products_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;

-- NOTE: These FKs reference auth.users. See note above.
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_lesson_access ADD CONSTRAINT user_lesson_access_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id) ON DELETE CASCADE;

ALTER TABLE public.user_plans ADD CONSTRAINT user_plans_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id);
ALTER TABLE public.user_plans ADD CONSTRAINT user_plans_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE;

ALTER TABLE public.user_products ADD CONSTRAINT user_products_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id);
ALTER TABLE public.user_products ADD CONSTRAINT user_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- NOTE: This FK references auth.users
-- ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================
-- 5. INDEXES
-- =====================
CREATE INDEX idx_community_comments_post ON public.community_comments USING btree (post_id, created_at);
CREATE INDEX idx_community_likes_post ON public.community_likes USING btree (post_id);
CREATE INDEX idx_community_posts_course ON public.community_posts USING btree (course_id, created_at DESC);
CREATE INDEX idx_system_logs_created_at ON public.system_logs USING btree (created_at DESC);
CREATE INDEX idx_system_logs_entity_type ON public.system_logs USING btree (entity_type);
CREATE INDEX idx_system_logs_level ON public.system_logs USING btree (level);

-- =====================
-- 6. ROW LEVEL SECURITY
-- =====================
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_lead_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_recommendation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_link_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_link_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_topologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_product_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sales_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_event_types ENABLE ROW LEVEL SECURITY;

-- =====================
-- 7. RLS POLICIES
-- =====================

-- banners
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view active banners" ON public.banners FOR SELECT USING ((auth.uid() IS NOT NULL) AND (active = true));

-- community_comments
CREATE POLICY "Admins can manage comments" ON public.community_comments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view comments" ON public.community_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.community_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.community_comments FOR UPDATE USING (auth.uid() = user_id);

-- community_likes
CREATE POLICY "Admins can manage likes" ON public.community_likes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view likes" ON public.community_likes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create likes" ON public.community_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.community_likes FOR DELETE USING (auth.uid() = user_id);

-- community_posts
CREATE POLICY "Admins can manage posts" ON public.community_posts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view posts" ON public.community_posts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);

-- course_categories
CREATE POLICY "Admins can manage categories" ON public.course_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view categories" ON public.course_categories FOR SELECT USING (auth.uid() IS NOT NULL);

-- course_enrollments
CREATE POLICY "Admins can manage enrollments" ON public.course_enrollments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments FOR SELECT USING (auth.uid() = user_id);

-- course_lessons
CREATE POLICY "Admins can manage lessons" ON public.course_lessons FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view lessons" ON public.course_lessons FOR SELECT USING (auth.uid() IS NOT NULL);

-- course_modules
CREATE POLICY "Admins can manage modules" ON public.course_modules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view modules of published courses" ON public.course_modules FOR SELECT USING ((auth.uid() IS NOT NULL) AND (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_modules.course_id AND courses.status = 'published')));

-- courses
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view published courses" ON public.courses FOR SELECT USING ((auth.uid() IS NOT NULL) AND (status = 'published'));

-- diagnostic_answers
CREATE POLICY "Admins can view all diagnostic answers" ON public.diagnostic_answers FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can insert diagnostic answers" ON public.diagnostic_answers FOR INSERT WITH CHECK (true);

-- diagnostic_lead_tracking
CREATE POLICY "Admins can manage lead tracking" ON public.diagnostic_lead_tracking FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can insert lead tracking" ON public.diagnostic_lead_tracking FOR INSERT TO anon, authenticated WITH CHECK (true);

-- diagnostic_questions
CREATE POLICY "Admins can manage diagnostic questions" ON public.diagnostic_questions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view diagnostic questions" ON public.diagnostic_questions FOR SELECT USING (true);

-- diagnostic_recommendation_rules
CREATE POLICY "Admins can manage diagnostic rules" ON public.diagnostic_recommendation_rules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view diagnostic rules" ON public.diagnostic_recommendation_rules FOR SELECT USING (true);

-- diagnostics
CREATE POLICY "Admins can delete diagnostics" ON public.diagnostics FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update diagnostics" ON public.diagnostics FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view diagnostics" ON public.diagnostics FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can insert diagnostics" ON public.diagnostics FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can select diagnostics by email" ON public.diagnostics FOR SELECT TO anon USING (true);

-- lesson_comments
CREATE POLICY "Admins can manage lesson_comments" ON public.lesson_comments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create lesson_comments" ON public.lesson_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own lesson_comments" ON public.lesson_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own lesson_comments" ON public.lesson_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view lesson_comments" ON public.lesson_comments FOR SELECT USING (auth.uid() IS NOT NULL);

-- lesson_contents
CREATE POLICY "Admins can manage lesson_contents" ON public.lesson_contents FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view lesson_contents" ON public.lesson_contents FOR SELECT USING (auth.uid() IS NOT NULL);

-- lesson_progress
CREATE POLICY "Admins can manage progress" ON public.lesson_progress FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own progress" ON public.lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.lesson_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id);

-- lesson_ratings
CREATE POLICY "Admins can manage ratings" ON public.lesson_ratings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create own ratings" ON public.lesson_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.lesson_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view ratings" ON public.lesson_ratings FOR SELECT USING (auth.uid() IS NOT NULL);

-- menu_link_packages
CREATE POLICY "Admins manage menu_link_packages" ON public.menu_link_packages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read menu_link_packages" ON public.menu_link_packages FOR SELECT USING (true);

-- menu_link_products
CREATE POLICY "Admins manage menu_link_products" ON public.menu_link_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read menu_link_products" ON public.menu_link_products FOR SELECT USING (true);

-- menu_links
CREATE POLICY "Admins manage menu_links" ON public.menu_links FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read menu_links" ON public.menu_links FOR SELECT USING (true);

-- network_topologies
CREATE POLICY "Users can create own topologies" ON public.network_topologies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own topologies" ON public.network_topologies FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own topologies" ON public.network_topologies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own topologies" ON public.network_topologies FOR SELECT USING (auth.uid() = user_id);

-- offers
CREATE POLICY "Admins can manage offers" ON public.offers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view active offers" ON public.offers FOR SELECT USING ((auth.uid() IS NOT NULL) AND (active = true));

-- package_product_groups
CREATE POLICY "Admins can manage package_product_groups" ON public.package_product_groups FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view package_product_groups" ON public.package_product_groups FOR SELECT USING (auth.uid() IS NOT NULL);

-- package_products
CREATE POLICY "Admins can manage package_products" ON public.package_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view package_products" ON public.package_products FOR SELECT USING (auth.uid() IS NOT NULL);

-- packages
CREATE POLICY "Admins can manage packages" ON public.packages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view active packages" ON public.packages FOR SELECT USING ((auth.uid() IS NOT NULL) AND (active = true));

-- plan_courses
CREATE POLICY "Admins can manage plan_courses" ON public.plan_courses FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view plan_courses" ON public.plan_courses FOR SELECT USING (auth.uid() IS NOT NULL);

-- plan_meetings
CREATE POLICY "Admins can manage plan_meetings" ON public.plan_meetings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view meetings for their plans" ON public.plan_meetings FOR SELECT USING (EXISTS (SELECT 1 FROM user_plans up WHERE up.user_id = auth.uid() AND up.package_id = plan_meetings.package_id AND up.status = 'active'));

-- plan_services
CREATE POLICY "Admins can manage plan_services" ON public.plan_services FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view plan_services" ON public.plan_services FOR SELECT USING (auth.uid() IS NOT NULL);

-- plans
CREATE POLICY "Admins can manage plans" ON public.plans FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view active plans" ON public.plans FOR SELECT USING ((auth.uid() IS NOT NULL) AND (active = true));

-- platform_settings
CREATE POLICY "Admins can manage platform_settings" ON public.platform_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- product_categories
CREATE POLICY "Admins can manage product_categories" ON public.product_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view product_categories" ON public.product_categories FOR SELECT USING (auth.uid() IS NOT NULL);

-- product_sales_pages
CREATE POLICY "Admins can manage product_sales_pages" ON public.product_sales_pages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active sales pages" ON public.product_sales_pages FOR SELECT USING (active = true);

-- products
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view active products" ON public.products FOR SELECT USING ((auth.uid() IS NOT NULL) AND (active = true));

-- profiles
CREATE POLICY "Admins can delete any profile" ON public.profiles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

-- services
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view active services" ON public.services FOR SELECT USING ((auth.uid() IS NOT NULL) AND (active = true));

-- system_logs
CREATE POLICY "Admins can insert system logs" ON public.system_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view system_logs" ON public.system_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- testimonials
CREATE POLICY "Admins can manage testimonials" ON public.testimonials FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active testimonials" ON public.testimonials FOR SELECT USING (active = true);

-- user_lesson_access
CREATE POLICY "Admins can manage user_lesson_access" ON public.user_lesson_access FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own lesson_access" ON public.user_lesson_access FOR SELECT USING (auth.uid() = user_id);

-- user_plans
CREATE POLICY "Admins can manage user_plans" ON public.user_plans FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own plans" ON public.user_plans FOR SELECT USING (auth.uid() = user_id);

-- user_products
CREATE POLICY "Admins can manage user_products" ON public.user_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own products" ON public.user_products FOR SELECT USING (auth.uid() = user_id);

-- user_roles
CREATE POLICY "Admins can manage user_roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- webhook_endpoints
CREATE POLICY "Admins can manage webhook_endpoints" ON public.webhook_endpoints FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- webhook_event_types
CREATE POLICY "Admins can manage webhook_event_types" ON public.webhook_event_types FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view webhook_event_types" ON public.webhook_event_types FOR SELECT USING (true);

-- =====================
-- 8. STORAGE BUCKETS
-- =====================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('community-images', 'community-images', true);

-- =====================
-- NOTE: auth.users trigger
-- =====================
-- The handle_new_user() function is triggered on auth.users INSERT.
-- For local Supabase: CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- This trigger is in the auth schema and must be created after Supabase Auth is set up.
