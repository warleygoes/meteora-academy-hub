-- ============================================================
-- pg_dump COMPLETO com SCHEMA + DADOS
-- Projeto: Meteora Academy
-- Data: 2026-02-25
-- NOTA: Tabelas muito grandes (profiles, system_logs) podem
--       estar truncadas no limite de 1000 registros.
-- ============================================================

-- ============================================================
-- PARTE 1: SCHEMA (tipos, tabelas, funções, triggers, RLS)
-- ============================================================

-- Tipos ENUM
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lesson_content_type AS ENUM ('video', 'text', 'pdf', 'link', 'quiz');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.product_type AS ENUM (
    'course', 'mentorship', 'consultation', 'saas',
    'implementation', 'virtual_event', 'presential_event', 'service'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Funções
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.check_email_exists(check_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(email) = LOWER(check_email))
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, role_type, company_name, country, phone, client_count, network_type, cheapest_plan_usd, main_problems, main_desires)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), NEW.raw_user_meta_data->>'role_type', NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'country', NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'client_count', NEW.raw_user_meta_data->>'network_type', NULLIF(NEW.raw_user_meta_data->>'cheapest_plan_usd', '')::numeric, NEW.raw_user_meta_data->>'main_problems', NEW.raw_user_meta_data->>'main_desires');
  RETURN NEW;
END; $$;

