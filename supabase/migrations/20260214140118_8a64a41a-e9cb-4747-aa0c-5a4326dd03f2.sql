
-- 1. Add columns to offers for Hotmart link and duration control
ALTER TABLE public.offers 
  ADD COLUMN IF NOT EXISTS hotmart_url text,
  ADD COLUMN IF NOT EXISTS payment_link_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS duration_days integer,
  ADD COLUMN IF NOT EXISTS duration_type text NOT NULL DEFAULT 'no_expiration';

-- 2. Add offer_id and expires_at to user_products
ALTER TABLE public.user_products
  ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES public.offers(id),
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- 3. Add offer_id to user_plans
ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES public.offers(id);

-- 4. Create lesson_comments table
CREATE TABLE public.lesson_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  comment_type text NOT NULL DEFAULT 'comment',
  video_timestamp_seconds integer,
  parent_id uuid REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lesson_comments" ON public.lesson_comments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view lesson_comments" ON public.lesson_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create lesson_comments" ON public.lesson_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lesson_comments" ON public.lesson_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lesson_comments" ON public.lesson_comments FOR DELETE USING (auth.uid() = user_id);

-- 5. Create product_categories junction table
CREATE TABLE public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.course_categories(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, category_id)
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product_categories" ON public.product_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view product_categories" ON public.product_categories FOR SELECT USING (auth.uid() IS NOT NULL);
