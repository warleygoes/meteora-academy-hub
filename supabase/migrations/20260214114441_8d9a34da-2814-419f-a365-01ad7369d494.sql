
-- 1. Add 'saas' to product_type enum
ALTER TYPE public.product_type ADD VALUE IF NOT EXISTS 'saas';

-- 2. Add saas_url to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS saas_url text;

-- 3. Add periodicity to offers (monthly, quarterly, semi_annual, annual)
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS periodicity text DEFAULT NULL;

-- 4. Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  subtitle text,
  image_url text,
  video_url text,
  link_url text,
  link_label text DEFAULT 'Saiba Mais',
  link_target text DEFAULT '_self',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  segment_exclude_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active banners" ON public.banners FOR SELECT
  USING (auth.uid() IS NOT NULL AND active = true);

-- 5. Add trail fields to packages
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS is_trail boolean NOT NULL DEFAULT false;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS show_in_showcase boolean NOT NULL DEFAULT false;

-- 6. Create package product groups table
CREATE TABLE IF NOT EXISTS public.package_product_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  thumbnail_url text,
  thumbnail_vertical_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.package_product_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage package_product_groups" ON public.package_product_groups FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view package_product_groups" ON public.package_product_groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 7. Add sort_order and group_id to package_products
ALTER TABLE public.package_products ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.package_products ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.package_product_groups(id) ON DELETE SET NULL;

-- 8. Update existing payment_type values: rename 'monthly' to 'recurring'
UPDATE public.products SET payment_type = 'recurring' WHERE payment_type = 'monthly';
UPDATE public.packages SET payment_type = 'recurring' WHERE payment_type = 'monthly';