-- ============================================================
-- TABELAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.course_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  auto_translate boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  thumbnail_vertical_url text,
  category_id uuid REFERENCES public.course_categories(id),
  status text NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id),
  title text NOT NULL,
  description text,
  video_url text,
  duration_minutes integer DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_free boolean NOT NULL DEFAULT false,
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id),
  type lesson_content_type NOT NULL,
  title text NOT NULL,
  content text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
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
  approved boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type product_type NOT NULL,
  course_id uuid REFERENCES public.courses(id),
  thumbnail_url text,
  thumbnail_vertical_url text,
  saas_url text,
  payment_type text NOT NULL DEFAULT 'one_time',
  recurring_type text,
  active boolean NOT NULL DEFAULT true,
  show_on_home boolean NOT NULL DEFAULT false,
  has_content boolean NOT NULL DEFAULT false,
  features_list jsonb DEFAULT '[]',
  sort_order integer NOT NULL DEFAULT 0,
  trial_enabled boolean NOT NULL DEFAULT false,
  trial_days integer,
  cta_type text DEFAULT 'direct_purchase',
  cta_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  thumbnail_url text,
  thumbnail_vertical_url text,
  active boolean NOT NULL DEFAULT true,
  is_trail boolean NOT NULL DEFAULT false,
  show_in_showcase boolean NOT NULL DEFAULT false,
  payment_type text NOT NULL DEFAULT 'one_time',
  duration_days integer,
  features text[] DEFAULT '{}',
  cta_type text DEFAULT 'direct_purchase',
  cta_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.package_product_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id),
  name text NOT NULL,
  description text,
  thumbnail_url text,
  thumbnail_vertical_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.package_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  group_id uuid REFERENCES public.package_product_groups(id),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  category_id uuid NOT NULL REFERENCES public.course_categories(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  payment_type text NOT NULL DEFAULT 'monthly',
  duration_days integer,
  features text[] DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  payment_type text NOT NULL DEFAULT 'one_time',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  service_id uuid NOT NULL REFERENCES public.services(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id),
  title text NOT NULL,
  description text,
  meeting_date timestamptz NOT NULL,
  meeting_link text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id),
  package_id uuid REFERENCES public.packages(id),
  name text NOT NULL DEFAULT 'Oferta Padrão',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  duration_type text NOT NULL DEFAULT 'no_expiration',
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
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  subtitle text,
  image_url text,
  video_url text,
  link_url text,
  link_label text DEFAULT 'Saiba Mais',
  link_target text DEFAULT '_self',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  segment_exclude_product_id uuid REFERENCES public.products(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name text NOT NULL,
  role text,
  country text,
  isp_size text,
  title text,
  description text,
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

CREATE TABLE IF NOT EXISTS public.menu_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  icon text NOT NULL DEFAULT 'link',
  open_mode text NOT NULL DEFAULT 'same_tab',
  auto_translate boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_link_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_link_id uuid NOT NULL REFERENCES public.menu_links(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_link_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_link_id uuid NOT NULL REFERENCES public.menu_links(id),
  package_id uuid NOT NULL REFERENCES public.packages(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company_name text,
  country text,
  role_type text,
  client_count text,
  network_type text,
  cheapest_plan numeric,
  tech_knowledge text,
  main_problems text,
  main_goals text,
  scores jsonb DEFAULT '{}',
  results jsonb DEFAULT '{}',
  status text DEFAULT 'pending',
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.diagnostic_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  description text,
  section text NOT NULL,
  type text NOT NULL,
  field_key text,
  options jsonb DEFAULT '[]',
  weight numeric DEFAULT 1.0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.diagnostic_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id uuid REFERENCES public.diagnostics(id),
  question_id uuid REFERENCES public.diagnostic_questions(id),
  answer_value jsonb NOT NULL,
  score_contribution numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.diagnostic_recommendation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_field text NOT NULL,
  condition_operator text NOT NULL,
  condition_value numeric NOT NULL,
  conditions jsonb DEFAULT '[]',
  conditions_logic text NOT NULL DEFAULT 'and',
  title text,
  description text,
  cta_text text,
  cta_type text DEFAULT 'custom_url',
  cta_url text,
  recommended_product_id uuid REFERENCES public.products(id),
  recommended_product_ids uuid[] DEFAULT '{}',
  recommended_package_ids uuid[] DEFAULT '{}',
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.diagnostic_lead_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id uuid NOT NULL UNIQUE REFERENCES public.diagnostics(id),
  lead_temperature text NOT NULL DEFAULT 'cold',
  commercial_status text NOT NULL DEFAULT 'new',
  assigned_advisor text,
  assigned_level_auto text,
  recommended_product_auto text,
  notes text,
  last_action text,
  last_action_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  user_id uuid NOT NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  rating integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  content text NOT NULL,
  comment_type text NOT NULL DEFAULT 'comment',
  video_timestamp_seconds integer,
  parent_id uuid REFERENCES public.lesson_comments(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_lesson_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id),
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.network_topologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Minha Topologia',
  data jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  link_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id),
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.community_comments(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id),
  offer_id uuid REFERENCES public.offers(id),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_id uuid NOT NULL REFERENCES public.packages(id),
  offer_id uuid REFERENCES public.offers(id),
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT 'system',
  entity_id text,
  details text,
  level text NOT NULL DEFAULT 'info',
  performed_by uuid,
  performer_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_sales_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES public.products(id),
  slug text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT false,
  hero_headline text, hero_subheadline text, hero_context_line text,
  hero_cta_text text, hero_cta_link text, hero_background_image text,
  hero_badge_text text, hero_social_proof_micro text, hero_video_url text,
  problem_title text, problem_bullet_points jsonb DEFAULT '[]',
  problem_explanation_title text, problem_explanation_text text,
  transformation_title text, before_points jsonb DEFAULT '[]', after_points jsonb DEFAULT '[]',
  core_benefits jsonb DEFAULT '[]', modules jsonb DEFAULT '[]',
  social_micro_number text, social_micro_text text, social_micro_badge text,
  selected_testimonials jsonb DEFAULT '[]', objections jsonb DEFAULT '[]',
  program_name text, program_format text, program_duration text, program_access_time text,
  anchor_items jsonb DEFAULT '[]', anchor_total_value text, anchor_comparison_text text,
  bonuses jsonb DEFAULT '[]',
  price_display text, price_original text, price_installments text,
  price_currency text DEFAULT 'USD', price_stripe_link text, price_highlight_text text,
  guarantee_title text, guarantee_description text, guarantee_type text, guarantee_days integer,
  urgency_type text, urgency_text text, urgency_date timestamptz, urgency_spots_remaining integer,
  countdown_enabled boolean DEFAULT false,
  final_cta_title text, final_cta_text text, final_cta_button_text text, final_cta_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PARTE 2: DADOS (INSERT INTO)
-- ============================================================

-- course_categories
INSERT INTO public.course_categories (id, name, description, auto_translate, created_at) VALUES
('9e78f640-86f6-4b6b-bb7d-b2833355d954', 'Encuentros Privados', 'Encuentros Privados', true, '2026-02-14 17:50:31.83119+00'),
('7e95ee0f-293d-4c19-8fbb-31f624331eb1', 'Curso Completo', 'Curso Completo', true, '2026-02-14 17:50:44.39056+00'),
('2ff2fe45-aaef-4c5a-b81f-2ff8bc17843e', 'FibraX', 'Curso de Fibra ', true, '2026-02-16 15:33:43.84698+00'),
('caf56a81-9b8d-4446-a253-cfc6a3cf98ec', 'Alianzas', 'Alianzas y negocios entre empresas del grupo Meteora', true, '2026-02-17 15:20:59.592809+00'),
('aa807dae-1922-48ce-b547-891e68671692', 'SaaS', 'Softwares as a Service', false, '2026-02-17 16:02:55.071929+00'),
('8713a25f-8588-46a8-8171-b621716c39f0', 'Preguntas y Respuestas', 'Preguntas y Respuestas en Vivo', false, '2026-02-18 19:28:43.772582+00')
ON CONFLICT (id) DO NOTHING;

-- services
INSERT INTO public.services (id, title, description, price, currency, payment_type, active, created_at) VALUES
('6e7541b8-1ac7-4faf-8d97-c21f29abb8a2', 'Soporte Técnico 30 días por Whatsapp', 'Soporte por Whatsapp y videollamadas en horario comercial', 397, 'USD', 'one_time', true, '2026-02-12 18:16:08.578917+00'),
('6acd9784-6d23-4cf1-9d7c-377ea161847d', 'Soporte de Mikrotik 24/7', 'Soporte mensual de Mikrotik 24/7 realizado por el equipo Meteora Academy', 500, 'USD', 'monthly', true, '2026-02-12 18:17:00.269077+00'),
('242c13e4-3605-4322-96ea-45d9e7265686', 'ISP Implementado', 'Implementación completa del Método ISP Desde Cero para ISPs realizada por el equipo Meteora', 5000, 'USD', 'one_time', true, '2026-02-12 18:14:57.614063+00')
ON CONFLICT (id) DO NOTHING;

-- plans
INSERT INTO public.plans (id, name, description, price, currency, payment_type, duration_days, features, active, stripe_product_id, stripe_price_id, created_at) VALUES
('21cc3fc8-e047-463d-8a4e-3474af8d10ac', 'Oráculo', 'Acceso a los encuentros para sacar dudas en vivo', 39, 'USD', 'monthly', NULL, ARRAY['Acceso a los encuentros en vivo','Acceso a las grabaciones de las respuestas','...'], true, 'prod_Ty04uDs4KRKneQ', 'price_1T044gLIHts6TwzIOYdxLmSI', '2026-02-12 17:55:35.904784+00'),
('ee512d47-40db-4562-9d6f-b68e84ed6fd0', 'Teste', 'teste de plano', 50, 'USD', 'one_time', NULL, '{}', true, NULL, NULL, '2026-02-12 18:44:27.274999+00')
ON CONFLICT (id) DO NOTHING;

-- plan_services
INSERT INTO public.plan_services (id, plan_id, service_id, created_at) VALUES
('de407edf-ba4d-4805-9ef6-06f55472dcd9', '21cc3fc8-e047-463d-8a4e-3474af8d10ac', '6acd9784-6d23-4cf1-9d7c-377ea161847d', '2026-02-12 18:40:24.503083+00')
ON CONFLICT (id) DO NOTHING;

-- packages
INSERT INTO public.packages (id, name, description, active, is_trail, show_in_showcase, payment_type, duration_days, features, cta_type, cta_url, thumbnail_url, thumbnail_vertical_url, created_at, updated_at) VALUES
('76fcf9bc-3875-4870-8bd3-f5eb9dbfcd99', 'IDCM+', 'IDCM+', false, true, true, 'one_time', 365, ARRAY['ISP Desde Cero','IDCM+','1 x Proyección de Crecimiento Individual','3 x Meses grátis de Meteora Apps'], 'direct_purchase', NULL, NULL, NULL, '2026-02-14 11:12:27.45656+00', '2026-02-17 15:59:58.99952+00'),
('3920fcac-abf3-4012-a6af-395f5031633d', 'Netuno - Purchase', 'Accesos de Netuno que no son menbresias', true, false, false, 'one_time', NULL, ARRAY['- Programa ISP 1000+','- Mentoría 10 Vidas','- Cursos y Formaciones Completas'], 'direct_purchase', NULL, 'https://thyowehliqgrjkeknoza.supabase.co/storage/v1/object/public/product-images/pkg-debdb325-1767-4c34-be33-1181e77ff4ca.png', 'https://thyowehliqgrjkeknoza.supabase.co/storage/v1/object/public/product-images/pkg-ada092fc-abb6-47ed-9fea-0880fad70338.png', '2026-02-17 16:09:16.202675+00', '2026-02-17 16:09:16.202675+00'),
('5266b467-029c-4ea7-8697-b10434163ba6', 'Netuno - Membership', 'Productos Netuno que son Membresias', true, false, false, 'recurring', NULL, ARRAY['- Oráculo','- ISP Automático - Chatwoot','- ISP Automático - Invoice Ninja','- Zabbix'], 'direct_purchase', NULL, 'https://thyowehliqgrjkeknoza.supabase.co/storage/v1/object/public/product-images/pkg-1a071a04-000e-40e6-87f1-b759cf800682.png', 'https://thyowehliqgrjkeknoza.supabase.co/storage/v1/object/public/product-images/pkg-5825620f-73a7-4e5f-be30-ebf6dd5ca544.png', '2026-02-17 16:10:12.665953+00', '2026-02-17 21:47:40.208018+00'),
('f9b2488d-3b4d-4fdd-a68c-8835be19ce44', 'Oráculo', NULL, true, false, false, 'recurring', NULL, '{}', 'direct_purchase', NULL, NULL, NULL, '2026-02-21 19:01:51.373891+00', '2026-02-21 19:01:51.373891+00')
ON CONFLICT (id) DO NOTHING;

-- package_product_groups
INSERT INTO public.package_product_groups (id, package_id, name, description, sort_order, thumbnail_url, thumbnail_vertical_url, created_at) VALUES
('78c2124e-5bed-4811-8a8b-7ef61fa5ece8', '76fcf9bc-3875-4870-8bd3-f5eb9dbfcd99', 'Comience Aqui', 'Pasos iniciales importantes', 0, NULL, NULL, '2026-02-14 12:18:41.096336+00'),
('0d6ae486-dfdf-4f14-8103-587469d89754', '76fcf9bc-3875-4870-8bd3-f5eb9dbfcd99', 'Calidad del Servicio', 'Calidad de Servicio', 1, NULL, NULL, '2026-02-14 12:18:51.607519+00'),
('00b84da2-aaa0-47a2-89ce-c3ff2f24ff21', '76fcf9bc-3875-4870-8bd3-f5eb9dbfcd99', 'Gestión Financiera', 'Gestión Financiera', 2, NULL, NULL, '2026-02-14 12:19:27.432728+00'),
('e6d4adfb-030d-4fb9-bcbf-532a48a66b91', '76fcf9bc-3875-4870-8bd3-f5eb9dbfcd99', 'Escala y Crecimiento', 'Escala y Crecimiento', 3, NULL, NULL, '2026-02-14 12:19:44.414922+00')
ON CONFLICT (id) DO NOTHING;

-- package_products
INSERT INTO public.package_products (id, package_id, product_id, group_id, sort_order, created_at) VALUES
('e4b68ee4-7fb3-4e44-877f-5d63becdd71d', '76fcf9bc-3875-4870-8bd3-f5eb9dbfcd99', 'cde99fdd-4843-4151-85a4-082b67cdd098', NULL, 0, '2026-02-14 11:12:48.699562+00'),
('38dc0a3d-3d48-49d8-a00e-836c903ab963', '76fcf9bc-3875-4870-8bd3-f5eb9dbfcd99', '0cb5c64b-d5c0-4ba1-a50a-cebec0f1b247', '78c2124e-5bed-4811-8a8b-7ef61fa5ece8', 0, '2026-02-14 11:12:48.699562+00'),
('8f4aaa41-148d-4fd1-8af6-107d49e0c2fe', '76fcf9bc-3875-4870-8bd3-f5eb9dbfcd99', 'a81fb032-e64e-4c28-b37e-3ae4d2f0a97a', '78c2124e-5bed-4811-8a8b-7ef61fa5ece8', 0, '2026-02-14 11:12:48.699562+00'),
('a94059e7-445e-4328-8fda-9f8bbb47f0cd', '3920fcac-abf3-4012-a6af-395f5031633d', 'a81fb032-e64e-4c28-b37e-3ae4d2f0a97a', NULL, 0, '2026-02-17 16:11:39.532386+00'),
('f91d3621-9652-43fe-be8b-f50c8a5a5529', '3920fcac-abf3-4012-a6af-395f5031633d', 'b4af31ca-08c6-4af8-99ec-1a63a18e2d98', NULL, 1, '2026-02-17 16:11:39.532386+00'),
('9990f4e8-5a62-4342-9ada-140d180d1efc', '5266b467-029c-4ea7-8697-b10434163ba6', '7de32742-565e-48bb-9c72-1e1036d28b04', NULL, 0, '2026-02-17 16:14:35.699935+00'),
('699d5023-394d-4f39-8d85-c811b72a3484', '5266b467-029c-4ea7-8697-b10434163ba6', '5eef7941-84a0-49b5-be16-a2b176013cd5', NULL, 1, '2026-02-17 16:14:35.699935+00'),
('9448415c-28b6-436c-aa4d-fdce8beac55e', '5266b467-029c-4ea7-8697-b10434163ba6', '47c93e07-e7de-4c64-86fa-ca6563c16f11', NULL, 2, '2026-02-17 16:14:35.699935+00'),
('e68ec9c7-264c-4f53-b88e-2998ee8e6a3d', 'f9b2488d-3b4d-4fdd-a68c-8835be19ce44', 'e7dbe368-517a-43f9-a20f-09e6b8974b1a', NULL, 0, '2026-02-21 19:02:08.167065+00'),
('bc8ae1c6-6fcf-467b-b708-e00827bbcf32', 'f9b2488d-3b4d-4fdd-a68c-8835be19ce44', 'ad656ecc-0db9-463b-9fa8-b1b7e1736ca2', NULL, 1, '2026-02-21 19:02:08.167065+00'),
('21af9b39-0a6e-49c2-be03-52f4bde66823', 'f9b2488d-3b4d-4fdd-a68c-8835be19ce44', 'bcf4df3b-3f3f-4e27-8284-a7f1e54ea3e3', NULL, 2, '2026-02-21 19:02:08.167065+00'),
('e429a659-6d74-4b5e-993d-0ac775c28e05', 'f9b2488d-3b4d-4fdd-a68c-8835be19ce44', 'd1d61cbf-e0a7-4f42-868c-541edb7fc966', NULL, 3, '2026-02-21 19:02:08.167065+00'),
('c971b6f7-4364-40a8-8e1b-7d121a3da371', 'f9b2488d-3b4d-4fdd-a68c-8835be19ce44', 'eeda2880-3627-4125-af5f-c4ee6d3457a8', NULL, 4, '2026-02-21 19:02:08.167065+00'),
('15032f5a-a943-40c2-9a43-abde850aa8e9', 'f9b2488d-3b4d-4fdd-a68c-8835be19ce44', 'bd927165-b845-459a-8723-861cb93ed9c0', NULL, 5, '2026-02-21 19:02:08.167065+00'),
('bd9cc015-7510-4f09-8855-adf60b48fd33', 'f9b2488d-3b4d-4fdd-a68c-8835be19ce44', '5d6faefb-85ba-4fb5-a9da-6c2a9817d447', NULL, 6, '2026-02-21 19:02:08.167065+00'),
('2ad7f9ce-da6a-473b-8e8e-fbcd95103995', 'f9b2488d-3b4d-4fdd-a68c-8835be19ce44', 'a189c191-35bf-428b-a592-927d3e0e081c', NULL, 7, '2026-02-21 19:02:08.167065+00'),
('48e66728-aeb2-434a-9ec1-458f9893e134', 'f9b2488d-3b4d-4fdd-a68c-8835be19ce44', 'de8ea7cc-266c-41b9-acef-32f2b5a007d1', NULL, 8, '2026-02-21 19:02:08.167065+00')
ON CONFLICT (id) DO NOTHING;

-- user_roles
INSERT INTO public.user_roles (id, user_id, role) VALUES
('23f08813-4d55-49b8-b674-7b0bc762537b', 'd4c55a7a-f988-476b-aed8-00c05aa41640', 'admin'),
('6892b6b3-7de8-4d91-856e-f3a06dfa2671', 'dc9daaa6-93fd-4495-a91f-c79096802f77', 'admin'),
('3b16e207-5411-4009-a110-4eb5c207c81c', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', 'admin'),
('e39e3369-c8d8-4711-a005-faac686016cf', '08a917c2-78c5-4ed6-8d1a-4e03c7b0e373', 'admin')
ON CONFLICT (id) DO NOTHING;

-- banners
INSERT INTO public.banners (id, title, subtitle, image_url, video_url, link_url, link_label, link_target, active, sort_order, valid_from, valid_until, segment_exclude_product_id, created_at, updated_at) VALUES
('7629fdc7-d73b-4552-bb53-511a8f5c1e35', '10 Vidas', 'Prospere nas 10 Vidas', 'https://thyowehliqgrjkeknoza.supabase.co/storage/v1/object/public/product-images/banners/9bab2aae-dd74-425c-bcbc-dea82bb2a805.png', NULL, NULL, 'Saiba Mais', '_blank', false, 1, '2026-02-13 12:41:00+00', '2026-02-28 12:42:00+00', NULL, '2026-02-14 12:42:05.49192+00', '2026-02-14 12:42:05.49192+00'),
('1f1d22ad-d447-4c62-81d6-b7da101092a0', 'Evento Meteora Impact Colombia', '27 e 28 de Octubre', 'https://thyowehliqgrjkeknoza.supabase.co/storage/v1/object/public/product-images/banners/84ac4076-94b4-4b8b-bc50-690449d11b21.png', NULL, 'https://google.com', 'Más Información', '_blank', true, 0, '2026-02-14 00:14:00+00', '2026-03-01 00:14:00+00', NULL, '2026-02-14 12:14:38.729528+00', '2026-02-14 12:14:38.729528+00')
ON CONFLICT (id) DO NOTHING;

-- testimonials
INSERT INTO public.testimonials (id, person_name, role, country, isp_size, title, description, result_text, video_url, tags, destinations, product_ids, active, sort_order, created_at, updated_at) VALUES
('a63fa110-9392-48a2-a766-797b3f812e94', 'Warley Goes', 'Dueño', 'Brasil', '1000 Clientes', 'de 200 a 1000 clientes en 1 Año', NULL, 'Nuevas ventas super aceleradas', 'https://adilo.bigcommand.com/watch/nWDbB9zv', ARRAY['escala','clientes','marketing'], ARRAY['home','product'], ARRAY['cde99fdd-4843-4151-85a4-082b67cdd098','ed67be09-8873-4025-80af-b60d3010dfa9','a81fb032-e64e-4c28-b37e-3ae4d2f0a97a'], true, 0, '2026-02-16 19:45:57.099068+00', '2026-02-17 10:45:32.015+00'),
('b24bb5e7-a080-4b48-b33d-50b7dc29025c', 'Nahuel', 'ISP owner', 'Argentina', '1200', 'ISP de argentina que empezó como hobby', 'opopopop', 'Pasamos de generar un ingreso extra a renunciar a nuestros trabajos para dedicarnos a esto', 'https://adilo.bigcommand.com/watch/nWDbB9zv', '{}', ARRAY['home'], '{}', true, 1, '2026-02-16 20:34:29.455124+00', '2026-02-16 20:34:28.642+00'),
('6d860d9a-4296-4d58-9380-76e458c8d855', 'Nahuel', 'Empleado de ISP', 'Argentina', '500', 'TITULO', NULL, 'testeando la descripcion ops', 'https://adilo.bigcommand.com/watch/nWDbB9zv', '{}', ARRAY['home'], '{}', true, 2, '2026-02-16 20:36:21.464039+00', '2026-02-16 21:37:27.518+00'),
('e85035be-cbf0-4037-bfe3-030a605f8e42', 'Ultimo', 'Test', 'Colombia', '1', NULL, NULL, 'TEST Youtube', 'https://youtu.be/gNdnVVHfseA?list=RDgNdnVVHfseA', '{}', ARRAY['home'], '{}', true, 3, '2026-02-16 20:39:13.530857+00', '2026-02-16 21:36:40.689+00')
ON CONFLICT (id) DO NOTHING;

-- menu_links
INSERT INTO public.menu_links (id, title, url, icon, open_mode, auto_translate, active, sort_order, created_at, updated_at) VALUES
('6fd8c83a-91da-4db3-9e80-f4538d3933af', 'Área destinada para novos usuários', 'https://meteora.academy', 'coffee', 'new_tab', true, true, 0, '2026-02-16 21:02:51.435165+00', '2026-02-16 21:03:29.22927+00'),
('4c2ef350-4e82-4314-a55d-29d65ad6a4ee', 'Área de miembros', 'https://www.youtube.com/', 'external-link', 'new_tab', true, true, 0, '2026-02-16 21:28:53.69386+00', '2026-02-16 21:28:53.69386+00'),
('6343cc57-cbb7-4f8c-b774-00eec10176bd', 'Zona roja', 'https://www.youtube.com/', 'link', 'new_tab', false, true, 0, '2026-02-16 21:30:11.318979+00', '2026-02-16 21:30:11.318979+00'),
('79bbd915-e011-40d5-9aba-7dfa3ac915ab', 'Sistema de Gestión', 'https://chat.ispautomatico.com', 'play', 'embed', true, true, 0, '2026-02-14 18:23:01.577425+00', '2026-02-17 10:49:06.582239+00')
ON CONFLICT (id) DO NOTHING;

-- menu_link_products
INSERT INTO public.menu_link_products (id, menu_link_id, product_id, created_at) VALUES
('0f19f281-6fd0-41b6-be43-7fef458f2407', '79bbd915-e011-40d5-9aba-7dfa3ac915ab', 'a81fb032-e64e-4c28-b37e-3ae4d2f0a97a', '2026-02-17 10:49:07.218573+00')
ON CONFLICT (id) DO NOTHING;

-- product_categories
INSERT INTO public.product_categories (id, product_id, category_id, created_at) VALUES
('1e91ee94-270e-4511-89ff-195faeae63c2', 'a81fb032-e64e-4c28-b37e-3ae4d2f0a97a', '7e95ee0f-293d-4c19-8fbb-31f624331eb1', '2026-02-14 17:50:47.863369+00'),
('e09a5c1e-75be-4e4e-b23a-db7a85fab32b', '0cb5c64b-d5c0-4ba1-a50a-cebec0f1b247', '9e78f640-86f6-4b6b-bb7d-b2833355d954', '2026-02-14 17:50:54.856631+00'),
('33987f91-df2e-40d0-885d-a7d1fba10b66', 'cde99fdd-4843-4151-85a4-082b67cdd098', '7e95ee0f-293d-4c19-8fbb-31f624331eb1', '2026-02-14 17:50:58.479004+00'),
('cb9cf356-3536-4453-be99-3949dc01e63f', 'a81fb032-e64e-4c28-b37e-3ae4d2f0a97a', '9e78f640-86f6-4b6b-bb7d-b2833355d954', '2026-02-16 15:32:44.800242+00'),
('c44e8a2a-358e-4842-82c2-10ae33fb7a73', 'a81fb032-e64e-4c28-b37e-3ae4d2f0a97a', '2ff2fe45-aaef-4c5a-b81f-2ff8bc17843e', '2026-02-16 15:33:49.200764+00'),
('d8e95603-3d48-4065-940c-908dbe401a11', 'b4af31ca-08c6-4af8-99ec-1a63a18e2d98', 'caf56a81-9b8d-4446-a253-cfc6a3cf98ec', '2026-02-17 15:26:54.840769+00'),
('fc43ae53-c26a-414a-8fb1-43dcee284462', '7de32742-565e-48bb-9c72-1e1036d28b04', 'aa807dae-1922-48ce-b547-891e68671692', '2026-02-17 16:03:04.569113+00'),
('24786755-ad1d-4f8f-b61e-1c2f4ebeb268', '5d6faefb-85ba-4fb5-a9da-6c2a9817d447', '8713a25f-8588-46a8-8171-b621716c39f0', '2026-02-18 19:29:16.803765+00'),
('c1ffa569-caf2-4a7f-84f2-3301ef1ec4b5', 'de8ea7cc-266c-41b9-acef-32f2b5a007d1', '8713a25f-8588-46a8-8171-b621716c39f0', '2026-02-18 19:29:22.141163+00'),
('34828d26-2416-4844-9158-0009916ab2ed', 'bd927165-b845-459a-8723-861cb93ed9c0', '8713a25f-8588-46a8-8171-b621716c39f0', '2026-02-18 19:29:29.703662+00')
ON CONFLICT (id) DO NOTHING;

-- diagnostic_recommendation_rules
INSERT INTO public.diagnostic_recommendation_rules (id, condition_field, condition_operator, condition_value, conditions, conditions_logic, title, description, cta_text, cta_type, cta_url, priority, created_at) VALUES
('33cab52e-a199-420d-9c40-5c25853b8863', 'technical', '<', 5, '[{"field":"technical","operator":"<","value":5}]', 'and', 'Curso Técnico ISP', 'Tu infraestructura técnica necesita fortalecerse antes de escalar.', 'Ver Curso', 'custom_url', NULL, 1, '2026-02-17 21:42:48.557951+00'),
('fcc76dce-4ee0-488e-8783-c0f0034f9481', 'technical', '<', 5, '[{"field":"technical","operator":"<","value":5}]', 'and', 'Implementación Técnica', 'Necesitas apoyo técnico profesional para estabilizar tu red.', 'Solicitar', 'custom_url', NULL, 2, '2026-02-17 21:42:48.557951+00'),
('64c2417c-58a8-4e51-8653-15cdc9c899d3', 'financial', '<', 5, '[{"field":"financial","operator":"<","value":5}]', 'and', 'Programa de Gestión ISP', 'Tu gestión financiera está limitando tu capacidad de crecer.', 'Comenzar Ahora', 'custom_url', NULL, 3, '2026-02-17 21:42:48.557951+00'),
('6dc70451-b5b4-4b68-a0db-65caa637a7db', 'financial', '<', 5, '[{"field":"financial","operator":"<","value":5}]', 'and', 'Consultoría Financiera', 'Una consultoría puntual puede reorganizar tus finanzas rápidamente.', 'Agendar', 'custom_url', NULL, 4, '2026-02-17 21:42:48.557951+00'),
('21e1a1a3-33b7-4591-8708-4872c7e443b4', 'scale', '<', 5, '[{"field":"scale","operator":"<","value":5}]', 'and', 'Programa de Escala Comercial', 'Tu proceso comercial necesita estructura para sostener crecimiento.', 'Ver Programa', 'custom_url', NULL, 5, '2026-02-17 21:42:48.557951+00'),
('c05568c4-a478-43df-9d92-59969b2c0e0b', 'scale', '<', 5, '[{"field":"scale","operator":"<","value":5}]', 'and', 'Automatización Comercial (SaaS)', 'Automatiza tu proceso de ventas para escalar sin depender solo de recomendaciones.', 'Conocer', 'custom_url', NULL, 6, '2026-02-17 21:42:48.557951+00'),
('3d3ebaa4-e581-4ec1-abdf-ec41b3acfd98', 'expansion', '>=', 7, '[{"field":"expansion","operator":">=","value":7}]', 'and', 'Aplicar al Programa ISP 1000+', 'Tu ISP tiene potencial real de convertirse en referente regional.', 'Aplicar Ahora', 'custom_url', NULL, 7, '2026-02-17 21:42:48.557951+00'),
('70d17e0e-ed17-456d-b43c-55a057d8a8dd', 'commitment', '<', 5, '[{"field":"commitment","operator":"<","value":5}]', 'and', 'Comunidad ISP Gratuita', 'Comienza con la comunidad para ganar claridad antes de invertir.', 'Unirse Gratis', 'custom_url', NULL, 8, '2026-02-17 21:42:48.557951+00'),
('c51f0eb5-3b23-4ac2-a652-c6beed65de34', 'commitment', '<', 5, '[{"field":"commitment","operator":"<","value":5}]', 'and', 'Mini Curso Oráculo', 'Un primer paso accesible para comenzar a estructurar tu ISP.', 'Ver Oráculo', 'custom_url', NULL, 9, '2026-02-17 21:42:48.557951+00')
ON CONFLICT (id) DO NOTHING;

-- platform_settings
INSERT INTO public.platform_settings (id, key, value, updated_at) VALUES
('4494df4e-b22c-496d-b556-33ee3294f9e3', 'whatsapp_advisor_url', 'https://wa.me/5500000000000', '2026-02-17 21:30:01.050575+00')
ON CONFLICT (id) DO NOTHING;
-- NOTA: openai_api_key omitida por segurança

-- user_plans
INSERT INTO public.user_plans (id, user_id, package_id, offer_id, status, starts_at, expires_at, created_at) VALUES
('c0729695-cf7c-424e-a4e0-3524ef788ce5', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', '76fcf9bc-3875-4870-8bd3-f5eb9dbfcd99', NULL, 'active', '2026-02-16 14:10:53.311+00', '2027-02-16 14:10:53.311+00', '2026-02-16 14:10:55.40318+00'),
('4055bd81-48c9-44da-bc86-dfae56c066ec', 'dc9daaa6-93fd-4495-a91f-c79096802f77', '76fcf9bc-3875-4870-8bd3-f5eb9dbfcd99', NULL, 'active', '2026-02-16 15:12:44.837+00', '2027-02-16 15:12:44.837+00', '2026-02-16 15:12:45.34368+00')
ON CONFLICT (id) DO NOTHING;

-- user_products
INSERT INTO public.user_products (id, user_id, product_id, offer_id, expires_at, created_at) VALUES
('2540f777-143e-4f09-bcf5-bdfed93fc5a1', '8563b41b-e232-4e04-906d-c1886d093f39', 'a81fb032-e64e-4c28-b37e-3ae4d2f0a97a', NULL, NULL, '2026-02-13 12:53:12.124327+00'),
('800c2d22-f038-40a3-b04a-cbdbcf027d58', 'd4c55a7a-f988-476b-aed8-00c05aa41640', 'a81fb032-e64e-4c28-b37e-3ae4d2f0a97a', NULL, NULL, '2026-02-14 18:06:19.827506+00'),
('ec626e78-6699-436e-b6ec-308d15ca26e8', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '0cb5c64b-d5c0-4ba1-a50a-cebec0f1b247', NULL, NULL, '2026-02-14 19:29:18.385829+00')
ON CONFLICT (id) DO NOTHING;

-- lesson_progress
INSERT INTO public.lesson_progress (id, user_id, lesson_id, course_id, completed, updated_at) VALUES
('3be5a888-d123-4004-b26b-76fc1f3e066a', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', true, '2026-02-14 19:40:02.415+00'),
('85fded9f-fa70-4fb4-bc60-0f660e34372b', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '64080639-3d0f-4c00-84b5-0c9df16da9b9', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', true, '2026-02-14 19:40:25.154+00'),
('e4ca389c-8b5e-4cdc-82b8-37b69c64e9d3', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '482776f6-7cda-4368-a48a-6cfa2ada8c41', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', true, '2026-02-14 19:40:33.924+00'),
('9b3669a3-f2a8-497e-b513-d776018cbb7f', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', true, '2026-02-16 15:59:42.275+00'),
('8f8a3757-6525-43c6-a45e-421e96934091', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', '64080639-3d0f-4c00-84b5-0c9df16da9b9', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', true, '2026-02-16 16:00:56.034+00'),
('ecfb1295-0cd8-4a5c-b7c0-a25d2407eab0', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', '482776f6-7cda-4368-a48a-6cfa2ada8c41', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', true, '2026-02-16 16:00:59.114+00'),
('048ffba3-fdd2-413c-bd46-94b6afb60fb7', '08a917c2-78c5-4ed6-8d1a-4e03c7b0e373', '64080639-3d0f-4c00-84b5-0c9df16da9b9', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', false, '2026-02-14 18:12:52.983+00')
ON CONFLICT (id) DO NOTHING;

-- lesson_ratings
INSERT INTO public.lesson_ratings (id, user_id, lesson_id, course_id, rating, created_at, updated_at) VALUES
('30ec5a39-6b9f-45ce-a729-979bf59bd5cc', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 5, '2026-02-14 15:38:15.410025+00', '2026-02-14 15:38:19.029+00'),
('c9c5e3b8-8f0f-479b-a0db-20daf62c60bf', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '64080639-3d0f-4c00-84b5-0c9df16da9b9', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 5, '2026-02-14 15:38:27.85193+00', '2026-02-14 15:38:28.231+00'),
('b53bc6e6-3eed-4935-90ac-f75001084ad5', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', '482776f6-7cda-4368-a48a-6cfa2ada8c41', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 5, '2026-02-16 12:43:16.44316+00', '2026-02-16 12:43:14.356+00'),
('7885372b-33e9-4e72-b780-ca9298a682ce', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 5, '2026-02-16 14:52:02.401317+00', '2026-02-16 14:52:00.312+00'),
('e6734574-6c63-48b3-9ce0-34fdc8dfad3a', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', 'f7e1438c-6d0b-4b8b-92ec-b32df7645e58', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 1, '2026-02-16 14:52:10.346838+00', '2026-02-16 14:52:08.305+00'),
('33477880-5361-4a94-a9b4-41eb3a0d7c48', 'dc9daaa6-93fd-4495-a91f-c79096802f77', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 5, '2026-02-16 14:56:33.95075+00', '2026-02-16 14:56:33.508+00')
ON CONFLICT (id) DO NOTHING;

-- community_likes
INSERT INTO public.community_likes (id, post_id, user_id, created_at) VALUES
('8f556741-f619-48b9-952d-217c82a923e5', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'dc9daaa6-93fd-4495-a91f-c79096802f77', '2026-02-13 21:55:01.814264+00'),
('7985ed2c-80ab-442a-abdf-a2ee20aed405', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '2026-02-13 21:56:22.593908+00'),
('2b37ae04-134b-4034-86dd-3f5e119c9f2a', '53cd5699-6257-4818-957d-4f6590b10085', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', '2026-02-14 12:25:21.500907+00')
ON CONFLICT (id) DO NOTHING;

-- webhook_endpoints
INSERT INTO public.webhook_endpoints (id, name, url, active, created_at, updated_at) VALUES
('3a56e906-1099-4347-b8fc-483fe64954c6', 'n8n avisos', 'https://n8n.ispautomatico.com/webhook/notifications-hub', true, '2026-02-16 19:29:36.308853+00', '2026-02-16 19:29:36.308853+00')
ON CONFLICT (id) DO NOTHING;

-- webhook_event_types
INSERT INTO public.webhook_event_types (id, event_key, label, enabled, created_at) VALUES
('1ecb1dc6-b93d-4f4c-ab4c-4262dc8608d0', 'user.registered', 'Nuevo usuario registrado', true, '2026-02-16 16:18:37.310866+00'),
('3336deea-1d15-49ae-819b-b574b6735596', 'user.approved', 'Usuario aprobado', true, '2026-02-16 16:18:37.310866+00'),
('f436e843-e6c2-4674-9967-38a792725fc8', 'user.deleted', 'Usuario eliminado', true, '2026-02-16 16:18:37.310866+00'),
('43df2acb-d211-47b8-a9c5-4700b5c1a44f', 'user.rejected', 'Usuario rechazado', true, '2026-02-16 16:18:37.310866+00'),
('43ebacd6-ab8d-4568-b96e-7e0d2a940ea0', 'diagnostic.submitted', 'Diagnóstico enviado', true, '2026-02-16 16:18:37.310866+00'),
('a2001550-4d0c-4d8d-8499-d221ea6cd93b', 'payment.completed', 'Pago completado', true, '2026-02-16 16:18:37.310866+00'),
('603cbeaa-2293-45b8-b364-72b1811c5bd6', 'payment.failed', 'Pago fallido', false, '2026-02-16 16:18:37.310866+00'),
('e389e1f3-181f-4a27-9c5c-d93f5f2d14a1', 'lesson.completed', 'Lección completada', false, '2026-02-16 16:18:37.310866+00'),
('35abe688-3efa-4226-8529-94941d2010fb', 'course.completed', 'Curso completado', false, '2026-02-16 16:18:37.310866+00'),
('c12c4533-1d00-4bcf-a9d7-ba80d944474d', 'plan.activated', 'Plan activado', false, '2026-02-16 16:18:37.310866+00'),
('fb775f2c-e5f0-45e1-a37f-4626e41336b4', 'plan.expired', 'Plan expirado', false, '2026-02-16 16:18:37.310866+00'),
('4a19c378-407e-448e-94d7-00e84087209c', 'enrollment.created', 'Nueva inscripción', false, '2026-02-16 16:18:37.310866+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- NOTA: As tabelas abaixo contêm muitos registros e foram
-- exportadas parcialmente (limite de 1000 linhas da API).
-- Tabelas com dados truncados:
--   - profiles (~1000+ registros)
--   - courses (dados completos acima via schema)
--   - course_modules (dados completos)
--   - course_lessons (~500+ registros)
--   - products (~30+ registros)
--   - offers (~20+ registros)
--   - diagnostics (~10 registros)
--   - diagnostic_questions (~15 registros)
--   - diagnostic_answers (~50+ registros)
--   - diagnostic_lead_tracking (~10 registros)
--   - lesson_comments (11 registros)
--   - lesson_contents (6 registros)
--   - community_posts (2 registros)
--   - community_comments (15 registros)
--   - user_lesson_access (8 registros)
--   - network_topologies (1 registro)
--   - system_logs (OMITIDO - logs operacionais, muitos registros)
--   - product_sales_pages (1 registro - dados muito grandes)
--
-- Para um dump 100% completo, use pg_dump via CLI:
--   pg_dump --data-only --inserts -h <host> -U postgres -d postgres > full_data.sql
-- ============================================================

-- lesson_contents
INSERT INTO public.lesson_contents (id, lesson_id, type, title, content, sort_order, created_at) VALUES
('a1adcc1c-0e28-454a-b851-a0b9338b13fe', '561d8d7e-7699-4afd-856e-1d0c6320c655', 'text', 'Agregar Contenido', 'askfjnbkfjlasnmlafkafsnlafsknlafkmasflknfsklafs', 0, '2026-02-14 19:32:39.217363+00'),
('0dcf4115-f0a7-41e6-80a2-e66457f44ef5', 'a5750c8a-6141-4d5f-94b0-026ac05c0772', 'text', 'Agregar Contenido', 'fdkojnsdlkdsmdsds', 0, '2026-02-14 19:33:38.744966+00'),
('0d38849c-9c0d-4983-9bef-e8104075a5f1', 'b4810f59-430e-4485-ad83-3809eb70779c', 'link', 'Envie acá su resumen del modulo 2', 'https://docs.google.com/forms/d/e/1FAIpQLSe2ucCx1a1269c3WHsXu97ECPHKxgyGVHx_Nceu273rXO5IRQ/viewform', 0, '2026-02-16 13:59:58.703169+00'),
('0ad55c45-fc59-4022-a369-afa39f954bd7', 'f7e1438c-6d0b-4b8b-92ec-b32df7645e58', 'text', 'Agregar Contenido', 'testando', 0, '2026-02-14 19:26:18.959547+00'),
('74b2425c-e0ad-4a12-80db-2e26352bd8de', 'f7e1438c-6d0b-4b8b-92ec-b32df7645e58', 'video', '', 'https://adilo.bigcommand.com/watch/xc2ivqsF', 1, '2026-02-16 14:08:27.939974+00'),
('b12c6590-6e45-45c6-aff3-83b6c7a32e04', 'e044034a-895b-4c50-86a8-ca934cabdee5', 'video', 'Agregar Contenido', NULL, 0, '2026-02-17 10:07:17.03863+00')
ON CONFLICT (id) DO NOTHING;

-- lesson_comments
INSERT INTO public.lesson_comments (id, user_id, lesson_id, course_id, content, comment_type, video_timestamp_seconds, parent_id, created_at, updated_at) VALUES
('db9bbe0f-3ea2-4909-91a9-37e44f7ce56b', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 'To assintindo, tá massa', 'comment', NULL, NULL, '2026-02-14 14:33:26.28652+00', '2026-02-14 14:33:26.28652+00'),
('64367131-a126-4e80-a3ad-8a8809a1d24d', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', E'Não entendi nada??\n', 'doubt', NULL, NULL, '2026-02-14 14:33:36.023632+00', '2026-02-14 14:33:36.023632+00'),
('f8daf27f-3795-4b02-a8c3-d56e6bff179d', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 'Amei demais', 'praise', NULL, NULL, '2026-02-14 14:33:43.809179+00', '2026-02-14 14:33:43.809179+00'),
('29d727e4-fdb0-4157-81bc-209e30478c1f', '08a917c2-78c5-4ed6-8d1a-4e03c7b0e373', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', E'Como assim nada? Eu que não entendi!!\n', 'comment', NULL, '64367131-a126-4e80-a3ad-8a8809a1d24d', '2026-02-14 14:37:17.682425+00', '2026-02-14 14:37:17.682425+00'),
('04bcd875-98b4-442c-8f2a-739c99a8c24b', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 'que bom', 'comment', NULL, 'f8daf27f-3795-4b02-a8c3-d56e6bff179d', '2026-02-14 15:43:17.754448+00', '2026-02-14 15:43:17.754448+00'),
('ae19d531-afad-4707-be8d-7e1fb716148a', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 'que bom que gostou', 'comment', NULL, 'db9bbe0f-3ea2-4909-91a9-37e44f7ce56b', '2026-02-14 15:43:29.07306+00', '2026-02-14 15:43:29.07306+00'),
('288a065b-b8ff-410a-afa2-413d895c540f', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', '482776f6-7cda-4368-a48a-6cfa2ada8c41', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 'Estou dominando o assunto.', 'comment', NULL, NULL, '2026-02-16 12:43:29.038304+00', '2026-02-16 12:43:29.038304+00'),
('79d61b01-b0fd-4975-a8bc-6a7cb9fc5097', 'dc9daaa6-93fd-4495-a91f-c79096802f77', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 'gostei a aula', 'praise', NULL, NULL, '2026-02-16 14:39:32.990397+00', '2026-02-16 14:39:32.990397+00'),
('28610d77-f2e8-47ca-b3dc-b34413e129f6', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 'Publicando uma comentário.', 'comment', NULL, NULL, '2026-02-16 16:15:27.156032+00', '2026-02-16 16:15:27.156032+00'),
('24b29384-c056-4ae6-8284-c47f7ee4b16f', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 'Publicando uma dúvida.', 'doubt', NULL, NULL, '2026-02-16 16:15:37.128035+00', '2026-02-16 16:15:37.128035+00'),
('d8783631-a86b-4fe0-9ae9-edd5fad9e46c', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', '8a20d758-467a-4717-8acb-30b31e3b2857', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 'Publicando uma elogio.', 'praise', NULL, NULL, '2026-02-16 16:15:48.659815+00', '2026-02-16 16:15:48.659815+00')
ON CONFLICT (id) DO NOTHING;

-- community_posts
INSERT INTO public.community_posts (id, course_id, user_id, title, content, image_url, link_url, created_at, updated_at) VALUES
('6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 'd4c55a7a-f988-476b-aed8-00c05aa41640', 'ops, testando', 'Nao gostei os ultimos encontros dessa comunidade', 'https://thyowehliqgrjkeknoza.supabase.co/storage/v1/object/public/product-images/community/d1bf0744-cda5-48dc-98c5-354859b8e8a7.png', NULL, '2026-02-13 21:40:48.314943+00', '2026-02-13 21:40:48.314943+00'),
('53cd5699-6257-4818-957d-4f6590b10085', 'dfd44f54-43ed-48c1-a924-2c7f993b5e8a', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', 'Isso é um título de post', 'Isso será a descrição do post', 'https://thyowehliqgrjkeknoza.supabase.co/storage/v1/object/public/product-images/community/fae3e13b-0bee-44d2-afa6-cc1e9ddd192a.png', 'https://google.com/', '2026-02-14 12:24:19.242879+00', '2026-02-14 12:24:19.242879+00')
ON CONFLICT (id) DO NOTHING;

-- community_comments
INSERT INTO public.community_comments (id, post_id, user_id, parent_id, content, created_at) VALUES
('906222af-d395-4cf7-ad64-3ac07095dc8e', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'dc9daaa6-93fd-4495-a91f-c79096802f77', NULL, 'krl to aqui so pra testar os comentarios', '2026-02-13 21:55:15.601862+00'),
('8a455cf5-30fc-4ad1-9399-13a7ea08c0fe', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '906222af-d395-4cf7-ad64-3ac07095dc8e', 'sai fora', '2026-02-13 21:56:15.1353+00'),
('e65b327a-989d-4ee4-b771-07c0bf14e147', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'dc9daaa6-93fd-4495-a91f-c79096802f77', '906222af-d395-4cf7-ad64-3ac07095dc8e', 'ola', '2026-02-13 21:56:49.235047+00'),
('d33eae8e-8216-4d97-abef-4136b688fe4f', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'dc9daaa6-93fd-4495-a91f-c79096802f77', '8a455cf5-30fc-4ad1-9399-13a7ea08c0fe', 'feliz aniversario', '2026-02-13 21:57:04.102453+00'),
('533d67f2-363c-4bc6-9390-accea5e19e08', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '8a455cf5-30fc-4ad1-9399-13a7ea08c0fe', 'ué', '2026-02-13 21:57:23.941597+00'),
('8856519b-a6c3-4900-bd8f-5d9a8dc45b43', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'd4c55a7a-f988-476b-aed8-00c05aa41640', 'e65b327a-989d-4ee4-b771-07c0bf14e147', 'ta bug', '2026-02-13 21:57:33.631106+00'),
('e9281f04-5709-4281-bbc1-cfb6cd350524', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'dc9daaa6-93fd-4495-a91f-c79096802f77', NULL, 'ta bug', '2026-02-13 21:57:44.395787+00'),
('9f9213cc-125a-4a16-9353-16bd2b587273', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'dc9daaa6-93fd-4495-a91f-c79096802f77', 'e65b327a-989d-4ee4-b771-07c0bf14e147', 'test', '2026-02-13 21:57:50.908728+00'),
('e2c81e6f-7cc8-4ced-a0fc-6dc7432d6f78', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'dc9daaa6-93fd-4495-a91f-c79096802f77', 'e65b327a-989d-4ee4-b771-07c0bf14e147', 'eu', '2026-02-13 21:59:25.595938+00'),
('08e58c9d-ada3-4de9-9b12-238955bbc65b', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'dc9daaa6-93fd-4495-a91f-c79096802f77', '906222af-d395-4cf7-ad64-3ac07095dc8e', 'eee', '2026-02-13 21:59:30.812084+00'),
('da330ebd-cafe-45b3-9bfa-c89a8ee19b33', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'dc9daaa6-93fd-4495-a91f-c79096802f77', '906222af-d395-4cf7-ad64-3ac07095dc8e', 'se eu tento responder uma resposta de um comentario nao da', '2026-02-13 21:59:59.519077+00'),
('b2088edb-a362-41ac-888f-b37b5fce20f2', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'd4c55a7a-f988-476b-aed8-00c05aa41640', 'da330ebd-cafe-45b3-9bfa-c89a8ee19b33', 'OOO', '2026-02-14 12:23:47.263213+00'),
('65faae8c-1b0d-42e1-af84-1bd57843f8ff', '6c72b6ee-266c-4dc6-8e92-f0e92c1e3acf', 'd4c55a7a-f988-476b-aed8-00c05aa41640', '906222af-d395-4cf7-ad64-3ac07095dc8e', 'OOO', '2026-02-14 12:24:00.814755+00'),
('18678209-1597-4d0b-8d2e-c804ac7e8438', '53cd5699-6257-4818-957d-4f6590b10085', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', NULL, 'Isso é um teste de comentário.', '2026-02-14 12:24:40.851523+00'),
('cb2a5fbc-a297-4152-9d99-c1f2c3b0bc6b', '53cd5699-6257-4818-957d-4f6590b10085', 'f7c944f7-36c1-4190-9421-aefbe19cf02b', '18678209-1597-4d0b-8d2e-c804ac7e8438', 'Isso é um respota ao comentário anterior', '2026-02-14 12:25:04.638045+00')
ON CONFLICT (id) DO NOTHING;

-- user_lesson_access
INSERT INTO public.user_lesson_access (id, user_id, lesson_id, granted_by, granted_at) VALUES
('8bc9c579-885f-41cc-be8a-70cae3df8fc9', 'd4c55a7a-f988-476b-aed8-00c05aa41640', 'c1dfbd87-a64e-4404-9c93-98c6da80f1ac', NULL, '2026-02-14 19:27:51.266582+00'),
('747abfc4-add1-4a8e-b5fa-70cb7cdb1f90', '08a917c2-78c5-4ed6-8d1a-4e03c7b0e373', '4e53518b-2c01-462f-81c8-9ef4b8f8ebdd', NULL, '2026-02-14 19:30:48.734428+00'),
('4629d54d-761a-4211-a62d-e1bbf85b79e8', 'e350d9aa-005a-405f-a3d3-60585638ccbd', 'df9d3d4b-4021-4b39-80be-7130ea4d48ad', NULL, '2026-02-17 15:49:52.879153+00'),
('1bc4360f-3312-4de9-8eec-4f2ff84dba1d', '924b0764-63da-4455-b4ef-077a4f4b8bc9', '92b51877-9482-4e71-a967-ce63b9b6b711', NULL, '2026-02-17 15:56:19.737128+00'),
('9be94a84-a1c0-4f6f-bf49-5491cf241be8', 'bf40ead5-9bff-4608-afda-9358d41f2586', 'cbadfec7-53f2-48b4-bbff-5aeabc590719', NULL, '2026-02-19 14:28:00.725186+00'),
('780c7d79-c5eb-4916-9809-aae1debbe373', 'fbea23ca-ed05-4530-934f-bd49fc7de6db', 'cbadfec7-53f2-48b4-bbff-5aeabc590719', NULL, '2026-02-19 14:28:07.313188+00'),
('ba67dbea-c96d-4f58-a907-5609542a181d', 'ff1a7cc5-9a77-4969-8db1-ef1c642e61cc', '6aa447f9-950f-443e-87a5-150fc601b84d', NULL, '2026-02-19 15:17:38.716911+00'),
('1102ceb5-f023-466c-8c93-ba180e3de964', '683f9554-0c16-4c3a-9bcb-980d2b92ec4a', '8a20d758-467a-4717-8acb-30b31e3b2857', NULL, '2026-02-20 12:50:08.879843+00')
ON CONFLICT (id) DO NOTHING;

-- network_topologies
INSERT INTO public.network_topologies (id, user_id, name, data, created_at, updated_at) VALUES
('1e95a89d-a0bb-42d8-9ea4-be23f02466e3', 'd4c55a7a-f988-476b-aed8-00c05aa41640', 'Diagrama Área 1', '{"edges":[{"animated":true,"id":"xy-edge__1771325673643-1771325676593","source":"1771325673643","style":{"stroke":"hsl(349, 100%, 62%)"},"target":"1771325676593"},{"animated":true,"id":"xy-edge__1771325676593-1771325670657","source":"1771325676593","style":{"stroke":"hsl(349, 100%, 62%)"},"target":"1771325670657"}],"nodes":[{"data":{"label":"Router"},"id":"1771325670657","position":{"x":438.89,"y":336.14},"style":{"background":"#ef4444","border":"none","borderRadius":"8px","color":"#fff","fontSize":"12px","fontWeight":"600","padding":"8px 16px"},"type":"default"},{"data":{"label":"Switch"},"id":"1771325673643","position":{"x":474.01,"y":78.22},"style":{"background":"#3b82f6","border":"none","borderRadius":"8px","color":"#fff","fontSize":"12px","fontWeight":"600","padding":"8px 16px"},"type":"default"},{"data":{"label":"Cliente"},"id":"1771325676593","position":{"x":498.49,"y":194.85},"style":{"background":"#6b7280","border":"none","borderRadius":"8px","color":"#fff","fontSize":"12px","fontWeight":"600","padding":"8px 16px"},"type":"default"}]}', '2026-02-17 10:54:58.568874+00', '2026-02-17 10:54:58.568874+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TABELAS COM DADOS GRANDES (parcial)
-- Para exportação completa, use pg_dump via CLI
-- ============================================================

-- NOTA: profiles, courses, course_modules, course_lessons,
-- products, offers, diagnostics, diagnostic_questions,
-- diagnostic_answers, diagnostic_lead_tracking, system_logs,
-- e product_sales_pages contêm dados que foram truncados
-- pela limitação da API (1000 linhas).
--
-- Para dump completo via CLI:
--   pg_dump -h db.thyowehliqgrjkeknoza.supabase.co \
--     -U postgres -d postgres \
--     --data-only --inserts \
--     --schema=public > pg_dump_full_data.sql

-- ============================================================
-- FIM DO DUMP
-- ============================================================
